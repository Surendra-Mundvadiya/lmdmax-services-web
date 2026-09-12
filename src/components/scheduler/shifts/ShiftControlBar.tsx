import React, { FC, useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Send,
  Wand2,
  Search,
  Sliders,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  Download,
  Bookmark,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
} from "lucide-react";
import { ScheduleRuleItem } from "../../../api/schedulerApi";
import { SHIFT_STATUS_TONES, ShiftStatusKey, ShiftStatusTone } from "./ShiftCard";

export type ViewMode = "day" | "week" | "biweekly" | "month";

export interface ShiftStatusCounts {
  total: number;
  published: number;
  unpublished: number;
  confirmed: number;
  pending: number;
  declined: number;
  backup: number;
  vto: number;
}

/* Status filters share the grid's single status -> token mapping, so a pill and
   the shift blocks it filters always read in the same colour. */
const STATUS_FILTERS: {
  key: string;
  countKey: keyof ShiftStatusCounts;
  label: string;
  tone: ShiftStatusKey;
  icon?: React.ReactNode;
  dot?: boolean;
}[] = [
  { key: "published", countKey: "published", label: "Published", tone: "published", dot: true },
  { key: "unpublished", countKey: "unpublished", label: "Draft", tone: "draft", dot: true },
  {
    key: "confirmed",
    countKey: "confirmed",
    label: "Confirmed",
    tone: "confirmed",
    icon: <CheckCircle2 size={12} />,
  },
  { key: "pending", countKey: "pending", label: "Pending", tone: "pending", icon: <Clock size={12} /> },
  { key: "declined", countKey: "declined", label: "Denied", tone: "declined", icon: <XCircle size={12} /> },
  {
    key: "backup",
    countKey: "backup",
    label: "Extra / Backup",
    tone: "backup",
    icon: <Sparkles size={12} />,
  },
  { key: "vto", countKey: "vto", label: "VTO", tone: "vto" },
];

const StatusFilterPill: FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: ShiftStatusTone;
  icon?: React.ReactNode;
  dot?: boolean;
}> = ({ label, count, active, onClick, tone, icon, dot }) => {
  const accent = tone ? tone.accent : "var(--ads-blue)";
  const tint = tone ? tone.tint : "var(--ads-blue-tint)";
  const ink = tone ? tone.ink : "var(--ads-blue)";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--ads-s1)",
        padding: "3px var(--ads-s3)",
        borderRadius: "var(--ads-r-pill)",
        fontSize: "0.75rem",
        fontWeight: 550,
        letterSpacing: "-0.005em",
        cursor: "pointer",
        border: `1px solid ${active ? accent : "var(--ads-hairline)"}`,
        background: active ? tint : "var(--ads-material-thick)",
        color: active ? ink : "var(--ads-ink-secondary)",
        transition:
          "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "var(--ads-r-pill)",
            background: accent,
            flexShrink: 0,
          }}
        />
      )}
      {icon && <span style={{ display: "inline-flex", color: accent }}>{icon}</span>}
      <span>{label}</span>
      <span
        style={{
          background: active ? accent : "rgba(0, 0, 0, 0.06)",
          color: active ? "#FFFFFF" : "var(--ads-ink-secondary)",
          borderRadius: "var(--ads-r-pill)",
          padding: "1px 7px",
          fontSize: "0.6875rem",
          fontWeight: 600,
        }}
      >
        {count}
      </span>
    </button>
  );
};

interface ShiftControlBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dateRangeLabel: string;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onCreateShift: () => void;
  onAutoAssign: () => void;
  onPublishSchedule: () => void;
  draftCount: number;
  loading?: boolean;
  scheduleRules?: ScheduleRuleItem[];
  onOpenRulesModal: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onExportCsv: () => void;
  onOpenTemplatesModal: () => void;
  exportLoading?: boolean;
  statusCounts?: ShiftStatusCounts;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export const ShiftControlBar: FC<ShiftControlBarProps> = ({
  viewMode,
  onViewModeChange,
  dateRangeLabel,
  onPrevDate,
  onNextDate,
  onToday,
  searchQuery,
  onSearchQueryChange,
  onCreateShift,
  onAutoAssign,
  onPublishSchedule,
  draftCount,
  scheduleRules = [],
  onOpenRulesModal,
  onExportExcel,
  onExportPdf,
  onExportCsv,
  onOpenTemplatesModal,
  exportLoading = false,
  statusCounts,
  statusFilter = "all",
  onStatusFilterChange,
}) => {
  const [isOthersOpen, setIsOthersOpen] = useState<boolean>(false);
  const othersRef = useRef<HTMLDivElement>(null);

  // Close "Others" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (othersRef.current && !othersRef.current.contains(e.target as Node)) {
        setIsOthersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusClick = (status: string) => {
    if (!onStatusFilterChange) return;
    if (statusFilter === status) {
      onStatusFilterChange("all");
    } else {
      onStatusFilterChange(status);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
      {/* 1. Main Control Bar */}
      <div className="sch-control-bar">
        {/* Left side: View Switcher & Date Navigator */}
        <div className="sch-control-bar-left">
          {/* Segmented View Switcher (All Scheduler App Views) */}
          <div className="sch-view-switcher">
            <button
              type="button"
              onClick={() => onViewModeChange("day")}
              className={`sch-view-btn ${viewMode === "day" ? "active" : ""}`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("week")}
              className={`sch-view-btn ${viewMode === "week" ? "active" : ""}`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("biweekly")}
              className={`sch-view-btn ${viewMode === "biweekly" ? "active" : ""}`}
            >
              Bi-Weekly
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("month")}
              className={`sch-view-btn ${viewMode === "month" ? "active" : ""}`}
            >
              Month
            </button>
          </div>

          {/* Date Navigator */}
          <div className="sch-date-nav-wrap">
            <button
              type="button"
              onClick={onPrevDate}
              className="sch-date-nav-arrow"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={onToday}
              className="sch-date-today-btn"
            >
              Today
            </button>

            <div className="sch-date-range-badge">
              <CalendarIcon size={14} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
              <span>{dateRangeLabel}</span>
            </div>

            <button
              type="button"
              onClick={onNextDate}
              className="sch-date-nav-arrow"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right side: Search & Action Buttons */}
        <div className="sch-control-bar-right">
          {/* Driver Search */}
          <div className="sch-search-wrap">
            <Search size={13} className="sch-filter-icon" />
            <input
              type="text"
              placeholder="Filter drivers..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="sch-search-input"
            />
          </div>

          {/* Schedule Rules Button (Opens In-Page Screen) */}
          <button
            type="button"
            onClick={onOpenRulesModal}
            className="sch-btn-auto"
            style={{
              borderRadius: "var(--ads-r-pill)",
              borderColor: "var(--ads-hairline)",
              background: "var(--ads-material-thick)",
              color: "var(--ads-ink)",
            }}
            title="View & Manage Live Schedule Rules"
          >
            <Sliders size={13} style={{ color: "var(--ads-blue)" }} />
            <span>Rules</span>
            {scheduleRules.length > 0 && (
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  padding: "1px var(--ads-s1)",
                  borderRadius: "var(--ads-r-pill)",
                  background: "var(--ads-blue-tint)",
                  color: "var(--ads-blue)",
                  border: "1px solid rgba(0, 113, 227, 0.22)",
                  marginLeft: "var(--ads-s1)",
                }}
              >
                {scheduleRules.length}
              </span>
            )}
          </button>

          {/* "Others" Dropdown Menu */}
          <div style={{ position: "relative" }} ref={othersRef}>
            <button
              type="button"
              onClick={() => setIsOthersOpen(!isOthersOpen)}
              className="sch-btn-auto"
              style={{
                borderRadius: "var(--ads-r-pill)",
                borderColor: isOthersOpen ? "var(--ads-hairline-strong)" : "var(--ads-hairline)",
                background: isOthersOpen ? "var(--ads-white)" : "var(--ads-material-thick)",
                color: "var(--ads-ink)",
              }}
              title="Others: Export shifts, templates & settings"
            >
              <MoreHorizontal size={14} style={{ color: "var(--ads-ink-secondary)" }} />
              <span>Others</span>
              <ChevronDown size={12} style={{ color: "var(--ads-ink-quaternary)" }} />
            </button>

            {isOthersOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: "210px",
                  background: "var(--ads-material-thick)",
                  WebkitBackdropFilter: "var(--ads-blur-lg)",
                  backdropFilter: "var(--ads-blur-lg)",
                  borderRadius: "var(--ads-r-md)",
                  boxShadow: "var(--ads-shadow-md), var(--ads-bevel)",
                  border: "1px solid var(--ads-hairline)",
                  zIndex: 100,
                  overflow: "hidden",
                  padding: "var(--ads-s1) 0",
                  animation: "ads-sheet-in var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <div
                  className="ads-overline"
                  style={{ padding: "var(--ads-s2) var(--ads-s3) var(--ads-s1)" }}
                >
                  Export Schedule
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOthersOpen(false);
                    onExportExcel();
                  }}
                  disabled={exportLoading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ads-s2)",
                    padding: "var(--ads-s2) var(--ads-s3)",
                    fontSize: "0.8125rem",
                    fontWeight: 550,
                    color: "var(--ads-ink)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <FileSpreadsheet size={15} style={{ color: "var(--ads-green)" }} />
                  <span>Export as Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOthersOpen(false);
                    onExportPdf();
                  }}
                  disabled={exportLoading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ads-s2)",
                    padding: "var(--ads-s2) var(--ads-s3)",
                    fontSize: "0.8125rem",
                    fontWeight: 550,
                    color: "var(--ads-ink)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <FileText size={15} style={{ color: "var(--ads-red)" }} />
                  <span>Export as PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOthersOpen(false);
                    onExportCsv();
                  }}
                  disabled={exportLoading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ads-s2)",
                    padding: "var(--ads-s2) var(--ads-s3)",
                    fontSize: "0.8125rem",
                    fontWeight: 550,
                    color: "var(--ads-ink)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Download size={15} style={{ color: "var(--ads-blue)" }} />
                  <span>Export as CSV</span>
                </button>

                <div
                  style={{
                    height: "1px",
                    backgroundColor: "var(--ads-hairline)",
                    margin: "var(--ads-s1) 0",
                  }}
                />

                <div
                  className="ads-overline"
                  style={{ padding: "var(--ads-s2) var(--ads-s3) var(--ads-s1)" }}
                >
                  Templates
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOthersOpen(false);
                    onOpenTemplatesModal();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ads-s2)",
                    padding: "var(--ads-s2) var(--ads-s3)",
                    fontSize: "0.8125rem",
                    fontWeight: 550,
                    color: "var(--ads-ink)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Bookmark size={15} style={{ color: "var(--ads-amber)" }} />
                  <span>Schedule Templates</span>
                </button>
              </div>
            )}
          </div>

          {/* Auto-Assign Button */}
          <button
            type="button"
            onClick={onAutoAssign}
            className="sch-btn-auto"
            style={{
              borderRadius: "var(--ads-r-pill)",
              borderColor: "var(--ads-hairline)",
              background: "var(--ads-material-thick)",
              color: "var(--ads-ink)",
            }}
          >
            <Wand2 size={13} style={{ color: "var(--ads-amber)" }} />
            <span>Auto-Assign</span>
          </button>

          {/* Publish Schedule Button */}
          <button
            type="button"
            onClick={onPublishSchedule}
            disabled={draftCount === 0}
            className={`sch-btn-publish ${draftCount > 0 ? "active" : "disabled"}`}
            style={{
              borderRadius: "var(--ads-r-pill)",
              backgroundColor: draftCount > 0 ? "var(--ads-amber)" : undefined,
              boxShadow: draftCount > 0 ? "0 1px 4px rgba(178, 80, 0, 0.28)" : undefined,
            }}
          >
            <Send
              size={13}
              style={{ color: draftCount > 0 ? "#FFFFFF" : "var(--ads-ink-quaternary)" }}
            />
            <span>Publish</span>
            {draftCount > 0 && (
              <span
                className="sch-btn-publish-count"
                style={{ background: "var(--ads-white)", color: "var(--ads-amber)" }}
              >
                {draftCount}
              </span>
            )}
          </button>

          {/* + Create Shift Primary Action Button (Rule 3: Blue button with #FFFFFF text and icon) */}
          <button
            type="button"
            onClick={onCreateShift}
            className="sch-btn-create"
            style={{
              borderRadius: "var(--ads-r-pill)",
              backgroundColor: "var(--ads-blue)",
              boxShadow: "0 1px 4px rgba(0, 113, 227, 0.30)",
            }}
          >
            <Plus size={15} style={{ color: "#FFFFFF" }} />
            <span style={{ color: "#FFFFFF" }}>Create Shift</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Shift Statuses & Counts Bar */}
      {statusCounts && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--ads-s2)",
            flexWrap: "wrap",
            padding: "var(--ads-s2) var(--ads-s3)",
            background: "var(--ads-material-thick)",
            WebkitBackdropFilter: "var(--ads-blur-md)",
            backdropFilter: "var(--ads-blur-md)",
            borderRadius: "var(--ads-r-md)",
            border: "1px solid var(--ads-hairline)",
            boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
          }}
        >
          <span className="ads-overline" style={{ marginRight: "var(--ads-s1)" }}>
            Shift Status
          </span>

          <StatusFilterPill
            label="Total"
            count={statusCounts.total}
            active={statusFilter === "all"}
            onClick={() => handleStatusClick("all")}
          />

          {STATUS_FILTERS.map((filter) => {
            if (filter.key === "vto" && statusCounts.vto === 0) return null;
            return (
              <StatusFilterPill
                key={filter.key}
                label={filter.label}
                count={statusCounts[filter.countKey]}
                tone={SHIFT_STATUS_TONES[filter.tone]}
                icon={filter.icon}
                dot={filter.dot}
                active={statusFilter === filter.key}
                onClick={() => handleStatusClick(filter.key)}
              />
            );
          })}

          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => handleStatusClick("all")}
              style={{
                fontSize: "0.6875rem",
                color: "var(--ads-blue)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                marginLeft: "auto",
                padding: "var(--ads-s1) var(--ads-s2)",
                borderRadius: "var(--ads-r-pill)",
              }}
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};
