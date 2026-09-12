import React, { FC, useState, useEffect } from "react";
import { Save, ChevronDown, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import {
  thresholdApi,
  ThresholdField,
  ScorecardSendOptions,
  CompanionThreshold,
} from "../../../../api/thresholdApi";
import ThresholdMetricRow from "../components/ThresholdMetricRow";
import ColorLegendBar from "../components/ColorLegendBar";
import CollapseMetricRow from "../components/CollapseMetricRow";
import ScorecardSendOptionModal from "../components/ScorecardSendOptionModal";
import ThresholdLoader from "../components/ThresholdLoader";

interface ScorecardThresholdViewProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

const REMOVE_FIELDS = new Set(["name", "transporter_id"]);
const SINGLE_INPUT_FIELDS = new Set(["overall_tier", "key_focus_area"]);

const SEND_OPTION_LABELS: Record<ScorecardSendOptions, string> = {
  scorecard_lmd: "Scorecard by (LMD) Image",
  scorecard_image: "Scorecard by Image",
  scorecard_link: "Scorecard by Web Link",
};

export const ScorecardThresholdView: FC<ScorecardThresholdViewProps> = ({
  onNotification,
}) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<ThresholdField[]>([]);
  const [initialData, setInitialData] = useState<ThresholdField[]>([]);
  const [sendType, setSendType] = useState<ScorecardSendOptions>("scorecard_lmd");
  const [template, setTemplate] = useState<string>("");
  const [companionThresholds, setCompanionThresholds] = useState<CompanionThreshold[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWeeklyThreshold = async () => {
    setLoading(true);
    try {
      const res = await thresholdApi.getThreshold("weekly");
      const doc = res?.data;
      if (doc) {
        const thresholdList = Array.isArray(doc.threshold) ? doc.threshold : [];
        setData(thresholdList);
        setInitialData(JSON.parse(JSON.stringify(thresholdList)));
        if (doc.scorecard_type) setSendType(doc.scorecard_type);
        if (doc.template) setTemplate(doc.template);
      }

      const meta = res?.metadata?.data;
      if (Array.isArray(meta)) {
        setCompanionThresholds(meta);
      }
    } catch (err: any) {
      console.warn("Could not fetch weekly threshold:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyThreshold();
  }, []);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(initialData);

  const handleMetricChange = ({
    key,
    changeKey,
    changeValue,
  }: {
    key: string;
    changeKey: "values" | "order" | "enable";
    changeValue: any;
  }) => {
    const updated = data.map((item) => {
      if (item.field === key) {
        return {
          ...item,
          [changeKey]: changeValue,
        };
      }
      return item;
    });

    setData(updated);

    // In generic image or link mode, auto-persist toggles if user isn't in lmd edit mode
    if (sendType !== "scorecard_lmd" && changeKey === "enable") {
      thresholdApi
        .updateThreshold("weekly", { threshold: updated })
        .then(() => {
          setInitialData(JSON.parse(JSON.stringify(updated)));
          onNotification({
            text: `Scorecard metric ${changeValue ? "enabled" : "disabled"} successfully`,
            type: "success",
          });
        })
        .catch((err) => {
          onNotification({
            text: err?.response?.data?.message || "Failed to update metric state",
            type: "error",
          });
        });
    }
  };

  const handleSaveThreshold = async () => {
    setIsSaving(true);
    try {
      await thresholdApi.updateThreshold("weekly", {
        threshold: data,
      });
      setInitialData(JSON.parse(JSON.stringify(data)));
      onNotification({
        text: "Weekly Scorecard thresholds saved successfully!",
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to save weekly thresholds",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSendOption = async (newOption: ScorecardSendOptions, newTemplate?: string) => {
    try {
      await thresholdApi.enableDisableThreshold({
        type: "weekly",
        scorecard_type: newOption,
        template: newTemplate || template,
      });
      setSendType(newOption);
      if (newTemplate) setTemplate(newTemplate);
      onNotification({
        text: `Scorecard format updated to: ${SEND_OPTION_LABELS[newOption]}`,
        type: "success",
      });
      // Refetch to refresh companion thresholds if changed to link
      fetchWeeklyThreshold();
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to update scorecard format",
        type: "error",
      });
    }
  };

  const handleCompanionActiveChange = async (
    type: "pod" | "cdf" | "delivery_concessions",
    active: boolean
  ) => {
    try {
      await thresholdApi.enableDisableThreshold({
        type,
        enable: active,
      });
      setCompanionThresholds((prev) =>
        prev.map((c) => (c.type === type ? { ...c, is_active: active } : c))
      );
      onNotification({
        text: `${type.toUpperCase()} companion report ${active ? "enabled" : "disabled"}`,
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to toggle companion report",
        type: "error",
      });
    }
  };

  const handleCompanionMetricChange = async (
    type: "pod" | "cdf" | "delivery_concessions",
    key: string,
    enable: boolean
  ) => {
    const targetComp = companionThresholds.find((c) => c.type === type);
    if (!targetComp) return;

    const updatedList = targetComp.threshold.map((item) =>
      item.field === key ? { ...item, enable } : item
    );

    try {
      await thresholdApi.updateThreshold(type, {
        threshold: updatedList,
      });
      setCompanionThresholds((prev) =>
        prev.map((c) => (c.type === type ? { ...c, threshold: updatedList } : c))
      );
      onNotification({
        text: `${key} metric updated successfully`,
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to update sub-metric",
        type: "error",
      });
    }
  };

  if (loading) {
    return <ThresholdLoader title="Loading Weekly Scorecard Thresholds from microservice..." />;
  }

  const visibleMetrics = data.filter((item) => !REMOVE_FIELDS.has(item.field));

  return (
    <div className="threshold-view-shell">
      {/* Top Header & Actions */}
      <div className="threshold-view-header">
        <div>
          <h3 className="threshold-view-title flex items-center gap-2">
            <span>Set Metrics for Weekly Scorecard</span>
            <span className="badge-custom blue">Live API</span>
          </h3>
          <p className="threshold-view-subtext">
            Configure delivery, safety, and customer metric targets used to evaluate driver performance
          </p>
        </div>

        <div className="threshold-view-actions">
          <button
            type="button"
            className="btn-outline-secondary btn-sm"
            onClick={fetchWeeklyThreshold}
            title="Reload from microservice"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          {sendType === "scorecard_lmd" && (
            <button
              type="button"
              className="btn-blue-primary btn-sm"
              disabled={isSaving || !hasChanges || data.length === 0}
              onClick={handleSaveThreshold}
              style={{ color: "#FFFFFF" }}
              title="Save changes to performance microservice"
            >
              <Save size={15} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>
                {isSaving ? "Saving..." : "Save Threshold"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* "Scorecard will be sent as" format selector */}
      <div className="threshold-format-selector-row">
        <span className="threshold-format-label">Scorecard will be sent as:</span>
        <button
          type="button"
          className="threshold-format-trigger"
          onClick={() => setIsModalOpen(true)}
          title="Change how drivers receive scorecards"
        >
          <span className="font-semibold text-slate-800">
            {SEND_OPTION_LABELS[sendType] || "Scorecard by Image"}
          </span>
          <ChevronDown size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Color Code Legend */}
      <ColorLegendBar
        type={sendType === "scorecard_lmd" ? "scorecard_report" : "lmd_report"}
        className="my-3"
      />

      {/* Metrics List */}
      {visibleMetrics.length > 0 ? (
        <div className="threshold-metrics-list">
          {visibleMetrics.map((field) => (
            <ThresholdMetricRow
              key={field.field}
              field={field}
              isActive={sendType === "scorecard_lmd"}
              singleInputField={SINGLE_INPUT_FIELDS}
              onChange={handleMetricChange}
            />
          ))}

          {/* Companion Collapsible Accordions (when sent by link) */}
          {sendType === "scorecard_link" &&
            companionThresholds.map((companion) => (
              <CollapseMetricRow
                key={companion.type}
                type={companion.type}
                isActive={companion.is_active}
                threshold={companion.threshold}
                onActiveChange={handleCompanionActiveChange}
                onChange={({ key, changeValue }) =>
                  handleCompanionMetricChange(companion.type, key, Boolean(changeValue))
                }
              />
            ))}
        </div>
      ) : (
        <div className="threshold-empty-state">
          <AlertCircle size={32} className="text-slate-400 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No Metrics Available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
            Please upload the Weekly Scorecard report to generate and configure metric thresholds.
          </p>
        </div>
      )}

      {/* Send Option Selection Modal */}
      <ScorecardSendOptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentOption={sendType}
        currentTemplate={template}
        onSave={handleSaveSendOption}
      />
    </div>
  );
};

export default ScorecardThresholdView;
