import React, { FC, useState, useEffect } from "react";
import { Save, Info, RefreshCw, AlertCircle } from "lucide-react";
import { thresholdApi, ThresholdField } from "../../../../api/thresholdApi";
import ThresholdLoader from "../components/ThresholdLoader";

interface DvicThresholdViewProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const DvicThresholdView: FC<DvicThresholdViewProps> = ({ onNotification }) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dvicField, setDvicField] = useState<ThresholdField | null>(null);
  const [initialField, setInitialField] = useState<ThresholdField | null>(null);

  const fetchDvicThreshold = async () => {
    setLoading(true);
    try {
      const res = await thresholdApi.getThreshold("dvic_report");
      const rawList = res?.data?.threshold;
      let field: ThresholdField;

      if (Array.isArray(rawList) && rawList.length > 0) {
        field = rawList[0];
      } else {
        field = {
          field: "dvic",
          enable: true,
          order: "normal",
          values: [{ value: 0 }, { value: 60 }],
        };
      }

      setDvicField(field);
      setInitialField(JSON.parse(JSON.stringify(field)));
    } catch (err: any) {
      console.warn("Could not fetch DVIC threshold:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDvicThreshold();
  }, []);

  const hasChanges = JSON.stringify(dvicField) !== JSON.stringify(initialField);
  const currentDuration = dvicField?.values?.[1]?.value ?? 60;

  const handleDurationChange = (valStr: string) => {
    if (!dvicField) return;
    if (valStr.length > 4) {
      onNotification({
        text: "Maximum 4 digits allowed for DVIC duration",
        type: "error",
      });
      return;
    }

    setDvicField({
      ...dvicField,
      values: [{ value: 0 }, { value: valStr }],
    });
  };

  const handleToggle = async (checked: boolean) => {
    if (!dvicField) return;
    const updated = { ...dvicField, enable: checked };
    setDvicField(updated);

    try {
      await thresholdApi.updateThreshold("dvic_report", {
        threshold: [updated],
      });
      setInitialField(JSON.parse(JSON.stringify(updated)));
      onNotification({
        text: `DVIC inspection threshold ${checked ? "enabled" : "disabled"}`,
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to update DVIC toggle",
        type: "error",
      });
    }
  };

  const handleSave = async () => {
    if (!dvicField) return;
    if (dvicField.values[1]?.value === "") {
      onNotification({
        text: "Please enter a valid DVIC duration in seconds",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      await thresholdApi.updateThreshold("dvic_report", {
        threshold: [dvicField],
      });
      setInitialField(JSON.parse(JSON.stringify(dvicField)));
      onNotification({
        text: "DVIC report threshold saved successfully!",
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to save DVIC threshold",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <ThresholdLoader title="Loading DVIC inspection thresholds..." />;
  }

  return (
    <div className="threshold-view-shell">
      {/* Header */}
      <div className="threshold-view-header">
        <div>
          <h3
            className="threshold-view-title"
            style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}
          >
            <span>Set Threshold for DVIC Report</span>
            <span className="badge-custom blue">Live API</span>
          </h3>
          <p className="threshold-view-subtext">
            Define minimum inspection duration thresholds to identify rushed pre/post-trip inspections
          </p>
        </div>

        <div className="threshold-view-actions">
          <button
            type="button"
            className="btn-outline-secondary btn-sm"
            onClick={fetchDvicThreshold}
            title="Reload from microservice"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-blue-primary btn-sm"
            disabled={isSaving || !hasChanges || !dvicField}
            onClick={handleSave}
            style={{ color: "#FFFFFF" }}
            title="Save changes to microservice"
          >
            <Save size={15} style={{ color: "#FFFFFF" }} />
            <span style={{ color: "#FFFFFF" }}>
              {isSaving ? "Saving..." : "Save Threshold"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Single Threshold Row */}
      <div className="threshold-standalone-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--ads-s4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--ads-ink)",
              }}
            >
              Inspection Duration Threshold
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
                &lt;
              </span>
              <input
                type="number"
                min="10"
                max="9999"
                step="5"
                className="threshold-input single"
                style={{ width: "6rem", maxWidth: "6rem", textAlign: "center", paddingLeft: 0 }}
                aria-label="Inspection duration threshold in seconds"
                value={currentDuration}
                disabled={!dvicField?.enable || isSaving}
                onChange={(e) => handleDurationChange(e.target.value)}
              />
              <span style={{ fontSize: "0.8125rem", fontWeight: 550, color: "var(--ads-ink-secondary)" }}>
                Seconds
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            <span
              className={`ads-badge ${dvicField?.enable ? "ads-badge--green" : "ads-badge--neutral"}`}
            >
              {dvicField?.enable ? "Active" : "Disabled"}
            </span>
            <label className="custom-blue-switch" title="Toggle DVIC threshold">
              <input
                type="checkbox"
                checked={dvicField?.enable ?? true}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div className="threshold-info-banner">
        <Info size={16} style={{ color: "var(--ads-blue)", flexShrink: 0, marginTop: "2px" }} />
        <span style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "var(--ads-ink-secondary)" }}>
          As per the configured threshold, any DA who completes their vehicle inspection under{" "}
          <strong>{currentDuration} seconds</strong> will be flagged and will receive an audit image.
        </span>
      </div>
    </div>
  );
};

export default DvicThresholdView;
