import React, { FC, useState, useEffect, useCallback, useRef, KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Users,
  AlertTriangle,
  X,
  Save,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Calendar,
  SlidersHorizontal,
  Info,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { perfAxiosInstance } from "../../../api/axiosClient";

const TOOLBAR_CHIP_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--ads-s1)",
  padding: "5px var(--ads-s3)",
  background: "var(--ads-material-thick)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-pill)",
  boxShadow: "var(--ads-bevel)",
};

const EDITOR_TOOL_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "28px",
  height: "28px",
  padding: "0 6px",
  border: "none",
  background: "transparent",
  borderRadius: "var(--ads-r-xs)",
  color: "var(--ads-ink-secondary)",
  cursor: "pointer",
};

const TOOLBAR_FIELD_STYLE: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: "0.75rem",
  color: "var(--ads-ink)",
  background: "transparent",
  border: "none",
  outline: "none",
  boxShadow: "none",
  padding: 0,
};

interface EmailEntry {
  email: string;
  from: "already_added" | "user_added";
  is_removed: boolean;
}

interface ViolationType {
  alert: string;
  active: boolean;
}

interface ViolationEntry {
  key: string;
  value: number;
}

interface NetradyneBodyItem {
  name: string;
  total: number;
  violations: ViolationEntry[];
}

interface PerMetricDriverItem {
  name: string;
  transporter_id: string;
  poor?: { color: string; values: Record<string, string>[] };
  fair?: { color: string; values: Record<string, string>[] };
}

interface OverallLowPerfDriverData {
  name: string;
  value: string;
  violations: {
    name: string;
    value: string;
    drivers?: { name: string; value: string; transporter_id: string }[];
  }[];
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const formatAlertName = (alert: string): string => {
  return alert
    .toLowerCase()
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface Props {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const PerformanceEmailReportingPanel: FC<Props> = ({ onNotification }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeReport = searchParams.get("report") || "netradyne_email";

  // Mode: "reporting" | "violations"
  const [viewMode, setViewMode] = useState<"reporting" | "violations">("reporting");

  // Netradyne states
  const [ndLoading, setNdLoading] = useState(false);
  const [ndSavingEmails, setNdSavingEmails] = useState(false);
  const [ndSavingViolations, setNdSavingViolations] = useState(false);
  const [ndSending, setNdSending] = useState(false);
  const [ndEmails, setNdEmails] = useState<EmailEntry[]>([]);
  const [ndSubject, setNdSubject] = useState("");
  const [ndHeaderCounts, setNdHeaderCounts] = useState<Record<string, number>[]>([]);
  const [ndTableData, setNdTableData] = useState<NetradyneBodyItem[]>([]);
  const [ndStartDate, setNdStartDate] = useState("");
  const [ndEndDate, setNdEndDate] = useState("");
  const [ndViolations, setNdViolations] = useState<ViolationType[]>([]);
  const [originalNdViolations, setOriginalNdViolations] = useState<ViolationType[]>([]);

  // Scorecard states
  const [scTab, setScTab] = useState<"per_metric" | "overall">("per_metric");
  const [scLoading, setScLoading] = useState(false);
  const [scSavingEmails, setScSavingEmails] = useState(false);
  const [scSending, setScSending] = useState(false);
  const [scEmails, setScEmails] = useState<EmailEntry[]>([]);
  const [scSubject, setScSubject] = useState("");
  const [scWeekNumber, setScWeekNumber] = useState<number | string>("");
  const [scPerMetricData, setScPerMetricData] = useState<PerMetricDriverItem[]>([]);
  const [scOverallData, setScOverallData] = useState<OverallLowPerfDriverData[]>([]);

  // Send modal
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [missingDrivers, setMissingDrivers] = useState<{ name: string; id: string }[]>([]);

  // Email chip input state
  const [emailInput, setEmailInput] = useState("");
  const [recipientsExpanded, setRecipientsExpanded] = useState(true);

  // ContentEditable Editor Ref
  const editorRef = useRef<HTMLDivElement>(null);

  // --- Netradyne Data Fetching ------------------------------------------------
  const fetchNetradyneData = useCallback(async () => {
    setNdLoading(true);
    try {
      let query = "?sendmail=no";
      if (ndStartDate && ndEndDate) {
        query += `&start=${ndStartDate}&end=${ndEndDate}`;
      }
      const [emailRes, violationRes] = await Promise.all([
        perfAxiosInstance.get(`email_reporting/v2/netradyne_email_reporting${query}`),
        perfAxiosInstance.get("email_reporting/v2/netradyne_voilations"),
      ]);

      if (emailRes.status === 200) {
        const d = emailRes.data?.data ?? {};
        const emails: EmailEntry[] = Array.isArray(d.emails)
          ? d.emails.map((e: string) => ({ email: e, from: "already_added" as const, is_removed: false }))
          : [];
        setNdEmails(emails);
        setNdSubject(d.subject ?? "Daily Netradyne Driver Performance & Violations Report");
        setNdHeaderCounts(Array.isArray(d.header) ? d.header : []);
        setNdTableData(Array.isArray(d.body) ? d.body : []);
        if (d.date && typeof d.date === "string" && !ndStartDate) {
          setNdStartDate(d.date);
          setNdEndDate(d.date);
        }
      }

      if (violationRes.status === 200) {
        const vList = violationRes.data?.data?.violations ?? [];
        setNdViolations(vList);
        setOriginalNdViolations(vList);
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to load Netradyne email data", type: "error" });
    } finally {
      setNdLoading(false);
    }
  }, [ndStartDate, ndEndDate, onNotification]);

  // --- Scorecard Data Fetching ------------------------------------------------
  const fetchScorecardData = useCallback(async () => {
    setScLoading(true);
    try {
      const query = scWeekNumber ? `?week_number=${scWeekNumber}` : "";
      if (scTab === "per_metric") {
        const res = await perfAxiosInstance.get(`email_reporting/v2/scorecard_bottom_performers${query}`);
        if (res.status === 200) {
          const d = res.data?.data ?? {};
          const emails: EmailEntry[] = Array.isArray(d.emails)
            ? d.emails.map((e: string) => ({ email: e, from: "already_added" as const, is_removed: false }))
            : [];
          setScEmails(emails);
          setScSubject(d.subject ?? "Weekly Driver Scorecard Focus Areas & Opportunities");
          setScPerMetricData(Array.isArray(d.body) ? d.body : []);
          if (res.data?.week_number && !scWeekNumber) {
            setScWeekNumber(res.data.week_number);
          }
        }
      } else {
        const res = await perfAxiosInstance.get(`email_reporting/v2/scorecard_email_reporting${query}`);
        if (res.status === 200) {
          const d = res.data?.data ?? {};
          const emails: EmailEntry[] = Array.isArray(d.emails)
            ? d.emails.map((e: string) => ({ email: e, from: "already_added" as const, is_removed: false }))
            : [];
          setScEmails(emails);
          setScSubject(d.subject ?? "Weekly Driver Scorecard Overall Performance Report");
          setScOverallData(Array.isArray(d.body) ? d.body : []);
          if (res.data?.week_number && !scWeekNumber) {
            setScWeekNumber(res.data.week_number);
          }
        }
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to load Scorecard email data", type: "error" });
    } finally {
      setScLoading(false);
    }
  }, [scTab, scWeekNumber, onNotification]);

  // Trigger data load based on active tab
  useEffect(() => {
    if (activeReport === "netradyne_email") {
      fetchNetradyneData();
    } else if (activeReport === "scorecard_email") {
      fetchScorecardData();
    }
  }, [activeReport, fetchNetradyneData, fetchScorecardData]);

  // --- Email Recipient Management ---------------------------------------------
  const currentEmails = activeReport === "netradyne_email" ? ndEmails : scEmails;
  const setCurrentEmails = activeReport === "netradyne_email" ? setNdEmails : setScEmails;

  const handleAddEmail = (raw: string) => {
    const val = raw.trim();
    if (!val) return;
    if (!isValidEmail(val)) {
      onNotification({ text: "Please enter a valid email address", type: "error" });
      return;
    }
    if (currentEmails.some((e) => e.email.toLowerCase() === val.toLowerCase() && !e.is_removed)) {
      onNotification({ text: "Email already exists in list", type: "error" });
      return;
    }
    setCurrentEmails((prev) => [...prev, { email: val, from: "user_added", is_removed: false }]);
    setEmailInput("");
  };

  const handleRemoveEmail = (emailStr: string) => {
    setCurrentEmails((prev) =>
      prev.map((e) => (e.email === emailStr ? { ...e, is_removed: true } : e))
    );
  };

  const handleSaveEmailList = async () => {
    const reportType = activeReport === "netradyne_email" ? "netradyne" : "scorecard";
    const activeList = currentEmails.filter((e) => !e.is_removed).map((e) => e.email);
    if (activeReport === "netradyne_email") setNdSavingEmails(true);
    else setScSavingEmails(true);

    try {
      const res = await perfAxiosInstance.patch("email_reporting/v2/email_list", {
        type: reportType,
        email_list: activeList,
      });
      if (res.status === 200) {
        onNotification({ text: "Recipient email list saved successfully!", type: "success" });
      } else {
        throw new Error(res.data?.message ?? "Failed to save email list");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Error saving email list", type: "error" });
    } finally {
      if (activeReport === "netradyne_email") setNdSavingEmails(false);
      else setScSavingEmails(false);
    }
  };

  // --- Save Violations --------------------------------------------------------
  const handleSaveViolations = async () => {
    setNdSavingViolations(true);
    try {
      const res = await perfAxiosInstance.post("email_reporting/v2/netradyne_voilations", {
        voilations: ndViolations,
      });
      if (res.status === 200) {
        setOriginalNdViolations(ndViolations);
        onNotification({ text: "Netradyne violation toggles updated successfully!", type: "success" });
        setViewMode("reporting");
        fetchNetradyneData();
      } else {
        throw new Error(res.data?.message ?? "Failed to update violations");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to update violations", type: "error" });
    } finally {
      setNdSavingViolations(false);
    }
  };

  // --- Rich Editor Helpers ----------------------------------------------------
  const formatDoc = (cmd: string, val: string = "") => {
    document.execCommand(cmd, false, val);
  };

  const getHTMLContent = (): string => {
    if (!editorRef.current) return "";
    const clone = editorRef.current.cloneNode(true) as HTMLElement;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
            table { border-collapse: separate; border-spacing: 0; width: 100%; max-width: 800px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; margin-top: 15px; }
            th { background-color: #e4f2fc; color: #0f172a; font-weight: bold; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 14px; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: middle; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          ${clone.innerHTML}
        </body>
      </html>
    `.trim();
  };

  // --- Send Email Trigger -----------------------------------------------------
  const handleOpenSendModal = () => {
    const activeEmails = currentEmails.filter((e) => !e.is_removed);
    if (activeEmails.length === 0) {
      onNotification({ text: "Please add at least one recipient email address", type: "error" });
      return;
    }
    const subj = activeReport === "netradyne_email" ? ndSubject : scSubject;
    if (!subj.trim()) {
      onNotification({ text: "Please enter an email subject", type: "error" });
      return;
    }

    const missing: { name: string; id: string }[] = [];
    if (activeReport === "netradyne_email") {
      ndTableData.forEach((row) => {
        if (!row.name || row.name.toLowerCase().includes("unassigned")) {
          missing.push({ name: row.name || "Unknown", id: row.name });
        }
      });
    }
    setMissingDrivers(missing);
    setSendModalOpen(true);
  };

  const handleConfirmSendEmail = async () => {
    const activeList = currentEmails.filter((e) => !e.is_removed).map((e) => e.email);
    const subj = activeReport === "netradyne_email" ? ndSubject : scSubject;
    const html = getHTMLContent();

    if (activeReport === "netradyne_email") setNdSending(true);
    else setScSending(true);

    try {
      const res = await perfAxiosInstance.post("email_reporting/v2/send_mail", {
        emails: activeList,
        subject: subj,
        htmlContent: html,
      });

      if (res.status === 200) {
        onNotification({ text: "Email report dispatched successfully to all recipients!", type: "success" });
        setSendModalOpen(false);
      } else {
        throw new Error(res.data?.message ?? "Failed to send email");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to send email", type: "error" });
    } finally {
      if (activeReport === "netradyne_email") setNdSending(false);
      else setScSending(false);
    }
  };

  const activeEmailCount = currentEmails.filter((e) => !e.is_removed).length;
  const isViolationsChanged = JSON.stringify(ndViolations) !== JSON.stringify(originalNdViolations);

  // 1. SET VIOLATIONS FULL VIEW (Netradyne)
  if (viewMode === "violations" && activeReport === "netradyne_email") {
    return (
      <div className="settings-panel-scroll">
        <div className="settings-panel-header-block">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-gray-secondary btn-sm"
              onClick={() => setViewMode("reporting")}
              title="Back to Email Reporting"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div>
              <h2 className="settings-panel-heading flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-blue-600" />
                <span>Configure Netradyne Violations</span>
              </h2>
              <p className="settings-panel-subheading">
                Toggle the violation metrics that will be included in the automated Netradyne email summary.
              </p>
            </div>
          </div>

          <div className="settings-header-actions">
            <button
              type="button"
              className="btn-blue-primary btn-sm"
              onClick={handleSaveViolations}
              disabled={ndSavingViolations || !isViolationsChanged}
              style={{ color: "#FFFFFF" }}
            >
              <Save size={15} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>
                {ndSavingViolations ? "Saving..." : "Save Changes"}
              </span>
            </button>
          </div>
        </div>

        <div className="settings-card mt-4" style={{ maxWidth: "640px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
              padding: "var(--ads-s3) var(--ads-s4)",
              fontSize: "0.75rem",
              color: "var(--ads-ink-secondary)",
              background: "var(--ads-blue-tint)",
              borderRadius: "var(--ads-r-md)",
            }}
          >
            <Info size={14} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
            <span>Enable or disable specific Netradyne camera safety alerts below.</span>
          </div>

          <div className="divide-y divide-slate-100">
            {ndViolations.map((v) => (
              <div
                key={v.alert}
                className="settings-toggle-row"
              >
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">
                    {formatAlertName(v.alert)}
                  </span>
                  <span className="settings-toggle-desc">Camera safety alert event</span>
                </div>
                <label
                  className="custom-blue-switch"
                  title={`Toggle ${formatAlertName(v.alert)}`}
                >
                  <input
                    type="checkbox"
                    checked={v.active}
                    aria-label={`Toggle ${formatAlertName(v.alert)}`}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNdViolations((prev) =>
                        prev.map((item) => (item.alert === v.alert ? { ...item, active: checked } : item))
                      );
                    }}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN REPORTING VIEW
  const isNetradyne = activeReport === "netradyne_email";
  const isLoading = isNetradyne ? ndLoading : scLoading;
  const isSending = isNetradyne ? ndSending : scSending;
  const isSavingEmails = isNetradyne ? ndSavingEmails : scSavingEmails;

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          {isNetradyne
            ? "Preview, customize, and dispatch daily Netradyne camera safety violation digests to management"
            : "Review, customize, and send weekly bottom & overall scorecard performance reports to management"}
        </p>

        {/* Right Toolbar Actions */}
        <div className="settings-panel-intro-actions">
          {isNetradyne && (
            <>
              {/* Date Filters */}
              <div style={TOOLBAR_CHIP_STYLE}>
                <Calendar size={14} style={{ color: "var(--ads-ink-quaternary)" }} />
                <input
                  type="date"
                  style={TOOLBAR_FIELD_STYLE}
                  value={ndStartDate}
                  onChange={(e) => setNdStartDate(e.target.value)}
                  title="Start Date"
                  aria-label="Report start date"
                />
                <span style={{ color: "var(--ads-ink-quaternary)", fontSize: "0.75rem" }}>-</span>
                <input
                  type="date"
                  style={TOOLBAR_FIELD_STYLE}
                  value={ndEndDate}
                  onChange={(e) => setNdEndDate(e.target.value)}
                  title="End Date"
                  aria-label="Report end date"
                />
              </div>

              <button
                type="button"
                className="btn-gray-secondary btn-sm"
                onClick={() => setViewMode("violations")}
                title="Configure alert types to include"
              >
                <SlidersHorizontal size={14} />
                <span>Set Violations</span>
              </button>
            </>
          )}

          {!isNetradyne && (
            <div style={TOOLBAR_CHIP_STYLE}>
              <span
                style={{ fontSize: "0.75rem", fontWeight: 550, color: "var(--ads-ink-tertiary)" }}
              >
                Week #
              </span>
              <input
                type="number"
                min={1}
                max={53}
                style={{ ...TOOLBAR_FIELD_STYLE, width: "3rem", textAlign: "center", fontWeight: 600 }}
                value={scWeekNumber}
                onChange={(e) => setScWeekNumber(e.target.value)}
                placeholder="Auto"
                title="Scorecard Week Number"
                aria-label="Scorecard week number"
              />
            </div>
          )}

          <button
            type="button"
            className="btn-gray-secondary btn-sm"
            onClick={isNetradyne ? fetchNetradyneData : fetchScorecardData}
            disabled={isLoading}
            title="Refresh live report data"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-blue-primary btn-sm"
            onClick={handleOpenSendModal}
            disabled={isLoading || isSending}
            style={{ color: "#FFFFFF" }}
          >
            <Send size={14} style={{ color: "#FFFFFF" }} />
            <span style={{ color: "#FFFFFF" }}>{isSending ? "Sending..." : "Send Email"}</span>
          </button>
        </div>
      </div>

      {/* Scorecard Sub-Tab Navigation */}
      {!isNetradyne && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--ads-s2)",
            paddingBottom: "var(--ads-s2)",
            borderBottom: "1px solid var(--ads-hairline)",
          }}
        >
          <button
            type="button"
            className={`ads-pill ${scTab === "per_metric" ? "ads-pill--active" : ""}`}
            onClick={() => setScTab("per_metric")}
          >
            Per Metric Low Performers
          </button>
          <button
            type="button"
            className={`ads-pill ${scTab === "overall" ? "ads-pill--active" : ""}`}
            onClick={() => setScTab("overall")}
          >
            Overall Low Performers
          </button>
        </div>
      )}

      {/* Recipients Management Card */}
      <div className="settings-card mt-3">
        <div
          className="settings-card-title-row"
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => setRecipientsExpanded((p) => !p)}
        >
          <h3 className="settings-card-title">
            <Users size={16} />
            <span>Email recipients ({activeEmailCount})</span>
          </h3>

          <div
            style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn-gray-secondary btn-sm"
              onClick={handleSaveEmailList}
              disabled={isSavingEmails}
              title="Save current recipient list to server"
            >
              <Save size={13} />
              <span>{isSavingEmails ? "Saving..." : "Save list"}</span>
            </button>
            <button
              type="button"
              aria-label={recipientsExpanded ? "Collapse recipients" : "Expand recipients"}
              title={recipientsExpanded ? "Collapse recipients" : "Expand recipients"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                border: "none",
                background: "transparent",
                borderRadius: "var(--ads-r-xs)",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
              }}
              onClick={() => setRecipientsExpanded((p) => !p)}
            >
              {recipientsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {recipientsExpanded && (
          <div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "var(--ads-s2)",
              }}
            >
              {currentEmails
                .filter((e) => !e.is_removed)
                .map((entry) => (
                  <span key={entry.email} className="ads-badge ads-badge--blue">
                    <span>{entry.email}</span>
                    <button
                      type="button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        color: "inherit",
                        cursor: "pointer",
                      }}
                      onClick={() => handleRemoveEmail(entry.email)}
                      title="Remove recipient"
                      aria-label={`Remove recipient ${entry.email}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

              <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: "220px" }}>
                <input
                  type="email"
                  className="ads-input"
                  placeholder="Enter email and press Enter or comma..."
                  aria-label="Add email recipient"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddEmail(emailInput);
                    }
                  }}
                  onBlur={() => {
                    if (emailInput.trim()) handleAddEmail(emailInput);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Subject Line */}
      <div className="settings-card mt-3">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
          <label className="settings-form-label" style={{ flexShrink: 0 }}>
            Subject
          </label>
          <input
            type="text"
            className="ads-input"
            aria-label="Email subject line"
            value={isNetradyne ? ndSubject : scSubject}
            onChange={(e) =>
              isNetradyne ? setNdSubject(e.target.value) : setScSubject(e.target.value)
            }
            placeholder="Email subject line..."
          />
        </div>
      </div>

      {/* Rich Editor & Preview Card */}
      <div className="settings-card mt-3">
        {/* Editor Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--ads-s2)",
            padding: "var(--ads-s2) var(--ads-s3)",
            background: "rgba(0, 0, 0, 0.02)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s1)" }}>
            <button
              type="button"
              style={EDITOR_TOOL_STYLE}
              onClick={() => formatDoc("bold")}
              title="Bold"
              aria-label="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              style={EDITOR_TOOL_STYLE}
              onClick={() => formatDoc("italic")}
              title="Italic"
              aria-label="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              style={EDITOR_TOOL_STYLE}
              onClick={() => formatDoc("underline")}
              title="Underline"
              aria-label="Underline"
            >
              <Underline size={14} />
            </button>
            <span
              style={{
                width: "1px",
                height: "16px",
                margin: "0 var(--ads-s1)",
                background: "var(--ads-hairline-strong)",
              }}
            />
            <button
              type="button"
              style={{ ...EDITOR_TOOL_STYLE, fontSize: "0.75rem", fontWeight: 600 }}
              onClick={() => formatDoc("formatBlock", "<h2>")}
              title="Heading 2"
              aria-label="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              style={{ ...EDITOR_TOOL_STYLE, fontSize: "0.75rem", fontWeight: 600 }}
              onClick={() => formatDoc("formatBlock", "<p>")}
              title="Normal Paragraph"
              aria-label="Normal paragraph"
            >
              P
            </button>
          </div>

          <span
            style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", fontStyle: "italic" }}
          >
            Content is live-editable. Click text or table to modify before dispatching.
          </span>
        </div>

        {/* ContentEditable Preview Area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="p-5 outline-none min-h-[350px] max-h-[600px] overflow-y-auto text-slate-800 text-sm leading-relaxed"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          {/* NETRADYNE EMAIL BODY */}
          {isNetradyne && (
            <div>
              <p className="mb-2">Hi Team,</p>
              <p className="mb-4">Please find below the performance report from Netradyne.</p>

              {/* Alert Summary Header Counts */}
              {ndHeaderCounts.length > 0 && (
                <div className="mb-4">
                  <p className="font-bold text-slate-900 mb-2">Alert Summary:</p>
                  <div className="flex flex-wrap gap-2">
                    {ndHeaderCounts.map((item, idx) =>
                      Object.entries(item).map(([k, v]) => (
                        <div
                          key={`${k}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900"
                        >
                          <span>{formatAlertName(k)}:</span>
                          <span className="text-blue-700 font-bold">{v}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Netradyne Driver Table */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #CBD5E1",
                  marginTop: "16px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#E4F2FC" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #CBD5E1", color: "#0F172A" }}>
                      Driver Name
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #CBD5E1", color: "#0F172A" }}>
                      Violations Breakdown
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: "bold", borderBottom: "2px solid #CBD5E1", color: "#0F172A" }}>
                      Total Violations
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ndTableData.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>
                        {ndLoading ? "Loading Netradyne data..." : "No driver violations recorded for this period."}
                      </td>
                    </tr>
                  ) : (
                    ndTableData.map((row, i) => (
                      <tr key={`${row.name}-${i}`} style={{ backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", fontWeight: "600", color: "#1E293B" }}>
                          {row.name}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {row.violations?.map((v, j) => (
                              <span
                                key={`${v.key}-${j}`}
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  backgroundColor: "#FEE2E2",
                                  color: "#991B1B",
                                  border: "1px solid #FECACA",
                                }}
                              >
                                {formatAlertName(v.key)}: {v.value}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", textAlign: "center", fontWeight: "bold", color: "#0F172A" }}>
                          {row.total}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <p style={{ marginTop: "24px", color: "#64748B", fontSize: "13px" }}>
                Best regards,<br />
                <strong>LMDmax Delivery Management Team</strong>
              </p>
            </div>
          )}

          {/* SCORECARD EMAIL BODY */}
          {!isNetradyne && (
            <div>
              <p className="mb-2">Hi Team,</p>
              <p className="mb-4">
                {scTab === "per_metric"
                  ? `Please find below the drivers requiring focus on specific scorecard metrics for Week ${scWeekNumber || ""}.`
                  : `Please find below the overall scorecard low performers breakdown for Week ${scWeekNumber || ""}.`}
              </p>

              {/* Per Metric Table */}
              {scTab === "per_metric" && (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: "1px solid #CBD5E1",
                    marginTop: "16px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#E4F2FC" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #CBD5E1", color: "#0F172A" }}>
                        Transporter ID
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #CBD5E1", color: "#0F172A" }}>
                        Driver Name
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #CBD5E1", color: "#0F172A" }}>
                        Deficient Metrics
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scPerMetricData.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>
                          {scLoading ? "Loading scorecard data..." : "No bottom performer records found for this week."}
                        </td>
                      </tr>
                    ) : (
                      scPerMetricData.map((d, idx) => (
                        <tr key={`${d.transporter_id}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", fontFamily: "monospace", fontSize: "12px" }}>
                            {d.transporter_id}
                          </td>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", fontWeight: "600", color: "#1E293B" }}>
                            {d.name}
                          </td>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {d.poor?.values?.map((m, mi) =>
                                Object.entries(m).map(([k, v]) => (
                                  <span
                                    key={`p-${k}-${mi}`}
                                    style={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      backgroundColor: "#FEE2E2",
                                      color: "#991B1B",
                                      border: "1px solid #FECACA",
                                    }}
                                  >
                                    {k.toUpperCase()}: {v}
                                  </span>
                                ))
                              )}
                              {d.fair?.values?.map((m, mi) =>
                                Object.entries(m).map(([k, v]) => (
                                  <span
                                    key={`f-${k}-${mi}`}
                                    style={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      backgroundColor: "#FEF3C7",
                                      color: "#92400E",
                                      border: "1px solid #FDE68A",
                                    }}
                                  >
                                    {k.toUpperCase()}: {v}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Overall Low Performers Table */}
              {scTab === "overall" && (
                <div style={{ marginTop: "16px" }}>
                  {scOverallData.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>
                      {scLoading ? "Loading overall performance data..." : "No overall low performers for this week."}
                    </div>
                  ) : (
                    scOverallData.map((category, ci) => (
                      <div key={`${category.name}-${ci}`} style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#0F172A", marginBottom: "8px" }}>
                          {category.name} ({category.value})
                        </h3>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "separate",
                            borderSpacing: "0",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #CBD5E1",
                          }}
                        >
                          <thead>
                            <tr style={{ backgroundColor: "#E4F2FC" }}>
                              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #CBD5E1", color: "#0F172A" }}>
                                Metric / Violation
                              </th>
                              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "bold", borderBottom: "2px solid #CBD5E1", color: "#0F172A" }}>
                                Drivers
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.violations?.map((viol, vi) => (
                              <tr key={`${viol.name}-${vi}`} style={{ backgroundColor: vi % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                                <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0", fontWeight: "600", color: "#1E293B", width: "240px" }}>
                                  {viol.name}
                                </td>
                                <td style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0" }}>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {viol.drivers?.map((drv, di) => (
                                      <span
                                        key={`${drv.name}-${di}`}
                                        style={{
                                          display: "inline-block",
                                          padding: "2px 8px",
                                          borderRadius: "6px",
                                          fontSize: "12px",
                                          backgroundColor: "#EFF6FF",
                                          color: "#1D4ED8",
                                          border: "1px solid #BFDBFE",
                                        }}
                                      >
                                        {drv.name} ({drv.value})
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))
                  )}
                </div>
              )}

              <p style={{ marginTop: "24px", color: "#64748B", fontSize: "13px" }}>
                Best regards,<br />
                <strong>LMDmax Delivery Management Team</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation & Missing Drivers Modal */}
      {sendModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {missingDrivers.length > 0 ? "Confirm Email Dispatch" : "Confirm Send Email"}
                </h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setSendModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {missingDrivers.length > 0 ? (
                <>
                  <div className="flex items-start gap-2 text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs mb-3">
                    <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>The following drivers are not yet part of the roster system or unassigned:</span>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2.5 divide-y divide-slate-100 text-xs text-slate-700 bg-slate-50">
                    {missingDrivers.map((m, i) => (
                      <div key={i} className="py-1">
                        {m.name}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 mt-3">
                    Do you still want to proceed and send this performance email to all recipients?
                  </p>
                </>
              ) : (
                <div className="text-sm text-slate-700">
                  <p>
                    Are you sure you want to dispatch this email report to{" "}
                    <strong>{activeEmailCount} recipient(s)</strong>?
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Subject: <em>{isNetradyne ? ndSubject : scSubject}</em>
                  </p>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn-gray-secondary btn-sm"
                onClick={() => setSendModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-blue-primary btn-sm"
                onClick={handleConfirmSendEmail}
                disabled={isSending}
                style={{ color: "#FFFFFF" }}
              >
                <Send size={14} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>{isSending ? "Sending..." : "Confirm & Send"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceEmailReportingPanel;
