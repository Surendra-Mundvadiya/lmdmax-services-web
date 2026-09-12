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
        backgroundColor: "#FFFFFF",
        borderRadius: "10px",
        border: "1px solid #E2E8F0",
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
          borderBottom: "1px solid #F1F5F9",
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
                borderRadius: "4px",
                fontSize: "0.6875rem",
                fontWeight: 700,
                textTransform: "capitalize",
                letterSpacing: "0.02em",
                backgroundColor: isAck ? "#EFF6FF" : "#FAF5FF",
                color: isAck ? "#1D4ED8" : "#7E22CE",
                border: isAck ? "1px solid #BFDBFE" : "1px solid #E9D5FF",
              }}
            >
              {isAck ? "Acknowledgement" : "Write-Up"}
            </span>
            {getStatusBadge()}
          </div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.01em",
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
              color: "#64748B",
              fontSize: "0.75rem",
            }}
          >
            <Building2 size={13} style={{ color: "#94A3B8" }} />
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
              borderRadius: "6px",
            }}
          />
        ) : (
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563EB",
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
          backgroundColor: "#F8FAFC",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: "1px solid #E2E8F0",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#DBEAFE",
              color: "#1D4ED8",
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
                color: "#64748B",
                fontWeight: 600,
                textTransform: "capitalize",
                letterSpacing: "0.02em",
              }}
            >
              Employee name
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#0F172A",
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
              backgroundColor: "#D1FAE5",
              color: "#047857",
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
                color: "#64748B",
                fontWeight: 600,
                textTransform: "capitalize",
                letterSpacing: "0.02em",
              }}
            >
              Date issued
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#0F172A",
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
              fontWeight: 700,
              color: "#334155",
              marginBottom: "0.4rem",
            }}
          >
            <AlertTriangle size={13} style={{ color: "#F59E0B" }} />
            <span>Infraction & Incident Categories:</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {incidentTypes.map((type, idx) => (
              <span
                key={idx}
                style={{
                  padding: "0.25rem 0.6rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  backgroundColor: "#F1F5F9",
                  color: "#334155",
                  border: "1px solid #E2E8F0",
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
            fontWeight: 700,
            color: "#334155",
            marginBottom: "0.4rem",
          }}
        >
          Statement & Details:
        </div>
        <div
          style={{
            padding: "0.85rem 1rem",
            backgroundColor: "#FAFAFA",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            color: "#334155",
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
            <span style={{ color: "#94A3B8", fontStyle: "italic" }}>
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
              fontWeight: 700,
              color: "#334155",
              marginBottom: "0.4rem",
            }}
          >
            <Paperclip size={13} style={{ color: "#64748B" }} />
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
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.75rem",
                    color: "#334155",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  <FileText size={13} style={{ color: "#2563EB", flexShrink: 0 }} />
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
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "8px",
            fontSize: "0.775rem",
            color: "#991B1B",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
            Driver Refusal Reason:
          </div>
          <div>{refusalReason}</div>
        </div>
      )}

      {/* Digital Signature Area */}
      <div
        style={{
          paddingTop: "1rem",
          borderTop: "1px solid #F1F5F9",
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
              color: "#64748B",
              textTransform: "capitalize",
              letterSpacing: "0.02em",
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
                  borderBottom: "1px solid #94A3B8",
                }}
              />
              {signedDate && (
                <div style={{ fontSize: "0.6875rem", color: "#64748B", marginTop: "0.25rem" }}>
                  Signed on: {new Date(signedDate).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                marginTop: "0.4rem",
                fontSize: "0.75rem",
                color: "#94A3B8",
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
              color: "#64748B",
              textTransform: "capitalize",
              letterSpacing: "0.02em",
              fontWeight: 600,
            }}
          >
            Status audit
          </div>
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#334155",
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



