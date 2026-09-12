import React, { FC, useState, useEffect } from "react";
import { Save, Info, RefreshCw, AlertCircle, AlertTriangle } from "lucide-react";
import { thresholdApi, ThresholdField } from "../../../../api/thresholdApi";
import ThresholdMetricRow from "../components/ThresholdMetricRow";
import ColorLegendBar from "../components/ColorLegendBar";
import ThresholdLoader from "../components/ThresholdLoader";
import { REVERSE_RENAME_MAP } from "../thresholdUtils";

interface DaWeeklyThresholdViewProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

const REMOVE_FIELDS = new Set(["name", "rank", "transporter_id"]);

const SINGLE_INPUT_FIELDS = new Set([
  "key_focus_area",
  "overall_standing",
  "on_road_safety_score",
  "overall_quality_score",
  "fico_tier",
  "speeding_event_rate_tier",
  "seatbelt_off_rate_tier",
  "distractions_rate_tier",
  "sign_signal_violations_rate_tier",
  "following_distance_rate_tier",
  "cdf_dpmo_tier",
  "ced_tier",
  "dcr_tier",
  "dsb_dpmo_tier",
  "pod_tier",
  "psb_tier",
]);

export const DaWeeklyThresholdView: FC<DaWeeklyThresholdViewProps> = ({
  onNotification,
}) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<ThresholdField[]>([]);
  const [initialData, setInitialData] = useState<ThresholdField[]>([]);
  const [weeklyThreshold, setWeeklyThreshold] = useState<ThresholdField[]>([]);
  const [pendingConflictField, setPendingConflictField] = useState<string | null>(null);

  const fetchThresholds = async () => {
    setLoading(true);
    try {
      const [daRes, scRes] = await Promise.all([
        thresholdApi.getThreshold("overview_report").catch(() => thresholdApi.getDaOverviewThreshold()),
        thresholdApi.getThreshold("weekly").catch(() => ({ data: { threshold: [] } })),
      ]);

      const daList = Array.isArray(daRes?.data?.threshold) ? daRes.data.threshold : [];
      setData(daList);
      setInitialData(JSON.parse(JSON.stringify(daList)));

      const scList = Array.isArray(scRes?.data?.threshold) ? scRes.data.threshold : [];
      setWeeklyThreshold(scList);
    } catch (err: any) {
      console.warn("Could not fetch DA weekly threshold:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(initialData);

  const applyChange = (key: string, changeKey: "values" | "order" | "enable", changeValue: any) => {
    setData((prev) =>
      prev.map((el) => (el.field === key ? { ...el, [changeKey]: changeValue } : el))
    );
  };

  const handleMetricChange = ({
    key,
    changeKey,
    changeValue,
  }: {
    key: string;
    changeKey: "values" | "order" | "enable";
    changeValue: any;
  }) => {
    // If enabling a metric, check if it's already enabled in Scorecard threshold
    if (changeKey === "enable" && changeValue === true) {
      const mappedKey = REVERSE_RENAME_MAP.get(key) ?? key;
      const foundInWeekly = weeklyThreshold.find(
        (el) => el.field === mappedKey || el.field === key
      );

      if (foundInWeekly?.enable) {
        setPendingConflictField(key);
        return;
      }
    }

    applyChange(key, changeKey, changeValue);
  };

  const handleConfirmConflict = () => {
    if (pendingConflictField) {
      applyChange(pendingConflictField, "enable", true);
      setPendingConflictField(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await thresholdApi.updateThreshold("overview_report", {
        threshold: data,
      });
      setInitialData(JSON.parse(JSON.stringify(data)));
      onNotification({
        text: "DA Weekly Overview thresholds saved successfully!",
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to save DA Weekly Overview thresholds",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <ThresholdLoader title="Loading DA Weekly Overview thresholds from microservice..." />;
  }

  const visibleMetrics = data.filter((item) => !REMOVE_FIELDS.has(item.field));

  return (
    <div className="threshold-view-shell">
      {/* Header */}
      <div className="threshold-view-header">
        <div>
          <h3
            className="threshold-view-title"
            style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}
          >
            <span>Set Threshold for DA Weekly Overview Report</span>
            <span className="badge-custom blue">Live API</span>
          </h3>
          <p className="threshold-view-subtext">
            Configure DA overview metrics to display in scorecard distributions
          </p>
        </div>

        <div className="threshold-view-actions">
          <button
            type="button"
            className="btn-outline-secondary btn-sm"
            onClick={fetchThresholds}
            title="Reload from microservice"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-blue-primary btn-sm"
            disabled={isSaving || !hasChanges || data.length === 0}
            onClick={handleSave}
            style={{ color: "#FFFFFF" }}
            title="Save changes"
          >
            <Save size={15} style={{ color: "#FFFFFF" }} />
            <span style={{ color: "#FFFFFF" }}>
              {isSaving ? "Saving..." : "Save Threshold"}
            </span>
          </button>
        </div>
      </div>

      {/* Info Callout */}
      <div className="threshold-info-banner">
        <Info size={16} style={{ color: "var(--ads-blue)", flexShrink: 0, marginTop: "2px" }} />
        <span style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "var(--ads-ink-secondary)" }}>
          Select metrics from the DA Weekly Overview Report and send it in the scorecard report as
          per the color key selected below.
        </span>
      </div>

      {/* Color Code Legend */}
      <ColorLegendBar type="lmd_report" />

      {/* Metrics List */}
      {visibleMetrics.length > 0 ? (
        <div className="threshold-metrics-list">
          {visibleMetrics.map((field) => (
            <ThresholdMetricRow
              key={field.field}
              field={field}
              isActive={true}
              singleInputField={SINGLE_INPUT_FIELDS}
              onChange={handleMetricChange}
            />
          ))}
        </div>
      ) : (
        <div className="threshold-empty-state">
          <AlertCircle size={32} style={{ color: "var(--ads-ink-quaternary)", marginBottom: "var(--ads-s2)" }} />
          <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--ads-ink)" }}>
            No Overview Data Available
          </h4>
          <p
            style={{
              margin: "var(--ads-s1) 0 0",
              maxWidth: "24rem",
              textAlign: "center",
              fontSize: "0.8125rem",
              color: "var(--ads-ink-tertiary)",
            }}
          >
            Please upload the DA Weekly Overview report to populate metric threshold options.
          </p>
        </div>
      )}

      {/* Duplicate Metric Conflict Modal */}
      {pendingConflictField && (
        <div
          className="ads-scrim"
          style={{
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--ads-s4)",
          }}
        >
          <div className="ads-sheet" style={{ maxWidth: "460px", width: "100%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                padding: "var(--ads-s5) var(--ads-s6) var(--ads-s4)",
                borderBottom: "1px solid var(--ads-hairline)",
              }}
            >
              <AlertTriangle size={20} style={{ color: "var(--ads-amber)" }} />
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  letterSpacing: "-0.014em",
                  color: "var(--ads-ink)",
                }}
              >
                Duplicate Metric Warning
              </h3>
            </div>
            <div style={{ padding: "var(--ads-s5) var(--ads-s6)" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8125rem",
                  lineHeight: 1.55,
                  color: "var(--ads-ink-secondary)",
                }}
              >
                The metric <strong>{pendingConflictField}</strong> is already enabled in the Weekly
                Scorecard threshold. Enabling it here will result in duplicate data in the scorecard
                sent to the driver.
              </p>
              <p
                style={{
                  margin: "var(--ads-s2) 0 0",
                  fontSize: "0.75rem",
                  color: "var(--ads-ink-tertiary)",
                }}
              >
                Are you sure you want to proceed and enable this metric in DA Weekly Overview?
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "var(--ads-s2)",
                padding: "var(--ads-s4) var(--ads-s6) var(--ads-s5)",
                borderTop: "1px solid var(--ads-hairline)",
              }}
            >
              <button
                type="button"
                className="btn-outline-secondary btn-sm"
                onClick={() => setPendingConflictField(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-blue-primary btn-sm"
                style={{ color: "#FFFFFF" }}
                onClick={handleConfirmConflict}
              >
                <span style={{ color: "#FFFFFF" }}>Proceed Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaWeeklyThresholdView;
