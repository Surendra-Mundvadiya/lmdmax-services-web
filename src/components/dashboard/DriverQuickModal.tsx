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
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 className="uop-modal-title">{driver.name}</h3>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
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
              color: "#94A3B8",
              padding: 4,
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
              borderRadius: "8px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Award size={18} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B" }}>
                Tier Rating
              </span>
            </div>
            <span
              style={{
                padding: "0.25rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.775rem",
                fontWeight: 800,
                backgroundColor: "#EFF6FF",
                color: "#1D4ED8",
                border: "1px solid #BFDBFE",
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
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ fontSize: "0.6875rem", color: "#64748B", fontWeight: 600 }}>
                OVERALL SCORE
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                {driver.score || 98.5}
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ fontSize: "0.6875rem", color: "#64748B", fontWeight: 600 }}>
                DELIVERED PACKAGES
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2563EB", marginTop: 2 }}>
                {driver.deliveredCount || 245}
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ fontSize: "0.6875rem", color: "#64748B", fontWeight: 600 }}>
                DCR COMPLETION
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#059669", marginTop: 2 }}>
                {driver.dcr || "99.8%"}
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ fontSize: "0.6875rem", color: "#64748B", fontWeight: 600 }}>
                SAFETY SCORE
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#7C3AED", marginTop: 2 }}>
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
              padding: "0.45rem 0.85rem",
              borderRadius: "7px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#334155",
              fontSize: "0.775rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
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
              padding: "0.45rem 0.85rem",
              borderRadius: "7px",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              fontSize: "0.775rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>View Full Roster Profile</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
