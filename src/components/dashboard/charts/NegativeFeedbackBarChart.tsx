import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NegativeFeedbackItem } from "../../../api/unifiedDashboardApi";

interface Props {
  data: NegativeFeedbackItem[];
}

export const NegativeFeedbackBarChart: FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Same categorical ramp as the other dashboard charts, mirroring --ads-* tokens.
  const barColors = [
    "#0071E3", // accent blue
    "#D70015", // red
    "#B25000", // amber
    "#6E4FC4", // purple
    "#0E7C74", // teal
  ];

  const list = data && data.length > 0 ? data.slice(0, 5) : [];
  const total = list.reduce((acc, curr) => acc + curr.count, 0);
  const maxCount = Math.max(...list.map((i) => i.count), 1);

  const handleReasonClick = (reason: string) => {
    navigate(
      `/performance/reports?report=negative_customer_feedback_daily_report&search=${encodeURIComponent(
        reason
      )}`
    );
  };

  if (list.length === 0 || total === 0) {
    return (
      <div
        style={{
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ads-ink-tertiary)",
          fontSize: "0.8125rem",
        }}
      >
        Zero customer concessions recorded
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, margin: "auto 0", padding: "0.25rem 0" }}>
      {/* Top Summary Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.15rem 0.35rem 0.55rem",
          borderBottom: "1px solid var(--ads-hairline)",
          marginBottom: "0.55rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem" }}>
          <span
            style={{
              fontSize: "1.45rem",
              fontWeight: 700,
              color: "var(--ads-ink)",
              lineHeight: 1,
              letterSpacing: "-0.022em",
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontSize: "0.725rem",
              fontWeight: 600,
              color: "var(--ads-ink-quaternary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Total Defects
          </span>
        </div>

        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            padding: "0.2rem 0.65rem",
            borderRadius: "var(--ads-r-pill)",
            backgroundColor: "var(--ads-amber-tint)",
            color: "var(--ads-amber)",
            border: "1px solid transparent",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Customer Concessions
        </span>
      </div>

      {/* Defect Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {list.map((item, idx) => {
          const color = barColors[idx % barColors.length];
          const barWidthPct = Math.max((item.count / maxCount) * 100, 10);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                padding: "0.4rem 0.55rem",
                borderRadius: "var(--ads-r-sm)",
                border: isHovered ? "1px solid var(--ads-hairline)" : "1px solid transparent",
                backgroundColor: isHovered ? "var(--uop-wash)" : "transparent",
                cursor: "pointer",
                transition: "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => handleReasonClick(item.reason)}
              title={`${item.reason}: ${item.count} defects`}
            >
              {/* Top row: Label and Values */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", minWidth: 0 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      backgroundColor: color,
                      flexShrink: 0,
                      boxShadow: isHovered ? `0 0 0 3px ${color}33` : "none",
                      transition: "box-shadow var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: isHovered ? 650 : 550,
                      color: "var(--ads-ink)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.reason}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color,
                      padding: "0.18rem 0.6rem",
                      borderRadius: "var(--ads-r-pill)",
                      backgroundColor: `${color}14`,
                      border: "1px solid transparent",
                      minWidth: "24px",
                      textAlign: "center",
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              </div>

              {/* Horizontal Bar Track & Fill */}
              <div
                style={{
                  width: "100%",
                  height: 6,
                  backgroundColor: "var(--uop-wash-strong)",
                  borderRadius: "var(--ads-r-pill)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: color,
                    borderRadius: "var(--ads-r-pill)",
                    transformOrigin: "left center",
                    transform: `scaleX(${barWidthPct / 100})`,
                    transition: "transform var(--ads-dur) var(--ads-ease)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NegativeFeedbackBarChart;
