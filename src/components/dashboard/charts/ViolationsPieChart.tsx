import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ViolationBreakdownItem } from "../../../api/unifiedDashboardApi";

interface Props {
  data: ViolationBreakdownItem[];
}

export const ViolationsPieChart: FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Balanced mid-tone colors (neither too dark nor too light)
  const pieColors = [
    "#EF4444", // Vivid Red
    "#F97316", // Bright Orange
    "#F59E0B", // Warm Amber
    "#3B82F6", // Royal Blue
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
  ];

  const list = data && data.length > 0 ? data.slice(0, 6) : [];
  const total = list.reduce((acc, curr) => acc + curr.count, 0);

  const handleViolationClick = (type: string) => {
    navigate(`/performance/reports?report=all_alert_report&search=${encodeURIComponent(type)}`);
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
        Zero safety infractions recorded
      </div>
    );
  }

  // SVG Pie / Donut dimensions (Enlarged to 156px with bold 18px stroke)
  const size = 156;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const activeItem = activeIdx !== null ? list[activeIdx] : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.25rem",
        margin: "auto 0",
        padding: "0.35rem 0",
      }}
    >
      {/* Left: SVG Donut / Pie Column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {list.map((item, idx) => {
              const pct = item.count / total;
              const strokeDasharray = `${circumference * pct} ${circumference * (1 - pct)}`;
              const strokeDashoffset = -cumulativeOffset;
              cumulativeOffset += circumference * pct;

              const isHovered = activeIdx === idx;
              const color = pieColors[idx % pieColors.length];

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
                  onClick={() => handleViolationClick(item.violationType)}
                />
              );
            })}
          </svg>

          {/* Center Metric */}
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
                fontSize: "1.65rem",
                fontWeight: 800,
                color: activeItem ? pieColors[activeIdx! % pieColors.length] : "#0F172A",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {activeItem ? activeItem.count : total}
            </span>
            <span
              style={{
                fontSize: "0.625rem",
                color: "#64748B",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: "0.25rem",
              }}
            >
              {activeItem ? "SELECTED" : "EVENTS"}
            </span>
          </div>
        </div>

        {/* Bottom Pill Badge */}
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
          {activeItem ? `${activeItem.count} / ${total} Events` : `${total} Total Events`}
        </div>
      </div>

      {/* Right: Interactive Legend List (Card rows matching Scorecard styling) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1, minWidth: 0 }}>
        {list.map((item, idx) => {
          const color = pieColors[idx % pieColors.length];
          const isHovered = activeIdx === idx;
          const cleanName = item.violationType
            .replace(/infractions?|non-compliance|warning|event/gi, "")
            .trim();

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                padding: "0.35rem 0.55rem",
                borderRadius: "8px",
                border: isHovered ? "1px solid #E2E8F0" : "1px solid transparent",
                backgroundColor: isHovered ? "#F8FAFC" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              onClick={() => handleViolationClick(item.violationType)}
              title={`${item.violationType}: ${item.count} events`}
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
                    color: isHovered ? "#0F172A" : "#1E293B",
                    fontWeight: isHovered ? 700 : 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cleanName}
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
          );
        })}
      </div>
    </div>
  );
};

export default ViolationsPieChart;
