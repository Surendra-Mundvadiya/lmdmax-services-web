import React, { FC, useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle } from "lucide-react";
import { thresholdApi, ThresholdField } from "../../../../api/thresholdApi";
import ThresholdMetricRow from "../components/ThresholdMetricRow";
import ColorLegendBar from "../components/ColorLegendBar";
import ThresholdLoader from "../components/ThresholdLoader";

interface PpsThresholdViewProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

const REMOVE_FIELDS = new Set(["name", "transporter_id"]);

export const PpsThresholdView: FC<PpsThresholdViewProps> = ({ onNotification }) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<ThresholdField[]>([]);
  const [initialData, setInitialData] = useState<ThresholdField[]>([]);

  const fetchPpsThreshold = async () => {
    setLoading(true);
    try {
      const res = await thresholdApi.getThreshold("pps_report");
      const list = Array.isArray(res?.data?.threshold) ? res.data.threshold : [];
      setData(list);
      setInitialData(JSON.parse(JSON.stringify(list)));
    } catch (err: any) {
      console.warn("Could not fetch PPS threshold:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPpsThreshold();
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
    setData((prev) =>
      prev.map((el) => (el.field === key ? { ...el, [changeKey]: changeValue } : el))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await thresholdApi.updateThreshold("pps_report", {
        threshold: data,
      });
      setInitialData(JSON.parse(JSON.stringify(data)));
      onNotification({
        text: "Weekly PPS Report thresholds saved successfully!",
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to save PPS thresholds",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <ThresholdLoader title="Loading Weekly PPS Report thresholds..." />;
  }

  const visibleMetrics = data.filter((item) => !REMOVE_FIELDS.has(item.field));

  return (
    <div className="threshold-view-shell">
      {/* Header */}
      <div className="threshold-view-header">
        <div>
          <h3 className="threshold-view-title flex items-center gap-2">
            <span>Set Threshold for Weekly PPS Report</span>
            <span className="badge-custom blue">Live API</span>
          </h3>
          <p className="threshold-view-subtext">
            Configure Proper Parking Sequence (emergency brake & gear in park) safety benchmarks
          </p>
        </div>

        <div className="threshold-view-actions">
          <button
            type="button"
            className="btn-outline-secondary btn-sm"
            onClick={fetchPpsThreshold}
            title="Reload from microservice"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-blue-primary btn-sm"
            disabled={isSaving || !hasChanges || visibleMetrics.length === 0}
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

      {/* Color Legend */}
      <ColorLegendBar type="scorecard_report" className="my-3" />

      {/* Metrics List */}
      {visibleMetrics.length > 0 ? (
        <div className="threshold-metrics-list">
          {visibleMetrics.map((field) => (
            <ThresholdMetricRow
              key={field.field}
              field={field}
              isActive={true}
              onChange={handleMetricChange}
            />
          ))}
        </div>
      ) : (
        <div className="threshold-empty-state">
          <AlertCircle size={32} className="text-slate-400 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No PPS Metrics Available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
            Please upload the Weekly PPS Report to configure parking sequence threshold benchmarks.
          </p>
        </div>
      )}
    </div>
  );
};

export default PpsThresholdView;
