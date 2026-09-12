import React, { FC, useState } from "react";
import { Plus } from "lucide-react";
import { ShiftCard } from "./ShiftCard";
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
        background: "var(--ads-material-thick)",
        WebkitBackdropFilter: "var(--ads-blur-md)",
        backdropFilter: "var(--ads-blur-md)",
        borderRadius: "var(--ads-r-lg)",
        border: "1px solid var(--ads-hairline)",
        boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          background: "var(--ads-material-thin)",
          WebkitBackdropFilter: "var(--ads-blur-sm)",
          backdropFilter: "var(--ads-blur-sm)",
          borderBottom: "1px solid var(--ads-hairline)",
        }}
      >
        {daysOfWeek.map((day) => (
          <div
            key={day}
            style={{
              padding: "var(--ads-s3) var(--ads-s2)",
              textAlign: "center",
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--ads-ink-quaternary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
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
          backgroundColor: "var(--ads-hairline)",
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
                backgroundColor: isDragOver
                  ? "var(--ads-blue-tint)"
                  : cell.isCurrentMonth
                  ? "var(--ads-white)"
                  : "var(--ads-canvas)",
                padding: "var(--ads-s2)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--ads-s1)",
                position: "relative",
                transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
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
                    fontWeight: cell.isToday ? 700 : cell.isCurrentMonth ? 600 : 500,
                    color: cell.isToday
                      ? "var(--ads-blue)"
                      : cell.isCurrentMonth
                      ? "var(--ads-ink)"
                      : "var(--ads-ink-quaternary)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: cell.isToday ? "24px" : "auto",
                    height: cell.isToday ? "24px" : "auto",
                    borderRadius: cell.isToday ? "var(--ads-r-pill)" : undefined,
                    backgroundColor: cell.isToday ? "var(--ads-blue-tint)" : "transparent",
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
                    borderRadius: "var(--ads-r-xs)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink-tertiary)",
                    cursor: "pointer",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)";
                    e.currentTarget.style.borderColor = "var(--ads-blue)";
                    e.currentTarget.style.color = "var(--ads-blue)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-material-thick)";
                    e.currentTarget.style.borderColor = "var(--ads-hairline)";
                    e.currentTarget.style.color = "var(--ads-ink-tertiary)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  aria-label={`Add shift on ${cell.dateStr}`}
                  title={`Add shift on ${cell.dateStr}`}
                >
                  <Plus size={11} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--ads-s1)",
                  flex: 1,
                  overflowY: "auto",
                  maxHeight: "95px",
                }}
              >
                {dayShifts.slice(0, 3).map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    density="compact"
                    onEdit={onEditShift}
                    title={`${shift.driver_name || "Unassigned"} (${shift.shift_duration_start?.slice(0, 5)} - ${shift.shift_duration_end?.slice(0, 5)})`}
                  />
                ))}

                {dayShifts.length > 3 && (
                  <span
                    style={{
                      fontSize: "0.625rem",
                      color: "var(--ads-ink-tertiary)",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
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
