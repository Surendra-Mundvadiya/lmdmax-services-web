import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Award,
  ShieldCheck,
  Package,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { DriverSummary } from "../../api/unifiedDashboardApi";

interface Props {
  driver: DriverSummary | null;
  onClose: () => void;
}

export const DriverQuickModal: FC<Props> = ({ driver, onClose }) => {
  const navigate = useNavigate();
  if (!driver) return null;

  return (
    <div className="uop-modal-backdrop" onClick={onClose}>
      <div className="uop-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="uop-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 className="uop-modal-title">{driver.name}</h3>
              <div style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                Transporter ID: {driver.transporterId || `TID-${driver.id || "8821"}`} · Rank #{driver.rank || 1}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ads-ink-tertiary)",
              padding: 4,
              borderRadius: "var(--ads-r-pill)",
              transition: "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="uop-modal-body">
          {/* Standing Tier Banner */}
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--ads-r-md)",
              backgroundColor: "var(--uop-wash)",
              border: "1px solid var(--ads-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Award size={18} style={{ color: "var(--ads-blue)" }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                Tier Rating
              </span>
            </div>
            <span
              style={{
                padding: "0.28rem 0.7rem",
                borderRadius: "var(--ads-r-pill)",
                fontSize: "0.775rem",
                fontWeight: 600,
                backgroundColor: "var(--ads-blue-tint)",
                color: "#0058B0",
                border: "1px solid transparent",
              }}
            >
              {driver.tier || "Fantastic"}
            </span>
          </div>

          {/* Key Metric Gauges */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--ads-r-md)",
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
              }}
            >
              <div style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", fontWeight: 600, letterSpacing: "0.06em" }}>
                OVERALL SCORE
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.022em", color: "var(--ads-ink)", marginTop: 2 }}>
                {driver.score || 98.5}
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--ads-r-md)",
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
              }}
            >
              <div style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", fontWeight: 600, letterSpacing: "0.06em" }}>
                DELIVERED PACKAGES
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.022em", color: "var(--ads-blue)", marginTop: 2 }}>
                {driver.deliveredCount || 245}
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--ads-r-md)",
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
              }}
            >
              <div style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", fontWeight: 600, letterSpacing: "0.06em" }}>
                DCR COMPLETION
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.022em", color: "var(--ads-green)", marginTop: 2 }}>
                {driver.dcr || "99.8%"}
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--ads-r-md)",
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
              }}
            >
              <div style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", fontWeight: 600, letterSpacing: "0.06em" }}>
                SAFETY SCORE
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.022em", color: "var(--ads-purple)", marginTop: 2 }}>
                {driver.safetyScore || 850}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="uop-modal-footer">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/performance/e-signature");
            }}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid var(--ads-hairline)",
              background: "var(--ads-material-thick)",
              boxShadow: "var(--ads-bevel)",
              color: "var(--ads-ink)",
              fontSize: "0.775rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <FileCheck size={14} />
            <span>Send E-Signature</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/operations?tab=drivers");
            }}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--ads-r-pill)",
              backgroundColor: "var(--ads-blue)",
              color: "#FFFFFF",
              border: "1px solid transparent",
              boxShadow: "0 1px 3px rgba(0, 113, 227, 0.24)",
              fontSize: "0.775rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "background-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <span style={{ color: "#FFFFFF" }}>View Full Roster Profile</span>
            <ExternalLink size={14} color="#FFFFFF" style={{ color: "#FFFFFF" }} />
          </button>
        </div>
      </div>
    </div>
  );
};
