import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import GlassAppLayout from "../layout/GlassAppLayout";
import UploadReportsPage from "./upload/UploadReportsPage";
import { ReportViewer } from "./reports/ReportViewer";
import { ReportIcon } from "./upload/ReportIcons";
import {
  ALL_REPORTS,
  REPORT_MAP,
  ReportConfigItem,
  WEEKLY_REPORTS,
  DAILY_REPORTS,
  WEEKLY_ROSTER_REPORTS,
  ARCHIVED_REPORTS,
} from "./reports/reportsConfig";

export type ReportCategoryTab = "daily" | "weekly" | "weekly_roster" | "archive";

const formatReportName = (name?: string): string => {
  if (!name) return "";
  const lower = name.trim().toLowerCase();
  if (lower === "all alert" || lower === "all alerts" || lower === "all alert report") {
    return "All Alerts";
  }
  return name;
};

export const PerformancePage: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ report_key?: string }>();
  const isUploadView = location.pathname.includes("upload");

  // Determine active report from URL or fallback to default Current Scorecard
  const activeReport: ReportConfigItem = useMemo(() => {
    if (params.report_key && REPORT_MAP.has(params.report_key)) {
      return REPORT_MAP.get(params.report_key)!;
    }
    return WEEKLY_REPORTS[0];
  }, [params.report_key]);

  const [selectedCategory, setSelectedCategory] = useState<ReportCategoryTab>(() => {
    if (activeReport.key === "weekly_roster_report" || activeReport.category === "weekly_roster") {
      return "weekly_roster";
    }
    return (activeReport.category as ReportCategoryTab) || "weekly";
  });

  useEffect(() => {
    if (activeReport.key === "weekly_roster_report" || activeReport.category === "weekly_roster") {
      setSelectedCategory("weekly_roster");
    } else if (activeReport.category) {
      setSelectedCategory(activeReport.category as ReportCategoryTab);
    }
  }, [activeReport.key, activeReport.category]);

  const handleSelectReport = (report: ReportConfigItem) => {
    navigate(`/performance/reports/${report.key}`);
  };

  const handleCategorySwitch = (cat: ReportCategoryTab) => {
    setSelectedCategory(cat);
    const targetList =
      cat === "daily"
        ? DAILY_REPORTS
        : cat === "weekly"
        ? WEEKLY_REPORTS
        : cat === "weekly_roster"
        ? WEEKLY_ROSTER_REPORTS
        : ARCHIVED_REPORTS;
    if (targetList.length > 0 && !targetList.some((r) => r.key === activeReport.key)) {
      handleSelectReport(targetList[0]);
    }
  };

  const currentCategoryReports = useMemo(() => {
    switch (selectedCategory) {
      case "daily":
        return DAILY_REPORTS;
      case "weekly":
        return WEEKLY_REPORTS;
      case "weekly_roster":
        return WEEKLY_ROSTER_REPORTS;
      case "archive":
      default:
        return ARCHIVED_REPORTS;
    }
  }, [selectedCategory]);

  return (
    <GlassAppLayout
      currentRoute="performance"
      activeBreadcrumb={{
        section: "Reports",
        page: isUploadView ? "Upload Reports" : "Reports Data",
      }}
    >
      {/* VIEW 1: UPLOAD REPORTS (/performance/upload) */}
      {isUploadView ? (
        <UploadReportsPage />
      ) : (
        /* VIEW 2: SEE REPORTS DATA (/performance/reports & /performance) */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            gap: "0.85rem",
          }}
        >
          {/* Header Options on the Background Screen (No Second Header Card, No Search Box) */}
          <div className="upload-filter-toolbar">
            {/* Left: Breadcrumbs in the normal way on the background screen */}
            <div className="upload-breadcrumb-wrap">
              <span
                className="upload-breadcrumb-root"
                onClick={() => navigate("/performance")}
              >
                Reports
              </span>
              <ChevronRight size={14} style={{ color: "#64748B" }} />
              <span className="upload-breadcrumb-current">Reports Data</span>
              <ChevronRight size={14} style={{ color: "#64748B" }} />
              <span className="upload-breadcrumb-active-report">
                {formatReportName(activeReport.label)}
              </span>
            </div>

            {/* Right: View by Capsule */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div className="upload-view-by-wrap">
                <span className="upload-view-by-label">View by</span>
                <div className="upload-segmented-capsule">
                  {[
                    { id: "daily" as const, label: "Daily", count: DAILY_REPORTS.length },
                    { id: "weekly" as const, label: "Weekly", count: WEEKLY_REPORTS.length },
                    { id: "weekly_roster" as const, label: "Weekly roster", count: WEEKLY_ROSTER_REPORTS.length },
                    { id: "archive" as const, label: "Other", count: ARCHIVED_REPORTS.length },
                  ].map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySwitch(cat.id)}
                        className={`upload-segmented-btn ${isActive ? "active" : ""}`}
                      >
                        <span>{cat.label}</span>
                        <span className="upload-segmented-count">{cat.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Divided Screen: Left Catalog Sidebar + Right Workspace Container */}
          <div className="upload-split-layout">
            {/* Left: Reports Catalog Sidebar */}
            <aside className="upload-reports-sidebar">
              <div className="upload-sidebar-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span className="upload-sidebar-title">
                    {selectedCategory === "daily"
                      ? "Daily Reports"
                      : selectedCategory === "weekly"
                      ? "Weekly Reports"
                      : selectedCategory === "weekly_roster"
                      ? "Weekly Roster"
                      : "Other Reports"}
                  </span>
                </div>
                <span className="upload-sidebar-badge">
                  {currentCategoryReports.length} {currentCategoryReports.length === 1 ? "report" : "reports"}
                </span>
              </div>

              <div className="upload-reports-list-scroll">
                {currentCategoryReports.map((r) => {
                  const isActive = r.key === activeReport.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => handleSelectReport(r)}
                      className={`upload-report-sidebar-item ${isActive ? "active" : ""}`}
                    >
                      {isActive && <span className="upload-item-indicator" />}
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: isActive ? "#EFF6FF" : "#F1F5F9",
                          border: isActive ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <ReportIcon id={r.key} active={isActive} color={isActive ? "#2563EB" : "#64748B"} size="1.05rem" />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: isActive ? 700 : 550,
                            color: isActive ? "#1D4ED8" : "#1E293B",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {formatReportName(r.label)}
                        </div>
                      </div>

                      <ChevronRight
                        size={14}
                        style={{
                          color: isActive ? "#2563EB" : "#CBD5E1",
                          flexShrink: 0,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right: Workspace Container */}
            <section className="upload-workspace-container">
              <ReportViewer report={activeReport} />
            </section>
          </div>
        </div>
      )}
    </GlassAppLayout>
  );
};

export default PerformancePage;
