import React, { FC, useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

interface CustomDatePickerProps {
  value: string; // accepts "MM/DD/YYYY" or "YYYY-MM-DD"
  onChange: (value: string) => void; // returns "MM/DD/YYYY"
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
  id?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Helper to normalize input value to a Date
function parseInputDate(str: string): Date | null {
  if (!str || !str.trim()) return null;
  const trimmed = str.trim();

  // MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [m, d, y] = trimmed.split("/").map(Number);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime()) && date.getMonth() === m - 1) return date;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

// Format Date object to "MM/DD/YYYY"
function formatDateMMDDYYYY(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export const CustomDatePicker: FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  label,
  required = false,
  error,
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseInputDate(value), [value]);

  // Current view month & year in calendar
  const [viewYear, setViewYear] = useState<number>(() =>
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  );

  // Sync view when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  // Close calendar popup on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    setViewYear(Number(e.target.value));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    setViewMonth(Number(e.target.value));
  };

  const handleSelectDay = (day: number) => {
    const picked = new Date(viewYear, viewMonth, day);
    onChange(formatDateMMDDYYYY(picked));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const handleYesterday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    onChange(formatDateMMDDYYYY(d));
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    onChange(formatDateMMDDYYYY(today));
    setIsOpen(false);
  };

  const handleTomorrow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date();
    d.setDate(d.getDate() + 1);
    onChange(formatDateMMDDYYYY(d));
    setIsOpen(false);
  };

  // Calendar grid math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays = Array.from(
    { length: firstDayOfWeek },
    (_, i) => daysInPrevMonth - firstDayOfWeek + i + 1
  );
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

  // Year options: 1940 to 2040
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list: number[] = [];
    for (let y = currentYear + 10; y >= 1940; y--) {
      list.push(y);
    }
    return list;
  }, []);

  const today = new Date();
  const isCurrentMonthView =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="field-label-clean">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* Input box trigger */}
      <div
        className={`custom-datepicker-input-wrap ${isOpen ? "focused" : ""} ${
          error ? "has-error" : ""
        } ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        <input
          id={id}
          type="text"
          readOnly
          className="custom-datepicker-display-input"
          placeholder={placeholder}
          value={selectedDate ? formatDateMMDDYYYY(selectedDate) : ""}
          disabled={disabled}
        />
        <div className="custom-datepicker-icon-btn">
          <CalendarIcon size={16} className="text-blue-600" />
        </div>
      </div>

      {error && <span className="field-error-msg">{error}</span>}

      {/* Beautiful Calendar Popover */}
      {isOpen && (
        <div className="custom-calendar-popover animate-fadeIn" onClick={(e) => e.stopPropagation()}>
          {/* Header Navigation */}
          <div className="calendar-popover-header">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="cal-selectors-group">
              <select
                className="cal-select cal-select-month"
                value={viewMonth}
                onChange={handleMonthChange}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="cal-select cal-select-year"
                value={viewYear}
                onChange={handleYearChange}
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="cal-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekdays Header */}
          <div className="calendar-weekdays-row">
            {WEEKDAY_NAMES.map((d) => (
              <span key={d} className="calendar-weekday-cell">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid">
            {/* Previous Month trailing days */}
            {prevMonthDays.map((d) => (
              <button
                key={`prev-${d}`}
                type="button"
                className="calendar-day-cell outside-month"
                onClick={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear((y) => y - 1);
                  } else {
                    setViewMonth((m) => m - 1);
                  }
                }}
              >
                {d}
              </button>
            ))}

            {/* Current Month days */}
            {currentMonthDays.map((d) => {
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === d;
              const isToday = isCurrentMonthView && today.getDate() === d;

              return (
                <button
                  key={`day-${d}`}
                  type="button"
                  className={`calendar-day-cell ${isSelected ? "selected" : ""} ${
                    isToday && !isSelected ? "today" : ""
                  }`}
                  onClick={() => handleSelectDay(d)}
                >
                  {d}
                </button>
              );
            })}

            {/* Next Month leading days */}
            {nextMonthDays.map((d) => (
              <button
                key={`next-${d}`}
                type="button"
                className="calendar-day-cell outside-month"
                onClick={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear((y) => y + 1);
                  } else {
                    setViewMonth((m) => m + 1);
                  }
                }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Footer Quick Actions */}
          <div className="calendar-popover-footer">
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                type="button"
                className="cal-footer-btn"
                style={{ backgroundColor: "#F1F5F9", color: "#475569" }}
                onClick={handleYesterday}
              >
                Yesterday
              </button>
              <button
                type="button"
                className="cal-footer-btn today"
                onClick={handleToday}
              >
                Today
              </button>
              <button
                type="button"
                className="cal-footer-btn"
                style={{ backgroundColor: "#F1F5F9", color: "#475569" }}
                onClick={handleTomorrow}
              >
                Tomorrow
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                type="button"
                className="cal-footer-btn clear"
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="cal-footer-btn clear"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
