import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ChevronRight } from "lucide-react";
import { WeeklyScorecardSummary, TierRating } from "../../../api/unifiedDashboardApi";

interface Props {
  scorecard?: WeeklyScorecardSummary;
  isLoading?: boolean;
}

export const Tier3ScorecardMatrix: FC<Props> = ({ scorecard, isLoading }) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const overallStanding: TierRating = scorecard?.overallStanding || "Fantastic";

  // Exact user color requirements:
  // Fantastic Plus -> purple
  // Fantastic -> blue
  // Great -> green
  // Fair -> orange
  // Poor -> red
  const getTierColor = (tier?: string) => {
    const t = (tier || "").toLowerCase();
    if (t.includes("plus")) return "#7C3AED"; // Purple
    if (t.includes("fantastic")) return "#2563EB"; // Blue
    if (t.includes("great")) return "#059669"; // Green
    if (t.includes("fair")) return "#EA580C"; // Orange
    if (t.includes("poor")) return "#DC2626"; // Red
    return "#2563EB";
  };

  const getPillClass = (tier?: string) => {
    const t = (tier || "").toLowerCase();
    if (t.includes("plus")) return "fantastic-plus";
    if (t.includes("fantastic")) return "fantastic";
    if (t.includes("great")) return "great";
    if (t.includes("fair")) return "fair";
    if (t.includes("poor")) return "poor";
    return "fantastic";
  };

  const metrics = [
    {
      key: "safety",
      title: "Safety & Compliance",
      tier: scorecard?.safetyCompliance || "Fantastic",
      color: getTierColor(scorecard?.safetyCompliance || "Fantastic"),
    },
    {
      key: "delivery",
      title: "Delivery Quality",
      tier: scorecard?.deliveryQuality || "Fantastic",
      color: getTierColor(scorecard?.deliveryQuality || "Fantastic"),
    },
    {
      key: "pickup",
      title: "Pickup Quality",
      tier: scorecard?.pickupQuality || "Great",
      color: getTierColor(scorecard?.pickupQuality || "Great"),
    },
    {
      key: "reliability",
      title: "Service Reliability",
      tier: scorecard?.serviceReliability || "Fantastic",
      color: getTierColor(scorecard?.serviceReliability || "Fantastic"),
    },
  ];

  // SVG Gauge calculations (Enlarged to 168px with bold 18px stroke)
  const size = 168;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / 4;
  const gap = 4;
  const dash = segmentLength - gap;

  return (
    <div className="uop-scorecard-card-container">
      <div className="uop-card uop-scorecard-white-card">
        {/* Card Header */}
        <div className="uop-card-header">
          <h3 className="uop-card-title">
            <span>Weekly Scorecard</span>
          </h3>
          <div className="uop-card-icon amber">
            <Trophy size={18} />
          </div>
        </div>

        {/* Card Body: Enlarged Gauge on Left, 4 Breakdown Rows on Right */}
        <div className="uop-scorecard-gauge-body">
          {/* Left: Circular Overall Standing Gauge */}
          <div className="uop-scorecard-gauge-col">
            <div style={{ position: "relative", width: size, height: size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {metrics.map((m, idx) => {
                  const isHovered = hoveredIdx === idx;
                  const strokeDasharray = `${dash} ${circumference - dash}`;
                  const strokeDashoffset = -idx * segmentLength;

                  return (
                    <circle
                      key={m.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke={m.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      transform={`rotate(-90 ${size / 2} ${size / 2})`}
                      style={{
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                      }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => navigate("/performance/reports?report=current_scorecard")}
                    />
                  );
                })}
              </svg>

              {/* Center Overall Standing Metric */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  textAlign: "center",
                  padding: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: getTierColor(overallStanding),
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {isLoading ? "..." : overallStanding}
                </span>
                <span
                  style={{
                    fontSize: "0.625rem",
                    fontWeight: 800,
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginTop: "0.25rem",
                  }}
                >
                  OVERALL
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "0.45rem",
                fontSize: "0.725rem",
                color: "#475569",
                fontWeight: 700,
                backgroundColor: "#F1F5F9",
                padding: "0.15rem 0.6rem",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Week {scorecard?.weekNumber || 36}
            </div>
          </div>

          {/* Right: 4 Scorecard Metrics List (Clean without % delta) */}
          <div className="uop-scorecard-metrics-list">
            {metrics.map((m, idx) => (
              <div
                key={m.key}
                className={`uop-scorecard-list-row ${hoveredIdx === idx ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => navigate("/performance/reports?report=current_scorecard")}
                title={`Click to view ${m.title} report`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", minWidth: 0 }}>
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      backgroundColor: m.color,
                      flexShrink: 0,
                      boxShadow: hoveredIdx === idx ? `0 0 0 3px ${m.color}33` : "none",
                      transition: "box-shadow 0.2s ease",
                    }}
                  />
                  <span className="uop-scorecard-row-title">{m.title}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <span className={`uop-matrix-tier-pill-small ${getPillClass(m.tier)}`}>
                    {m.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Footer */}
        <div className="uop-card-footer" style={{ marginTop: "auto" }}>
          <span />
          <span
            className="uop-card-link-hint"
            onClick={() => navigate("/performance/reports?report=current_scorecard")}
            style={{ cursor: "pointer" }}
          >
            <span>Scorecard</span>
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default Tier3ScorecardMatrix;
