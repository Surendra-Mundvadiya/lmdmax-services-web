import React, { FC, useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileSpreadsheet,
  FileUp,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileDown,
} from "lucide-react";
import {
  performanceApi,
  ReportTypeConfig,
  VERIFIED_REPORT_REGISTRY,
  downloadSampleTemplate,
} from "../../../api/performanceApi";
import { ReportIcon } from "./ReportIcons";
import { AppDateNavigator } from "../../common/AppDateNavigator";
import { useAuthStore } from "../../../store/authStore";
import "../performance-glass.css";

const formatReportName = (name?: string): string => {
  if (!name) return "";
  const lower = name.trim().toLowerCase();
  if (lower === "all alert" || lower === "all alerts" || lower === "all alert report") {
    return "All Alerts";
  }
  return name;
};

const isCurrentWeek = (weekCode: number): boolean => {
  return weekCode === getISOWeekDetails(new Date()).code;
};

const isLastWeek = (weekCode: number): boolean => {
  const lw = new Date();
  lw.setDate(lw.getDate() - 7);
  return weekCode === getISOWeekDetails(lw).code;
};

// Helper for ISO week info:
// weekNumber code format: YYYYWW (number, e.g. 202636)
interface ISOWeekInfo {
  code: number;
  year: number;
  week: number;
  label: string;
  rangeStr: string;
}

const getISOWeekDetails = (d: Date = new Date()): ISOWeekInfo => {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = target.getUTCFullYear();
  const weekPadded = String(weekNo).padStart(2, "0");
  const code = Number(`${year}${weekPadded}`);

  // Calculate Sunday to Saturday date range (matching performance app calendar standard)
  const sunday = new Date(target);
  sunday.setUTCDate(target.getUTCDate() - 4);
  const saturday = new Date(sunday);
  saturday.setUTCDate(sunday.getUTCDate() + 6);

  const startStr = sunday.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  const endStr = saturday.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  return {
    code,
    year,
    week: weekNo,
    label: `Week ${String(weekNo).padStart(2, "0")}`,
    rangeStr: `${startStr} - ${endStr}`,
  };
};

// Generate list of recent weeks for weekly selector
const getRecentWeeksList = (): ISOWeekInfo[] => {
  const list: ISOWeekInfo[] = [];
  const now = new Date();
  for (let i = 0; i < 16; i++) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    list.push(getISOWeekDetails(d));
  }
  return list;
};

export const UploadReportsPage: FC = () => {
  const stations = useAuthStore((state) => state.stations);
  const allStations = useAuthStore((state) => state.allStations);
  const user = useAuthStore((state) => state.user);

  const availableStations = useMemo(() => {
    const map = new Map<string, any>();
    (stations || []).forEach((st) => {
      if (st.station_code) map.set(st.station_code, { ...st });
    });
    (allStations || []).forEach((st) => {
      if (st.station_code && !map.has(st.station_code)) {
        map.set(st.station_code, { ...st });
      }
    });
    return Array.from(map.values());
  }, [stations, allStations]);

  const activeStationObj =
    availableStations.find((s) => s.current) ||
    stations?.find((s) => s.current) ||
    allStations?.find((s) => s.current) ||
    (user?.station_code ? availableStations.find((s) => s.station_code === user.station_code) : null) ||
    availableStations[0] ||
    stations?.[0];

  const activeStation =
    activeStationObj?.station_code ||
    user?.station_code ||
    user?.company?.station_code ||
    "QUE4";

  // Collapsible section toggles: Daily, Weekly, Bulk Upload
  const [dailyOpen, setDailyOpen] = useState<boolean>(true);
  const [weeklyOpen, setWeeklyOpen] = useState<boolean>(true);
  const [bulkOpen, setBulkOpen] = useState<boolean>(true);

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlReport = searchParams.get("report") || searchParams.get("report_key") || searchParams.get("tab");
  const urlCategory = searchParams.get("category") || searchParams.get("section");

  // Report Discovery Registry State
  const [reportsRegistry, setReportsRegistry] = useState<ReportTypeConfig[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>(urlReport || "all_alert_report");

  // Contextual Date Form State (Daily: YYYY-MM-DD, defaults to yesterday)
  const [dailyDate, setDailyDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  });

  // Contextual Week Form State (Weekly: YYYYWW code, defaults to last week)
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return getISOWeekDetails(lastWeek).code;
  });

  type CategoryTab = "DAILY" | "WEEKLY" | "WEEKLY_ROSTER" | "BULK";
  const [activeCategoryTab, setActiveCategoryTab] = useState<CategoryTab>(() => {
    if (urlReport === "weekly_roster_report") return "WEEKLY_ROSTER";
    if (urlCategory === "roster" || urlCategory === "weekly_roster") return "WEEKLY_ROSTER";
    if (urlCategory === "bulk") return "BULK";
    if (urlCategory === "weekly") return "WEEKLY";
    return "DAILY";
  });
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState<boolean>(false);

  // Auto-expand and select report if provided in URL parameters
  useEffect(() => {
    if (urlReport) {
      setSelectedReportId(urlReport);
      if (urlReport === "weekly_roster_report") {
        setActiveCategoryTab("WEEKLY_ROSTER");
      } else if (
        urlReport === "drivers" ||
        urlReport === "vehicles" ||
        urlReport === "admins" ||
        urlCategory === "bulk"
      ) {
        setActiveCategoryTab("BULK");
      } else if (urlCategory === "weekly") {
        setActiveCategoryTab("WEEKLY");
      } else if (urlCategory === "daily") {
        setActiveCategoryTab("DAILY");
      }
    }
  }, [urlReport, urlCategory]);

  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Status & Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const weekDropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch available report types
  useEffect(() => {
    const loadReports = async () => {
      try {
        const types = await performanceApi.getAvailableReportTypes();
        setReportsRegistry(types);
        if (urlReport && types.some((t) => t.id === urlReport)) {
          setSelectedReportId(urlReport);
        } else if (types.length > 0 && !types.some((t) => t.id === selectedReportId)) {
          setSelectedReportId(types[0].id);
        }
      } catch {
        // Handled
      }
    };
    loadReports();
  }, [urlReport]);

  // Close week dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (weekDropdownRef.current && !weekDropdownRef.current.contains(event.target as Node)) {
        setIsWeekDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Active Report Object
  const activeReport = useMemo(() => {
    const list = reportsRegistry.length > 0 ? reportsRegistry : VERIFIED_REPORT_REGISTRY;
    return (
      list.find((r) => r.id === selectedReportId) ||
      list[0] ||
      VERIFIED_REPORT_REGISTRY[0]
    );
  }, [reportsRegistry, selectedReportId]);

  // Bucket reports into 3 categories matching the real performance app
  const allReportsList = useMemo(() => {
    return reportsRegistry.length > 0 ? reportsRegistry : VERIFIED_REPORT_REGISTRY;
  }, [reportsRegistry]);

  const dailyReports = useMemo(() => {
    return allReportsList.filter((r) => r.frequency === "DAILY" || r.category === "DAILY");
  }, [allReportsList]);

  const weeklyReports = useMemo(() => {
    return allReportsList.filter(
      (r) => (r.frequency === "WEEKLY" || r.category === "WEEKLY") && r.id !== "weekly_roster_report"
    );
  }, [allReportsList]);

  const weeklyRosterReports = useMemo(() => {
    return allReportsList.filter((r) => r.id === "weekly_roster_report");
  }, [allReportsList]);

  const bulkReports = useMemo(() => {
    return allReportsList.filter((r) => r.category === "BULK" && r.id !== "weekly_roster_report");
  }, [allReportsList]);

  const recentWeeks = useMemo(() => getRecentWeeksList(), []);

  const currentWeekDetails = useMemo(() => {
    const found = recentWeeks.find((w) => w.code === selectedWeek);
    if (found) return found;
    const str = String(selectedWeek);
    const yr = str.substring(0, 4);
    const wk = str.substring(4);
    return {
      code: selectedWeek,
      year: Number(yr),
      week: Number(wk),
      label: `Week ${wk}`,
      rangeStr: `${yr}`,
    };
  }, [recentWeeks, selectedWeek]);

  // Auto clear selected file on report type switch & update URL
  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    setSelectedFile(null);
    setSearchParams({ report: id }, { replace: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Sync activeCategoryTab when activeReport changes
  useEffect(() => {
    if (activeReport?.id === "weekly_roster_report") {
      setActiveCategoryTab("WEEKLY_ROSTER");
    } else if (activeReport?.category === "DAILY") {
      setActiveCategoryTab("DAILY");
    } else if (activeReport?.category === "WEEKLY") {
      setActiveCategoryTab("WEEKLY");
    } else if (activeReport?.category === "BULK") {
      setActiveCategoryTab("BULK");
    }
  }, [activeReport?.id, activeReport?.category]);

  const handleCategorySwitch = (cat: CategoryTab) => {
    setActiveCategoryTab(cat);
    const targetList =
      cat === "DAILY"
        ? dailyReports
        : cat === "WEEKLY"
        ? weeklyReports
        : cat === "WEEKLY_ROSTER"
        ? weeklyRosterReports
        : bulkReports;
    if (targetList.length > 0 && !targetList.some((r) => r.id === selectedReportId)) {
      handleSelectReport(targetList[0].id);
    }
  };

  const currentCategoryList = useMemo(() => {
    switch (activeCategoryTab) {
      case "WEEKLY":
        return weeklyReports;
      case "WEEKLY_ROSTER":
        return weeklyRosterReports;
      case "BULK":
        return bulkReports;
      case "DAILY":
      default:
        return dailyReports;
    }
  }, [activeCategoryTab, dailyReports, weeklyReports, weeklyRosterReports, bulkReports]);

  const filteredReports = currentCategoryList;

  const handleExportExcel = () => {
    if (activeReport.sampleTemplateType) {
      downloadSampleTemplate(activeReport.sampleTemplateType);
      setToastMessage({ text: `Downloading ${formatReportName(activeReport.name)} template...`, type: "info" });
    } else {
      const headers =
        activeReport.expectedFields && activeReport.expectedFields.length > 0
          ? activeReport.expectedFields.join(",")
          : "Name,Phone,Email,Role,Station";
      const blob = new Blob([headers + "\n"], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeReport.id}_template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage({ text: `Exported ${formatReportName(activeReport.name)} template`, type: "success" });
    }
  };

  // Week Steppers
  const handlePrevWeek = () => {
    const idx = recentWeeks.findIndex((w) => w.code === selectedWeek);
    if (idx !== -1 && idx < recentWeeks.length - 1) {
      setSelectedWeek(recentWeeks[idx + 1].code);
    } else {
      const yr = Math.floor(selectedWeek / 100);
      const wk = selectedWeek % 100;
      if (wk > 1) {
        setSelectedWeek(Number(`${yr}${String(wk - 1).padStart(2, "0")}`));
      } else {
        setSelectedWeek(Number(`${yr - 1}52`));
      }
    }
  };

  const handleNextWeek = () => {
    const idx = recentWeeks.findIndex((w) => w.code === selectedWeek);
    if (idx > 0) {
      setSelectedWeek(recentWeeks[idx - 1].code);
    } else {
      const yr = Math.floor(selectedWeek / 100);
      const wk = selectedWeek % 100;
      if (wk < 52) {
        setSelectedWeek(Number(`${yr}${String(wk + 1).padStart(2, "0")}`));
      } else {
        setSelectedWeek(Number(`${yr + 1}01`));
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndSetFile = (file: File) => {
    if (file.size === 0) {
      setToastMessage({ text: "The selected file is empty (0 bytes).", type: "error" });
      setSelectedFile(null);
      return false;
    }

    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setToastMessage({
        text: `File exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
        type: "error",
      });
      setSelectedFile(null);
      return false;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const allowed = activeReport?.supportedMimeTypes || [".csv", ".xlsx", ".xls"];
    if (!allowed.some((a) => a.toLowerCase() === ext)) {
      setToastMessage({
        text: "Invalid file format. Please select a valid spreadsheet file.",
        type: "error",
      });
      setSelectedFile(null);
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Real Upload Dispatcher
  const handleUploadFile = async () => {
    if (!selectedFile) {
      setToastMessage({ text: "Please select a file to upload.", type: "error" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await performanceApi.uploadReportWorkflow(
        activeReport,
        selectedFile,
        {
          date: dailyDate,
          weekNumber: selectedWeek,
          replace: replaceExisting,
        },
        (pct) => setUploadProgress(pct)
      );

      if (result.success) {
        setToastMessage({ text: result.message || "File uploaded successfully", type: "success" });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setToastMessage({ text: result.message || "Upload failed. Please check file and try again.", type: "error" });
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to upload file.";
      setToastMessage({ text: errorMsg, type: "error" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div
      className="upload-reports-shell perf-catalog"
      style={{ position: "relative" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "70px",
            right: "24px",
            zIndex: 9999,
            backgroundColor:
              toastMessage.type === "success"
                ? "var(--ads-green)"
                : toastMessage.type === "error"
                ? "var(--ads-red)"
                : "var(--ads-blue)",
            color: "#FFFFFF",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--ads-r-md)",
            boxShadow: "var(--ads-shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.875rem",
            fontWeight: 550,
            letterSpacing: "-0.01em",
            animation: "ads-sheet-in var(--ads-dur) var(--ads-ease)",
          }}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            style={{
              background: "none",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              marginLeft: "0.5rem",
              display: "flex",
              borderRadius: "var(--ads-r-xs)",
              transition: "transform var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

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
          <ChevronRight size={14} style={{ color: "var(--ads-ink-quaternary)" }} />
          <span className="upload-breadcrumb-current">Upload Reports</span>
          <ChevronRight size={14} style={{ color: "var(--ads-ink-quaternary)" }} />
          <span className="upload-breadcrumb-active-report">
            {formatReportName(activeReport.name)}
          </span>
        </div>

        {/* Right: View by Capsule & Bulk Export Template */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div className="upload-view-by-wrap">
            <span className="upload-view-by-label">View by</span>
            <div className="upload-segmented-capsule">
              {[
                { id: "DAILY" as const, label: "Daily", count: dailyReports.length },
                { id: "WEEKLY" as const, label: "Weekly", count: weeklyReports.length },
                { id: "WEEKLY_ROSTER" as const, label: "Weekly roster", count: weeklyRosterReports.length },
                { id: "BULK" as const, label: "Bulk upload", count: bulkReports.length },
              ].map((cat) => {
                const isActive = activeCategoryTab === cat.id;
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

          <div className="upload-toolbar-actions">
            {/* Export Template Button - only for drivers, vehicles, admins in Bulk section */}
            {activeCategoryTab === "BULK" && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="upload-action-pill-btn"
                title="Download bulk template"
              >
                <FileDown size={15} style={{ color: "var(--ads-blue)" }} />
                <span>Export Template</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Divided Screen: Left Catalog Sidebar + Right Workspace (Hero Ingestion Card) */}
      <div className="upload-split-layout">
        {/* Left: Reports Catalog Sidebar */}
        <aside className="upload-reports-sidebar">
          <div className="upload-sidebar-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span className="upload-sidebar-title">
                {activeCategoryTab === "DAILY"
                  ? "Daily Reports"
                  : activeCategoryTab === "WEEKLY"
                  ? "Weekly Reports"
                  : activeCategoryTab === "WEEKLY_ROSTER"
                  ? "Weekly Roster"
                  : "Bulk Uploads"}
              </span>
            </div>
            <span className="upload-sidebar-badge">
              {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"}
            </span>
          </div>

          <div className="upload-reports-list-scroll">
            {filteredReports.length === 0 ? (
              <div
                style={{
                  padding: "2rem 1rem",
                  textAlign: "center",
                  color: "var(--ads-ink-tertiary)",
                  fontSize: "0.8125rem",
                }}
              >
                <AlertCircle size={28} style={{ margin: "0 auto 0.5rem", color: "var(--ads-ink-quaternary)" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No reports available</p>
              </div>
            ) : (
              filteredReports.map((r) => {
                const isActive = r.id === selectedReportId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectReport(r.id)}
                    className={`upload-report-sidebar-item ${isActive ? "active" : ""}`}
                  >
                    {isActive && <span className="upload-item-indicator" />}
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--ads-r-xs)",
                        backgroundColor: isActive ? "var(--ads-blue-tint-strong)" : "rgba(0, 0, 0, 0.04)",
                        border: "1px solid var(--ads-hairline)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      <ReportIcon
                        id={r.id}
                        active={isActive}
                        color={isActive ? "var(--ads-blue)" : "var(--ads-ink-tertiary)"}
                        size="1.05rem"
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: isActive ? 650 : 550,
                          letterSpacing: "-0.01em",
                          color: isActive ? "#0058B0" : "var(--ads-ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {formatReportName(r.name)}
                      </div>
                    </div>

                    <ChevronRight
                      size={14}
                      style={{
                        color: isActive ? "var(--ads-blue)" : "var(--ads-ink-quaternary)",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Workspace Container */}
        <section className="upload-workspace-container">
          {/* Unified Workspace Card Header: Report Identity & Specs (Left) + Date Navigation (Right) */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--ads-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              backgroundColor: "var(--ads-material-thin)",
              backdropFilter: "var(--ads-blur-sm)",
              WebkitBackdropFilter: "var(--ads-blur-sm)",
            }}
          >
            {/* Left: Active Report Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--ads-r-sm)",
                  backgroundColor: "var(--ads-blue-tint)",
                  border: "1px solid var(--ads-hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "var(--ads-shadow-xs)",
                }}
              >
                <ReportIcon id={activeReport.id} active color="var(--ads-blue)" size="1.25rem" />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.125rem",
                      fontWeight: 650,
                      color: "var(--ads-ink)",
                      letterSpacing: "-0.019em",
                    }}
                  >
                    {formatReportName(activeReport.name)}
                  </h2>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      padding: "0.18rem 0.55rem",
                      borderRadius: "var(--ads-r-pill)",
                      backgroundColor: "var(--ads-blue-tint)",
                      color: "#0058B0",
                      border: "1px solid transparent",
                    }}
                  >
                    {activeReport.id === "weekly_roster_report" || activeCategoryTab === "WEEKLY_ROSTER"
                      ? "Weekly Roster"
                      : activeReport.category === "DAILY"
                      ? "Daily"
                      : activeReport.category === "WEEKLY"
                      ? "Weekly"
                      : "Bulk upload"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Date Navigation Controls */}
            {activeCategoryTab === "DAILY" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 550, color: "var(--ads-ink-tertiary)" }}>
                  Report date:
                </span>
                <AppDateNavigator
                  selectedDate={dailyDate}
                  onChange={setDailyDate}
                  align="right"
                  size="md"
                />
              </div>
            )}

            {(activeCategoryTab === "WEEKLY" ||
              activeCategoryTab === "WEEKLY_ROSTER" ||
              activeReport.id === "weekly_roster_report") && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div
                  ref={weekDropdownRef}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    backgroundColor: "var(--ads-material-thick)",
                    border: "1px solid var(--ads-hairline)",
                    borderRadius: "var(--ads-r-sm)",
                    boxShadow: "var(--ads-bevel)",
                    padding: "0.2rem 0.35rem",
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.3rem",
                      borderRadius: "var(--ads-r-xs)",
                      color: "var(--ads-ink-secondary)",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Previous week"
                    aria-label="Previous week"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.25rem 0.65rem",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "var(--ads-ink)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Calendar size={15} style={{ color: "var(--ads-blue)" }} />
                    <span>{currentWeekDetails.label}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", fontWeight: 500 }}>
                      ({currentWeekDetails.rangeStr})
                    </span>
                    <ChevronDown size={14} style={{ color: "var(--ads-ink-quaternary)" }} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextWeek}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.3rem",
                      borderRadius: "var(--ads-r-xs)",
                      color: "var(--ads-ink-secondary)",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Next week"
                    aria-label="Next week"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {isWeekDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "6px",
                        width: "290px",
                        maxHeight: "280px",
                        overflowY: "auto",
                        backgroundColor: "var(--ads-material-thick)",
                        backdropFilter: "var(--ads-blur-lg)",
                        WebkitBackdropFilter: "var(--ads-blur-lg)",
                        border: "1px solid var(--ads-hairline)",
                        borderRadius: "var(--ads-r-md)",
                        boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
                        zIndex: 100,
                        padding: "0.35rem",
                        animation: "ads-sheet-in var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      {recentWeeks.map((w) => (
                        <button
                          key={w.code}
                          type="button"
                          onClick={() => {
                            setSelectedWeek(w.code);
                            setIsWeekDropdownOpen(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            textAlign: "left",
                            background: w.code === selectedWeek ? "var(--ads-blue-tint)" : "transparent",
                            color: w.code === selectedWeek ? "#0058B0" : "var(--ads-ink)",
                            border: "none",
                            borderRadius: "var(--ads-r-xs)",
                            cursor: "pointer",
                            fontSize: "0.8125rem",
                            fontWeight: w.code === selectedWeek ? 650 : 500,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "2px",
                          }}
                        >
                          <span>{w.label}</span>
                          <span style={{ fontSize: "0.75rem", color: w.code === selectedWeek ? "#0058B0" : "var(--ads-ink-tertiary)" }}>
                            {w.rangeStr}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const lw = new Date();
                      lw.setDate(lw.getDate() - 7);
                      setSelectedWeek(getISOWeekDetails(lw).code);
                    }}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.8125rem",
                      fontWeight: isLastWeek(selectedWeek) ? 650 : 550,
                      borderRadius: "var(--ads-r-pill)",
                      border: "1px solid",
                      cursor: "pointer",
                      backgroundColor: isLastWeek(selectedWeek)
                        ? "var(--ads-blue-tint)"
                        : "var(--ads-material-thick)",
                      borderColor: isLastWeek(selectedWeek) ? "transparent" : "var(--ads-hairline)",
                      color: isLastWeek(selectedWeek) ? "#0058B0" : "var(--ads-ink-secondary)",
                      transition:
                        "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    Last week
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWeek(getISOWeekDetails(new Date()).code);
                    }}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.8125rem",
                      fontWeight: isCurrentWeek(selectedWeek) ? 650 : 550,
                      borderRadius: "var(--ads-r-pill)",
                      border: "1px solid",
                      cursor: "pointer",
                      backgroundColor: isCurrentWeek(selectedWeek)
                        ? "var(--ads-blue-tint)"
                        : "var(--ads-material-thick)",
                      borderColor: isCurrentWeek(selectedWeek) ? "transparent" : "var(--ads-hairline)",
                      color: isCurrentWeek(selectedWeek) ? "#0058B0" : "var(--ads-ink-secondary)",
                      transition:
                        "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    Current week
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Unified Workspace Card Body: Hero Dropzone */}
          <div
            className="settings-panel-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem 1.5rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "760px",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Dropzone Container */}
              <div
                className={`upload-dropzone-wrap ${isDragOver ? "drag-over" : ""}`}
                style={{
                  border: isDragOver
                    ? "2px dashed var(--ads-blue)"
                    : "2px dashed var(--ads-hairline-strong)",
                  borderRadius: "var(--ads-r-lg)",
                  padding: "2.75rem 2rem",
                  textAlign: "center",
                  backgroundColor: isDragOver ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
                  cursor: "pointer",
                  transition:
                    "background-color var(--ads-dur) var(--ads-ease), border-color var(--ads-dur) var(--ads-ease), box-shadow var(--ads-dur) var(--ads-ease), transform var(--ads-dur) var(--ads-ease)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "220px",
                  boxShadow: isDragOver ? "var(--ads-shadow-md)" : "var(--ads-shadow-xs)",
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!selectedFile && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept={activeReport.supportedMimeTypes.join(",")}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      validateAndSetFile(e.target.files[0]);
                    }
                  }}
                />

                {!selectedFile ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "62px",
                        height: "62px",
                        borderRadius: "var(--ads-r-lg)",
                        backgroundColor: "var(--ads-blue)",
                        border: "1px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 14px rgba(0, 113, 227, 0.24)",
                        color: "#FFFFFF",
                      }}
                    >
                      <UploadCloud size={32} style={{ color: "#FFFFFF" }} />
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                        Drag & drop your report here
                      </p>
                      <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
                        Files will be automatically processed upon upload
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                      style={{
                        marginTop: "0.25rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1.25rem",
                        borderRadius: "var(--ads-r-pill)",
                        backgroundColor: "var(--ads-blue-tint)",
                        border: "1px solid transparent",
                        color: "#0058B0",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        transition:
                          "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                        boxShadow: "var(--ads-shadow-xs)",
                      }}
                    >
                      <FileUp size={16} />
                      <span>Browse file</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.85rem",
                      padding: "1.15rem 1.35rem",
                      backgroundColor: "var(--ads-material-thick)",
                      backdropFilter: "var(--ads-blur-md)",
                      WebkitBackdropFilter: "var(--ads-blur-md)",
                      border: "1px solid var(--ads-hairline)",
                      borderRadius: "var(--ads-r-md)",
                      width: "100%",
                      maxWidth: "560px",
                      boxSizing: "border-box",
                      boxShadow: "var(--ads-shadow-md), var(--ads-bevel)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "var(--ads-r-sm)",
                            backgroundColor: "var(--ads-blue-tint)",
                            border: "1px solid var(--ads-hairline)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            color: "var(--ads-blue)",
                          }}
                        >
                          <FileSpreadsheet size={24} />
                        </div>
                        <div style={{ textAlign: "left", minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {selectedFile.name}
                          </p>
                          <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {isUploading ? "Uploading & processing..." : "Ready to ingest"}
                          </p>
                        </div>
                      </div>
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--ads-ink-tertiary)",
                            cursor: "pointer",
                            padding: "0.45rem",
                            borderRadius: "var(--ads-r-xs)",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Remove file"
                          aria-label="Remove selected file"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                    {isUploading && (
                      <div style={{ width: "100%", marginTop: "0.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", marginBottom: "0.35rem" }}>
                          <span>Uploading and processing...</span>
                          <span style={{ fontWeight: 600, color: "#0058B0" }}>{uploadProgress > 0 ? `${uploadProgress}%` : "Processing"}</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(0, 0, 0, 0.08)", borderRadius: "var(--ads-r-pill)", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${uploadProgress > 0 ? uploadProgress : 100}%`,
                              height: "100%",
                              backgroundColor: "var(--ads-blue)",
                              borderRadius: "var(--ads-r-pill)",
                              transition: "width var(--ads-dur) var(--ads-ease)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Action Footer Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  padding: "0.25rem 0.25rem 0 0.25rem",
                }}
              >
                {selectedFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "var(--ads-green)",
                      }}
                    />
                    <span>Ready to upload: {selectedFile.name}</span>
                  </div>
                ) : (
                  <div />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {selectedFile && !isUploading && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        padding: "0.55rem 1.15rem",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--ads-ink)",
                        backgroundColor: "var(--ads-material-thick)",
                        border: "1px solid var(--ads-hairline)",
                        borderRadius: "var(--ads-r-pill)",
                        boxShadow: "var(--ads-bevel)",
                        cursor: "pointer",
                        transition:
                          "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      Clear file
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!selectedFile || isUploading}
                    onClick={handleUploadFile}
                    className="btn-blue-primary"
                    style={{
                      minWidth: "170px",
                      height: "42px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      backgroundColor: "var(--ads-blue)",
                      color: "#FFFFFF",
                      borderRadius: "var(--ads-r-pill)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      opacity: !selectedFile || isUploading ? 0.4 : 1,
                      cursor: !selectedFile || isUploading ? "not-allowed" : "pointer",
                      boxShadow: !selectedFile || isUploading ? "none" : "0 2px 8px rgba(0, 113, 227, 0.28)",
                      border: "none",
                      padding: "0 1.5rem",
                      transition:
                        "background-color var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" style={{ color: "#FFFFFF" }} />
                        <span style={{ color: "#FFFFFF" }}>
                          Uploading... {uploadProgress > 0 ? `${uploadProgress}%` : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={17} style={{ color: "#FFFFFF" }} />
                        <span style={{ color: "#FFFFFF" }}>Upload file</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UploadReportsPage;
