import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileCheck,
  Plus,
  Search,
  RefreshCw,
  Download,
  Send,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
  MessageSquare,
  Mail,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import GlassAppLayout from "../../layout/GlassAppLayout";
import { AppDateNavigator } from "../../common/AppDateNavigator";
import { useAuthStore } from "../../../store/authStore";
import {
  ESignatureApi,
  ESignatureReportItem,
  ESignatureRemainderConfig,
} from "../../../api/eSignatureApi";
import ESignatureSendFormModal from "./ESignatureSendFormModal";
import ESignatureDocumentPreview from "./ESignatureDocumentPreview";
import "./esignature.css";

export const ESignatureView: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, stations } = useAuthStore();
  const currentStation = stations?.find((s) => s.current) || stations?.[0];
  const activeStation = currentStation?.station_code || "";

  // Active Tab: "acknowledgement" | "writeup" | "drafts" | "all"
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"acknowledgement" | "writeup" | "drafts" | "all">(
    urlTab === "writeup" || urlTab === "write-up"
      ? "writeup"
      : urlTab === "drafts"
      ? "drafts"
      : urlTab === "all"
      ? "all"
      : "acknowledgement"
  );

  // Selected Date
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [dateFilterMode, setDateFilterMode] = useState<"all" | "single">("all");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Data State
  const [reports, setReports] = useState<ESignatureReportItem[]>([]);
  const [remainderConfig, setRemainderConfig] = useState<ESignatureRemainderConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(
    () => searchParams.get("action") === "send"
  );
  const [previewTarget, setPreviewTarget] = useState<ESignatureReportItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ESignatureReportItem | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    if (urlTab === "writeup" || urlTab === "write-up") setActiveTab("writeup");
    else if (urlTab === "drafts") setActiveTab("drafts");
    else if (urlTab === "all") setActiveTab("all");
    else if (urlTab === "acknowledgement") setActiveTab("acknowledgement");
  }, [urlTab]);

  const handleTabChange = (tab: "acknowledgement" | "writeup" | "drafts" | "all") => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        prev.set("tab", tab);
        return prev;
      },
      { replace: true }
    );
  };

  // Fetch Reports from real microservice
  const fetchReportsData = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const params: any = {};
      if (dateFilterMode === "single" && selectedDate) {
        params.start = selectedDate;
        params.end = selectedDate;
      }
      if (activeStation) {
        params.station_id = activeStation;
      }

      const [data, remainder] = await Promise.all([
        ESignatureApi.getReports(params),
        ESignatureApi.getRemainder(),
      ]);

      setReports(data);
      if (remainder) setRemainderConfig(remainder);
    } catch (err: any) {
      console.error("[ESignature Fetch Error]", err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || "Failed to load live E-Signature records."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFilterMode, selectedDate, activeStation]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Toast auto-hide
  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successToast]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const type = (item.report_type || "").toLowerCase();
      const isAck = type === "ack" || type === "acknowledgement";
      const isWriteup = type === "write-up" || type === "writeup";
      const isDraft = item.status === "draft";

      if (activeTab === "drafts") {
        if (!isDraft) return false;
      } else if (activeTab === "acknowledgement") {
        if (!isAck || isDraft) return false;
      } else if (activeTab === "writeup") {
        if (!isWriteup || isDraft) return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const driverName = (item.driver_name || "").toLowerCase();
        const titleText = (item.title || "").toLowerCase();
        const violationsText = (item.violation || []).join(" ").toLowerCase();
        const notesText = (item.notes || "").toLowerCase();
        if (
          !driverName.includes(q) &&
          !titleText.includes(q) &&
          !violationsText.includes(q) &&
          !notesText.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [reports, activeTab, statusFilter, searchQuery]);

  // Metrics counts
  const stats = useMemo(() => {
    let pending = 0;
    let signed = 0;
    let refused = 0;
    let drafts = 0;

    reports.forEach((r) => {
      if (r.status === "sent") pending++;
      else if (r.status === "signed") signed++;
      else if (r.status === "refused_to_sign") refused++;
      else if (r.status === "draft") drafts++;
    });

    return { total: reports.length, pending, signed, refused, drafts };
  }, [reports]);

  // Actions
  const handleResend = async (report: ESignatureReportItem) => {
    setResendingId(report._id);
    try {
      const defaultChannels =
        report.channels && report.channels.length > 0 ? report.channels : ["sms", "inapp"];
      await ESignatureApi.resendReport({
        _id: report._id,
        channels: defaultChannels as any,
      });
      setSuccessToast(`Notification resent successfully to ${report.driver_name}`);
      await fetchReportsData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to resend notification.");
    } finally {
      setResendingId(null);
    }
  };

  const handleDownload = async (report: ESignatureReportItem) => {
    setDownloadingId(report._id);
    try {
      const blob = await ESignatureApi.downloadReportPdf(report._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.report_type}_${(report.driver_name || "report").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to download PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget._id);
    try {
      await ESignatureApi.deleteReport(deleteTarget._id);
      setSuccessToast("E-Signature document record removed successfully.");
      setDeleteTarget(null);
      await fetchReportsData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete record.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isSendModalOpen) {
    return (
      <GlassAppLayout currentRoute="e_signature" activeBreadcrumb={{ section: "Utilities", page: "E-signature" }}>
        <div className="esign-page-shell" style={{ width: "100%", height: "100%", overflowY: "auto" }}>
          <div className="operations-main-content scrollable">
            <ESignatureSendFormModal
              isOpen={true}
              embedded={true}
              onClose={() => setIsSendModalOpen(false)}
              onSuccess={() => {
                setIsSendModalOpen(false);
                setSuccessToast("E-Signature document dispatched successfully!");
                fetchReportsData();
              }}
              initialDocumentType={activeTab === "writeup" ? "write-up" : "acknowledgement"}
            />
          </div>
        </div>
      </GlassAppLayout>
    );
  }

  return (
    <GlassAppLayout currentRoute="e_signature" activeBreadcrumb={{ section: "Utilities", page: "E-signature" }}>
      <div className="esign-page-shell" style={{ width: "100%", height: "100%", overflowY: "auto" }}>
        {/* Main Container */}
        <main className="esign-main-container">
        <div className="esign-card-container">
          {/* 1. Top Header */}
          <div className="esign-top-header">
            <div className="esign-header-left">
              <div className="esign-header-icon-wrap">
                <FileCheck size={22} />
              </div>
              <div className="esign-header-text">
                <div className="esign-title-row">
                  <h1 className="esign-title">E-Signature Hub</h1>
                  {activeStation && (
                    <span className="esign-station-badge">Station: {activeStation}</span>
                  )}
                </div>
                <p className="esign-subtitle">
                  Digital policy sign-offs, driver write-ups, infraction notices, and verifiable signature audit trails
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="esign-header-actions">
              <button
                type="button"
                onClick={fetchReportsData}
                disabled={isRefreshing}
                className="esign-btn-secondary"
                title="Refresh live reports"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSendModalOpen(true)}
                className="esign-btn-primary"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Send Form</span>
              </button>
            </div>
          </div>

          {/* 2. Stats Bar */}
          <div className="esign-stats-grid">
            <div className="esign-stat-card">
              <span className="esign-stat-label">Total Records</span>
              <span className="esign-stat-value">{stats.total}</span>
            </div>
            <div className="esign-stat-card blue">
              <span className="esign-stat-label">Pending Signature</span>
              <span className="esign-stat-value">{stats.pending}</span>
            </div>
            <div className="esign-stat-card emerald">
              <span className="esign-stat-label">Signed</span>
              <span className="esign-stat-value">{stats.signed}</span>
            </div>
            <div className="esign-stat-card red">
              <span className="esign-stat-label">Refused</span>
              <span className="esign-stat-value">{stats.refused}</span>
            </div>
          </div>

          {/* Notification Toast */}
          {successToast && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.6rem 1.25rem",
                backgroundColor: "#ECFDF5",
                borderBottom: "1px solid #A7F3D0",
                color: "#065F46",
                fontSize: "0.775rem",
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} style={{ color: "#10B981" }} />
                <span>{successToast}</span>
              </div>
              <button
                onClick={() => setSuccessToast(null)}
                style={{ background: "none", border: "none", color: "#065F46", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* 3. Toolbar: Tabs, Search, Status & Date Navigator */}
          <div className="esign-toolbar">
            {/* Tabs */}
            <div className="esign-tabs-wrap">
              <button
                type="button"
                onClick={() => handleTabChange("acknowledgement")}
                className={`esign-tab-btn ${activeTab === "acknowledgement" ? "active" : ""}`}
              >
                Acknowledgement
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("writeup")}
                className={`esign-tab-btn ${activeTab === "writeup" ? "active" : ""}`}
              >
                Write-Up
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("drafts")}
                className={`esign-tab-btn ${activeTab === "drafts" ? "active" : ""}`}
              >
                <span>Drafts</span>
                {stats.drafts > 0 && <span className="esign-tab-pill">{stats.drafts}</span>}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("all")}
                className={`esign-tab-btn ${activeTab === "all" ? "active" : ""}`}
              >
                All Records
              </button>
            </div>

            {/* Right Controls */}
            <div className="esign-toolbar-right">
              {/* Search */}
              <div className="esign-search-box">
                <Search size={13} className="esign-search-icon" />
                <input
                  type="text"
                  placeholder="Search driver, violation…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="esign-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="esign-search-clear"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="esign-select"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Pending Signature</option>
                <option value="signed">Signed</option>
                <option value="refused_to_sign">Refused</option>
                <option value="draft">Draft</option>
              </select>

              {/* Date Navigator */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <AppDateNavigator
                  selectedDate={selectedDate}
                  onChange={(newDate) => {
                    setSelectedDate(newDate);
                    setDateFilterMode("single");
                  }}
                  size="sm"
                />
                {dateFilterMode === "single" && (
                  <button
                    type="button"
                    onClick={() => setDateFilterMode("all")}
                    className="esign-btn-secondary"
                    style={{ padding: "0.25rem 0.55rem", fontSize: "0.725rem", height: "30px" }}
                    title="Clear date filter"
                  >
                    All Dates
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Data Table Area */}
          <div className="esign-table-wrapper">
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4rem 1.5rem",
                  color: "#64748B",
                  gap: "0.5rem",
                }}
              >
                <Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} />
                <span style={{ fontSize: "0.8125rem" }}>Loading live E-Signature records…</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4rem 1.5rem",
                  textAlign: "center",
                  color: "#64748B",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileCheck size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0F172A" }}>
                    No E-Signature documents found
                  </h3>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.775rem", color: "#64748B" }}>
                    {searchQuery
                      ? `No documents match "${searchQuery}"`
                      : "Dispatch a new digital acknowledgement or write-up form using the button below"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(true)}
                  className="esign-btn-primary"
                  style={{ marginTop: "0.25rem" }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Send New Form</span>
                </button>
              </div>
            ) : (
              <table className="esign-table">
                <thead>
                  <tr>
                    <th className="esign-th">Driver Name</th>
                    <th className="esign-th">Type</th>
                    <th className="esign-th">Violations / Categories</th>
                    <th className="esign-th">Date Dispatched</th>
                    <th className="esign-th">Channels</th>
                    <th className="esign-th">Status</th>
                    <th className="esign-th" style={{ textAlign: "right", paddingRight: "1.25rem" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const isAck = (report.report_type || "").toLowerCase().includes("ack");
                    const dateStr = report.report_date
                      ? new Date(report.report_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—";

                    return (
                      <tr key={report._id} className="esign-tr">
                        {/* Driver */}
                        <td className="esign-td">
                          <div className="esign-driver-cell">
                            <span className="esign-driver-name">
                              {report.driver_name || "Driver"}
                            </span>
                            {report.driver_id && (
                              <span className="esign-driver-sub">ID: {report.driver_id}</span>
                            )}
                          </div>
                        </td>

                        {/* Document Type */}
                        <td className="esign-td">
                          <span className={`esign-type-tag ${isAck ? "ack" : "writeup"}`}>
                            {isAck ? "Acknowledgement" : "Write-Up"}
                          </span>
                        </td>

                        {/* Violations */}
                        <td className="esign-td" style={{ maxWidth: 280 }}>
                          {report.violation && report.violation.length > 0 ? (
                            <div className="esign-chips-wrap">
                              {report.violation.map((v, i) => (
                                <span key={i} className="esign-chip" title={v}>
                                  {v}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "#94A3B8", fontStyle: "italic", fontSize: "0.75rem" }}>
                              General Notice
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="esign-td" style={{ color: "#475569", fontWeight: 500 }}>
                          {dateStr}
                        </td>

                        {/* Channels */}
                        <td className="esign-td">
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            {report.channels?.includes("inapp") && (
                              <span title="In-App Chat alert sent">
                                <Smartphone size={14} style={{ color: "#2563EB" }} />
                              </span>
                            )}
                            {report.channels?.includes("sms") && (
                              <span title="SMS Message sent">
                                <MessageSquare size={14} style={{ color: "#059669" }} />
                              </span>
                            )}
                            {report.channels?.includes("email") && (
                              <span title="Email notification sent">
                                <Mail size={14} style={{ color: "#7C3AED" }} />
                              </span>
                            )}
                            {(!report.channels || report.channels.length === 0) && (
                              <span style={{ color: "#94A3B8", fontSize: "0.75rem" }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="esign-td">
                          {report.status === "signed" ? (
                            <span className="esign-status-pill signed">
                              <CheckCircle2 size={11} />
                              Signed
                            </span>
                          ) : report.status === "refused_to_sign" ? (
                            <span className="esign-status-pill refused">
                              <XCircle size={11} />
                              Refused
                            </span>
                          ) : report.status === "draft" ? (
                            <span className="esign-status-pill draft">
                              <Clock size={11} />
                              Draft
                            </span>
                          ) : (
                            <span className="esign-status-pill pending">
                              <Clock size={11} />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="esign-td" style={{ textAlign: "right", paddingRight: "1.25rem" }}>
                          <div className="esign-actions-cell">
                            {/* View Document */}
                            <button
                              type="button"
                              onClick={() => setPreviewTarget(report)}
                              className="esign-icon-btn"
                              title="View Document Details & Signatures"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Resend Link if pending */}
                            {report.status === "sent" && (
                              <button
                                type="button"
                                onClick={() => handleResend(report)}
                                disabled={resendingId === report._id}
                                className="esign-icon-btn"
                                title="Resend digital sign-off notification"
                              >
                                {resendingId === report._id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Send size={14} style={{ color: "#059669" }} />
                                )}
                              </button>
                            )}

                            {/* Download PDF */}
                            <button
                              type="button"
                              onClick={() => handleDownload(report)}
                              disabled={downloadingId === report._id}
                              className="esign-icon-btn"
                              title="Download PDF"
                            >
                              {downloadingId === report._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(report)}
                              className="esign-icon-btn danger"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ── Modal: Send E-Signature Form ── */}
      <ESignatureSendFormModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={() => {
          setSuccessToast("E-Signature document dispatched successfully!");
          fetchReportsData();
        }}
        initialDocumentType={activeTab === "writeup" ? "write-up" : "acknowledgement"}
      />

      {/* ── Modal: View Document Details ── */}
      {previewTarget && (
        <div className="esign-modal-backdrop" onClick={() => setPreviewTarget(null)}>
          <div className="esign-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="esign-modal-header">
              <div className="esign-modal-title-wrap">
                <div className="esign-header-icon-wrap" style={{ width: 32, height: 32 }}>
                  <FileCheck size={18} />
                </div>
                <div>
                  <h3 className="esign-modal-title">
                    {previewTarget.title || previewTarget.driver_name}
                  </h3>
                  <p className="esign-modal-subtitle">
                    Dispatched on {new Date(previewTarget.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="esign-icon-btn"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="esign-modal-body">
              <ESignatureDocumentPreview
                documentType={previewTarget.report_type as any}
                employeeName={previewTarget.driver_name}
                reportDate={previewTarget.report_date}
                title={previewTarget.title}
                companyName={user?.company?.company_name || "DSP Fleet Operations"}
                companyLogoUrl={previewTarget.company_logo_url || user?.company?.company_logo_url}
                status={previewTarget.status}
                incidentTypes={previewTarget.violation}
                notes={previewTarget.notes}
                attachments={previewTarget.attachments}
                refusalReason={previewTarget.refused_reason}
                signatureUrl={previewTarget.driver_sign_url}
                signedDate={previewTarget.driver_sign_date}
              />
            </div>

            <div className="esign-modal-footer">
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Status: <strong style={{ color: "#0F172A", textTransform: "capitalize" }}>{previewTarget.status.replace(/_/g, " ")}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => handleDownload(previewTarget)}
                  className="esign-btn-secondary"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTarget(null)}
                  className="esign-btn-primary"
                >
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ── */}
      {deleteTarget && (
        <div className="esign-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="esign-modal-dialog"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "1.4rem" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#FEF2F2",
                  color: "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.85rem",
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>
                Delete E-Signature Document?
              </h3>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.775rem", color: "#64748B", lineHeight: 1.4 }}>
                Are you sure you want to permanently delete this document for{" "}
                <strong style={{ color: "#0F172A" }}>{deleteTarget.driver_name}</strong>? This action cannot be undone.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "1.25rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deletingId !== null}
                  className="esign-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deletingId !== null}
                  style={{
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.45rem 1rem",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {deletingId ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </GlassAppLayout>
  );
};

export default ESignatureView;
