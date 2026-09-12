import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ViolationBreakdownItem } from "../../../api/unifiedDashboardApi";

interface Props {
  data: ViolationBreakdownItem[];
}

export const ViolationsBarChart: FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<{
    item: ViolationBreakdownItem;
    x: number;
    y: number;
  } | null>(null);

  const list = data && data.length > 0 ? data.slice(0, 6) : [];
  const maxCount = Math.max(...list.map((i) => i.count), 10);

  // Severity is real data, so this stays on the semantic --ads-* scale.
  const getBarColor = (severity: string) => {
    if (severity === "critical") return "#D70015";
    if (severity === "medium") return "#B25000";
    return "#0071E3";
  };

  const handleBarClick = (type: string) => {
    navigate(`/performance/reports?report=all_alert_report&search=${encodeURIComponent(type)}`);
  };

  if (list.length === 0) {
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
        No safety infractions recorded for this timeframe
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: 210, paddingTop: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          height: 155,
          gap: "0.75rem",
          paddingBottom: "1.75rem",
          borderBottom: "1px solid var(--ads-hairline)",
        }}
      >
        {list.map((item, idx) => {
          const heightPercent = Math.max((item.count / maxCount) * 100, item.count > 0 ? 8 : 4);
          const color = getBarColor(item.severity);

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end",
                position: "relative",
              }}
            >
              {/* Count label above bar */}
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--ads-ink-secondary)",
                  marginBottom: 4,
                }}
              >
                {item.count}
              </div>

              {/* Vertical Bar */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "40px",
                  height: `${heightPercent}%`,
                  backgroundColor: color,
                  borderRadius: "var(--ads-r-xs) var(--ads-r-xs) 0 0",
                  cursor: "pointer",
                  transition: "filter var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease)",
                  boxShadow: item.severity === "critical" ? "0 2px 8px rgba(215, 0, 21, 0.24)" : "none",
                }}
                onClick={() => handleBarClick(item.violationType)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({
                    item,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
              />

              {/* Category label below axis */}
              <div
                style={{
                  position: "absolute",
                  bottom: "-24px",
                  width: "100%",
                  textAlign: "center",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--ads-ink-tertiary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={item.violationType}
              >
                {item.violationType.replace(/infractions?|non-compliance|warning|event/gi, "").trim()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Severity Indicator Badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "0.75rem",
          marginTop: "1.75rem",
          fontSize: "0.6875rem",
          color: "var(--ads-ink-secondary)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--ads-red)" }} />
          Critical Infraction
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--ads-amber)" }} />
          Medium Hazard
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--ads-blue)" }} />
          Standard Telemetry
        </span>
      </div>
    </div>
  );
};
