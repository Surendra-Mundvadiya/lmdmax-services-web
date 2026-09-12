import React from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  Paperclip,
  Building2,
  Calendar,
  User,
  AlertTriangle,
} from "lucide-react";
import { ESignatureStatus } from "../../../api/eSignatureApi";

export interface ESignatureDocumentPreviewProps {
  documentType: "acknowledgement" | "write-up" | "ack" | "writeup";
  employeeName?: string;
  reportDate?: string;
  title?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  status?: ESignatureStatus;
  incidentTypes?: string[];
  notes?: string;
  attachments?: Array<File | string>;
  refusalReason?: string;
  signatureUrl?: string | null;
  signedDate?: string | null;
  compact?: boolean;
}

export const ESignatureDocumentPreview: React.FC<ESignatureDocumentPreviewProps> = ({
  documentType,
  employeeName = "Driver Name",
  reportDate,
  title,
  companyName = "DSP Fleet Operations",
  companyLogoUrl,
  status = "sent",
  incidentTypes = [],
  notes = "",
  attachments = [],
  refusalReason,
  signatureUrl,
  signedDate,
  compact = false,
}) => {
  const isAck = documentType === "acknowledgement" || documentType === "ack";
  const displayTitle =
    title?.trim() || (isAck ? "Acknowledgement Form" : "Driver Write-Up Report");
  const displayDate = reportDate
    ? new Date(reportDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

  const getStatusBadge = () => {
    switch (status) {
      case "signed":
        return (
          <span className="esign-status-pill signed">
            <CheckCircle2 size={11} />
            Signed
          </span>
        );
      case "refused_to_sign":
        return (
          <span className="esign-status-pill refused">
            <XCircle size={11} />
            Refused To Sign
          </span>
        );
      case "draft":
        return (
          <span className="esign-status-pill draft">
            <Clock size={11} />
            Draft
          </span>
        );
      case "sent":
      default:
        return (
          <span className="esign-status-pill pending">
            <Clock size={11} />
            Pending Signature
          </span>
        );
    }
  };

  return (
    <div
      className={`esign-preview-card ${compact ? "compact" : "normal"}`}
      style={{
        backgroundColor: "var(--ads-material-thick)",
        borderRadius: "var(--ads-r-md)",
        border: "1px solid var(--ads-hairline)",
        padding: compact ? "1rem" : "1.5rem",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Header Banner */}
      <div
        className="esign-preview-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--ads-hairline)",
          paddingBottom: "1rem",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "0.4rem",
            }}
          >
            <span
              className={`esign-preview-type-pill ${isAck ? "ack" : "writeup"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.2rem 0.55rem",
                borderRadius: "var(--ads-r-pill)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                textTransform: "capitalize",
                letterSpacing: "-0.005em",
                backgroundColor: isAck ? "var(--ads-blue-tint)" : "var(--ads-purple-tint)",
                color: isAck ? "#0058B0" : "var(--ads-purple)",
                border: isAck ? "1px solid transparent" : "1px solid transparent",
              }}
            >
              {isAck ? "Acknowledgement" : "Write-Up"}
            </span>
            {getStatusBadge()}
          </div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 650,
              color: "var(--ads-ink)",
              letterSpacing: "-0.019em",
              margin: "0 0 0.25rem",
              lineHeight: 1.3,
            }}
          >
            {displayTitle}
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              color: "var(--ads-ink-tertiary)",
              fontSize: "0.75rem",
            }}
          >
            <Building2 size={13} style={{ color: "var(--ads-ink-quaternary)" }} />
            <span>{companyName}</span>
          </div>
        </div>

        {companyLogoUrl ? (
          <img
            src={companyLogoUrl}
            alt="Company Logo"
            style={{
              maxHeight: "44px",
              maxWidth: "120px",
              objectFit: "contain",
              borderRadius: "var(--ads-r-xs)",
            }}
          />
        ) : (
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "var(--ads-blue-tint)",
              border: "1px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ads-blue)",
              flexShrink: 0,
            }}
          >
            <FileCheck size={20} />
          </div>
        )}
      </div>

      {/* Recipient & Metadata Grid */}
      <div
        className="esign-preview-meta-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          backgroundColor: "rgba(0, 0, 0, 0.025)",
          padding: "0.75rem 1rem",
          borderRadius: "var(--ads-r-sm)",
          border: "1px solid var(--ads-hairline)",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--ads-blue-tint-strong)",
              color: "#0058B0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={14} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.6875rem",
                color: "var(--ads-ink-tertiary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Employee name
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--ads-ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {employeeName}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--ads-green-tint)",
              color: "var(--ads-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={14} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.6875rem",
                color: "var(--ads-ink-tertiary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Date issued
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--ads-ink)",
              }}
            >
              {displayDate}
            </div>
          </div>
        </div>
      </div>

      {/* Violation / Incident Types */}
      {incidentTypes && incidentTypes.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--ads-ink-secondary)",
              marginBottom: "0.4rem",
            }}
          >
            <AlertTriangle size={13} style={{ color: "var(--ads-amber)" }} />
            <span>Infraction & Incident Categories:</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {incidentTypes.map((type, idx) => (
              <span
                key={idx}
                style={{
                  padding: "0.25rem 0.6rem",
                  borderRadius: "var(--ads-r-xs)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  color: "var(--ads-ink-secondary)",
                  border: "1px solid var(--ads-hairline)",
                }}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes / Reason / Policy Text */}
      <div style={{ marginBottom: "1rem", flex: 1 }}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--ads-ink-secondary)",
            marginBottom: "0.4rem",
          }}
        >
          Statement & Details:
        </div>
        <div
          style={{
            padding: "0.85rem 1rem",
            backgroundColor: "rgba(0, 0, 0, 0.025)",
            borderRadius: "var(--ads-r-sm)",
            border: "1px solid var(--ads-hairline)",
            color: "var(--ads-ink-secondary)",
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            minHeight: "80px",
          }}
        >
          {notes && notes.trim() ? (
            notes.includes("<") && notes.includes(">") ? (
              <div
                dangerouslySetInnerHTML={{ __html: notes }}
                style={{ lineHeight: 1.5 }}
              />
            ) : (
              notes
            )
          ) : (
            <span style={{ color: "var(--ads-ink-quaternary)", fontStyle: "italic" }}>
              No additional notes entered for this document.
            </span>
          )}
        </div>
      </div>

      {/* Attachments Section */}
      {attachments && attachments.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--ads-ink-secondary)",
              marginBottom: "0.4rem",
            }}
          >
            <Paperclip size={13} style={{ color: "var(--ads-ink-tertiary)" }} />
            <span>Supporting Evidence & Attachments ({attachments.length}):</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {attachments.map((att, idx) => {
              const fileName =
                att instanceof File ? att.name : att.split("/").pop() || `File-${idx + 1}`;

              return (
                <div
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.35rem 0.65rem",
                    borderRadius: "var(--ads-r-xs)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.75rem",
                    color: "var(--ads-ink-secondary)",
                    boxShadow: "var(--ads-shadow-xs)",
                  }}
                >
                  <FileText size={13} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
                  <span
                    style={{
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                    }}
                    title={fileName}
                  >
                    {fileName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Refusal Section if applicable */}
      {refusalReason && (
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--ads-red-tint)",
            border: "1px solid transparent",
            borderRadius: "var(--ads-r-sm)",
            fontSize: "0.775rem",
            color: "var(--ads-red)",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
            Driver Refusal Reason:
          </div>
          <div>{refusalReason}</div>
        </div>
      )}

      {/* Digital Signature Area */}
      <div
        style={{
          paddingTop: "1rem",
          borderTop: "1px solid var(--ads-hairline)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1rem",
          marginTop: "auto",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--ads-ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            Driver acknowledgement & signature
          </div>
          {signatureUrl ? (
            <div style={{ marginTop: "0.35rem" }}>
              <img
                src={signatureUrl}
                alt="Driver Digital Signature"
                style={{
                  maxHeight: "48px",
                  maxWidth: "180px",
                  objectFit: "contain",
                  borderBottom: "1px solid var(--ads-hairline-strong)",
                }}
              />
              {signedDate && (
                <div style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", marginTop: "0.25rem" }}>
                  Signed on: {new Date(signedDate).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                marginTop: "0.4rem",
                fontSize: "0.75rem",
                color: "var(--ads-ink-quaternary)",
                fontStyle: "italic",
              }}
            >
              [ Awaiting digital signature from {employeeName} ]
            </div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--ads-ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            Status audit
          </div>
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--ads-ink)",
              textTransform: "capitalize",
              marginTop: "0.25rem",
            }}
          >
            {status.replace(/_/g, " ")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESignatureDocumentPreview;



