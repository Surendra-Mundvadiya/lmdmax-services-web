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
              <CalendarIcon size={14} style={{ color: "#2563EB", flexShrink: 0 }} />
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
              borderColor: "#DBEAFE",
              backgroundColor: "#FFFFFF",
              color: "#1E293B",
            }}
            title="View & Manage Live Schedule Rules"
          >
            <Sliders size={13} style={{ color: "#2563EB" }} />
            <span>Rules</span>
            {scheduleRules.length > 0 && (
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  padding: "0.1rem 0.4rem",
                  borderRadius: "9999px",
                  backgroundColor: "#EFF6FF",
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                  marginLeft: "0.2rem",
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
                borderColor: "#E2E8F0",
                backgroundColor: isOthersOpen ? "#F8FAFC" : "#FFFFFF",
                color: "#334155",
              }}
              title="Others: Export shifts, templates & settings"
            >
              <MoreHorizontal size={14} style={{ color: "#475569" }} />
              <span>Others</span>
              <ChevronDown size={12} style={{ color: "#94A3B8" }} />
            </button>

            {isOthersOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: "210px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  border: "1px solid #E2E8F0",
                  zIndex: 100,
                  overflow: "hidden",
                  padding: "0.35rem 0",
                }}
              >
                <div
                  style={{
                    padding: "0.4rem 0.85rem 0.35rem",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#94A3B8",
                  }}
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
                    gap: "0.6rem",
                    padding: "0.55rem 0.85rem",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#1E293B",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <FileSpreadsheet size={15} style={{ color: "#059669" }} />
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
                    gap: "0.6rem",
                    padding: "0.55rem 0.85rem",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#1E293B",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <FileText size={15} style={{ color: "#DC2626" }} />
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
                    gap: "0.6rem",
                    padding: "0.55rem 0.85rem",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#1E293B",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Download size={15} style={{ color: "#2563EB" }} />
                  <span>Export as CSV</span>
                </button>

                <div style={{ height: "1px", backgroundColor: "#F1F5F9", margin: "0.35rem 0" }} />

                <div
                  style={{
                    padding: "0.4rem 0.85rem 0.35rem",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#94A3B8",
                  }}
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
                    gap: "0.6rem",
                    padding: "0.55rem 0.85rem",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#1E293B",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Bookmark size={15} style={{ color: "#D97706" }} />
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
          >
            <Wand2 size={13} style={{ color: "#D97706" }} />
            <span>Auto-Assign</span>
          </button>

          {/* Publish Schedule Button */}
          <button
            type="button"
            onClick={onPublishSchedule}
            disabled={draftCount === 0}
            className={`sch-btn-publish ${draftCount > 0 ? "active" : "disabled"}`}
          >
            <Send size={13} style={{ color: draftCount > 0 ? "#FFFFFF" : "#94A3B8" }} />
            <span>Publish</span>
            {draftCount > 0 && (
              <span className="sch-btn-publish-count">
                {draftCount}
              </span>
            )}
          </button>

          {/* + Create Shift Primary Action Button (Rule 3: Blue button with #FFFFFF text and icon) */}
          <button
            type="button"
            onClick={onCreateShift}
            className="sch-btn-create"
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
            gap: "0.5rem",
            flexWrap: "wrap",
            padding: "0.45rem 0.75rem",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginRight: "0.25rem",
            }}
          >
            Shift Status:
          </span>

          {/* All Shifts */}
          <button
            type="button"
            onClick={() => handleStatusClick("all")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: statusFilter === "all" ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
              backgroundColor: statusFilter === "all" ? "#EFF6FF" : "#F8FAFC",
              color: statusFilter === "all" ? "#2563EB" : "#334155",
            }}
          >
            <span>Total</span>
            <span
              style={{
                backgroundColor: statusFilter === "all" ? "#2563EB" : "#E2E8F0",
                color: statusFilter === "all" ? "#FFFFFF" : "#475569",
                borderRadius: "9999px",
                padding: "0.05rem 0.4rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}
            >
              {statusCounts.total}
            </span>
          </button>

          {/* Published */}
          <button
            type="button"
            onClick={() => handleStatusClick("published")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: statusFilter === "published" ? "1.5px solid #16A34A" : "1px solid #E2E8F0",
              backgroundColor: statusFilter === "published" ? "#F0FDF4" : "#FFFFFF",
              color: statusFilter === "published" ? "#16A34A" : "#334155",
            }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16A34A" }} />
            <span>Published</span>
            <span
              style={{
                backgroundColor: statusFilter === "published" ? "#16A34A" : "#DCFCE7",
                color: statusFilter === "published" ? "#FFFFFF" : "#166534",
                borderRadius: "9999px",
                padding: "0.05rem 0.4rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}
            >
              {statusCounts.published}
            </span>
          </button>

          {/* Draft / Unpublished */}
          <button
            type="button"
            onClick={() => handleStatusClick("unpublished")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: statusFilter === "unpublished" ? "1.5px solid #D97706" : "1px solid #E2E8F0",
              backgroundColor: statusFilter === "unpublished" ? "#FFFBEB" : "#FFFFFF",
              color: statusFilter === "unpublished" ? "#D97706" : "#334155",
            }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#D97706" }} />
            <span>Draft</span>
            <span
              style={{
                backgroundColor: statusFilter === "unpublished" ? "#D97706" : "#FEF3C7",
                color: statusFilter === "unpublished" ? "#FFFFFF" : "#92400E",
                borderRadius: "9999px",
                padding: "0.05rem 0.4rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}
            >
              {statusCounts.unpublished}
            </span>
          </button>

          {/* Confirmed / Accepted */}
          <button
            type="button"
            onClick={() => handleStatusClick("confirmed")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: statusFilter === "confirmed" ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
              backgroundColor: statusFilter === "confirmed" ? "#EFF6FF" : "#FFFFFF",
              color: statusFilter === "confirmed" ? "#2563EB" : "#334155",
            }}
          >
            <CheckCircle2 size={12} style={{ color: "#2563EB" }} />
            <span>Confirmed</span>
            <span
              style={{
                backgroundColor: statusFilter === "confirmed" ? "#2563EB" : "#DBEAFE",
                color: statusFilter === "confirmed" ? "#FFFFFF" : "#1E40AF",
                borderRadius: "9999px",
                padding: "0.05rem 0.4rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}
            >
              {statusCounts.confirmed}
            </span>
          </button>

          {/* Pending Confirmation */}
          <button
            type="button"
            onClick={() => handleStatusClick("pending")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: statusFilter === "pending" ? "1.5px solid #64748B" : "1px solid #E2E8F0",
              backgroundColor: statusFilter === "pending" ? "#F1F5F9" : "#FFFFFF",
              color: statusFilter === "pending" ? "#475569" : "#334155",
            }}
          >
            <Clock size={12} style={{ color: "#64748B" }} />
            <span>Pending</span>
            <span
              style={{
                backgroundColor: statusFilter === "pending" ? "#64748B" : "#F1F5F9",
                color: statusFilter === "pending" ? "#FFFFFF" : "#475569",
                borderRadius: "9999px",
                padding: "0.05rem 0.4rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}
            >
              {statusCounts.pending}
            </span>
          </button>

          {/* Denied / Declined */}
          <button
            type="button"
            onClick={() => handleStatusClick("declined")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: statusFilter === "declined" ? "1.5px solid #DC2626" : "1px solid #E2E8F0",
              backgroundColor: statusFilter === "declined" ? "#FEF2F2" : "#FFFFFF",
              color: statusFilter === "declined" ? "#DC2626" : "#334155",
            }}
          >
            <XCircle size={12} style={{ color: "#DC2626" }} />
            <span>Denied</span>
            <span
              style={{
                backgroundColor: statusFilter === "declined" ? "#DC2626" : "#FEE2E2",
                color: statusFilter === "declined" ? "#FFFFFF" : "#991B1B",
                borderRadius: "9999px",
                padding: "0.05rem 0.4rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}
            >
              {statusCounts.declined}
            </span>
          </button>

          {/* Extra / Backup */}
          <button
            type="button"
            onClick={() => handleStatusClick("backup")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: statusFilter === "backup" ? "1.5px solid #9333EA" : "1px solid #E2E8F0",
              backgroundColor: statusFilter === "backup" ? "#FAF5FF" : "#FFFFFF",
              color: statusFilter === "backup" ? "#9333EA" : "#334155",
            }}
          >
            <Sparkles size={12} style={{ color: "#9333EA" }} />
            <span>Extra / Backup</span>
            <span
              style={{
                backgroundColor: statusFilter === "backup" ? "#9333EA" : "#F3E8FF",
                color: statusFilter === "backup" ? "#FFFFFF" : "#6B21A8",
                borderRadius: "9999px",
                padding: "0.05rem 0.4rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
              }}
            >
              {statusCounts.backup}
            </span>
          </button>

          {/* VTO */}
          {statusCounts.vto > 0 && (
            <button
              type="button"
              onClick={() => handleStatusClick("vto")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: statusFilter === "vto" ? "1.5px solid #4F46E5" : "1px solid #E2E8F0",
                backgroundColor: statusFilter === "vto" ? "#EEF2FF" : "#FFFFFF",
                color: statusFilter === "vto" ? "#4F46E5" : "#334155",
              }}
            >
              <span>VTO</span>
              <span
                style={{
                  backgroundColor: statusFilter === "vto" ? "#4F46E5" : "#E0E7FF",
                  color: statusFilter === "vto" ? "#FFFFFF" : "#3730A3",
                  borderRadius: "9999px",
                  padding: "0.05rem 0.4rem",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                }}
              >
                {statusCounts.vto}
              </span>
            </button>
          )}

          {/* Reset filter button if any filter active */}
          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => handleStatusClick("all")}
              style={{
                fontSize: "0.6875rem",
                color: "#2563EB",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                textDecoration: "underline",
                marginLeft: "auto",
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
