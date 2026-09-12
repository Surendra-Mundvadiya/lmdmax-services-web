import React, { FC } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ThresholdField } from "../../../../api/thresholdApi";
import { getMetricLabel } from "../thresholdUtils";

export interface ThresholdMetricRowProps {
  field: ThresholdField;
  isActive: boolean;
  singleInputField?: Set<string>;
  onChange: (data: {
    key: string;
    changeKey: "values" | "order" | "enable";
    changeValue: any;
  }) => void;
  disabled?: boolean;
}

export const ThresholdMetricRow: FC<ThresholdMetricRowProps> = ({
  field,
  isActive,
  singleInputField,
  onChange,
  disabled = false,
}) => {
  const isSingleInput = singleInputField?.has(field.field) || false;
  const isNormalOrder = field.order === "normal";

  const minVal = field.values?.[0]?.value ?? "";
  const maxVal = field.values?.[1]?.value ?? "";

  return (
    <div className={`threshold-metric-row ${!field.enable ? "row-disabled" : ""}`}>
      {/* Metric Label */}
      <div className="threshold-metric-label-wrap">
        <span className="threshold-metric-name">{getMetricLabel(field.field)}</span>
        <span className="threshold-metric-key">{field.field}</span>
      </div>

      {/* Input Controls (when active) */}
      {isActive && (
        <div className="threshold-metric-inputs-wrap">
          {isSingleInput ? (
            <div className="threshold-single-input-wrap">
              <input
                type="text"
                className="threshold-input single"
                placeholder="Exact value target"
                value={minVal}
                disabled={disabled || !field.enable}
                onChange={(e) =>
                  onChange({
                    key: field.field,
                    changeKey: "values",
                    changeValue: [{ value: e.target.value }, { value: maxVal || "0" }],
                  })
                }
                title="Filter based on exact provided value"
              />
            </div>
          ) : (
            <div className="threshold-range-inputs">
              {/* Min Value Input */}
              <div className="threshold-input-container">
                <input
                  type="number"
                  step="any"
                  className={`threshold-input range ${
                    isNormalOrder ? "border-red" : "border-green"
                  }`}
                  placeholder="Min"
                  value={minVal}
                  disabled={disabled || !field.enable}
                  onChange={(e) =>
                    onChange({
                      key: field.field,
                      changeKey: "values",
                      changeValue: [{ value: e.target.value }, { value: maxVal }],
                    })
                  }
                  title={
                    isNormalOrder
                      ? `Value below ${minVal || "minimum"} is flagged as poor/bad`
                      : `Value below ${minVal || "minimum"} is good`
                  }
                />
                <span className="threshold-input-tag">
                  {isNormalOrder ? "Low (Bad)" : "Low (Good)"}
                </span>
              </div>

              {/* Order Invert Button */}
              <button
                type="button"
                className="threshold-swap-order-btn"
                title="Change preference order (invert good vs bad directions)"
                aria-label={`Invert good and bad direction for ${getMetricLabel(field.field)}`}
                disabled={disabled || !field.enable}
                onClick={() =>
                  onChange({
                    key: field.field,
                    changeKey: "order",
                    changeValue: isNormalOrder ? "reverse" : "normal",
                  })
                }
              >
                <ArrowLeftRight size={14} />
              </button>

              {/* Max Value Input */}
              <div className="threshold-input-container">
                <input
                  type="number"
                  step="any"
                  className={`threshold-input range ${
                    isNormalOrder ? "border-green" : "border-red"
                  }`}
                  placeholder="Max"
                  value={maxVal}
                  disabled={disabled || !field.enable}
                  onChange={(e) =>
                    onChange({
                      key: field.field,
                      changeKey: "values",
                      changeValue: [{ value: minVal }, { value: e.target.value }],
                    })
                  }
                  title={
                    isNormalOrder
                      ? `Value above ${maxVal || "maximum"} is good/fantastic`
                      : `Value above ${maxVal || "maximum"} is flagged as poor/bad`
                  }
                />
                <span className="threshold-input-tag">
                  {isNormalOrder ? "High (Good)" : "High (Bad)"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enable / Disable Switch */}
      <div className="threshold-metric-toggle-wrap">
        <label
          className="custom-blue-switch"
          title={`Toggle ${getMetricLabel(field.field)} metric`}
        >
          <input
            type="checkbox"
            checked={field.enable}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                key: field.field,
                changeKey: "enable",
                changeValue: e.target.checked,
              })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>
    </div>
  );
};

export default ThresholdMetricRow;
