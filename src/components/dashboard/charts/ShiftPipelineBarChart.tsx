import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShiftsSummary } from "../../../api/unifiedDashboardApi";

interface Props {
  data?: ShiftsSummary;
}

export const ShiftPipelineBarChart: FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const [hoveredSegment, setHoveredSegment] = useState<{
    label: string;
    value: number;
    percent: number;
    statusKey: string;
    color: string;
    x: number;
    y: number;
  } | null>(null);

  const published = data?.totalPublished || 0;
  const accepted = data?.accepted || 0;
  const autoAccepted = data?.autoAccepted || 0;
  const pending = data?.pending || 0;
  const open = data?.open || 0;

  const total = (published + accepted + autoAccepted + pending + open) || 1;

  // Matches the Shift Pipeline tile family (--ads-* semantics + the teal sixth hue).
  const segments = [
    { label: "Published", key: "published", count: published, color: "var(--ads-blue)" },
    { label: "Accepted", key: "accepted", count: accepted, color: "var(--ads-green)" },
    { label: "Auto-Accepted", key: "auto_accepted", count: autoAccepted, color: "var(--uop-teal)" },
    { label: "Pending", key: "pending", count: pending, color: "var(--ads-amber)" },
    { label: "Open Slots", key: "open", count: open, color: "var(--ads-ink-quaternary)" },
  ];

  const handleSegmentClick = (statusKey: string) => {
    navigate(`/scheduler/shifts?status=${statusKey}`);
  };

  return (
    <div className="uop-segmented-bar-container" style={{ position: "relative" }}>
      {/* Segmented Bar */}
      <div className="uop-segmented-bar">
        {segments.map((seg, idx) => {
          const pct = Math.max((seg.count / total) * 100, seg.count > 0 ? 3 : 0);
          if (seg.count === 0 && (data?.total || 0) > 0) return null;

          return (
            <div
              key={seg.key}
              className="uop-bar-segment"
              style={{
                width: `${(seg.count / total) * 100}%`,
                minWidth: seg.count > 0 ? "8px" : "0",
                backgroundColor: seg.color,
              }}
              title={`${seg.label}: ${seg.count} (${((seg.count / total) * 100).toFixed(1)}%) - Click to view shifts`}
              onClick={() => handleSegmentClick(seg.key)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredSegment({
                  label: seg.label,
                  value: seg.count,
                  percent: Number(((seg.count / total) * 100).toFixed(1)),
                  statusKey: seg.key,
                  color: seg.color,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
              }}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          );
        })}
      </div>

      {/* Interactive Legend */}
      <div className="uop-bar-legend">
        {segments.map((seg) => {
          const pct = ((seg.count / total) * 100).toFixed(1);
          return (
            <div
              key={seg.key}
              className="uop-legend-item"
              onClick={() => handleSegmentClick(seg.key)}
              title={`Filter shifts by ${seg.label}`}
            >
              <div className="uop-legend-chip" style={{ backgroundColor: seg.color }} />
              <span>
                <strong>{seg.label}</strong>: {seg.count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
