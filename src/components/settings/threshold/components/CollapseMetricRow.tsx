import React, { FC, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ThresholdField } from "../../../../api/thresholdApi";
import { getMetricLabel } from "../thresholdUtils";

interface CollapseMetricRowProps {
  type: "pod" | "cdf" | "delivery_concessions";
  isActive: boolean;
  threshold: ThresholdField[];
  onChange: (data: {
    key: string;
    changeKey: "values" | "order" | "enable";
    changeValue: any;
  }) => void;
  onActiveChange: (type: "pod" | "cdf" | "delivery_concessions", active: boolean) => void;
  disabled?: boolean;
}

const TYPE_TITLES: Record<string, string> = {
  pod: "POD (Photo-On-Delivery)",
  cdf: "CDF Negative",
  delivery_concessions: "Delivery Concessions",
};

export const CollapseMetricRow: FC<CollapseMetricRowProps> = ({
  type,
  isActive,
  threshold,
  onChange,
  onActiveChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`threshold-collapse-card ${!isActive ? "card-inactive" : ""}`}>
      {/* Header Row */}
      <div className="threshold-collapse-header">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
          <button
            type="button"
            className="threshold-collapse-trigger"
            onClick={() => setIsOpen(!isOpen)}
            disabled={!isActive || disabled}
            title={isOpen ? "Collapse metrics" : "Expand metrics"}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${TYPE_TITLES[type] || type} metrics`}
            aria-expanded={isOpen}
          >
            {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>
          <span className="threshold-collapse-title">
            {TYPE_TITLES[type] || type}
          </span>
          <span className="threshold-collapse-count">
            {threshold.filter((t) => t.enable).length}/{threshold.length} enabled
          </span>
        </div>

        {/* Master Toggle */}
        <label className="custom-blue-switch" title={`Toggle ${TYPE_TITLES[type]}`}>
          <input
            type="checkbox"
            checked={isActive}
            disabled={disabled}
            onChange={(e) => onActiveChange(type, e.target.checked)}
          />
          <span className="switch-slider" />
        </label>
      </div>

      {/* Expanded Inner Metrics */}
      {isOpen && isActive && (
        <div className="threshold-collapse-body">
          {threshold.map((item) => (
            <div key={item.field} className="threshold-submetric-row">
              <span className="threshold-submetric-name">
                {getMetricLabel(item.field)}
              </span>
              <label
                className="custom-blue-switch"
                title={`Toggle ${getMetricLabel(item.field)}`}
              >
                <input
                  type="checkbox"
                  checked={item.enable}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange({
                      key: item.field,
                      changeKey: "enable",
                      changeValue: e.target.checked,
                    })
                  }
                />
                <span className="switch-slider" />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollapseMetricRow;
