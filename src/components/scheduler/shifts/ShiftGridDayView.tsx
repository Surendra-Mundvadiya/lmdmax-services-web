import React, { FC, useState } from "react";
import { Clock, Plus, AlertCircle, Sparkles } from "lucide-react";
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
                backgroundColor: "#FFFFFF",
                borderBottom: "1.5px solid #E2E8F0",
                position: "sticky",
                top: 0,
                zIndex: 30,
              }}
            >
              <div style={{ display: "flex", width: "100%", minWidth: "800px" }}>
                {hours.map((hr, idx) => (
                  <div
                    key={hr}
                    style={{
                      flex: 1,
                      padding: "0.65rem 0",
                      textAlign: "center",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "#64748B",
                      borderRight: idx === hours.length - 1 ? "none" : "1px solid #F1F5F9",
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
                style={{ textAlign: "center", padding: "4rem 1rem", color: "#94A3B8", fontSize: "0.8125rem" }}
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
                              fontWeight: 700,
                              color: "#DC2626",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              marginTop: "0.2rem",
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
                              gap: "0.2rem",
                              fontSize: "0.625rem",
                              fontWeight: 600,
                              color: "#2563EB",
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
                      borderBottom: "1px solid #F1F5F9",
                      backgroundColor: isDragOver ? "#EFF6FF" : "#FFFFFF",
                      outline: isDragOver ? "2px dashed #2563EB" : undefined,
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        minWidth: "800px",
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
                              borderRight: idx === hours.length - 1 ? "none" : "1px solid #F8FAFC",
                            }}
                          />
                        ))}
                      </div>

                      {/* Time Off Full-Track Overlay */}
                      {timeOff && (
                        <div
                          style={{
                            position: "absolute",
                            left: "8px",
                            right: "8px",
                            top: "8px",
                            bottom: "8px",
                            backgroundColor: "#FEF2F2",
                            border: "1px solid #FECACA",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#B91C1C",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            gap: "0.4rem",
                            zIndex: 10,
                          }}
                        >
                          <AlertCircle size={14} style={{ color: "#DC2626" }} />
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
                          const isDraft = !shift.is_published;
                          const isConflict = shift.isConflict;
                          const isBackup = Boolean(shift.is_backup || shift.sch_status === "backup");

                          return (
                            <div
                              key={shift.id}
                              onClick={() => onEditShift(shift)}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify({
                                    shiftId: shift.id,
                                    assign_to: shift.assign_to,
                                    schedule_date: shift.schedule_date,
                                  })
                                );
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              style={{
                                position: "absolute",
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                height: "38px",
                                padding: "0 0.6rem",
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.35rem",
                                cursor: "grab",
                                zIndex: 15,
                                userSelect: "none",
                                transition: "transform 0.15s ease",
                                backgroundColor: isConflict
                                  ? "#FEF2F2"
                                  : isBackup
                                  ? "#FAF5FF"
                                  : isDraft
                                  ? "#FFFBEB"
                                  : "#2563EB",
                                border: isConflict
                                  ? "1.5px solid #F87171"
                                  : isBackup
                                  ? "1.5px solid #9333EA"
                                  : isDraft
                                  ? "1.5px dashed #F59E0B"
                                  : "none",
                                color: isConflict
                                  ? "#991B1B"
                                  : isBackup
                                  ? "#6B21A8"
                                  : isDraft
                                  ? "#78350F"
                                  : "#FFFFFF",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                              }}
                              title={`Drag to reassign to another driver`}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", overflow: "hidden" }}>
                                <Clock size={12} style={{ flexShrink: 0 }} />
                                <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                                  {shift.shift_duration_start?.slice(0, 5)} - {shift.shift_duration_end?.slice(0, 5)}
                                </span>
                                {shift.route_code && (
                                  <span
                                    style={{
                                      padding: "0.1rem 0.35rem",
                                      borderRadius: "4px",
                                      fontSize: "0.625rem",
                                      fontWeight: 600,
                                      backgroundColor: isDraft || isConflict || isBackup ? "#FFFFFF" : "#1D4ED8",
                                      color: isDraft || isConflict ? "#475569" : isBackup ? "#9333EA" : "#FFFFFF",
                                      border: isDraft || isConflict || isBackup ? "1px solid #E2E8F0" : "none",
                                    }}
                                  >
                                    {shift.route_code}
                                  </span>
                                )}
                              </div>

                              <div>
                                {isBackup ? (
                                  <span
                                    style={{
                                      fontSize: "0.625rem",
                                      fontWeight: 700,
                                      padding: "0.1rem 0.35rem",
                                      borderRadius: "9999px",
                                      backgroundColor: "#F3E8FF",
                                      color: "#6B21A8",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "2px",
                                    }}
                                  >
                                    <Sparkles size={8} /> Extra
                                  </span>
                                ) : isDraft ? (
                                  <span
                                    style={{
                                      fontSize: "0.625rem",
                                      fontWeight: 700,
                                      padding: "0.1rem 0.35rem",
                                      borderRadius: "9999px",
                                      backgroundColor: "#FEF3C7",
                                      color: "#B45309",
                                    }}
                                  >
                                    Draft
                                  </span>
                                ) : isConflict ? (
                                  <span
                                    style={{
                                      fontSize: "0.625rem",
                                      fontWeight: 700,
                                      padding: "0.1rem 0.35rem",
                                      borderRadius: "9999px",
                                      backgroundColor: "#FEE2E2",
                                      color: "#B91C1C",
                                    }}
                                  >
                                    Conflict
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#BFDBFE" }}>
                                    {shift.total_hours || "10"}h
                                  </span>
                                )}
                              </div>
                            </div>
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
