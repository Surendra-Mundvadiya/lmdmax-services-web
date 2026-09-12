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
              className="back-btn"
              onClick={() => setIsTemplateModalOpen(false)}
              title="Back to Thresholds"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                color: "#1E293B",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Thresholds</span>
            </button>
            <div className="screen-heading">
              <h1 className="screen-title" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                Choose EOC Coaching Template
              </h1>
              <p className="screen-subtitle" style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>
                Select the template message to dispatch to drivers below threshold
              </p>
            </div>
          </div>
          <div className="screen-nav-right">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsTemplateModalOpen(false)}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Template List Cards */}
        <div style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
          <div className="space-y-3">
            {DEFAULT_EOC_TEMPLATES.map((tmpl, idx) => {
              const isSelected = eocField?.template === tmpl;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 capitalize tracking-normal mb-1 block">
                        Template option {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{tmpl}</p>
                    </div>
                    {isSelected ? (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-100/70 px-2.5 py-1 rounded-full">
                        <Check size={14} />
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition"
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
          <h3 className="threshold-view-title flex items-center gap-2">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-800">
              Engine Off Compliance Cutoff:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-slate-500">&lt;</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                className="w-20 p-2 text-center text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={eocField?.values?.[0]?.value ?? 95}
                disabled={!eocField?.enable || isSaving}
                onChange={(e) => handlePercentageChange(e.target.value)}
              />
              <span className="text-base font-bold text-slate-600">%</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <span className="text-xs text-blue-900 leading-relaxed">
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

        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 capitalize tracking-normal">
              Selected notification template
            </span>
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
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
          <p className="text-xs text-slate-700 leading-relaxed">
            {eocField?.template || DEFAULT_EOC_TEMPLATES[0]}
          </p>
        </div>
      </div>


    </div>
  );
};

export default EocThresholdView;
