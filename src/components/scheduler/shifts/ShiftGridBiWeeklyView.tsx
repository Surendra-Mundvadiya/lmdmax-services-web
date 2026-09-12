import React, { FC, useState } from "react";
import { Plus, Clock } from "lucide-react";
import { ShiftCard } from "./ShiftCard";
import {
  SchedulerShiftItem,
  SchedulerDriverItem,
  SchedulerTimeOffItem,
} from "../../../api/schedulerApi";
import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";

interface DayColumnInfo {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // Sun, Mon, etc.
  dateNumber: string; // 6, 7, etc.
  isToday: boolean;
}

interface ShiftGridBiWeeklyViewProps {
  days: DayColumnInfo[]; // 14 days
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

export const ShiftGridBiWeeklyView: FC<ShiftGridBiWeeklyViewProps> = ({
  days,
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
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const getDriverTimeOff = (driverId: number, dateStr: string) => {
    return timeOffRequests.find(
      (t) =>
        t.driver_id === driverId &&
        (t.leave_status === "approved" || t.status === "approved") &&
        dateStr >= t.start_date &&
        dateStr <= t.end_date
    );
  };

  const getDriverBiWeeklyHours = (driverId: number) => {
    const driverShifts = shifts.filter(
      (s) => s.assign_to === driverId && days.some((d) => d.dateStr === s.schedule_date)
    );
    return driverShifts.reduce((sum, s) => sum + (parseFloat(s.total_hours || "10.0") || 10.0), 0);
  };

  const handleDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCell !== cellKey) setDragOverCell(cellKey);
  };

  const handleDragLeave = (cellKey: string) => {
    if (dragOverCell === cellKey) setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, driverId: number, dateStr: string) => {
    e.preventDefault();
    setDragOverCell(null);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.shiftId && onDropShift) {
          onDropShift(Number(data.shiftId), driverId, dateStr);
        }
      }
    } catch (err) {
      console.error("Failed to parse drop shift payload:", err);
    }
  };

  return (
    <div className="sch-matrix-scroll-pane scheduler-matrix-container">
      <table className="sch-table">
        {/* Header Row */}
        <thead>
          <tr>
            {/* Pinned Left Header */}
            <th className="sch-th-pinned" style={{ width: "240px", minWidth: "240px", maxWidth: "240px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>DRIVERS ({drivers.length})</span>
                <span
                  style={{ fontSize: "0.625rem", color: "var(--ads-ink-tertiary)", fontWeight: 550 }}
                >
                  14 Days
                </span>
              </div>
            </th>

            {/* 14 Day Columns */}
            {days.map((day, idx) => {
              const dayShiftsCount = shifts.filter((s) => s.schedule_date === day.dateStr).length;
              const isWeekSeparator = idx === 6;

              return (
                <th
                  key={day.dateStr}
                  className={`sch-th-day ${day.isToday ? "today" : ""}`}
                  style={{
                    minWidth: "90px",
                    padding: "var(--ads-s2) var(--ads-s1)",
                    borderRight: isWeekSeparator
                      ? "2px solid var(--ads-hairline-strong)"
                      : "1px solid var(--ads-hairline)",
                  }}
                >
                  <div className="sch-day-header-top">
                    <span className={`sch-day-name ${day.isToday ? "today" : ""}`}>
                      {day.dayLabel}
                    </span>
                    <span className={`sch-day-num ${day.isToday ? "today" : ""}`}>
                      {day.dateNumber}
                    </span>
                  </div>

                  <div className="sch-day-shifts-sub">
                    {dayShiftsCount} {dayShiftsCount === 1 ? "shift" : "shifts"}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {drivers.length === 0 ? (
            <tr>
              <td
                colSpan={days.length + 1}
                style={{
                  textAlign: "center",
                  padding: "var(--ads-s10) var(--ads-s4)",
                  color: "var(--ads-ink-tertiary)",
                  fontSize: "0.8125rem",
                }}
              >
                {loading ? "Loading 14-day schedule..." : "No drivers found."}
              </td>
            </tr>
          ) : (
            drivers.map((driver) => {
              const totalHours = getDriverBiWeeklyHours(driver.id);
              const targetHours = (driver.target_hours || 40) * 2; // 80h for 2 weeks
              const isOvertime = totalHours > targetHours;
              const avatarBg = getAvatarColor(driver.name, "driver");

              return (
                <tr key={driver.id} className="sch-row">
                  {/* Pinned Left Driver Cell */}
                  <td className="sch-td-pinned" style={{ width: "240px", minWidth: "240px", maxWidth: "240px" }}>
                    <div className="sch-driver-card">
                      <div
                        className="unified-avatar-circle sm"
                        style={{ background: avatarBg }}
                        title={driver.name}
                      >
                        <span>{getInitials(driver.name)}</span>
                      </div>

                      <div className="sch-driver-info-block">
                        <span className="sch-driver-name" title={driver.name}>
                          {driver.name}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--ads-s1)",
                            fontSize: "0.6875rem",
                            color: "var(--ads-ink-tertiary)",
                            marginTop: "0.15rem",
                          }}
                        >
                          <Clock size={10} style={{ color: "var(--ads-ink-quaternary)", flexShrink: 0 }} />
                          <span
                            style={{
                              fontWeight: 600,
                              color: isOvertime ? "var(--ads-amber)" : "var(--ads-ink-secondary)",
                            }}
                          >
                            {totalHours.toFixed(1)}h / {targetHours}h
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 14 Day Columns with Drag-and-Drop and Per-Driver Quick-Add */}
                  {days.map((day, idx) => {
                    const cellKey = `${driver.id}_${day.dateStr}`;
                    const isDragOver = dragOverCell === cellKey;
                    const dayShifts = shifts.filter(
                      (s) => s.assign_to === driver.id && s.schedule_date === day.dateStr
                    );
                    const timeOff = getDriverTimeOff(driver.id, day.dateStr);
                    const isWeekSeparator = idx === 6;

                    return (
                      <td
                        key={day.dateStr}
                        className={`sch-td-day ${day.isToday ? "today" : ""}`}
                        onDragOver={(e) => handleDragOver(e, cellKey)}
                        onDragLeave={() => handleDragLeave(cellKey)}
                        onDrop={(e) => handleDrop(e, driver.id, day.dateStr)}
                        style={{
                          padding: "var(--ads-s1)",
                          borderRight: isWeekSeparator
                            ? "2px solid var(--ads-hairline-strong)"
                            : "1px solid var(--ads-hairline)",
                          backgroundColor: isDragOver ? "var(--ads-blue-tint)" : undefined,
                          outline: isDragOver ? "2px dashed var(--ads-blue)" : undefined,
                          transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                        }}
                      >
                        <div
                          style={{
                            minHeight: "54px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--ads-s1)",
                          }}
                        >
                          {timeOff && (
                            <div
                              style={{
                                padding: "2px var(--ads-s1)",
                                borderRadius: "var(--ads-r-xs)",
                                background: "var(--ads-red-tint)",
                                border: "1px solid rgba(215, 0, 21, 0.28)",
                                color: "var(--ads-red)",
                                fontSize: "0.5625rem",
                                fontWeight: 600,
                                textAlign: "center",
                              }}
                            >
                              Leave
                            </div>
                          )}

                          {dayShifts.map((shift) => (
                            <ShiftCard
                              key={shift.id}
                              shift={{
                                ...shift,
                                isConflict: shift.isConflict || Boolean(timeOff),
                                conflictReason:
                                  shift.conflictReason ||
                                  (timeOff ? "Driver on approved leave" : undefined),
                              }}
                              density="micro"
                              onEdit={onEditShift}
                              title={`${shift.shift_duration_start?.slice(0, 5)} - ${shift.shift_duration_end?.slice(0, 5)} (Drag to move)`}
                            />
                          ))}

                          {/* Empty cell quick add button */}
                          {dayShifts.length === 0 && !timeOff && (
                            <button
                              type="button"
                              onClick={() => onCellClick(driver.id, day.dateStr)}
                              className="sch-empty-slot-btn"
                              style={{ minHeight: "44px", borderRadius: "var(--ads-r-xs)" }}
                              aria-label={`Create shift for ${driver.name} on ${day.dateStr}`}
                              title={`Create shift for ${driver.name} on ${day.dateStr}`}
                            >
                              <Plus size={13} />
                            </button>
                          )}

                          {/* Additional shift trigger when shifts exist */}
                          {dayShifts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => onCellClick(driver.id, day.dateStr)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                padding: "2px",
                                borderRadius: "var(--ads-r-xs)",
                                border: "1px dashed var(--ads-hairline-strong)",
                                background: "var(--ads-material-thick)",
                                color: "var(--ads-ink-tertiary)",
                                fontSize: "0.625rem",
                                cursor: "pointer",
                                transition:
                                  "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--ads-blue)";
                                e.currentTarget.style.color = "var(--ads-blue)";
                                e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--ads-hairline-strong)";
                                e.currentTarget.style.color = "var(--ads-ink-tertiary)";
                                e.currentTarget.style.backgroundColor = "var(--ads-material-thick)";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              aria-label={`Add another shift for ${driver.name}`}
                              title={`Add another shift for ${driver.name}`}
                            >
                              <Plus size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
