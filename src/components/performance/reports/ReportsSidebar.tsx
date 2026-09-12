import React, { FC, useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, Upload, Calendar, Clock, Archive } from "lucide-react";
import {
  WEEKLY_REPORTS,
  DAILY_REPORTS,
  ARCHIVED_REPORTS,
  ReportConfigItem,
  ReportCategory,
} from "./reportsConfig";
import { ReportIcon } from "../upload/ReportIcons";

// Map report keys to ReportIcon IDs (matching upload/ReportIcons.tsx switch cases)
function getIconId(key: string): string {
  const map: Record<string, string> = {
    current_week_scorecard: "scorecard_report",
    trailing_week_scorecard: "scorecard_report",
    compare_scorecard_report: "scorecard_report",
    negative_customer_feedback_report: "negative_customer_feedback_report",
    photo_on_delivery_quality_report: "pod_report",
    proper_parking_sequence_report: "proper_parking_sequence_report",
    dsp_scorecards: "scorecard_report",
    da_weekly_overview_report: "da_weekly_overview_report",
    daily_driver_scorecard: "scorecard_report",
    all_alert_report: "all_alert_report",
    driver_report: "netradyne_driver_report",
    callouts_report: "tenure_report",
    attendance_and_extras_report: "delivery_report",
    rescue_report: "eoc_report",
    e_mentor_report: "e_mentor_report",
    driver_safety: "safety_report",
    driver_delivery: "delivery_report",
    quality_report: "quality_report",
    e_signature_report: "delivery_report",
    inventory_report: "dvic_report",
    eoc_report: "eoc_report",
    suspended_driver_report: "drivers",
    negative_customer_feedback: "negative_customer_feedback_report",
    delivery_concessions: "delivery_concessions",
    dvic_report: "dvic_report",
    working_device_report: "working_device_report",
    inventory_assignment: "dvic_report",
    quality_rts_report: "quality_rts_report",
    positive_customer_feedback: "pod_report",
    netradyne_auto_coaching: "e_mentor_report",
    customer_feedback_report: "negative_customer_feedback_report",
    work_hour_compliance_report: "weekly_roster_report",
    operation_report: "da_weekly_overview_report",
  };
  return map[key] || key;
}

interface ReportsSidebarProps {
  activeReportKey: string;
  onSelectReport: (report: ReportConfigItem) => void;
}

export const ReportsSidebar: FC<ReportsSidebarProps> = ({
  activeReportKey,
  onSelectReport,
}) => {
  const activeCategory: ReportCategory = useMemo(() => {
    if (WEEKLY_REPORTS.some((r) => r.key === activeReportKey)) return "weekly";
    if (DAILY_REPORTS.some((r) => r.key === activeReportKey)) return "daily";
    if (ARCHIVED_REPORTS.some((r) => r.key === activeReportKey)) return "archive";
    return "weekly";
  }, [activeReportKey]);

  const [weeklyOpen, setWeeklyOpen] = useState(activeCategory === "weekly");
  const [dailyOpen, setDailyOpen] = useState(activeCategory === "daily");
  const [archiveOpen, setArchiveOpen] = useState(activeCategory === "archive");

  // Auto-expand section containing active report
  useEffect(() => {
    setWeeklyOpen(activeCategory === "weekly");
    setDailyOpen(activeCategory === "daily");
    setArchiveOpen(activeCategory === "archive");
  }, [activeCategory]);

  const sections = [
    {
      key: "weekly" as ReportCategory,
      label: "Weekly",
      icon: <Calendar size={13} />,
      open: weeklyOpen,
      toggle: () => setWeeklyOpen((v) => !v),
      reports: WEEKLY_REPORTS,
    },
    {
      key: "daily" as ReportCategory,
      label: "Daily",
      icon: <Clock size={13} />,
      open: dailyOpen,
      toggle: () => setDailyOpen((v) => !v),
      reports: DAILY_REPORTS,
    },
    {
      key: "archive" as ReportCategory,
      label: "Archived",
      icon: <Archive size={13} />,
      open: archiveOpen,
      toggle: () => setArchiveOpen((v) => !v),
      reports: ARCHIVED_REPORTS,
    },
  ];

  return (
    <aside
      className="settings-nav-sidebar"
      style={{
        borderRadius: 0,
        border: "none",
        borderRight: "1px solid #E2E8F0",
        boxShadow: "none",
        height: "100%",
      }}
    >
      {/* Header */}
      <div className="settings-sidebar-header">
        <div className="settings-sidebar-title-row">
          <Upload size={18} className="text-blue-600" />
          <h3 className="settings-sidebar-title">Reports</h3>
        </div>
      </div>

      {/* Scrollable nav groups */}
      <div className="settings-nav-scroll scrollable">
        {sections.map((section) => (
          <div key={section.key} className="settings-nav-group">
            {/* Group header */}
            <div
              className="settings-group-header-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                padding: "0.3rem 0.5rem",
                userSelect: "none",
                borderRadius: "6px",
              }}
              onClick={section.toggle}
              title={section.open ? `Hide ${section.label}` : `Show ${section.label}`}
            >
              <span className="settings-group-heading" style={{ padding: 0 }}>
                {section.label}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className="settings-nav-badge">{section.reports.length}</span>
                {section.open ? (
                  <ChevronDown size={14} className="text-slate-400" />
                ) : (
                  <ChevronRight size={14} className="text-slate-400" />
                )}
              </div>
            </div>

            {/* Report list */}
            {section.open && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                  marginTop: "0.15rem",
                }}
              >
                {section.reports.map((report) => {
                  const isActive = report.key === activeReportKey;
                  const iconId = getIconId(report.key);
                  return (
                    <button
                      key={report.key}
                      type="button"
                      className={`settings-nav-button ${isActive ? "active" : ""}`}
                      onClick={() => onSelectReport(report)}
                      title={report.description}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                        width: "100%",
                        padding: "0.5rem 0.65rem",
                        borderRadius: "8px",
                        border: isActive ? "1px solid #BFDBFE" : "1px solid transparent",
                        backgroundColor: isActive ? "#EFF6FF" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Icon box — blue when active, gray when inactive */}
                      <div
                        className="settings-nav-icon-wrap"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isActive ? "#2563EB" : "#F1F5F9",
                          color: isActive ? "#FFFFFF" : "#64748B",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <ReportIcon
                          id={iconId}
                          active={isActive}
                          color={isActive ? "#FFFFFF" : "#64748B"}
                          size="1rem"
                        />
                      </div>
                      {/* Label */}
                      <span
                        className="settings-nav-label"
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#1D4ED8" : "#334155",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {report.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};
