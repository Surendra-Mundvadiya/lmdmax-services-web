import React, { FC, useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export interface AppDateNavigatorProps {
  selectedDate: string; // ISO date string: "YYYY-MM-DD"
  onChange: (date: string) => void;
  align?: "left" | "right";
  showTodayBtn?: boolean;
  className?: string;
  style?: React.CSSProperties;
  size?: "sm" | "md";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Safe date helpers preventing any timezone offset issues
function parseISODate(isoStr: string): { year: number; month: number; day: number; dateObj: Date } {
  if (!isoStr || !isoStr.trim()) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate(), dateObj: now };
  }
  const parts = isoStr.split("-").map(Number);
  const year = !isNaN(parts[0]) && parts[0] > 1900 ? parts[0] : new Date().getFullYear();
  const month = !isNaN(parts[1]) && parts[1] >= 1 && parts[1] <= 12 ? parts[1] - 1 : new Date().getMonth();
  const day = !isNaN(parts[2]) && parts[2] >= 1 && parts[2] <= 31 ? parts[2] : new Date().getDate();
  const dateObj = new Date(year, month, day);
  return { year, month, day, dateObj };
}

function formatToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayISO(): string {
  return formatToISO(new Date());
}

export const AppDateNavigator: FC<AppDateNavigatorProps> = ({
  selectedDate,
  onChange,
  align = "right",
  showTodayBtn = true,
  className = "",
  style = {},
  size = "sm",
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { year: currentYear, month: currentMonth } = useMemo(
    () => parseISODate(selectedDate),
    [selectedDate]
  );

  const [calendarViewYear, setCalendarViewYear] = useState<number>(currentYear);
  const [calendarViewMonth, setCalendarViewMonth] = useState<number>(currentMonth);

  // Sync calendar view month/year whenever selectedDate updates
  useEffect(() => {
    const { year, month } = parseISODate(selectedDate);
    setCalendarViewYear(year);
    setCalendarViewMonth(month);
  }, [selectedDate]);

  // Click-outside and Escape key dismissal
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCalendarOpen]);

  // Formatted date title for main display button (e.g. "Tue, Sep 8, 2026")
  const formattedDateTitle = useMemo(() => {
    try {
      const { dateObj } = parseISODate(selectedDate);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isToday = useMemo(() => {
    return selectedDate === getTodayISO();
  }, [selectedDate]);

  // Prev / Next day handlers
  const handlePrevDay = () => {
    const { dateObj } = parseISODate(selectedDate);
    dateObj.setDate(dateObj.getDate() - 1);
    onChange(formatToISO(dateObj));
  };

  const handleNextDay = () => {
    const { dateObj } = parseISODate(selectedDate);
    dateObj.setDate(dateObj.getDate() + 1);
    onChange(formatToISO(dateObj));
  };

  const handleToday = () => {
    onChange(getTodayISO());
  };

  // Calendar month / year navigators
  const handlePrevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarViewMonth(11);
      setCalendarViewYear((y) => y - 1);
    } else {
      setCalendarViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarViewMonth === 11) {
      setCalendarViewMonth(0);
      setCalendarViewYear((y) => y + 1);
    } else {
      setCalendarViewMonth((m) => m + 1);
    }
  };

  const handleSelectCalendarDay = (day: number, targetMonth = calendarViewMonth, targetYear = calendarViewYear) => {
    const mStr = String(targetMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    onChange(`${targetYear}-${mStr}-${dStr}`);
    setIsCalendarOpen(false);
  };

  const handleCalendarYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    onChange(formatToISO(d));
    setIsCalendarOpen(false);
  };

  const handleCalendarToday = () => {
    onChange(getTodayISO());
    setIsCalendarOpen(false);
  };

  const handleCalendarTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    onChange(formatToISO(d));
    setIsCalendarOpen(false);
  };

  // Days calculations
  const firstDayOfWeek = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
  const daysInViewMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calendarViewYear, calendarViewMonth, 0).getDate();

  const prevPaddingDays = useMemo(() => {
    const arr: number[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      arr.push(daysInPrevMonth - i);
    }
    return arr;
  }, [firstDayOfWeek, daysInPrevMonth]);

  const nextPaddingDays = useMemo(() => {
    const totalFilled = prevPaddingDays.length + daysInViewMonth;
    const nextSlots = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7);
    return Array.from({ length: nextSlots }, (_, i) => i + 1);
  }, [prevPaddingDays.length, daysInViewMonth]);

  // Year choices from currentYear - 6 to currentYear + 10
  const calendarYears = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = thisYear - 6; y <= thisYear + 10; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const isSmall = size === "sm";
  const btnHeight = isSmall ? "28px" : "34px";
  const btnFontSize = isSmall ? "0.8125rem" : "0.875rem";

  return (
    <div
      ref={containerRef}
      className={`app-date-navigator ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        backgroundColor: "#F8FAFC",
        padding: isSmall ? "0.2rem 0.3rem" : "0.25rem 0.4rem",
        borderRadius: "7px",
        border: "1px solid #E2E8F0",
        position: "relative",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* 1-Click Previous Day */}
      <button
        type="button"
        onClick={handlePrevDay}
        style={{
          width: btnHeight,
          height: btnHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "5px",
          border: "1px solid #CBD5E1",
          backgroundColor: "#FFFFFF",
          color: "#475569",
          cursor: "pointer",
          padding: 0,
          transition: "all 0.15s ease",
        }}
        title="Previous Day"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
      >
        <ChevronLeft size={isSmall ? 14 : 16} />
      </button>

      {/* Main Center Trigger Button (Formatted Date with Calendar Icon and Chevron) */}
      <button
        type="button"
        onClick={() => setIsCalendarOpen((prev) => !prev)}
        style={{
          height: btnHeight,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          backgroundColor: isCalendarOpen ? "#DBEAFE" : "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: "5px",
          padding: isSmall ? "0.2rem 0.65rem" : "0.3rem 0.8rem",
          cursor: "pointer",
          color: "#1D4ED8",
          fontSize: btnFontSize,
          fontWeight: 700,
          whiteSpace: "nowrap",
          transition: "all 0.15s ease",
        }}
        title="Click to open calendar and select any date"
      >
        <CalendarIcon size={isSmall ? 13 : 15} style={{ color: "#2563EB", flexShrink: 0 }} />
        <span>{formattedDateTitle}</span>
        <ChevronDown
          size={isSmall ? 12 : 14}
          style={{
            color: "#2563EB",
            transform: isCalendarOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {/* 1-Click Next Day */}
      <button
        type="button"
        onClick={handleNextDay}
        style={{
          width: btnHeight,
          height: btnHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "5px",
          border: "1px solid #CBD5E1",
          backgroundColor: "#FFFFFF",
          color: "#475569",
          cursor: "pointer",
          padding: 0,
          transition: "all 0.15s ease",
        }}
        title="Next Day"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
      >
        <ChevronRight size={isSmall ? 14 : 16} />
      </button>

      {/* Dynamic Today Shortcut Button */}
      {showTodayBtn && !isToday && (
        <button
          type="button"
          onClick={handleToday}
          style={{
            height: btnHeight,
            padding: isSmall ? "0.2rem 0.55rem" : "0.3rem 0.7rem",
            fontSize: isSmall ? "0.75rem" : "0.8125rem",
            fontWeight: 600,
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
          title="Jump to Today"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1D4ED8")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
        >
          Today
        </button>
      )}

      {/* Interactive Calendar Popover Dropdown */}
      {isCalendarOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 2000,
            backgroundColor: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "10px",
            boxShadow:
              "0 12px 28px -4px rgba(0, 0, 0, 0.16), 0 8px 10px -4px rgba(0, 0, 0, 0.08)",
            padding: "0.75rem",
            width: "280px",
            boxSizing: "border-box",
            userSelect: "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Row: Month & Year Select Dropdowns + Prev / Next Month Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.35rem",
              marginBottom: "0.6rem",
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "5px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
                color: "#475569",
                cursor: "pointer",
              }}
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <select
                value={calendarViewMonth}
                onChange={(e) => setCalendarViewMonth(Number(e.target.value))}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#1E293B",
                  backgroundColor: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  borderRadius: "5px",
                  padding: "0.2rem 0.4rem",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={calendarViewYear}
                onChange={(e) => setCalendarViewYear(Number(e.target.value))}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#1E293B",
                  backgroundColor: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  borderRadius: "5px",
                  padding: "0.2rem 0.4rem",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {calendarYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "5px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
                color: "#475569",
                cursor: "pointer",
              }}
              title="Next Month"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday Abbreviations Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "#94A3B8",
              marginBottom: "0.35rem",
            }}
          >
            {WEEKDAY_NAMES.map((d) => (
              <div key={d} style={{ padding: "0.2rem 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "2px",
            }}
          >
            {/* Trailing days from previous month */}
            {prevPaddingDays.map((day) => {
              const targetMonth = calendarViewMonth === 0 ? 11 : calendarViewMonth - 1;
              const targetYear = calendarViewMonth === 0 ? calendarViewYear - 1 : calendarViewYear;
              return (
                <button
                  key={`prev-${day}`}
                  type="button"
                  onClick={() => handleSelectCalendarDay(day, targetMonth, targetYear)}
                  style={{
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    color: "#CBD5E1",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Previous month day"
                >
                  {day}
                </button>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInViewMonth }, (_, i) => i + 1).map((day) => {
              const mStr = String(calendarViewMonth + 1).padStart(2, "0");
              const dStr = String(day).padStart(2, "0");
              const dayIso = `${calendarViewYear}-${mStr}-${dStr}`;
              const isSelected = selectedDate === dayIso;
              const isTodayDay = getTodayISO() === dayIso;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectCalendarDay(day)}
                  style={{
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: isSelected ? 700 : isTodayDay ? 700 : 500,
                    color: isSelected ? "#FFFFFF" : isTodayDay ? "#2563EB" : "#1E293B",
                    backgroundColor: isSelected
                      ? "#2563EB"
                      : isTodayDay
                      ? "#EFF6FF"
                      : "transparent",
                    border: isTodayDay && !isSelected ? "1px solid #93C5FD" : "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#F1F5F9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isTodayDay ? "#EFF6FF" : "transparent";
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}

            {/* Leading days into next month */}
            {nextPaddingDays.map((day) => {
              const targetMonth = calendarViewMonth === 11 ? 0 : calendarViewMonth + 1;
              const targetYear = calendarViewMonth === 11 ? calendarViewYear + 1 : calendarViewYear;
              return (
                <button
                  key={`next-${day}`}
                  type="button"
                  onClick={() => handleSelectCalendarDay(day, targetMonth, targetYear)}
                  style={{
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    color: "#CBD5E1",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Next month day"
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.6rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                type="button"
                onClick={handleCalendarYesterday}
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "#475569",
                  backgroundColor: "#F1F5F9",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.2rem 0.45rem",
                  cursor: "pointer",
                }}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={handleCalendarToday}
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "#2563EB",
                  backgroundColor: "#EFF6FF",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.2rem 0.45rem",
                  cursor: "pointer",
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleCalendarTomorrow}
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "#475569",
                  backgroundColor: "#F1F5F9",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.2rem 0.45rem",
                  cursor: "pointer",
                }}
              >
                Tomorrow
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "#64748B",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "4px",
                padding: "0.2rem 0.45rem",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1E293B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppDateNavigator;
