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
        backgroundColor: "rgba(0, 0, 0, 0.04)",
        padding: isSmall ? "0.2rem 0.3rem" : "0.25rem 0.4rem",
        borderRadius: "var(--ads-r-xs)",
        border: "1px solid var(--ads-hairline)",
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
          borderRadius: "var(--ads-r-xs)",
          border: "1px solid var(--ads-hairline)",
          backgroundColor: "var(--ads-material-thick)",
          color: "var(--ads-ink-secondary)",
          cursor: "pointer",
          padding: 0,
          transition: "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
        }}
        title="Previous Day"
        aria-label="Previous day"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-white)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-material-thick)")}
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
          backgroundColor: isCalendarOpen ? "var(--ads-blue-tint-strong)" : "var(--ads-blue-tint)",
          border: "1px solid var(--ads-blue-tint-strong)",
          borderRadius: "var(--ads-r-xs)",
          padding: isSmall ? "0.2rem 0.65rem" : "0.3rem 0.8rem",
          cursor: "pointer",
          color: "var(--ads-blue)",
          fontSize: btnFontSize,
          fontWeight: 700,
          whiteSpace: "nowrap",
          transition: "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
        }}
        title="Click to open calendar and select any date"
      >
        <CalendarIcon size={isSmall ? 13 : 15} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
        <span>{formattedDateTitle}</span>
        <ChevronDown
          size={isSmall ? 12 : 14}
          style={{
            color: "var(--ads-blue)",
            transform: isCalendarOpen ? "rotate(180deg)" : "none",
            transition: "transform var(--ads-dur-fast) var(--ads-ease)",
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
          borderRadius: "var(--ads-r-xs)",
          border: "1px solid var(--ads-hairline)",
          backgroundColor: "var(--ads-material-thick)",
          color: "var(--ads-ink-secondary)",
          cursor: "pointer",
          padding: 0,
          transition: "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
        }}
        title="Next Day"
        aria-label="Next day"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-white)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-material-thick)")}
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
            backgroundColor: "var(--ads-blue)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--ads-r-pill)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
          }}
          title="Jump to Today"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue)")}
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
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-lg)",
            boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
            padding: "0.75rem",
            width: "280px",
            maxWidth: "calc(100vw - 32px)",
            boxSizing: "border-box",
            animation: "ads-sheet-in var(--ads-dur) var(--ads-ease)",
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
                borderRadius: "var(--ads-r-xs)",
                border: "1px solid var(--ads-hairline)",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                color: "var(--ads-ink-secondary)",
                cursor: "pointer",
              }}
              title="Previous Month"
              aria-label="Previous month"
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
                  color: "var(--ads-ink)",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-xs)",
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
                  color: "var(--ads-ink)",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-xs)",
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
                borderRadius: "var(--ads-r-xs)",
                border: "1px solid var(--ads-hairline)",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                color: "var(--ads-ink-secondary)",
                cursor: "pointer",
              }}
              title="Next Month"
              aria-label="Next month"
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
              color: "var(--ads-ink-quaternary)",
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
                    color: "var(--ads-hairline-strong)",
                    borderRadius: "var(--ads-r-xs)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)")}
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
                    color: isSelected ? "#FFFFFF" : isTodayDay ? "var(--ads-blue)" : "var(--ads-ink)",
                    backgroundColor: isSelected
                      ? "var(--ads-blue)"
                      : isTodayDay
                      ? "var(--ads-blue-tint)"
                      : "transparent",
                    border: isTodayDay && !isSelected ? "1px solid var(--ads-blue-tint-strong)" : "none",
                    borderRadius: "var(--ads-r-xs)",
                    cursor: "pointer",
                    transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isTodayDay ? "var(--ads-blue-tint)" : "transparent";
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
                    color: "var(--ads-hairline-strong)",
                    borderRadius: "var(--ads-r-xs)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)")}
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
              borderTop: "1px solid var(--ads-hairline)",
            }}
          >
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                type="button"
                onClick={handleCalendarYesterday}
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--ads-ink-secondary)",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  border: "none",
                  borderRadius: "var(--ads-r-pill)",
                  padding: "3px 9px",
                  cursor: "pointer",
                  transition: "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
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
                  color: "var(--ads-blue)",
                  backgroundColor: "var(--ads-blue-tint)",
                  border: "none",
                  borderRadius: "var(--ads-r-pill)",
                  padding: "3px 9px",
                  cursor: "pointer",
                  transition: "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
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
                  color: "var(--ads-ink-secondary)",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  border: "none",
                  borderRadius: "var(--ads-r-pill)",
                  padding: "3px 9px",
                  cursor: "pointer",
                  transition: "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
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
                color: "var(--ads-ink-tertiary)",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "var(--ads-r-pill)",
                padding: "3px 9px",
                cursor: "pointer",
                transition: "color var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ads-ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ads-ink-tertiary)")}
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
