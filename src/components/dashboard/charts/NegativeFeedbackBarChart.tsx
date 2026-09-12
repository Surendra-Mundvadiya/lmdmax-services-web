import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NegativeFeedbackItem } from "../../../api/unifiedDashboardApi";

interface Props {
  data: NegativeFeedbackItem[];
}

export const NegativeFeedbackBarChart: FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Balanced mid-tone colors (neither too dark nor too light)
  const barColors = [
    "#EF4444", // Vivid Red
    "#F97316", // Vibrant Orange
    "#3B82F6", // Royal Blue
    "#8B5CF6", // Purple
    "#10B981", // Emerald
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
          color: "#94A3B8",
          fontSize: "0.8125rem",
          fontStyle: "italic",
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
          borderBottom: "1px solid #F1F5F9",
          marginBottom: "0.55rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem" }}>
          <span
            style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontSize: "0.725rem",
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Total Defects
          </span>
        </div>

        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            padding: "0.15rem 0.55rem",
            borderRadius: "9999px",
            backgroundColor: "#FFFBEB",
            color: "#D97706",
            border: "1px solid #FDE68A",
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
                borderRadius: "8px",
                border: isHovered ? "1px solid #E2E8F0" : "1px solid transparent",
                backgroundColor: isHovered ? "#F8FAFC" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
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
                      transition: "box-shadow 0.2s ease",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: isHovered ? 700 : 600,
                      color: isHovered ? "#0F172A" : "#1E293B",
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
                      fontWeight: 800,
                      color,
                      padding: "0.15rem 0.55rem",
                      borderRadius: "5px",
                      backgroundColor: `${color}15`,
                      border: `1px solid ${color}30`,
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
                  backgroundColor: "#E2E8F0",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidthPct}%`,
                    height: "100%",
                    backgroundColor: color,
                    borderRadius: "9999px",
                    transition: "width 0.4s ease",
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
