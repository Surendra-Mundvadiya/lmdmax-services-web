import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NegativeFeedbackItem } from "../../../api/unifiedDashboardApi";

interface Props {
  data: NegativeFeedbackItem[];
}

export const NegativeFeedbackDonutChart: FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const colors = ["#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"];
  const list = data && data.length > 0 ? data.slice(0, 5) : [];
  const total = list.reduce((acc, curr) => acc + curr.count, 0);

  const handleReasonClick = (reason: string) => {
    navigate(
      `/performance/reports?report=negative_customer_feedback_daily_report&search=${encodeURIComponent(
        reason
      )}`
    );
  };

  if (total === 0) {
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

  // Calculate SVG donut segments
  const size = 130;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        minHeight: 180,
      }}
    >
      {/* SVG Donut */}
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {list.map((item, idx) => {
            const pct = item.count / total;
            const strokeDasharray = `${circumference * pct} ${circumference * (1 - pct)}`;
            const strokeDashoffset = -cumulativeOffset;
            cumulativeOffset += circumference * pct;

            const isHovered = activeIdx === idx;
            const color = colors[idx % colors.length];

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  opacity: activeIdx !== null && !isHovered ? 0.45 : 1,
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onClick={() => handleReasonClick(item.reason)}
              />
            );
          })}
        </svg>

        {/* Center Total Metric */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
            {activeIdx !== null ? list[activeIdx]?.count : total}
          </span>
          <span style={{ fontSize: "0.625rem", color: "#64748B", fontWeight: 600, marginTop: 2 }}>
            {activeIdx !== null ? "SELECTED" : "DEFECTS"}
          </span>
        </div>
      </div>

      {/* Interactive Legend List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: 0 }}>
        {list.map((item, idx) => {
          const color = colors[idx % colors.length];
          const pct = Math.round((item.count / total) * 100);
          const isHovered = activeIdx === idx;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.25rem 0.4rem",
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: isHovered ? "#F1F5F9" : "transparent",
                transition: "background-color 0.12s ease",
              }}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              onClick={() => handleReasonClick(item.reason)}
              title={`${item.reason}: ${item.count} concessions (${pct}%)`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.725rem",
                    color: isHovered ? "#0F172A" : "#334155",
                    fontWeight: isHovered ? 700 : 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.reason}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.725rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginLeft: "0.5rem",
                  flexShrink: 0,
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
