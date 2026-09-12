import React, { FC, useState, useEffect } from "react";
import { ArrowLeft, Save, Info, RefreshCw, MessageSquare, RotateCcw, X, Check } from "lucide-react";
import { thresholdApi, EocThresholdField } from "../../../../api/thresholdApi";
import ThresholdLoader from "../components/ThresholdLoader";

interface EocThresholdViewProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

const DEFAULT_EOC_TEMPLATES = [
  "Hi ${driver_name}, your Engine Off Compliance (EOC) score for your recent shift fell below the required threshold. Please make sure the vehicle engine is turned off at every delivery stop for safety and compliance. Thanks!",
  "Hi ${driver_name}, reminder to maintain proper Engine Off Compliance. Turn off your engine and engage the emergency brake before leaving the seat at each delivery location. Keep up the good work!",
  "Safety Notice: EOC compliance is mandatory across all assigned routes. Please review the station idle guidelines. Reach out to dispatch if you have questions.",
];

export const EocThresholdView: FC<EocThresholdViewProps> = ({ onNotification }) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [eocField, setEocField] = useState<EocThresholdField | null>(null);
  const [initialField, setInitialField] = useState<EocThresholdField | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const fetchEocThreshold = async () => {
    setLoading(true);
    try {
      const res = await thresholdApi.getThreshold("eoc").catch(() => thresholdApi.getEocThreshold());
      const rawThreshold = res?.data?.threshold;
      let field: EocThresholdField;

      if (Array.isArray(rawThreshold) && rawThreshold.length > 0) {
        field = rawThreshold[0];
      } else {
        field = {
          field: "eoc",
          enable: true,
          order: "normal",
          values: [{ value: 95 }, { value: 0 }],
          template: DEFAULT_EOC_TEMPLATES[0],
        };
      }

      setEocField(field);
      setInitialField(JSON.parse(JSON.stringify(field)));
    } catch (err: any) {
      console.warn("Could not fetch EOC threshold:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEocThreshold();
  }, []);

  const hasChanges = JSON.stringify(eocField) !== JSON.stringify(initialField);

  const handlePercentageChange = (valStr: string) => {
    if (!eocField) return;
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 100) {
      onNotification({
        text: "EOC compliance percentage cannot exceed 100%",
        type: "error",
      });
      return;
    }

    setEocField({
      ...eocField,
      values: [{ value: valStr }, { value: eocField.values?.[1]?.value ?? 0 }],
    });
  };

  const handleToggle = async (checked: boolean) => {
    if (!eocField) return;
    const updated = { ...eocField, enable: checked };
    setEocField(updated);

    try {
      await thresholdApi.enableDisableThreshold({
        type: "eoc",
        enable: checked,
      });
      setInitialField(JSON.parse(JSON.stringify(updated)));
      onNotification({
        text: `Engine Off Compliance threshold ${checked ? "enabled" : "disabled"}`,
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to update EOC toggle",
        type: "error",
      });
    }
  };

  const handleSave = async () => {
    if (!eocField) return;
    const val = eocField.values?.[0]?.value;
    if (val === "" || val === undefined) {
      onNotification({
        text: "Please enter a valid EOC threshold value",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      await thresholdApi.updateThreshold("eoc", {
        threshold: [eocField],
      });
      setInitialField(JSON.parse(JSON.stringify(eocField)));
      onNotification({
        text: "Engine Off Compliance threshold saved successfully!",
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to save EOC threshold",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <ThresholdLoader title="Loading Engine Off Compliance threshold..." />;
  }

  if (isTemplateModalOpen) {
    return (
      <div className="add-driver-screen-container" style={{ minHeight: "100%", padding: "1.5rem" }}>
        <div className="screen-nav-header" style={{ marginBottom: "1.5rem" }}>
          <div className="screen-nav-left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(false)}
              title="Back to Thresholds"
              aria-label="Back to thresholds"
              className="btn-outline-cancel"
              style={{ gap: "var(--ads-s2)" }}
            >
              <ArrowLeft size={16} />
              <span>Back to Thresholds</span>
            </button>
            <div className="screen-heading">
              <h1
                className="screen-title"
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  letterSpacing: "-0.014em",
                  color: "var(--ads-ink)",
                  margin: 0,
                }}
              >
                Choose EOC Coaching Template
              </h1>
              <p
                className="screen-subtitle"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--ads-ink-tertiary)",
                  margin: "var(--ads-s1) 0 0 0",
                }}
              >
                Select the template message to dispatch to drivers below threshold
              </p>
            </div>
          </div>
          <div className="screen-nav-right">
            <button
              type="button"
              className="btn-outline-cancel"
              onClick={() => setIsTemplateModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Template List Cards */}
        <div style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s3)" }}>
            {DEFAULT_EOC_TEMPLATES.map((tmpl, idx) => {
              const isSelected = eocField?.template === tmpl;
              return (
                <div
                  key={idx}
                  className="ads-card ads-card--interactive"
                  style={{
                    padding: "var(--ads-s4)",
                    borderColor: isSelected ? "var(--ads-blue)" : "var(--ads-hairline)",
                    background: isSelected ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
                  }}
                  onClick={() => {
                    if (eocField) {
                      setEocField({ ...eocField, template: tmpl });
                    }
                    setIsTemplateModalOpen(false);
                    onNotification({
                      text: "Notification template updated",
                      type: "success",
                    });
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "var(--ads-s3)",
                    }}
                  >
                    <div>
                      <span className="ads-overline" style={{ display: "block", marginBottom: "var(--ads-s1)" }}>
                        Template option {idx + 1}
                      </span>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8125rem",
                          lineHeight: 1.5,
                          color: "var(--ads-ink-secondary)",
                        }}
                      >
                        {tmpl}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="ads-badge ads-badge--blue" style={{ flexShrink: 0 }}>
                        <Check size={14} />
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="ads-btn ads-btn--ghost ads-btn--sm"
                        style={{ flexShrink: 0 }}
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
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
            <span>Set Threshold for Engine Off Compliance (EOC)</span>
            <span className="badge-custom blue">Live API</span>
          </h3>
          <p className="threshold-view-subtext">
            Specify the safety cutoff percentage for driver ignition compliance and notification templates
          </p>
        </div>

        <div className="threshold-view-actions">
          <button
            type="button"
            className="btn-outline-secondary btn-sm"
            onClick={fetchEocThreshold}
            title="Reload from microservice"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-blue-primary btn-sm"
            disabled={isSaving || !hasChanges || !eocField}
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
              Engine Off Compliance Cutoff
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
                &lt;
              </span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                className="threshold-input single"
                style={{ width: "5rem", maxWidth: "5rem", textAlign: "center", paddingLeft: 0 }}
                aria-label="Engine off compliance cutoff percentage"
                value={eocField?.values?.[0]?.value ?? 95}
                disabled={!eocField?.enable || isSaving}
                onChange={(e) => handlePercentageChange(e.target.value)}
              />
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ads-ink-secondary)" }}>
                %
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            <span
              className={`ads-badge ${eocField?.enable ? "ads-badge--green" : "ads-badge--neutral"}`}
            >
              {eocField?.enable ? "Active" : "Disabled"}
            </span>
            <label className="custom-blue-switch" title="Toggle EOC threshold rule">
              <input
                type="checkbox"
                checked={eocField?.enable ?? true}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* Template Notification Box */}
      <div className="threshold-template-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--ads-s3)",
            marginBottom: "var(--ads-s3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--ads-s2)" }}>
            <Info size={16} style={{ color: "var(--ads-blue)", flexShrink: 0, marginTop: "2px" }} />
            <span
              style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "var(--ads-ink-secondary)" }}
            >
              You can send bulk automated coaching notifications to DAs who fall below the {eocField?.values?.[0]?.value ?? 95}% threshold.
            </span>
          </div>

          <button
            type="button"
            className="btn-outline-secondary btn-sm shrink-0"
            onClick={() => setIsTemplateModalOpen(true)}
            disabled={!eocField?.enable}
            title="Pick or edit notification template"
          >
            <MessageSquare size={14} />
            <span>Select other template</span>
          </button>
        </div>

        <div
          style={{
            padding: "var(--ads-s3) var(--ads-s4)",
            background: "var(--ads-white)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--ads-s3)",
              marginBottom: "var(--ads-s2)",
            }}
          >
            <span className="ads-overline">Selected notification template</span>
            <button
              type="button"
              className="ads-btn ads-btn--ghost ads-btn--sm"
              onClick={() => {
                if (eocField) {
                  setEocField({
                    ...eocField,
                    template: DEFAULT_EOC_TEMPLATES[0],
                  });
                }
              }}
              title="Reset to standard default template"
            >
              <RotateCcw size={12} />
              <span>Reset to Default</span>
            </button>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              color: "var(--ads-ink-secondary)",
            }}
          >
            {eocField?.template || DEFAULT_EOC_TEMPLATES[0]}
          </p>
        </div>
      </div>


    </div>
  );
};

export default EocThresholdView;
