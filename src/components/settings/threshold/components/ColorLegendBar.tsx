import React, { FC } from "react";
import { getColorLegend, LegendType } from "../thresholdUtils";

interface ColorLegendBarProps {
  type?: LegendType;
  className?: string;
}

export const ColorLegendBar: FC<ColorLegendBarProps> = ({
  type = "scorecard",
  className = "",
}) => {
  const legendItems = getColorLegend(type);

  return (
    <div className={`threshold-legend-bar ${className}`}>
      <div className="threshold-legend-items">
        {legendItems.map((item) => (
          <div key={item.value} className="threshold-legend-item">
            <span
              className="threshold-legend-dot"
              style={{ backgroundColor: item.color }}
            />
            <span className="threshold-legend-text">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorLegendBar;
