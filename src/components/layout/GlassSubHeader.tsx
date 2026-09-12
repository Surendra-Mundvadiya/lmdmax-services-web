import React, { FC, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";

export type ViewMode = "day" | "week" | "month" | "quarter";

interface GlassSubHeaderProps {
  date: string;
  onDateChange: (newDate: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showFlagged: boolean;
  onToggleShowFlagged: (val: boolean) => void;
  filterCount?: number;
  onOpenFilters?: () => void;
  isRefetching?: boolean;
  onRefresh?: () => void;
}

export const GlassSubHeader: FC<GlassSubHeaderProps> = ({
  date,
  onDateChange,
  viewMode,
  onViewModeChange,
  showFlagged,
  onToggleShowFlagged,
  filterCount = 0,
  onOpenFilters,
  isRefetching = false,
  onRefresh,
}) => {
  // Format the date for display (e.g. "Monday, September 7, 2026")
  const formattedDate = React.useMemo(() => {
    try {
      const parts = date.split("-").map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch {
      // Fallback
    }
    return date;
  }, [date]);

  // Navigate Date
  const handleStepDate = (deltaDays: number) => {
    try {
      const parts = date.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + deltaDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      onDateChange(`${y}-${m}-${day}`);
    } catch {
      // ignore
    }
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    onDateChange(`${y}-${m}-${day}`);
  };

  return (
    <div className="glass-sub-header">
      {/* Left: Date Navigation Controls */}
      <div className="glass-sub-header-left">
        <div className="glass-date-nav-group">
          <button
            type="button"
            className="glass-date-arrow-btn"
            onClick={() => handleStepDate(-1)}
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="glass-date-display">{formattedDate}</span>
          <button
            type="button"
            className="glass-date-arrow-btn"
            onClick={() => handleStepDate(1)}
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          type="button"
          className="glass-today-btn"
          onClick={handleToday}
        >
          Today
        </button>

        {/* View Mode Switcher Pills (Day, Week, Month, Quarter) */}
        <div className="glass-mode-pills">
          <button
            type="button"
            className={`glass-mode-pill ${viewMode === "day" ? "active" : ""}`}
            onClick={() => onViewModeChange("day")}
          >
            Day
          </button>
          <button
            type="button"
            className={`glass-mode-pill ${viewMode === "week" ? "active" : ""}`}
            onClick={() => onViewModeChange("week")}
          >
            Week
          </button>
          <button
            type="button"
            className={`glass-mode-pill ${viewMode === "month" ? "active" : ""}`}
            onClick={() => onViewModeChange("month")}
          >
            Month
          </button>
          <button
            type="button"
            className={`glass-mode-pill ${viewMode === "quarter" ? "active" : ""}`}
            onClick={() => onViewModeChange("quarter")}
          >
            Quarter
          </button>
        </div>
      </div>

      {/* Right: Status Filters & Actions */}
      <div className="glass-sub-header-right">
        {/* Toggle Flagged / Callouts */}
        <div
          className={`glass-toggle-pill ${showFlagged ? "active" : ""}`}
          onClick={() => onToggleShowFlagged(!showFlagged)}
          title="Toggle Flagged / Disrupted Routes"
        >
          <span className="glass-toggle-dot" />
          <span>Show Flagged</span>
        </div>

        {/* Filters Button */}
        <button
          type="button"
          className="glass-filters-btn"
          onClick={onOpenFilters}
          title="Open Filters"
        >
          <Filter size={14} />
          <span>Filters</span>
          <span className="glass-filters-badge">{filterCount}</span>
        </button>

        {/* Real-time Sync status button */}
        {onRefresh && (
          <button
            type="button"
            className="glass-today-btn"
            onClick={onRefresh}
            title="Refresh Microservices Telemetry"
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <RefreshCw
              size={13}
              className={isRefetching ? "animate-spin" : ""}
            />
            <span style={{ fontSize: "0.75rem" }}>Sync</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default GlassSubHeader;
