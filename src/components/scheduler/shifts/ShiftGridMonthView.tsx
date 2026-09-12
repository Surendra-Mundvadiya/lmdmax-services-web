import React, { FC, useState } from "react";
import { Plus, Clock, Sparkles } from "lucide-react";
import {
  SchedulerShiftItem,
  SchedulerDriverItem,
  SchedulerTimeOffItem,
} from "../../../api/schedulerApi";

interface ShiftGridMonthViewProps {
  currentDate: Date;
  drivers: SchedulerDriverItem[];
  shifts: SchedulerShiftItem[];
  timeOffRequests: SchedulerTimeOffItem[];
  onCellClick: (driverId: number | null, dateStr: string) => void;
  onEditShift: (shift: SchedulerShiftItem) => void;
  onDeleteShift: (shiftId: number) => void;
  onMarkExtra?: (shiftId: number, isBackup: boolean) => void;
  onDropShift?: (shiftId: number, targetDriverId: number, targetDate: string) => void;
  loading?: boolean;
}

export const ShiftGridMonthView: FC<ShiftGridMonthViewProps> = ({
  currentDate,
  drivers,
  shifts,
  onCellClick,
  onEditShift,
  onDropShift,
  loading = false,
}) => {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const formatDateISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateISO(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();

  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const calendarCells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const d = new Date(year, month - 1, dayNum);
    const dStr = formatDateISO(d);
    calendarCells.push({
      dateStr: dStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
    });
  }

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const curD = new Date(year, month, d);
    const dStr = formatDateISO(curD);
    calendarCells.push({
      dateStr: dStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
    });
  }

  const remainder = calendarCells.length % 7;
  if (remainder !== 0) {
    const paddingNeeded = 7 - remainder;
    for (let p = 1; p <= paddingNeeded; p++) {
      const nextD = new Date(year, month + 1, p);
      const dStr = formatDateISO(nextD);
      calendarCells.push({
        dateStr: dStr,
        dayNumber: p,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDate !== dateStr) setDragOverDate(dateStr);
  };

  const handleDragLeave = (dateStr: string) => {
    if (dragOverDate === dateStr) setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.shiftId && onDropShift) {
          const targetDriverId = data.assign_to || (drivers[0]?.id ?? 0);
          onDropShift(Number(data.shiftId), targetDriverId, dateStr);
        }
      }
    } catch (err) {
      console.error("Failed to parse drop shift payload:", err);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "14px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          backgroundColor: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        {daysOfWeek.map((day) => (
          <div
            key={day}
            style={{
              padding: "0.75rem 0.5rem",
              textAlign: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          backgroundColor: "#E2E8F0",
          gap: "1px",
        }}
      >
        {calendarCells.map((cell) => {
          const dayShifts = shifts.filter((s) => s.schedule_date === cell.dateStr);
          const isDragOver = dragOverDate === cell.dateStr;

          return (
            <div
              key={cell.dateStr}
              onDragOver={(e) => handleDragOver(e, cell.dateStr)}
              onDragLeave={() => handleDragLeave(cell.dateStr)}
              onDrop={(e) => handleDrop(e, cell.dateStr)}
              style={{
                minHeight: "120px",
                backgroundColor: isDragOver ? "#EFF6FF" : cell.isCurrentMonth ? "#FFFFFF" : "#F8FAFC",
                padding: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                position: "relative",
                transition: "background-color 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: cell.isToday ? 800 : cell.isCurrentMonth ? 600 : 400,
                    color: cell.isToday ? "#2563EB" : cell.isCurrentMonth ? "#1E293B" : "#94A3B8",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: cell.isToday ? "24px" : "auto",
                    height: cell.isToday ? "24px" : "auto",
                    borderRadius: cell.isToday ? "50%" : "none",
                    backgroundColor: cell.isToday ? "#EFF6FF" : "transparent",
                  }}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={() => onCellClick(null, cell.dateStr)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title={`Add shift on ${cell.dateStr}`}
                >
                  <Plus size={11} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  flex: 1,
                  overflowY: "auto",
                  maxHeight: "95px",
                }}
              >
                {dayShifts.slice(0, 3).map((shift) => {
                  const isBackup = Boolean(shift.is_backup || shift.sch_status === "backup");
                  const isDraft = !shift.is_published;

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
                        padding: "0.25rem 0.4rem",
                        borderRadius: "5px",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        cursor: "grab",
                        backgroundColor: isBackup
                          ? "#FAF5FF"
                          : isDraft
                          ? "#FFFBEB"
                          : "#EFF6FF",
                        border: isBackup
                          ? "1px solid #C084FC"
                          : isDraft
                          ? "1px dashed #F59E0B"
                          : "1px solid #BFDBFE",
                        color: isBackup
                          ? "#6B21A8"
                          : isDraft
                          ? "#92400E"
                          : "#1E40AF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={`${shift.driver_name || "Unassigned"} (${shift.shift_duration_start?.slice(0, 5)} - ${shift.shift_duration_end?.slice(0, 5)})`}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {shift.driver_name || "Unassigned"}
                      </span>
                      <span style={{ fontSize: "0.625rem", color: "#64748B", marginLeft: "0.2rem" }}>
                        {shift.shift_duration_start?.slice(0, 5)}
                      </span>
                    </div>
                  );
                })}

                {dayShifts.length > 3 && (
                  <span style={{ fontSize: "0.625rem", color: "#64748B", fontWeight: 600, textAlign: "center" }}>
                    +{dayShifts.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
