import React, { FC, useState, useRef, useEffect } from "react";
import { Download, Loader2, ChevronDown, FileText } from "lucide-react";
import { axiosInstance, getClientTimeZone } from "../../../api/axiosClient";

interface DownloadReportButtonProps {
  id: string;
  type: "accident" | "injury";
  date?: string | null;
  time?: string | null;
  variant?: "icon" | "button";
  label?: string;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export const DownloadReportButton: FC<DownloadReportButtonProps> = ({
  id,
  type,
  date,
  time,
  variant = "icon",
  label = "Download",
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  const executeDownload = async (formatQuery: string = "") => {
    setLoading(true);
    setDropdownOpen(false);
    try {
      const tz = getClientTimeZone();
      let url: string;
      let defaultFileName: string;

      if (type === "accident") {
        const timeStr = time || (date ? new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "12:00 PM");
        url = `/incident_report_form/v1/incident_report/${id}?time=${encodeURIComponent(timeStr)}&timezone=${encodeURIComponent(tz)}${formatQuery}`;
        defaultFileName = formatQuery.includes("incident_report")
          ? `Accident_Report_${id}.pdf`
          : `DA_Incident_Report_${id}.pdf`;
      } else {
        url = `/injury_report/v1/download_injury_report/${id}`;
        defaultFileName = `Injury_Report_${id}.docx`;
      }

      const response = await axiosInstance.get(url, {
        responseType: "arraybuffer",
      });

      const contentType =
        type === "accident"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", defaultFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to download report document.";
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === "accident") {
      setDropdownOpen(!dropdownOpen);
    } else {
      executeDownload();
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          title={type === "accident" ? "Download Accident Report (PDF)" : "Download Injury Report (.docx)"}
          aria-label={type === "accident" ? "Download accident report" : "Download injury report"}
          style={{
            width: 30,
            height: 30,
            borderRadius: "var(--ads-r-sm)",
            border: "1px solid var(--ads-hairline)",
            backgroundColor: "transparent",
            color: "var(--ads-blue)",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all var(--ads-dur-fast) var(--ads-ease)",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {loading ? (
            <Loader2
              size={13}
              style={{ animation: "spin 0.8s linear infinite", color: "var(--ads-blue)" }}
            />
          ) : (
            <Download size={14} />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          style={{
            padding: "9px 18px",
            borderRadius: "var(--ads-r-pill)",
            border: "1px solid var(--ads-hairline)",
            backgroundColor: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-sm)",
            WebkitBackdropFilter: "var(--ads-blur-sm)",
            boxShadow: "var(--ads-bevel)",
            color: "var(--ads-ink)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            cursor: loading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--ads-s2)",
            transition: "all var(--ads-dur-fast) var(--ads-ease)",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "var(--ads-white)";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "var(--ads-material-thick)";
          }}
        >
          {loading ? (
            <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
          ) : (
            <Download size={14} />
          )}
          <span>{loading ? "Downloading…" : label}</span>
          {type === "accident" && <ChevronDown size={12} />}
        </button>
      )}

      {/* Popover for Accident Formats */}
      {dropdownOpen && type === "accident" && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + var(--ads-s1))",
            backgroundColor: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            borderRadius: "var(--ads-r-md)",
            boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
            border: "1px solid var(--ads-hairline)",
            zIndex: 99999,
            minWidth: "200px",
            overflow: "hidden",
            padding: "var(--ads-s1) 0",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => executeDownload("&format=incident_report")}
            style={{
              width: "100%",
              padding: "0.6rem 0.9rem",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--ads-ink)",
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
              transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <FileText size={14} color="var(--ads-blue)" />
            <span>Accident Report (Standard)</span>
          </button>
          <button
            type="button"
            onClick={() => executeDownload("")}
            style={{
              width: "100%",
              padding: "0.6rem 0.9rem",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--ads-ink)",
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
              borderTop: "1px solid var(--ads-hairline)",
              transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <FileText size={14} color="var(--ads-green)" />
            <span>DA Incident Report (Detailed)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadReportButton;
