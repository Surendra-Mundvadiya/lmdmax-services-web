import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  Zap,
  Clock,
  AlertCircle,
  XCircle,
  PlusCircle,
} from "lucide-react";
import { ShiftsSummary } from "../../api/unifiedDashboardApi";

interface Props {
  shifts?: ShiftsSummary;
  isLoading?: boolean;
}

export const ShiftPipelineCard: FC<Props> = ({ shifts, isLoading }) => {
  const navigate = useNavigate();

  // Multi-status dummy fallback data accommodating Accepted, Auto-Accepted, Extra Shift, Pending, Open, Declined
  const total = shifts?.total || 0;
  const accepted = shifts?.accepted || 0;
  const autoAccepted = shifts?.autoAccepted || 0;
  const extraShift = 0;
  const pending = shifts?.pending || 0;
  const open = shifts?.open || 0;
  const declined = 0;

  const statuses = [
    {
      key: "accepted",
      label: "Accepted",
      count: accepted,
      color: "var(--ads-green)",
      bg: "var(--ads-green-tint)",
      accent: "var(--ads-green)",
      icon: CheckCircle2,
      pct: total > 0 ? Math.round((accepted / total) * 100) : 0,
    },
    {
      key: "auto_accepted",
      label: "Auto-Accepted",
      count: autoAccepted,
      color: "var(--uop-teal)",
      bg: "var(--uop-teal-tint)",
      accent: "var(--uop-teal)",
      icon: Zap,
      pct: total > 0 ? Math.round((autoAccepted / total) * 100) : 0,
    },
    {
      key: "extra_shift",
      label: "Extra Shift",
      count: extraShift,
      color: "var(--ads-purple)",
      bg: "var(--ads-purple-tint)",
      accent: "var(--ads-purple)",
      icon: PlusCircle,
      pct: total > 0 ? Math.round((extraShift / total) * 100) : 0,
    },
    {
      key: "pending",
      label: "Pending",
      count: pending,
      color: "var(--ads-amber)",
      bg: "var(--ads-amber-tint)",
      accent: "var(--ads-amber)",
      icon: Clock,
      pct: total > 0 ? Math.round((pending / total) * 100) : 0,
    },
    {
      key: "open",
      label: "Open Shifts",
      count: open,
      color: "#0058B0",
      bg: "var(--ads-blue-tint)",
      accent: "var(--ads-blue)",
      icon: AlertCircle,
      pct: total > 0 ? Math.round((open / total) * 100) : 0,
    },
    {
      key: "declined",
      label: "Declined",
      count: declined,
      color: "var(--ads-red)",
      bg: "var(--ads-red-tint)",
      accent: "var(--ads-red)",
      icon: XCircle,
      pct: total > 0 ? Math.round((declined / total) * 100) : 0,
    },
  ];

  const handleTileClick = (statusKey: string) => {
    navigate(`/scheduler/shifts?status=${statusKey}`);
  };

  const confirmedRate = total > 0 ? Math.round(((accepted + autoAccepted + extraShift) / total) * 100) : 0;

  return (
    <div className="uop-card uop-shift-pipeline-card">
      {/* Header with h5 overline, h3 title, and p description */}
      <div className="uop-card-header" style={{ marginBottom: "0.4rem" }}>
        <div>
          <h5 className="uop-card-badge">Operations Dispatch</h5>
          <h3 className="uop-card-title-lg">
            <span>Shift Pipeline</span>
          </h3>
        </div>
        <div className="uop-card-icon blue">
          <CalendarDays size={18} />
        </div>
      </div>

      <p className="uop-card-desc">
        Real-time shift coverage, driver acceptance, and schedule pipeline status.
      </p>

      {/* Top Shift Coverage Distribution Header (Total shift number removed) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.005em", color: "var(--ads-ink-secondary)" }}>
          Shift Coverage Distribution
        </span>

        <small
          style={{
            fontSize: "var(--text-caption)",
            fontWeight: 600,
            lineHeight: "var(--line-height-caption)",
            padding: "0.22rem 0.65rem",
            borderRadius: "var(--ads-r-pill)",
            backgroundColor: "var(--ads-green-tint)",
            color: "var(--ads-green)",
            border: "1px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <CheckCircle2 size={13} />
          {confirmedRate}% Confirmed
        </small>
      </div>

      {/* Multi-Segment Coverage Track */}
      <div
        style={{
          width: "100%",
          height: 8,
          borderRadius: "var(--ads-r-pill)",
          backgroundColor: "var(--uop-wash-strong)",
          overflow: "hidden",
          display: "flex",
          gap: 1.5,
          marginBottom: "0.85rem",
          padding: 1,
        }}
      >
        {statuses.map((s) => (
          <div
            key={s.key}
            style={{
              width: `${s.pct}%`,
              height: "100%",
              backgroundColor: s.accent,
              borderRadius: "var(--ads-r-pill)",
            }}
            title={`${s.label}: ${s.count} (${s.pct}%)`}
          />
        ))}
      </div>

      {/* 6 Attractive Status Tiles: 3 Columns x 2 Rows (Bigger & More Spacious) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.65rem",
          marginBottom: "0.5rem",
          flex: 1,
        }}
      >
        {statuses.map((s) => {
          const IconComponent = s.icon;
          return (
            <div
              key={s.key}
              onClick={() => handleTileClick(s.key)}
              className="uop-shift-status-tile"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "0.7rem 0.8rem",
                backgroundColor: s.bg,
                cursor: "pointer",
              }}
              title={`Click to filter ${s.label} shifts (${s.count})`}
            >
              {/* Tile Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                    color: s.color,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.label}
                </span>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    backgroundColor: "var(--ads-material-thick)",
                    boxShadow: "var(--ads-shadow-xs)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconComponent size={12} style={{ color: s.color }} />
                </div>
              </div>

              {/* Large Value */}
              <div
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  color: "var(--ads-ink)",
                  margin: "0.25rem 0 0.2rem",
                  lineHeight: 1,
                  letterSpacing: "-0.022em",
                }}
              >
                {isLoading ? <div className="uop-skeleton" style={{ width: 30, height: 24 }} /> : s.count}
              </div>

              {/* Mini Progress Track & Pill */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: "var(--ads-r-pill)",
                    backgroundColor: "var(--uop-wash-strong)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: s.accent,
                      borderRadius: "var(--ads-r-pill)",
                      transformOrigin: "left center",
                      transform: `scaleX(${Math.min(s.pct, 100) / 100})`,
                      transition: "transform var(--ads-dur) var(--ads-ease)",
                    }}
                  />
                </div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: s.color, minWidth: "26px", textAlign: "right" }}>
                  {s.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="uop-card-footer" style={{ marginTop: "auto" }}>
        <span />
        <span
          className="uop-card-link-hint"
          onClick={() => navigate("/scheduler/shifts")}
          style={{ cursor: "pointer" }}
        >
          <span>Manage Shifts</span>
          <ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
};

export default ShiftPipelineCard;
