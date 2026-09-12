import React, {
  FC,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  FileSpreadsheet,
  X,
  Loader2,
  FileCheck,
} from "lucide-react";
import { ReportConfigItem } from "./reportsConfig";
import { ReportsApi, GenericReportResponse } from "../../../api/reportsApi";
import { useAuthStore } from "../../../store/authStore";
import ESignatureSendFormModal from "../esignature/ESignatureSendFormModal";
import { ReportIcon } from "../upload/ReportIcons";
import { AppDateNavigator } from "../../common/AppDateNavigator";

interface ReportViewerProps {
  report: ReportConfigItem;
}

// Page size matching performance-web-production standard
const PAGE_LIMIT = 50;

// ── Date / Week utilities ─────────────────────────────────────────────────────

function getSundayBasedWeek(date: Date = new Date()) {
  const dow = date.getDay();
  const sun = new Date(date);
  sun.setDate(date.getDate() - dow);
  sun.setHours(0, 0, 0, 0);
  const sat = new Date(sun);
  sat.setDate(sun.getDate() + 6);
  sat.setHours(23, 59, 59, 999);
  const weekYear = sat.getFullYear();
  const jan1 = new Date(weekYear, 0, 1);
  const firstSun = new Date(jan1);
  firstSun.setDate(jan1.getDate() - jan1.getDay());
  firstSun.setHours(0, 0, 0, 0);
  const diffDays = Math.round((sun.getTime() - firstSun.getTime()) / 86400000);
  const weekNum = Math.floor(diffDays / 7) + 1;
  return {
    weekNumber: weekNum,
    weekYear,
    formattedWeek: `${weekYear}${String(weekNum).padStart(2, "0")}`,
  };
}

function offsetWeek(weekStr: string, delta: number): string {
  if (!weekStr || weekStr.length < 6) return getSundayBasedWeek().formattedWeek;
  const year = parseInt(weekStr.slice(0, 4), 10);
  const week = parseInt(weekStr.slice(4), 10);
  const jan1 = new Date(year, 0, 1);
  const firstSun = new Date(jan1);
  firstSun.setDate(jan1.getDate() - jan1.getDay() + (week - 1) * 7);
  const target = new Date(firstSun);
  target.setDate(target.getDate() + delta * 7);
  return getSundayBasedWeek(target).formattedWeek;
}

function getWeekRange(weekStr: string): string {
  if (!weekStr || weekStr.length < 6) return "";
  const year = parseInt(weekStr.slice(0, 4), 10);
  const week = parseInt(weekStr.slice(4), 10);
  const jan1 = new Date(year, 0, 1);
  const start = new Date(jan1);
  start.setDate(jan1.getDate() - jan1.getDay() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(start)} – ${f(end)}`;
}

function offsetDate(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  d.setDate(d.getDate() + delta);
  return d.toISOString().split("T")[0];
}

const formatReportName = (name?: string): string => {
  if (!name) return "";
  const lower = name.trim().toLowerCase();
  if (lower === "all alert" || lower === "all alerts" || lower === "all alert report") {
    return "All Alerts";
  }
  return name;
};

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

const getRecentWeeksList = (): ISOWeekInfo[] => {
  const list: ISOWeekInfo[] = [];
  const now = new Date();
  for (let i = 0; i < 16; i++) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    list.push(getISOWeekDetails(d));
  }
  return list;
};

const isCurrentWeek = (weekCode: number): boolean => {
  return weekCode === getISOWeekDetails(new Date()).code;
};

const isLastWeek = (weekCode: number): boolean => {
  const lw = new Date();
  lw.setDate(lw.getDate() - 7);
  return weekCode === getISOWeekDetails(lw).code;
};

function fmtHeader(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtCell(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  const s = String(val).trim();
  return s === "" || s === "null" || s === "undefined" ? "—" : s;
}

function tierStyle(val: string) {
  const v = val.toLowerCase();
  if (v.includes("fantastic plus")) return { bg: "var(--ads-green-tint)", fg: "var(--ads-green)" };
  if (v.includes("fantastic")) return { bg: "var(--ads-green-tint)", fg: "var(--ads-green)" };
  if (v.includes("great")) return { bg: "var(--ads-blue-tint)", fg: "#0058B0" };
  if (v.includes("fair")) return { bg: "var(--ads-amber-tint)", fg: "var(--ads-amber)" };
  return { bg: "var(--ads-red-tint)", fg: "var(--ads-red)" };
}

const HIDDEN = new Set([
  "_id", "id", "company_id", "msg_id", "msg_sent",
  "report_type", "created_at", "updated_at",
]);

// ── Component ─────────────────────────────────────────────────────────────────

export const ReportViewer: FC<ReportViewerProps> = ({ report }) => {
  const { user, stations } = useAuthStore();
  const currentStation = stations?.find((s) => s.current) || stations?.[0];
  const compId = user?.company?.id || user?.company_id || currentStation?.company_id;
  const stationId = currentStation?.company_id;

  const weekPickerRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  const [weekNumber, setWeekNumber] = useState(() => getSundayBasedWeek().formattedWeek);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isESignModalOpen, setIsESignModalOpen] = useState(false);

  const recentWeeks = useMemo(() => getRecentWeeksList(), []);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const weekDropdownRef = useRef<HTMLDivElement>(null);

  // Close week dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (weekDropdownRef.current && !weekDropdownRef.current.contains(e.target as Node)) {
        setIsWeekDropdownOpen(false);
      }
    };
    if (isWeekDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isWeekDropdownOpen]);

  // Current week display details
  const currentWeekDetails = useMemo(() => {
    const match = recentWeeks.find((w) => String(w.code) === String(weekNumber));
    if (match) return match;
    const yr = parseInt(String(weekNumber).slice(0, 4), 10) || new Date().getFullYear();
    const wk = parseInt(String(weekNumber).slice(4), 10) || 1;
    return {
      code: Number(weekNumber),
      year: yr,
      week: wk,
      label: `Week ${String(wk).padStart(2, "0")}`,
      rangeStr: getWeekRange(String(weekNumber)),
    };
  }, [recentWeeks, weekNumber]);

  const handlePrevWeek = () => {
    const codeNum = Number(weekNumber);
    const idx = recentWeeks.findIndex((w) => w.code === codeNum);
    if (idx !== -1 && idx < recentWeeks.length - 1) {
      setWeekNumber(String(recentWeeks[idx + 1].code));
    } else {
      setWeekNumber((p) => offsetWeek(p, -1));
    }
  };

  const handleNextWeek = () => {
    const codeNum = Number(weekNumber);
    const idx = recentWeeks.findIndex((w) => w.code === codeNum);
    if (idx > 0) {
      setWeekNumber(String(recentWeeks[idx - 1].code));
    } else {
      setWeekNumber((p) => offsetWeek(p, 1));
    }
  };

  // Data state — accumulates pages for infinite scroll
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reset when report key / date / week changes
  const resetAndLoad = useCallback(() => {
    setRows([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    resetAndLoad();
  }, [report.key, weekNumber, dateStr, resetAndLoad]);

  // Fetch a page of data
  const fetchPage = useCallback(
    async (page: number) => {
      const isFirst = page === 1;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);

      const params: any = {
        company_id: compId,
        station_id: stationId,
        page,
        limit: PAGE_LIMIT,
      };
      if (report.type === "weekly") {
        params.week_number = weekNumber;
      } else {
        params.date = dateStr;
      }

      try {
        const res: GenericReportResponse = await ReportsApi.fetchReportData(
          report.key,
          params
        );
        const rawList: any[] = res?.data || [];

        const formatted = rawList.map((item: any, idx: number) => {
          if (item.metrics && typeof item.metrics === "object") {
            return {
              _rowId: item._id || item.id || `r${page}-${idx}`,
              driver_name:
                item.metrics.name ||
                item.driver_name ||
                item.name ||
                item.transporter_id ||
                "Driver",
              transporter_id: item.transporter_id || item.transpoter_id || "—",
              week_number: item.week_number || weekNumber,
              date: item.date || dateStr,
              callout_type: item.metrics.callout_time || item.metrics.callout_type,
              ...item.metrics,
            };
          }
          return { _rowId: item._id || item.id || `r${page}-${idx}`, ...item };
        });

        setRows((prev) => (isFirst ? formatted : [...prev, ...formatted]));
        // If we got fewer than PAGE_LIMIT rows, no more pages
        setHasMore(rawList.length >= PAGE_LIMIT);
      } catch (err: any) {
        if (isFirst) {
          setRows([]);
          setError(err?.response?.data?.message || err?.message || "Error loading data");
        }
        setHasMore(false);
      } finally {
        if (isFirst) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [report.key, report.type, weekNumber, dateStr, compId, stationId]
  );

  // Load first page whenever deps reset
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Intersection observer — load next page when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchPage(nextPage);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, currentPage, fetchPage]);

  // Client-side search filter
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) =>
      Object.entries(row).some(
        ([k, v]) => !HIDDEN.has(k) && v != null && String(v).toLowerCase().includes(q)
      )
    );
  }, [rows, searchQuery]);

  // Dynamic column extraction
  const columns = useMemo(() => {
    if (!rows.length) return [];
    const keysSet = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((k) => {
      if (k !== "_rowId" && !HIDDEN.has(k)) keysSet.add(k);
    }));
    return Array.from(keysSet).sort((a, b) => {
      if (a === "driver_name" || a === "name") return -1;
      if (b === "driver_name" || b === "name") return 1;
      if (a === "transporter_id") return -1;
      if (b === "transporter_id") return 1;
      return a.localeCompare(b);
    });
  }, [rows]);

  // CSV export
  const handleExport = () => {
    if (!filteredRows.length || !columns.length) return;
    const header = columns.map(fmtHeader).join(",");
    const body = filteredRows.map((row) =>
      columns.map((c) => `"${String(row[c] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const uri = "data:text/csv;charset=utf-8," + encodeURI([header, ...body].join("\n"));
    const a = document.createElement("a");
    a.href = uri;
    a.download = `${report.key}_${report.type === "weekly" ? weekNumber : dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const weekRange = getWeekRange(weekNumber);
  const weekLabel = `W${weekNumber.slice(4)}`;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      {/* ── Workspace Card Header (Matching Upload Reports Layout) ── */}
      <div
        style={{
          padding: "0.85rem 1.25rem",
          borderBottom: "1px solid var(--ads-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          backgroundColor: "var(--ads-material-thin)",
          backdropFilter: "var(--ads-blur-sm)",
          WebkitBackdropFilter: "var(--ads-blur-sm)",
          flexShrink: 0,
        }}
      >
        {/* Left: Active Report Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
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
            <ReportIcon id={report.key} active color="var(--ads-blue)" size="1.2rem" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                  fontWeight: 650,
                  color: "var(--ads-ink)",
                  letterSpacing: "-0.019em",
                }}
              >
                {formatReportName(report.label)}
              </h2>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "var(--ads-r-pill)",
                  backgroundColor: "var(--ads-blue-tint)",
                  color: "#0058B0",
                  border: "1px solid transparent",
                }}
              >
                {report.category === "weekly_roster"
                  ? "Weekly Roster"
                  : report.category === "daily"
                  ? "Daily"
                  : report.category === "weekly"
                  ? "Weekly"
                  : "Other"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Date Navigation Controls + Search + Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Calendar Controls */}
          {report.type === "daily" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 550, color: "var(--ads-ink-tertiary)" }}>
                Report date:
              </span>
              <AppDateNavigator
                selectedDate={dateStr}
                onChange={setDateStr}
                align="right"
                size="md"
              />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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
                    padding: "0.25rem",
                    borderRadius: "var(--ads-r-xs)",
                    color: "var(--ads-ink-secondary)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Previous week"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.2rem 0.5rem",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: "var(--ads-ink)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                  }}
                >
                  <Calendar size={14} style={{ color: "var(--ads-blue)" }} />
                  <span>{currentWeekDetails.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--ads-ink-tertiary)", fontWeight: 500 }}>
                    ({currentWeekDetails.rangeStr})
                  </span>
                  <ChevronDown size={13} style={{ color: "var(--ads-ink-quaternary)" }} />
                </button>

                <button
                  type="button"
                  onClick={handleNextWeek}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "var(--ads-r-xs)",
                    color: "var(--ads-ink-secondary)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Next week"
                  aria-label="Next week"
                >
                  <ChevronRight size={15} />
                </button>

                {isWeekDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "6px",
                      width: "280px",
                      maxHeight: "260px",
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
                          setWeekNumber(String(w.code));
                          setIsWeekDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "0.45rem 0.65rem",
                          textAlign: "left",
                          background: String(w.code) === String(weekNumber) ? "var(--ads-blue-tint)" : "transparent",
                          color: String(w.code) === String(weekNumber) ? "#0058B0" : "var(--ads-ink)",
                          border: "none",
                          borderRadius: "var(--ads-r-xs)",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: String(w.code) === String(weekNumber) ? 650 : 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "2px",
                        }}
                      >
                        <span>{w.label}</span>
                        <span style={{ fontSize: "0.72rem", color: String(w.code) === String(weekNumber) ? "#0058B0" : "var(--ads-ink-tertiary)" }}>
                          {w.rangeStr}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const lw = new Date();
                  lw.setDate(lw.getDate() - 7);
                  setWeekNumber(String(getISOWeekDetails(lw).code));
                }}
                style={{
                  padding: "0.3rem 0.65rem",
                  fontSize: "0.78rem",
                  fontWeight: isLastWeek(Number(weekNumber)) ? 650 : 550,
                  borderRadius: "var(--ads-r-pill)",
                  border: "1px solid",
                  cursor: "pointer",
                  backgroundColor: isLastWeek(Number(weekNumber))
                    ? "var(--ads-blue-tint)"
                    : "var(--ads-material-thick)",
                  borderColor: isLastWeek(Number(weekNumber)) ? "transparent" : "var(--ads-hairline)",
                  color: isLastWeek(Number(weekNumber)) ? "#0058B0" : "var(--ads-ink-secondary)",
                  transition:
                    "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                Last week
              </button>

              <button
                type="button"
                onClick={() => setWeekNumber(String(getISOWeekDetails(new Date()).code))}
                style={{
                  padding: "0.3rem 0.65rem",
                  fontSize: "0.78rem",
                  fontWeight: isCurrentWeek(Number(weekNumber)) ? 650 : 550,
                  borderRadius: "var(--ads-r-pill)",
                  border: "1px solid",
                  cursor: "pointer",
                  backgroundColor: isCurrentWeek(Number(weekNumber))
                    ? "var(--ads-blue-tint)"
                    : "var(--ads-material-thick)",
                  borderColor: isCurrentWeek(Number(weekNumber)) ? "transparent" : "var(--ads-hairline)",
                  color: isCurrentWeek(Number(weekNumber)) ? "#0058B0" : "var(--ads-ink-secondary)",
                  transition:
                    "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                Current week
              </button>
            </div>
          )}

          {/* Search inside table records */}
          <div style={{ position: "relative", width: "170px" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: "0.55rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ads-ink-quaternary)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search table…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "30px",
                padding: "0 1.5rem 0 1.8rem",
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid var(--ads-hairline)",
                fontSize: "0.78rem",
                outline: "none",
                backgroundColor: "var(--ads-material-thick)",
                color: "var(--ads-ink)",
                boxSizing: "border-box",
                transition:
                  "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--ads-blue)";
                e.target.style.boxShadow = "var(--ads-shadow-focus)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--ads-hairline)";
                e.target.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "0.45rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--ads-ink-tertiary)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
                aria-label="Clear table search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* E-Signature Send Form Action Button */}
          {report.key === "e_signature_report" && (
            <button
              type="button"
              onClick={() => setIsESignModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                height: "30px",
                padding: "0 0.9rem",
                borderRadius: "var(--ads-r-pill)",
                backgroundColor: "var(--ads-blue)",
                color: "#FFFFFF",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition:
                  "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                boxShadow: "0 1px 3px rgba(0, 113, 227, 0.24)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--ads-blue-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 113, 227, 0.32)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--ads-blue)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 113, 227, 0.24)";
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              title="Dispatch new E-Signature Form"
            >
              <FileCheck size={13} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Send form</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredRows.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              height: "30px",
              padding: "0 0.85rem",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid var(--ads-hairline)",
              backgroundColor: "var(--ads-material-thick)",
              boxShadow: "var(--ads-bevel)",
              color: "var(--ads-ink)",
              opacity: filteredRows.length === 0 ? 0.4 : 1,
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: filteredRows.length === 0 ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              transition:
                "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
            onMouseEnter={(e) => {
              if (filteredRows.length > 0) {
                e.currentTarget.style.backgroundColor = "var(--ads-white)";
                e.currentTarget.style.borderColor = "var(--ads-hairline-strong)";
              }
            }}
            onMouseLeave={(e) => {
              if (filteredRows.length > 0) {
                e.currentTarget.style.backgroundColor = "var(--ads-material-thick)";
                e.currentTarget.style.borderColor = "var(--ads-hairline)";
              }
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>


      {/* ── Results info bar (only when data is loaded) ── */}
      {!loading && rows.length > 0 && (
        <div
          style={{
            padding: "0.3rem 1rem",
            fontSize: "0.72rem",
            color: "var(--ads-ink-tertiary)",
            backgroundColor: "rgba(0, 0, 0, 0.02)",
            borderBottom: "1px solid var(--ads-hairline)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {searchQuery
            ? `${filteredRows.length} of ${rows.length} rows match "${searchQuery}"`
            : `${rows.length} records loaded${hasMore ? " · scroll for more" : ""}`}
        </div>
      )}

      {/* ── Table Area: Endless Vertical Scroll ── */}
      <div
        ref={tableWrapRef}
        className="scrollable"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          position: "relative",
          backgroundColor: "transparent",
        }}
      >
        {loading ? (
          /* Initial load spinner */
          <div style={CENTERED}>
            <div style={SPINNER} />
            <span style={{ fontSize: "0.875rem", fontWeight: 550, color: "var(--ads-ink-secondary)", marginTop: "0.75rem" }}>
              Loading live data…
            </span>
          </div>
        ) : error && rows.length === 0 ? (
          /* Error state */
          <div style={CENTERED}>
            <div style={{ ...ICON_BOX, backgroundColor: "var(--ads-red-tint)", color: "var(--ads-red)" }}>
              <FileSpreadsheet size={22} />
            </div>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9375rem", fontWeight: 600, color: "var(--ads-ink)" }}>
              Unable to load data
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", maxWidth: 360, textAlign: "center", lineHeight: 1.6 }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => fetchPage(1)}
              style={RETRY_BTN}
            >
              Retry
            </button>
          </div>
        ) : filteredRows.length === 0 ? (
          /* Empty state */
          <div style={CENTERED}>
            <div style={{ ...ICON_BOX, backgroundColor: "var(--ads-blue-tint)", color: "var(--ads-blue)" }}>
              <FileSpreadsheet size={22} />
            </div>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9375rem", fontWeight: 600, color: "var(--ads-ink)" }}>
              {searchQuery
                ? `No rows match "${searchQuery}"`
                : `No data for ${report.type === "weekly" ? `${weekLabel} (${weekRange})` : dateStr}`}
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", maxWidth: 360, textAlign: "center", lineHeight: 1.6 }}>
              {searchQuery
                ? "Try a different keyword."
                : "Uploaded reports will appear here automatically."}
            </p>
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} style={CLEAR_BTN}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}
            >
              <thead>
                <tr style={{ position: "sticky", top: 0, backgroundColor: "var(--ads-material-thick)", zIndex: 10 }}>
                  <th style={TH_NUM}>#</th>
                  {columns.map((col) => (
                    <th key={col} style={TH}>
                      {fmtHeader(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row._rowId || idx}
                    style={{
                      borderBottom: "1px solid var(--ads-hairline)",
                      transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 113, 227, 0.045)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={TD_NUM}>{idx + 1}</td>
                    {columns.map((col) => {
                      const raw = row[col];
                      const val = fmtCell(raw);
                      const isName = col === "driver_name" || col === "name";
                      const isTier = col === "tier";
                      return (
                        <td
                          key={col}
                          style={{
                            padding: "0.55rem 0.85rem",
                            color: isName ? "var(--ads-ink)" : "var(--ads-ink-secondary)",
                            fontWeight: isName ? 600 : 400,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isTier && val !== "—" ? (
                            (() => {
                              const ts = tierStyle(val);
                              return (
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "0.15rem 0.55rem",
                                    borderRadius: "var(--ads-r-pill)",
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                    backgroundColor: ts.bg,
                                    color: ts.fg,
                                  }}
                                >
                                  {val}
                                </span>
                              );
                            })()
                          ) : val === "—" ? (
                            <span style={{ color: "var(--ads-ink-quaternary)" }}>—</span>
                          ) : (
                            val
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sentinel div — triggers IntersectionObserver to load next page */}
            <div ref={sentinelRef} style={{ height: "1px" }} />

            {/* Loading more indicator */}
            {loadingMore && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "1rem",
                  color: "var(--ads-ink-tertiary)",
                  fontSize: "0.8125rem",
                }}
              >
                <Loader2 size={16} className="animate-spin" />
                <span>Loading more…</span>
              </div>
            )}

            {/* End of results indicator */}
            {!hasMore && rows.length > 0 && !loadingMore && (
              <div
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  fontSize: "0.72rem",
                  color: "var(--ads-ink-tertiary)",
                  borderTop: "1px solid var(--ads-hairline)",
                }}
              >
                All {rows.length} records loaded
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Send E-Signature Form */}
      {isESignModalOpen && (
        <ESignatureSendFormModal
          isOpen={isESignModalOpen}
          onClose={() => setIsESignModalOpen(false)}
          onSuccess={() => fetchPage(1)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-ldr { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin-ldr 0.7s linear infinite; }
      `}</style>
    </div>
  );
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const NAV_BTN: React.CSSProperties = {
  border: "1px solid var(--ads-hairline)",
  backgroundColor: "var(--ads-material-thick)",
  borderRadius: "var(--ads-r-sm)",
  width: "30px",
  height: "30px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--ads-ink-secondary)",
  transition: "all var(--ads-dur-fast) var(--ads-ease)",
  padding: 0,
  flexShrink: 0,
};

const WEEK_PILL: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  height: "30px",
  padding: "0 0.7rem",
  backgroundColor: "var(--ads-blue-tint)",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-pill)",
  fontSize: "0.8rem",
  color: "#0058B0",
  whiteSpace: "nowrap",
  cursor: "pointer",
  userSelect: "none",
};

const DATE_PILL: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  height: "30px",
  padding: "0 0.7rem",
  backgroundColor: "var(--ads-green-tint)",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-pill)",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--ads-green)",
  whiteSpace: "nowrap",
  cursor: "pointer",
  userSelect: "none",
};

const TODAY_BTN: React.CSSProperties = {
  border: "1px solid transparent",
  backgroundColor: "var(--ads-blue-tint)",
  borderRadius: "var(--ads-r-pill)",
  height: "30px",
  padding: "0 0.65rem",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#0058B0",
  transition: "all var(--ads-dur-fast) var(--ads-ease)",
  whiteSpace: "nowrap",
};

const CENTERED: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "5rem 2rem",
  textAlign: "center",
};

const ICON_BOX: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "var(--ads-r-md)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const SPINNER: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "3px solid var(--ads-blue-tint)",
  borderTopColor: "var(--ads-blue)",
  animation: "spin 0.7s linear infinite",
};

const RETRY_BTN: React.CSSProperties = {
  marginTop: "0.75rem",
  padding: "0.45rem 1.1rem",
  borderRadius: "var(--ads-r-pill)",
  border: "none",
  backgroundColor: "var(--ads-blue)",
  color: "#FFFFFF",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  fontSize: "0.8125rem",
  cursor: "pointer",
  boxShadow: "0 1px 3px rgba(0, 113, 227, 0.24)",
  transition:
    "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
};

const CLEAR_BTN: React.CSSProperties = {
  marginTop: "0.6rem",
  padding: "0.4rem 1rem",
  borderRadius: "var(--ads-r-pill)",
  border: "1px solid var(--ads-hairline)",
  backgroundColor: "var(--ads-material-thick)",
  boxShadow: "var(--ads-bevel)",
  color: "var(--ads-ink)",
  fontSize: "0.8125rem",
  fontWeight: 600,
  cursor: "pointer",
  transition:
    "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
};

const TH_NUM: React.CSSProperties = {
  width: "44px",
  textAlign: "center",
  padding: "0.55rem 0.5rem",
  borderBottom: "1px solid var(--ads-hairline)",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--ads-ink-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const TH: React.CSSProperties = {
  textAlign: "left",
  padding: "0.55rem 0.85rem",
  borderBottom: "1px solid var(--ads-hairline)",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--ads-ink-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};

const TD_NUM: React.CSSProperties = {
  textAlign: "center",
  padding: "0.55rem 0.5rem",
  color: "var(--ads-ink-quaternary)",
  fontWeight: 600,
  fontSize: "0.72rem",
};
