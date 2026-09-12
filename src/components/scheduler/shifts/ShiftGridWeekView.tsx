import React, { FC, useState } from "react";
import { Plus, Clock, AlertCircle } from "lucide-react";
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

interface ShiftGridWeekViewProps {
  days: DayColumnInfo[];
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

export const ShiftGridWeekView: FC<ShiftGridWeekViewProps> = ({
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

  // Check if a driver has approved time-off on a given date
  const getDriverTimeOff = (driverId: number, dateStr: string) => {
    return timeOffRequests.find(
      (t) =>
        t.driver_id === driverId &&
        (t.leave_status === "approved" || t.status === "approved") &&
        dateStr >= t.start_date &&
        dateStr <= t.end_date
    );
  };

  // Calculate total scheduled hours for each driver in this 7-day window
  const getDriverWeeklyHours = (driverId: number) => {
    const driverShifts = shifts.filter(
      (s) => s.assign_to === driverId && days.some((d) => d.dateStr === s.schedule_date)
    );
    return driverShifts.reduce((sum, s) => sum + (parseFloat(s.total_hours || "10.0") || 10.0), 0);
  };

  const handleDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCell !== cellKey) {
      setDragOverCell(cellKey);
    }
  };

  const handleDragLeave = (cellKey: string) => {
    if (dragOverCell === cellKey) {
      setDragOverCell(null);
    }
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
        {/* Table Header */}
        <thead>
          <tr>
            {/* Left Pinned Driver Column Header */}
            <th className="sch-th-pinned">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>DRIVERS ROSTER ({drivers.length})</span>
                <span style={{ fontSize: "0.625rem", fontWeight: 500, color: "#64748B" }}>
                  Target: 40h/wk
                </span>
              </div>
            </th>

            {/* 7 Day Column Headers */}
            {days.map((day) => {
              const dayShiftsCount = shifts.filter((s) => s.schedule_date === day.dateStr).length;
              return (
                <th
                  key={day.dateStr}
                  className={`sch-th-day ${day.isToday ? "today" : ""}`}
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
                {loading ? "Loading drivers and shift schedules..." : "No drivers match your current filter."}
              </td>
            </tr>
          ) : (
            drivers.map((driver) => {
              const weeklyHours = getDriverWeeklyHours(driver.id);
              const targetHours = driver.target_hours || 40;
              const isOvertime = weeklyHours > targetHours;
              const avatarBg = getAvatarColor(driver.name, "driver");

              return (
                <tr key={driver.id} className="sch-row">
                  {/* Left Pinned Driver Cell */}
                  <td className="sch-td-pinned">
                    <div className="sch-driver-card">
                      {/* Driver Avatar with Dynamic Distinct Color */}
                      <div
                        className="unified-avatar-circle"
                        style={{ background: avatarBg }}
                        title={driver.name}
                      >
                        <span>{getInitials(driver.name)}</span>
                      </div>

                      {/* Driver Information Block */}
                      <div className="sch-driver-info-block">
                        <div className="sch-driver-name-row">
                          <span className="sch-driver-name" title={driver.name}>
                            {driver.name}
                          </span>
                        </div>

                        {/* Hours tally */}
                        <div className="sch-driver-hours-tally">
                          <span className={`sch-driver-hours-text ${isOvertime ? "overtime" : ""}`}>
                            <Clock size={11} style={{ color: "#64748B", flexShrink: 0 }} />
                            <span>{weeklyHours.toFixed(1)}h / {targetHours}h</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 7 Days Cells with Drag-and-Drop & Per-Driver Shift Creation */}
                  {days.map((day) => {
                    const cellKey = `${driver.id}_${day.dateStr}`;
                    const isDragOver = dragOverCell === cellKey;
                    const dayShifts = shifts.filter(
                      (s) => s.assign_to === driver.id && s.schedule_date === day.dateStr
                    );
                    const timeOff = getDriverTimeOff(driver.id, day.dateStr);

                    return (
                      <td
                        key={day.dateStr}
                        className={`sch-td-day ${day.isToday ? "today" : ""}`}
                        onDragOver={(e) => handleDragOver(e, cellKey)}
                        onDragLeave={() => handleDragLeave(cellKey)}
                        onDrop={(e) => handleDrop(e, driver.id, day.dateStr)}
                        style={{
                          backgroundColor: isDragOver ? "#EFF6FF" : undefined,
                          outline: isDragOver ? "2px dashed #2563EB" : undefined,
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <div className="sch-cell-content">
                          {/* Approved Leave Alert */}
                          {timeOff && (
                            <div className="sch-timeoff-banner">
                              <AlertCircle size={11} style={{ color: "#DC2626", flexShrink: 0 }} />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                Approved Leave
                              </span>
                            </div>
                          )}

                          {/* Render Shifts */}
                          {dayShifts.map((shift) => (
                            <ShiftCard
                              key={shift.id}
                              shift={{
                                ...shift,
                                isConflict: shift.isConflict || Boolean(timeOff),
                                conflictReason: shift.conflictReason || (timeOff ? "Driver on approved leave" : undefined),
                              }}
                              onEdit={onEditShift}
                              onDelete={onDeleteShift}
                              onMarkExtra={onMarkExtra}
                            />
                          ))}

                          {/* Empty slot quick add button */}
                          {dayShifts.length === 0 && !timeOff && (
                            <button
                              type="button"
                              onClick={() => onCellClick(driver.id, day.dateStr)}
                              className="sch-empty-slot-btn"
                              title={`Create shift for ${driver.name} on ${day.dateStr}`}
                            >
                              <Plus size={16} />
                            </button>
                          )}

                          {/* Additional Shift creation trigger for driver when shifts already exist */}
                          {dayShifts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => onCellClick(driver.id, day.dateStr)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                                width: "100%",
                                padding: "0.2rem 0.4rem",
                                marginTop: "0.25rem",
                                borderRadius: "6px",
                                border: "1px dashed #CBD5E1",
                                backgroundColor: "#FFFFFF",
                                color: "#64748B",
                                fontSize: "0.6875rem",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#2563EB";
                                e.currentTarget.style.color = "#2563EB";
                                e.currentTarget.style.backgroundColor = "#F8FAFC";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#CBD5E1";
                                e.currentTarget.style.color = "#64748B";
                                e.currentTarget.style.backgroundColor = "#FFFFFF";
                              }}
                              title={`Add another shift for ${driver.name}`}
                            >
                              <Plus size={11} />
                              <span>Shift</span>
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
