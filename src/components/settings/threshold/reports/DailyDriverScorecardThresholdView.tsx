import React, { FC, useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle, Calendar } from "lucide-react";
import { thresholdApi, DailyThreshold, ThresholdField } from "../../../../api/thresholdApi";
import ThresholdMetricRow from "../components/ThresholdMetricRow";
import ColorLegendBar from "../components/ColorLegendBar";
import ThresholdLoader from "../components/ThresholdLoader";

interface DailyDriverScorecardThresholdViewProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const DailyDriverScorecardThresholdView: FC<DailyDriverScorecardThresholdViewProps> = ({
  onNotification,
}) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<DailyThreshold>({
    previous_day: [],
    "2_days_before": [],
  });
  const [initialData, setInitialData] = useState<DailyThreshold>({
    previous_day: [],
    "2_days_before": [],
  });

  const fetchDailyThreshold = async () => {
    setLoading(true);
    try {
      const res = await thresholdApi.getThreshold<DailyThreshold>("daily");
      const thr = res?.data?.threshold;

      if (thr && typeof thr === "object") {
        const prevDay = Array.isArray(thr.previous_day) ? thr.previous_day : [];
        const twoDays = Array.isArray(thr["2_days_before"]) ? thr["2_days_before"] : [];
        const structured = {
          previous_day: prevDay,
          "2_days_before": twoDays,
        };
        setData(structured);
        setInitialData(JSON.parse(JSON.stringify(structured)));
      }
    } catch (err: any) {
      console.warn("Could not fetch Daily Scorecard threshold:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyThreshold();
  }, []);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(initialData);

  const handleMetricChange = (
    bucket: "previous_day" | "2_days_before",
    key: string,
    changeKey: "values" | "order" | "enable",
    changeValue: any
  ) => {
    setData((prev) => ({
      ...prev,
      [bucket]: prev[bucket].map((el) =>
        el.field === key ? { ...el, [changeKey]: changeValue } : el
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await thresholdApi.updateThreshold("daily", {
        threshold: {
          previous_day: data.previous_day,
          "2_days_before": data["2_days_before"],
        },
      });
      setInitialData(JSON.parse(JSON.stringify(data)));
      onNotification({
        text: "Daily Driver Scorecard thresholds saved successfully!",
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.response?.data?.message || "Failed to save Daily Scorecard thresholds",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <ThresholdLoader title="Loading Daily Driver Scorecard thresholds..." />;
  }

  const hasMetrics = data.previous_day.length > 0 || data["2_days_before"].length > 0;

  return (
    <div className="threshold-view-shell">
      {/* Header */}
      <div className="threshold-view-header">
        <div>
          <h3 className="threshold-view-title flex items-center gap-2">
            <span>Set Threshold for Daily Driver Scorecard</span>
            <span className="badge-custom blue">Live API</span>
          </h3>
          <p className="threshold-view-subtext">
            Configure previous-day and 2-days-prior performance metrics for real-time daily coaching
          </p>
        </div>

        <div className="threshold-view-actions">
          <button
            type="button"
            className="btn-outline-secondary btn-sm"
            onClick={fetchDailyThreshold}
            title="Reload from microservice"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-blue-primary btn-sm"
            disabled={isSaving || !hasChanges || !hasMetrics}
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

      {/* Grouped Buckets */}
      {hasMetrics ? (
        <div className="space-y-6">
          {/* Bucket 1: Previous Day */}
          {data.previous_day.length > 0 && (
            <div className="threshold-bucket-section">
              <div className="threshold-bucket-heading">
                <Calendar size={16} className="text-blue-600" />
                <span>Previous Day Metrics</span>
                <span className="badge-custom gray">{data.previous_day.length}</span>
              </div>
              <div className="threshold-metrics-list">
                {data.previous_day.map((field) => (
                  <ThresholdMetricRow
                    key={`prev_${field.field}`}
                    field={field}
                    isActive={true}
                    onChange={({ key, changeKey, changeValue }) =>
                      handleMetricChange("previous_day", key, changeKey, changeValue)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bucket 2: 2 Days Before */}
          {data["2_days_before"].length > 0 && (
            <div className="threshold-bucket-section">
              <div className="threshold-bucket-heading">
                <Calendar size={16} className="text-blue-600" />
                <span>2 Days Before Metrics</span>
                <span className="badge-custom gray">{data["2_days_before"].length}</span>
              </div>
              <div className="threshold-metrics-list">
                {data["2_days_before"].map((field) => (
                  <ThresholdMetricRow
                    key={`twodays_${field.field}`}
                    field={field}
                    isActive={true}
                    onChange={({ key, changeKey, changeValue }) =>
                      handleMetricChange("2_days_before", key, changeKey, changeValue)
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="threshold-empty-state">
          <AlertCircle size={32} className="text-slate-400 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No Daily Metrics Available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
            Please upload the Daily Driver Scorecard report to configure previous-day thresholds.
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyDriverScorecardThresholdView;
