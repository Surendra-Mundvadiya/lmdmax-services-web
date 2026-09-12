import React, { FC, useState } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { ReportsApi } from "../../../api/reportsApi";
import { useAuthStore } from "../../../store/authStore";

interface ScorecardExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractionSuccess?: () => void;
  defaultReportType?: "weekly" | "daily";
  currentWeekNumber?: number | string;
  currentDate?: string;
}

export const ScorecardExtractionModal: FC<ScorecardExtractionModalProps> = ({
  isOpen,
  onClose,
  onExtractionSuccess,
  defaultReportType = "weekly",
  currentWeekNumber,
  currentDate,
}) => {
  const { user } = useAuthStore();
  const [reportType, setReportType] = useState<"weekly" | "daily">(defaultReportType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [weekNumber, setWeekNumber] = useState<string>(
    currentWeekNumber ? String(currentWeekNumber) : "202636"
  );
  const [dateStr, setDateStr] = useState<string>(
    currentDate || new Date().toISOString().split("T")[0]
  );
  const [reportName, setReportName] = useState<string>(
    reportType === "weekly" ? "scorecard_report" : "daily_driver_scorecard"
  );
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFeedback(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: "error", message: "Please select a scorecard or report file to extract." });
      return;
    }

    setIsExtracting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("report_name", reportName);
      formData.append("company", String(user?.company?.id || user?.company_id || "1"));
      formData.append("replace", String(replaceExisting));

      if (reportType === "weekly") {
        formData.append("week_number", weekNumber);
      } else {
        formData.append("date", dateStr);
      }

      const res = await ReportsApi.uploadAndExtractReport(formData, reportType);

      if (res?.status_code === 200 || res?.status === 200 || res?.success) {
        setFeedback({
          type: "success",
          message: res?.message || "Scorecard report extracted successfully! Data is now updated in live tables.",
        });
        setTimeout(() => {
          onExtractionSuccess?.();
          onClose();
        }, 1500);
      } else {
        setFeedback({
          type: "error",
          message: res?.message || res?.detail || "Extraction completed with notes. Check report tables.",
        });
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Extraction error occurred. Ensure the file format matches standard scorecard schema.";
      setFeedback({ type: "error", message: errMsg });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            backgroundColor: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>
                Scorecard Extraction
              </h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>
                Upload & extract live data into performance reports
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#64748B",
              padding: "0.25rem",
              borderRadius: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Report Cadence Selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
              Report Cadence
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  setReportType("weekly");
                  setReportName("scorecard_report");
                }}
                style={{
                  padding: "0.5rem",
                  borderRadius: "6px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  border: reportType === "weekly" ? "2px solid #2563EB" : "1px solid #CBD5E1",
                  backgroundColor: reportType === "weekly" ? "#EFF6FF" : "#FFFFFF",
                  color: reportType === "weekly" ? "#1D4ED8" : "#475569",
                  cursor: "pointer",
                }}
              >
                Weekly Scorecard
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportType("daily");
                  setReportName("daily_driver_scorecard");
                }}
                style={{
                  padding: "0.5rem",
                  borderRadius: "6px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  border: reportType === "daily" ? "2px solid #2563EB" : "1px solid #CBD5E1",
                  backgroundColor: reportType === "daily" ? "#EFF6FF" : "#FFFFFF",
                  color: reportType === "daily" ? "#1D4ED8" : "#475569",
                  cursor: "pointer",
                }}
              >
                Daily Report
              </button>
            </div>
          </div>

          {/* Week or Date Input */}
          {reportType === "weekly" ? (
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Week Number (Format: YYYYWW, e.g. 202636)
              </label>
              <input
                type="text"
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                placeholder="202636"
                required
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.8125rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Report Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.8125rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* File Dropzone */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
              Upload Report File (.pdf, .xlsx, .csv)
            </label>
            <div
              style={{
                border: "2px dashed #CBD5E1",
                borderRadius: "8px",
                padding: "1.25rem 1rem",
                textAlign: "center",
                backgroundColor: "#F8FAFC",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onClick={() => document.getElementById("scorecard-file-input")?.click()}
            >
              <input
                id="scorecard-file-input"
                type="file"
                accept=".pdf,.xlsx,.csv"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              {selectedFile ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#2563EB" }}>
                  <FileText size={20} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
                  <UploadCloud size={28} style={{ color: "#94A3B8" }} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#2563EB" }}>
                    Click to browse or drop file here
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
                    Supports Amazon Scorecard PDFs, Netradyne CSVs, DVIC, and POD reports
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Replace Checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              id="replace-data-checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              style={{ cursor: "pointer", accentColor: "#2563EB" }}
            />
            <label htmlFor="replace-data-checkbox" style={{ fontSize: "0.75rem", color: "#475569", cursor: "pointer" }}>
              Replace existing records if data for this period is already extracted
            </label>
          </div>

          {/* Feedback Messages */}
          {feedback && (
            <div
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.75rem",
                backgroundColor: feedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
                color: feedback.type === "success" ? "#065F46" : "#991B1B",
                border: `1px solid ${feedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              }}
            >
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isExtracting}
              style={{
                padding: "0.5rem 0.85rem",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#475569",
                cursor: isExtracting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExtracting || !selectedFile}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1.1rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: isExtracting || !selectedFile ? "#94A3B8" : "#2563EB",
                fontSize: "0.8125rem",
                fontWeight: 650,
                color: "#FFFFFF",
                cursor: isExtracting || !selectedFile ? "not-allowed" : "pointer",
                transition: "background-color 0.15s",
              }}
            >
              {isExtracting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>Extract Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
