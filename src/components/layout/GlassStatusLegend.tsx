import React, { FC } from "react";

export interface LegendItem {
  label: string;
  colorClass: "blue" | "amber" | "green" | "rose" | "purple" | "slate" | "yellow";
}

interface GlassStatusLegendProps {
  items?: LegendItem[];
}

const DEFAULT_LEGEND_ITEMS: LegendItem[] = [
  { label: "Initiated", colorClass: "blue" },
  { label: "Pending", colorClass: "amber" },
  { label: "Scheduled", colorClass: "green" },
  { label: "Holiday", colorClass: "yellow" },
  { label: "Non-working", colorClass: "slate" },
];

export const GlassStatusLegend: FC<GlassStatusLegendProps> = ({
  items = DEFAULT_LEGEND_ITEMS,
}) => {
  return (
    <footer className="glass-status-legend">
      <span className="glass-legend-title">Legend</span>
      <div className="glass-legend-items">
        {items.map((item, idx) => (
          <div key={idx} className="glass-legend-item">
            <span className={`glass-legend-dot ${item.colorClass}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </footer>
  );
};

export default GlassStatusLegend;
