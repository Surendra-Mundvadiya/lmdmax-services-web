import React, { FC, useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { ShiftCard } from "./ShiftCard";
import {
  SchedulerShiftItem,
  SchedulerDriverItem,
  SchedulerTimeOffItem,
} from "../../../api/schedulerApi";
import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";

interface ShiftGridDayViewProps {
  currentDateStr: string; // YYYY-MM-DD
  drivers: SchedulerDriverItem[];
  shifts: SchedulerShiftItem[];
  timeOffRequests: SchedulerTimeOffItem[];
  onCellClick: (driverId: number, dateStr: string) => void;
  onEditShift: (shift: SchedulerShiftItem) => void;
  onDeleteShift: (shiftId: number) => void;
  onMarkExtra?: (shiftId: number, isBackup: boolean) => void;
  onDropShift?: (shiftId: number, targetDriverId: number, targetDate: string) => void;
  loading?: boolean;
}

const TIMELINE_START_HOUR = 6;  // 06:00
const TIMELINE_END_HOUR = 22;   // 22:00
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR; // 16 hours

export const ShiftGridDayView: FC<ShiftGridDayViewProps> = ({
  currentDateStr,
  drivers,
  shifts,
  timeOffRequests,
  onCellClick,
  onEditShift,
  onDeleteShift,
  onMarkExtra,
  onDropShift,
  loading = false,
}) => {
  const [dragOverDriverId, setDragOverDriverId] = useState<number | null>(null);
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => TIMELINE_START_HOUR + i);

  const parseHourToFloat = (timeStr: string) => {
    if (!timeStr) return TIMELINE_START_HOUR;
    const parts = timeStr.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h + m / 60;
  };

  const getDriverTimeOff = (driverId: number) => {
    return timeOffRequests.find(
      (t) =>
        t.driver_id === driverId &&
        (t.leave_status === "approved" || t.status === "approved") &&
        currentDateStr >= t.start_date &&
        currentDateStr <= t.end_date
    );
  };

  const handleDragOver = (e: React.DragEvent, driverId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDriverId !== driverId) setDragOverDriverId(driverId);
  };

  const handleDragLeave = (driverId: number) => {
    if (dragOverDriverId === driverId) setDragOverDriverId(null);
  };

  const handleDrop = (e: React.DragEvent, driverId: number) => {
    e.preventDefault();
    setDragOverDriverId(null);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.shiftId && onDropShift) {
          onDropShift(Number(data.shiftId), driverId, currentDateStr);
        }
      }
    } catch (err) {
      console.error("Failed to parse drop shift payload:", err);
    }
  };

  return (
    <div className="sch-matrix-scroll-pane scheduler-matrix-container">
      <table className="sch-table">
        {/* Timeline Header */}
        <thead>
          <tr>
            {/* Pinned Left Header */}
            <th className="sch-th-pinned">
              <span>DRIVERS ROSTER ({drivers.length})</span>
            </th>

            {/* Hourly Headers */}
            <th
              style={{
                padding: 0,
                background: "var(--ads-material-thick)",
                WebkitBackdropFilter: "var(--ads-blur-sm)",
                backdropFilter: "var(--ads-blur-sm)",
                borderBottom: "1px solid var(--ads-hairline)",
                position: "sticky",
                top: 0,
                zIndex: 30,
              }}
            >
              <div style={{ display: "flex", width: "100%", minWidth: "min(800px, 100%)" }}>
                {hours.map((hr, idx) => (
                  <div
                    key={hr}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "var(--ads-s2) 0",
                      textAlign: "center",
                      fontSize: "clamp(0.5rem, 1vw, 0.6875rem)",
                      fontWeight: 600,
                      color: "var(--ads-ink-tertiary)",
                      letterSpacing: "-0.005em",
                      borderRight:
                        idx === hours.length - 1 ? "none" : "1px solid var(--ads-hairline)",
                    }}
                  >
                    {String(hr).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
            </th>
          </tr>
        </thead>

        {/* Drivers Rows */}
        <tbody>
          {drivers.length === 0 ? (
            <tr>
              <td
                colSpan={2}
                style={{
                  textAlign: "center",
                  padding: "var(--ads-s10) var(--ads-s4)",
                  color: "var(--ads-ink-tertiary)",
                  fontSize: "0.8125rem",
                }}
              >
                {loading ? "Loading timeline..." : "No drivers found."}
              </td>
            </tr>
          ) : (
            drivers.map((driver) => {
              const dayShifts = shifts.filter(
                (s) => s.assign_to === driver.id && s.schedule_date === currentDateStr
              );
              const timeOff = getDriverTimeOff(driver.id);
              const avatarBg = getAvatarColor(driver.name, "driver");
              const isDragOver = dragOverDriverId === driver.id;

              return (
                <tr key={driver.id} className="sch-row">
                  {/* Left Driver Cell */}
                  <td className="sch-td-pinned">
                    <div className="sch-driver-card">
                      <div
                        className="unified-avatar-circle"
                        style={{ background: avatarBg }}
                        title={driver.name}
                      >
                        <span>{getInitials(driver.name)}</span>
                      </div>

                      <div className="sch-driver-info-block">
                        <div className="sch-driver-name-row">
                          <span className="sch-driver-name" title={driver.name}>
                            {driver.name}
                          </span>
                        </div>

                        {timeOff ? (
                          <span
                            style={{
                              fontSize: "0.625rem",
                              fontWeight: 600,
                              color: "var(--ads-red)",
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--ads-s1)",
                              marginTop: "var(--ads-s1)",
                            }}
                          >
                            <AlertCircle size={10} />
                            Approved Leave
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onCellClick(driver.id, currentDateStr)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "var(--ads-s1)",
                              fontSize: "0.625rem",
                              fontWeight: 600,
                              color: "var(--ads-blue)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0.1rem 0",
                              marginTop: "0.15rem",
                            }}
                          >
                            <Plus size={10} /> Add Shift
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Timeline Track Cell with Droppable Support */}
                  <td
                    onDragOver={(e) => handleDragOver(e, driver.id)}
                    onDragLeave={() => handleDragLeave(driver.id)}
                    onDrop={(e) => handleDrop(e, driver.id)}
                    style={{
                      padding: 0,
                      position: "relative",
                      verticalAlign: "middle",
                      height: "64px",
                      borderBottom: "1px solid var(--ads-hairline)",
                      backgroundColor: isDragOver ? "var(--ads-blue-tint)" : "transparent",
                      outline: isDragOver ? "2px dashed var(--ads-blue)" : undefined,
                      transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        minWidth: "min(800px, 100%)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {/* Background Vertical Hour Lines */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          pointerEvents: "none",
                        }}
                      >
                        {hours.map((hr, idx) => (
                          <div
                            key={hr}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              borderRight:
                                idx === hours.length - 1 ? "none" : "1px solid var(--ads-hairline)",
                            }}
                          />
                        ))}
                      </div>

                      {/* Time Off Full-Track Overlay */}
                      {timeOff && (
                        <div
                          style={{
                            position: "absolute",
                            left: "var(--ads-s2)",
                            right: "var(--ads-s2)",
                            top: "var(--ads-s2)",
                            bottom: "var(--ads-s2)",
                            background: "var(--ads-red-tint)",
                            border: "1px solid rgba(215, 0, 21, 0.28)",
                            borderRadius: "var(--ads-r-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--ads-red)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            gap: "var(--ads-s1)",
                            zIndex: 10,
                          }}
                        >
                          <AlertCircle size={14} />
                          <span>Driver on Approved Leave</span>
                        </div>
                      )}

                      {/* Shift Blocks */}
                      {!timeOff &&
                        dayShifts.map((shift) => {
                          const startFloat = Math.max(
                            TIMELINE_START_HOUR,
                            Math.min(TIMELINE_END_HOUR, parseHourToFloat(shift.shift_duration_start))
                          );
                          const endFloat = Math.max(
                            startFloat + 0.5,
                            Math.min(TIMELINE_END_HOUR, parseHourToFloat(shift.shift_duration_end))
                          );

                          const leftPercent = ((startFloat - TIMELINE_START_HOUR) / TOTAL_HOURS) * 100;
                          const widthPercent = ((endFloat - startFloat) / TOTAL_HOURS) * 100;

                          return (
                            <ShiftCard
                              key={shift.id}
                              shift={shift}
                              density="timeline"
                              onEdit={onEditShift}
                              title="Drag to reassign to another driver"
                              style={{
                                position: "absolute",
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                height: "38px",
                                zIndex: 15,
                              }}
                            />
                          );
                        })}

                      {/* Empty Slot Hover Button */}
                      {dayShifts.length === 0 && !timeOff && (
                        <div
                          onClick={() => onCellClick(driver.id, currentDateStr)}
                          className="sch-empty-slot-btn"
                          style={{ position: "absolute", left: "8px", right: "8px", height: "48px", minHeight: "auto" }}
                          title={`Add shift on ${currentDateStr}`}
                        >
                          <Plus size={16} />
                          <span style={{ fontSize: "0.75rem", marginLeft: "0.3rem", fontWeight: 600 }}>Add Shift</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
