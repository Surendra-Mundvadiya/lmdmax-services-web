import React, { FC, useState, useRef, useEffect, useMemo } from "react";
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { DashboardMode } from "../../hooks/useUnifiedDashboardQueries";
import { AppDateNavigator } from "../common/AppDateNavigator";

interface Props {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  date: string;
  onDateChange: (date: string) => void;
  weekNumber: number;
  onWeekChange: (week: number) => void;
}

// Calculate standard ISO week number from a date string (YYYY-MM-DD)
function getISOWeekFromDate(dateStr: string): number {
  if (!dateStr) return 36;
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// Calculate start (Monday) and end (Sunday) of an ISO week in a year
function getISOWeekRange(weekNum: number, yearNum: number): {
  startISO: string;
  endISO: string;
  rangeLabel: string;
} {
  const simple = new Date(yearNum, 0, 1 + (weekNum - 1) * 7);
  const dow = simple.getDay();
  const monday = new Date(simple);
  if (dow <= 4 && dow > 0) {
    monday.setDate(simple.getDate() - dow + 1);
  } else if (dow === 0) {
    monday.setDate(simple.getDate() - 6);
  } else {
    monday.setDate(simple.getDate() + 8 - dow);
  }
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startMonth = monday.toLocaleDateString("en-US", { month: "short" });
  const startDay = monday.getDate();
  const endMonth = sunday.toLocaleDateString("en-US", { month: "short" });
  const endDay = sunday.getDate();

  const rangeLabel =
    startMonth === endMonth
      ? `${startMonth} ${startDay} – ${endDay}`
      : `${startMonth} ${startDay} – ${endMonth} ${endDay}`;

  const formatISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    startISO: formatISO(monday),
    endISO: formatISO(sunday),
    rangeLabel,
  };
}

// Current ISO week
function getCurrentISOWeek(): number {
  const d = new Date();
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export const GlobalControlsBar: FC<Props> = ({
  mode,
  onModeChange,
  date,
  onDateChange,
  weekNumber,
  onWeekChange,
}) => {
  const [isWeekMenuOpen, setIsWeekMenuOpen] = useState(false);
  const weekMenuRef = useRef<HTMLDivElement>(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentWeek = useMemo(() => getCurrentISOWeek(), []);

  // Close week dropdown on outside click
  useEffect(() => {
    if (!isWeekMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (weekMenuRef.current && !weekMenuRef.current.contains(e.target as Node)) {
        setIsWeekMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isWeekMenuOpen]);

  const weekInfo = useMemo(
    () => getISOWeekRange(weekNumber, currentYear),
    [weekNumber, currentYear]
  );

  // Daily date selection handler
  const handleDailyDateSelect = (newDate: string) => {
    onDateChange(newDate);
    const calculatedWeek = getISOWeekFromDate(newDate);
    onWeekChange(calculatedWeek);
  };

  // Weekly navigators
  const handlePrevWeek = () => {
    const nextW = Math.max(1, weekNumber - 1);
    onWeekChange(nextW);
    const { startISO } = getISOWeekRange(nextW, currentYear);
    onDateChange(startISO);
  };

  const handleNextWeek = () => {
    const nextW = Math.min(53, weekNumber + 1);
    onWeekChange(nextW);
    const { startISO } = getISOWeekRange(nextW, currentYear);
    onDateChange(startISO);
  };

  const handleCurrentWeek = () => {
    onWeekChange(currentWeek);
    const { startISO } = getISOWeekRange(currentWeek, currentYear);
    onDateChange(startISO);
  };

  const handleSelectSpecificWeek = (w: number) => {
    onWeekChange(w);
    const { startISO } = getISOWeekRange(w, currentYear);
    onDateChange(startISO);
    setIsWeekMenuOpen(false);
  };

  // Pre-calculate all 53 weeks for dropdown
  const allWeeks = useMemo(() => {
    return Array.from({ length: 53 }, (_, idx) => {
      const w = idx + 1;
      const range = getISOWeekRange(w, currentYear);
      return {
        week: w,
        label: `Week ${w}`,
        rangeLabel: range.rangeLabel,
        isCurrent: w === currentWeek,
        isSelected: w === weekNumber,
      };
    });
  }, [currentYear, currentWeek, weekNumber]);

  return (
    <div className="uop-dashboard-toolbar">
      {/* Left: Operations live subtitle - NO white box, NO second header */}
      <div className="uop-toolbar-left">
        <span className="uop-toolbar-eyebrow">Operations Overview</span>
        <span className="uop-toolbar-sep">•</span>
        <span className="uop-toolbar-sub">
          {mode === "daily" ? "Daily Telemetry" : `Week ${weekNumber} Quality Scorecard`}
        </span>
        <span className="uop-live-tag">
          <span className="uop-live-dot" />
          Live
        </span>
      </div>

      {/* Right: Date Navigator (working on Days AND Weeks) - Sync & Time removed */}
      <div className="uop-toolbar-right">
        {/* Daily / Weekly Mode Switcher */}
        <div className="uop-toolbar-mode-switcher">
          <button
            type="button"
            className={`uop-toolbar-mode-btn ${mode === "daily" ? "active" : ""}`}
            onClick={() => onModeChange("daily")}
            title="Switch to Daily Operations View"
          >
            <Clock size={12} />
            <span>Daily</span>
          </button>
          <button
            type="button"
            className={`uop-toolbar-mode-btn ${mode === "weekly" ? "active" : ""}`}
            onClick={() => onModeChange("weekly")}
            title="Switch to Weekly Cycle Scorecard View"
          >
            <Calendar size={12} />
            <span>Weekly</span>
          </button>
        </div>

        {/* ── Daily Mode Calendar: AppDateNavigator (Driver Inspection page calendar) ── */}
        {mode === "daily" && (
          <AppDateNavigator
            selectedDate={date}
            onChange={handleDailyDateSelect}
            size="sm"
            align="right"
          />
        )}

        {/* ── Weekly Mode Calendar: Full Week Navigator with Popover ── */}
        {mode === "weekly" && (
          <div ref={weekMenuRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <div
              className="app-date-navigator"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                backgroundColor: "#F8FAFC",
                padding: "0.2rem 0.3rem",
                borderRadius: "7px",
                border: "1px solid #E2E8F0",
                boxSizing: "border-box",
              }}
            >
              {/* Prev Week */}
              <button
                type="button"
                onClick={handlePrevWeek}
                disabled={weekNumber <= 1}
                title="Previous Week"
                style={{
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: weekNumber <= 1 ? "#CBD5E1" : "#475569",
                  cursor: weekNumber <= 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Center Week Title Button */}
              <button
                type="button"
                onClick={() => setIsWeekMenuOpen(!isWeekMenuOpen)}
                title="Select a specific week"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0 0.55rem",
                  height: "28px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: "5px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "#1E293B",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Calendar size={13} style={{ color: "#2563EB" }} />
                <span>
                  Week {weekNumber} &middot; {weekInfo.rangeLabel}
                </span>
                <ChevronDown
                  size={12}
                  style={{
                    color: "#64748B",
                    transform: isWeekMenuOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                />
              </button>

              {/* Next Week */}
              <button
                type="button"
                onClick={handleNextWeek}
                disabled={weekNumber >= 53}
                title="Next Week"
                style={{
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: weekNumber >= 53 ? "#CBD5E1" : "#475569",
                  cursor: weekNumber >= 53 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronRight size={14} />
              </button>

              {/* Current Week Quick Jump */}
              <button
                type="button"
                onClick={handleCurrentWeek}
                style={{
                  height: "28px",
                  padding: "0 0.55rem",
                  borderRadius: "5px",
                  border: "1px solid #BFDBFE",
                  backgroundColor: weekNumber === currentWeek ? "#EFF6FF" : "#FFFFFF",
                  color: "#2563EB",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                This Week
              </button>
            </div>

            {/* Week Selection Dropdown Popover */}
            {isWeekMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: "280px",
                  maxHeight: "340px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                  zIndex: 2000,
                  padding: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    padding: "0.3rem 0.5rem 0.5rem",
                    borderBottom: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B" }}>
                    Select Performance Week
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
                    Year {currentYear}
                  </span>
                </div>

                <div
                  style={{
                    overflowY: "auto",
                    padding: "0.35rem 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.15rem",
                  }}
                >
                  {allWeeks.map((item) => (
                    <button
                      key={item.week}
                      type="button"
                      onClick={() => handleSelectSpecificWeek(item.week)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.4rem 0.6rem",
                        borderRadius: "6px",
                        border: item.isSelected ? "1px solid #BFDBFE" : "1px solid transparent",
                        backgroundColor: item.isSelected
                          ? "#EFF6FF"
                          : item.isCurrent
                          ? "#F8FAFC"
                          : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background-color 0.12s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: item.isSelected ? 800 : item.isCurrent ? 700 : 500,
                            color: item.isSelected ? "#2563EB" : "#1E293B",
                          }}
                        >
                          {item.label}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "#64748B" }}>
                          ({item.rangeLabel})
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        {item.isCurrent && !item.isSelected && (
                          <span
                            style={{
                              fontSize: "0.625rem",
                              fontWeight: 700,
                              color: "#059669",
                              backgroundColor: "#ECFDF5",
                              padding: "0.1rem 0.35rem",
                              borderRadius: "4px",
                            }}
                          >
                            Current
                          </span>
                        )}
                        {item.isSelected && (
                          <Check size={14} style={{ color: "#2563EB" }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalControlsBar;
