import React, { FC, useState } from "react";
import { Plus, Clock, Sparkles } from "lucide-react";
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
                <span style={{ fontSize: "0.625rem", color: "#64748B", fontWeight: 500 }}>14 Days</span>
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
                    padding: "0.5rem 0.25rem",
                    borderRight: isWeekSeparator ? "2.5px solid #94A3B8" : "1px solid #E2E8F0",
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
                style={{ textAlign: "center", padding: "4rem 1rem", color: "#94A3B8", fontSize: "0.8125rem" }}
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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.6875rem", color: "#64748B", marginTop: "0.15rem" }}>
                          <Clock size={10} style={{ color: "#64748B", flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: isOvertime ? "#D97706" : "#334155" }}>
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
                          padding: "0.3rem",
                          borderRight: isWeekSeparator ? "2.5px solid #94A3B8" : "1px solid #E2E8F0",
                          backgroundColor: isDragOver ? "#EFF6FF" : undefined,
                          outline: isDragOver ? "2px dashed #2563EB" : undefined,
                        }}
                      >
                        <div style={{ minHeight: "54px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {timeOff && (
                            <div
                              style={{
                                padding: "0.15rem 0.25rem",
                                borderRadius: "4px",
                                backgroundColor: "#FEF2F2",
                                border: "1px solid #FECACA",
                                color: "#B91C1C",
                                fontSize: "0.5625rem",
                                fontWeight: 700,
                                textAlign: "center",
                              }}
                            >
                              Leave
                            </div>
                          )}

                          {dayShifts.map((shift) => {
                            const isDraft = !shift.is_published;
                            const isConflict = shift.isConflict || Boolean(timeOff);
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
                                  padding: "0.3rem 0.4rem",
                                  borderRadius: "6px",
                                  fontSize: "0.6875rem",
                                  cursor: "grab",
                                  backgroundColor: isConflict
                                    ? "#FEF2F2"
                                    : isBackup
                                    ? "#FAF5FF"
                                    : isDraft
                                    ? "#FFFBEB"
                                    : "#EFF6FF",
                                  border: isConflict
                                    ? "1px solid #F87171"
                                    : isBackup
                                    ? "1px solid #C084FC"
                                    : isDraft
                                    ? "1px dashed #F59E0B"
                                    : "1px solid #93C5FD",
                                  color: isConflict
                                    ? "#991B1B"
                                    : isBackup
                                    ? "#6B21A8"
                                    : isDraft
                                    ? "#78350F"
                                    : "#1E3A8A",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                }}
                                title={`${shift.shift_duration_start?.slice(0, 5)} - ${shift.shift_duration_end?.slice(0, 5)} (Drag to move)`}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
                                  <span>{shift.shift_duration_start?.slice(0, 5)}</span>
                                  {isBackup ? (
                                    <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#9333EA", display: "inline-flex", alignItems: "center", gap: "1px" }}>
                                      <Sparkles size={8} />B
                                    </span>
                                  ) : isDraft ? (
                                    <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#D97706" }}>D</span>
                                  ) : isConflict ? (
                                    <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#DC2626" }}>!</span>
                                  ) : (
                                    <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#2563EB" }}>P</span>
                                  )}
                                </div>
                                {shift.route_code && (
                                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.5625rem", color: "#64748B", marginTop: "0.1rem" }}>
                                    {shift.route_code}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Empty cell quick add button */}
                          {dayShifts.length === 0 && !timeOff && (
                            <button
                              type="button"
                              onClick={() => onCellClick(driver.id, day.dateStr)}
                              className="sch-empty-slot-btn"
                              style={{ minHeight: "44px" }}
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
                                padding: "0.15rem",
                                borderRadius: "4px",
                                border: "1px dashed #CBD5E1",
                                backgroundColor: "#FFFFFF",
                                color: "#64748B",
                                fontSize: "0.625rem",
                                cursor: "pointer",
                              }}
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
