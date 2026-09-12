import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import {
  Star,
  RefreshCw,
  Save,
  Info,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  X,
  Sliders,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { perfAxiosInstance } from "../../../api/axiosClient";
import { useAuthStore } from "../../../store/authStore";

// --- Types ---------------------------------------------------------------------
export interface Condition {
  excused: boolean;
  unexcused: boolean;
}

export interface DriverRatingType {
  name: string;
  max: string;
  min: string;
  isMaxEditable: boolean;
  isMinEditable: boolean;
  weightage: number | string;
  higherIsBetter: boolean;
  condition?: Condition;
  callout_types?: string[];
}

export interface WeightageData {
  _id?: string;
  company_id?: string;
  weightages: DriverRatingType[];
  scale: number; // 1 for 10-point scale, 10 for 100-point scale
  rating_in_scorecard: boolean;
  ranking_in_scorecard: boolean;
}

// --- Helpers ------------------------------------------------------------------
const percentageFields = ["cdf", "dcr", "pod", "swc_cc", "eoc", "pps"];

const getLabel = (name: string): string => {
  if (name.toLowerCase() === "swc_cc") return "SWC CC";
  if (name.toLowerCase() === "eoc") return "EOC";
  if (name.toLowerCase() === "pps") return "PPS";
  if (name.toLowerCase() === "dcr") return "DCR";
  if (name.toLowerCase() === "spr") return "SPR";
  if (name.toLowerCase() === "cdf") return "CDF";
  if (name.toLowerCase() === "pod") return "POD";
  if (name.toLowerCase() === "fico") return "FICO";

  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const calculateTotalWeightage = (items: DriverRatingType[]): number => {
  let total = 0;
  items?.forEach((item) => {
    total += Number(item.weightage) || 0;
  });
  return Number(total.toFixed(2));
};

const formatNumber = (value: number): string => {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
};

const RATING_SCALE_BANDS = [
  { scale_10: "0.0 - 4.0", scale_100: "00 - 40", color: "var(--ads-red)" },
  { scale_10: "4.1 - 6.0", scale_100: "41 - 60", color: "var(--ads-amber)" },
  { scale_10: "6.1 - 8.0", scale_100: "61 - 80", color: "var(--ads-green)" },
  { scale_10: "8.1 - 10",  scale_100: "81 - 100", color: "var(--ads-blue)" },
];

const DEFAULT_CALLOUT_OPTIONS = [
  "Sick / Medical",
  "Personal Emergency",
  "Transportation Issue",
  "Severe Weather",
  "Family Emergency",
  "Bereavement",
  "Unexcused Absence",
  "No Call No Show",
];

// --- Props ---------------------------------------------------------------------
interface Props {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const DriverRatingSettingsPanel: FC<Props> = ({ onNotification }) => {
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [scaleSwitching, setScaleSwitching] = useState(false);
  const [ratingPermissionLoading, setRatingPermissionLoading] = useState(false);

  // Driver rating company enabled state
  const [isDriverRatingEnabled, setIsDriverRatingEnabled] = useState<boolean>(true);
  const [disableModalOpen, setDisableModalOpen] = useState<boolean>(false);

  // Data states
  const [scaleRating, setScaleRating] = useState<boolean>(true); // true = 10 pt scale, false = 100 pt scale
  const [ratingData, setRatingData] = useState<WeightageData | null>(null);
  const [data, setData] = useState<DriverRatingType[]>([]);

  // Callout popover menu state
  const [calloutMenuAnchorIndex, setCalloutMenuAnchorIndex] = useState<number | null>(null);
  const [availableCalloutTypes, setAvailableCalloutTypes] = useState<string[]>(DEFAULT_CALLOUT_OPTIONS);

  // Fetch live weightages and rating configuration
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await perfAxiosInstance.get("driver_rating/v2/weightage");
      if (res.status === 200) {
        const d: WeightageData = res.data?.data ?? {};
        setRatingData(d);
        const wList = d.weightages ?? [];
        setData(wList);

        const totalW = calculateTotalWeightage(wList);
        setScaleRating(totalW <= 10);

        if (user?.company?.driver_rating !== undefined) {
          setIsDriverRatingEnabled(Boolean(user.company.driver_rating));
        }
      } else {
        throw new Error(res.data?.message ?? "Failed to fetch driver rating data");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to load driver rating settings", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [user, onNotification]);

  // Fetch callout types for callouts metric
  useEffect(() => {
    fetchData();

    // Optionally fetch dynamic callout options from attendance if available
    perfAxiosInstance
      .get("attendance/v2/callout_types")
      .then((res) => {
        if (res.status === 200 && Array.isArray(res.data?.data?.options)) {
          setAvailableCalloutTypes(res.data.data.options);
        }
      })
      .catch(() => {
        // Fallback already pre-initialized
      });
  }, [fetchData]);

  // --- Calculations -----------------------------------------------------------
  const weightagesCount = useMemo(() => {
    return calculateTotalWeightage(data);
  }, [data]);

  const hasEmptyWeightage = useMemo(() => {
    return data.some((item) => String(item.weightage ?? "").trim() === "");
  }, [data]);

  const isDataUnchanged = useMemo(() => {
    if (data && ratingData?.weightages) {
      return JSON.stringify(data) === JSON.stringify(ratingData.weightages);
    }
    return false;
  }, [data, ratingData]);

  const maxPoints = scaleRating ? 10 : 100;
  const isPointsOverLimit = weightagesCount > maxPoints;
  const isPointsValid = scaleRating ? weightagesCount === 10 : weightagesCount === 100;

  // --- Change Handlers --------------------------------------------------------
  const handleChange = ({
    changeKey,
    changeValue,
    index,
  }: {
    changeKey: string;
    changeValue: string | Condition | string[];
    index: number;
  }) => {
    setData((prev) =>
      prev.map((el, i) => {
        if (i === index) {
          return {
            ...el,
            [changeKey]: changeValue,
          };
        }
        return el;
      })
    );
  };

  // --- Toggle Driver Rating On / Off ------------------------------------------
  const handleToggleRatingPermission = async (enable: boolean) => {
    setRatingPermissionLoading(true);
    try {
      const res = await perfAxiosInstance.patch("driver_rating/v2/update_rating_permisson", {
        driver_rating: enable,
      });

      if (res.status === 200) {
        setIsDriverRatingEnabled(enable);
        setDisableModalOpen(false);
        onNotification({
          text: `Driver rating ${enable ? "enabled" : "disabled"} successfully!`,
          type: "success",
        });
      } else {
        throw new Error(res.data?.message ?? "Permission update failed");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to update driver rating permission", type: "error" });
    } finally {
      setRatingPermissionLoading(false);
    }
  };

  // --- Switch Scale (10 pt vs 100 pt) -----------------------------------------
  const handleSwitchScale = async () => {
    setScaleSwitching(true);
    try {
      const res = await perfAxiosInstance.patch("driver_rating/v2/rating_scale");
      if (res.status === 200) {
        const updatedWeightages = res.data?.data?.weightages;
        if (updatedWeightages) {
          setData(updatedWeightages);
        }
        setScaleRating((prev) => !prev);
        onNotification({ text: "Switched rating scale successfully!", type: "success" });
      } else {
        throw new Error(res.data?.message ?? "Scale switch failed");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to switch rating scale", type: "error" });
    } finally {
      setScaleSwitching(false);
    }
  };

  // --- Toggle Scorecard Display Options ---------------------------------------
  const handleScorecardOptionChange = async (key: "rating_in_scorecard" | "ranking_in_scorecard", checked: boolean) => {
    try {
      const res = await perfAxiosInstance.patch("driver_rating/v2/rating_in_scorecard", {
        [key]: checked,
      });

      if (res.status === 200) {
        setRatingData((prev) => (prev ? { ...prev, [key]: checked } : prev));
        const label =
          key === "rating_in_scorecard"
            ? "Show Driver Rating in Scorecard"
            : "Show Rank in Scorecard";
        onNotification({
          text: `${label} ${checked ? "enabled" : "disabled"} successfully!`,
          type: "success",
        });
      } else {
        throw new Error(res.data?.message ?? "Failed to update scorecard setting");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to update scorecard setting", type: "error" });
    }
  };

  // --- Save Weightages --------------------------------------------------------
  const handleSaveRating = async () => {
    if (!isPointsValid) {
      onNotification({
        text: `Total weightages must equal exactly ${maxPoints} points before saving`,
        type: "error",
      });
      return;
    }
    if (hasEmptyWeightage) {
      onNotification({ text: "Weightage cannot be empty for any metric", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await perfAxiosInstance.patch("driver_rating/v2/weightage", {
        weightage: data,
      });

      if (res.status === 200) {
        setRatingData((prev) => (prev ? { ...prev, weightages: data } : prev));
        onNotification({ text: "Driver rating weightages updated successfully!", type: "success" });
      } else {
        throw new Error(res.data?.message ?? "Failed to save driver rating");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to save driver rating", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // --- Reset to Defaults ------------------------------------------------------
  const handleResetToDefaults = async () => {
    setResetting(true);
    try {
      const res = await perfAxiosInstance.patch("driver_rating/v2/weightage_reset");
      if (res.status === 200) {
        const resetData = res.data?.data?.weightages;
        if (resetData) {
          setData(resetData);
          setRatingData((prev) => (prev ? { ...prev, weightages: resetData } : prev));
        }
        onNotification({ text: "Driver rating reset to default weightages and scales!", type: "success" });
      } else {
        throw new Error(res.data?.message ?? "Reset failed");
      }
    } catch (e: any) {
      onNotification({ text: e.message ?? "Failed to reset driver rating", type: "error" });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Decide how much each performance metric contributes to create driver tier ratings and scorecards
        </p>

        {/* Header Action Buttons */}
        <div className="settings-panel-intro-actions">
          {/* Driver Rating Enable/Disable Switch */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
              padding: "5px var(--ads-s3)",
              background: "rgba(0, 0, 0, 0.03)",
              border: "1px solid var(--ads-hairline)",
              borderRadius: "var(--ads-r-pill)",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "-0.005em",
                color: "var(--ads-ink-secondary)",
              }}
            >
              Driver Rating
            </span>
            <label className="custom-blue-switch" title="Enable or disable driver rating">
              <input
                type="checkbox"
                checked={isDriverRatingEnabled}
                disabled={ratingPermissionLoading}
                aria-label="Enable driver rating"
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  if (!isChecked) {
                    setDisableModalOpen(true);
                  } else {
                    handleToggleRatingPermission(true);
                  }
                }}
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Save Rating Primary Button */}
          <button
            type="button"
            className="btn-blue-primary btn-sm"
            onClick={handleSaveRating}
            disabled={
              !isDriverRatingEnabled ||
              saving ||
              isDataUnchanged ||
              hasEmptyWeightage ||
              !isPointsValid
            }
            style={{ color: "#FFFFFF" }}
          >
            <Save size={14} style={{ color: "#FFFFFF" }} />
            <span style={{ color: "#FFFFFF" }}>{saving ? "Saving..." : "Save Rating"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw size={24} className="animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading driver rating parameters...</span>
        </div>
      ) : (
        <>
          {/* Info Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
              padding: "var(--ads-s3) var(--ads-s4)",
              fontSize: "0.75rem",
              lineHeight: 1.5,
              color: "var(--ads-ink-secondary)",
              background: "var(--ads-blue-tint)",
              border: "1px solid transparent",
              borderRadius: "var(--ads-r-md)",
            }}
          >
            <Info size={15} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
            <span>
              You can decide how much each metric should contribute to create ratings for drivers. Adjust individual weightages, scales, and conditions below.
            </span>
          </div>

          {isDriverRatingEnabled && (
            <>
              {/* 1. Scale Rating & Point Allocation Banner */}
              <div className="settings-card mt-3 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50 border border-slate-200">
                {/* Left: Switch Scale & Points Remaining */}
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <span className="text-xs font-bold capitalize text-slate-500 tracking-normal">
                      Total allocated
                    </span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {weightagesCount} Points
                    </div>
                    {isPointsOverLimit ? (
                      <span className="text-xs font-bold text-red-600 mt-0.5 inline-block">
                        The total cannot exceed {maxPoints} points!
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">
                        {formatNumber(maxPoints - weightagesCount)} points remaining
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-gray-secondary btn-sm"
                    onClick={handleSwitchScale}
                    disabled={scaleSwitching}
                    title="Toggle between 10-point and 100-point rating calculation scale"
                  >
                    <RefreshCw size={13} className={scaleSwitching ? "animate-spin" : ""} />
                    <span>
                      {scaleRating ? "Switch to 100 point scale" : "Switch to 10 point scale"}
                    </span>
                  </button>
                </div>

                {/* Right: Driver Rating Scale Legend */}
                <div className="flex flex-col items-start md:items-end gap-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
                  <span className="text-xs font-bold capitalize text-slate-500 tracking-normal">
                    Rating tier thresholds ({scaleRating ? "10 Pt" : "100 Pt"})
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {RATING_SCALE_BANDS.map((band, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: band.color,
                          color: "#FFFFFF",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          letterSpacing: "-0.005em",
                          padding: "3px 9px",
                          borderRadius: "var(--ads-r-pill)",
                        }}
                      >
                        {scaleRating ? band.scale_10 : band.scale_100}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Scorecard Display Checkboxes */}
              <div className="settings-card mt-3 p-4 flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    checked={Boolean(ratingData?.rating_in_scorecard)}
                    onChange={(e) =>
                      handleScorecardOptionChange("rating_in_scorecard", e.target.checked)
                    }
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Show Driver Rating in Scorecard Image
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    checked={Boolean(ratingData?.ranking_in_scorecard)}
                    onChange={(e) =>
                      handleScorecardOptionChange("ranking_in_scorecard", e.target.checked)
                    }
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Show Rank in Scorecard Image or Scorecard Via Link
                  </span>
                </label>
              </div>

              {/* 3. Driver Metrics Table */}
              <div className="settings-card mt-3 overflow-hidden">
                {/* Table Header Strip */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--ads-s4)",
                    padding: "var(--ads-s3) var(--ads-s4)",
                    background: "rgba(0, 0, 0, 0.02)",
                    borderBottom: "1px solid var(--ads-hairline)",
                  }}
                >
                  <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                    <span className="col-span-4 text-xs font-bold text-slate-500 capitalize tracking-normal">
                      Metrics
                    </span>
                    <span className="col-span-3 text-xs font-bold text-slate-500 capitalize tracking-normal">
                      Weightages
                    </span>
                    <span className="col-span-5 text-xs font-bold text-slate-500 capitalize tracking-normal flex items-center gap-1">
                      <span>Possible scale</span>
                      <span
                        title="You can adjust your upper or lower value according to your preference."
                        className="cursor-help text-blue-600"
                      >
                        <Info size={13} />
                      </span>
                    </span>
                  </div>

                  {/* Reset Button */}
                  <button
                    type="button"
                    className="btn-gray-secondary btn-sm flex-shrink-0"
                    onClick={handleResetToDefaults}
                    disabled={resetting || isDataUnchanged}
                    title="Revert to standard default weightages and possible scales"
                  >
                    <RotateCcw size={13} className={resetting ? "animate-spin" : ""} />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Metrics Rows */}
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {data.map((metric, idx) => {
                    const isWeightageEmpty = String(metric.weightage ?? "").trim() === "";
                    const isExceedLimit = scaleRating
                      ? Number(metric.weightage) > 10
                      : Number(metric.weightage) > 100;
                    const isWeightageError = isWeightageEmpty || isExceedLimit;
                    const isPercentage = percentageFields.includes(metric.name.toLowerCase());

                    return (
                      <div
                        key={`${metric.name}-${idx}`}
                        className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col gap-2"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Col 1: Metric Label & Callout Multi-Select */}
                          <div className="col-span-4 flex items-center gap-2">
                            {metric.name.toLowerCase() === "callouts" ? (
                              <div className="relative">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 shadow-xs"
                                  onClick={() =>
                                    setCalloutMenuAnchorIndex(
                                      calloutMenuAnchorIndex === idx ? null : idx
                                    )
                                  }
                                >
                                  <span>Callouts</span>
                                  <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                                    {metric.callout_types?.length ?? 0}
                                  </span>
                                  <ChevronDown size={13} className="text-slate-400" />
                                </button>

                                {/* Callout Multi-select Dropdown Popover */}
                                {calloutMenuAnchorIndex === idx && (
                                  <div
                                    className="ads-sheet"
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      top: "100%",
                                      marginTop: "var(--ads-s1)",
                                      width: "16rem",
                                      zIndex: 30,
                                      padding: "var(--ads-s3)",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                                      <span className="font-bold text-slate-800">
                                        Included Callout Types
                                      </span>
                                      <button
                                        type="button"
                                        className="text-slate-400 hover:text-slate-600"
                                        onClick={() => setCalloutMenuAnchorIndex(null)}
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>

                                    {/* All Toggle */}
                                    <button
                                      type="button"
                                      className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-100 font-semibold text-blue-700"
                                      onClick={() => {
                                        const currentTypes = metric.callout_types ?? [];
                                        const allSelected =
                                          currentTypes.length === availableCalloutTypes.length;
                                        handleChange({
                                          changeKey: "callout_types",
                                          changeValue: allSelected ? [] : [...availableCalloutTypes],
                                          index: idx,
                                        });
                                      }}
                                    >
                                      {metric.callout_types?.length === availableCalloutTypes.length ? (
                                        <CheckSquare size={15} className="text-blue-600" />
                                      ) : (
                                        <Square size={15} className="text-slate-400" />
                                      )}
                                      <span>Select All</span>
                                    </button>

                                    {/* Options List */}
                                    <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
                                      {availableCalloutTypes.map((typeStr) => {
                                        const isSelected = metric.callout_types?.includes(typeStr);
                                        return (
                                          <button
                                            key={typeStr}
                                            type="button"
                                            className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-100 text-left text-slate-700"
                                            onClick={() => {
                                              const current = new Set(metric.callout_types ?? []);
                                              if (current.has(typeStr)) current.delete(typeStr);
                                              else current.add(typeStr);
                                              handleChange({
                                                changeKey: "callout_types",
                                                changeValue: Array.from(current),
                                                index: idx,
                                              });
                                            }}
                                          >
                                            {isSelected ? (
                                              <CheckSquare size={15} className="text-blue-600 flex-shrink-0" />
                                            ) : (
                                              <Square size={15} className="text-slate-400 flex-shrink-0" />
                                            )}
                                            <span className="truncate">{typeStr}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-800">
                                {getLabel(metric.name)}
                              </span>
                            )}
                          </div>

                          {/* Col 2: Weightage Input */}
                          <div className="col-span-3">
                            <div className="flex flex-col">
                              <input
                                type="number"
                                step="any"
                                min={0}
                                max={maxPoints}
                                className={`w-28 text-center text-xs font-semibold px-2.5 py-1.5 border rounded-lg outline-none transition-all ${
                                  isWeightageError
                                    ? "border-red-400 bg-red-50 text-red-700 focus:ring-1 focus:ring-red-400"
                                    : "border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                }`}
                                value={metric.weightage}
                                onChange={(e) =>
                                  handleChange({
                                    changeKey: "weightage",
                                    changeValue: e.target.value,
                                    index: idx,
                                  })
                                }
                              />
                              {isWeightageError && (
                                <span className="text-[10px] text-red-600 mt-0.5">
                                  {isWeightageEmpty
                                    ? "Cannot be empty"
                                    : `Max limit ${maxPoints}`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Col 3: Possible Scale (Min - Max & Higher Is Better Icon) */}
                          <div className="col-span-5 flex items-center gap-2">
                            {/* Min Value */}
                            <div className="flex items-center gap-1">
                              {metric.isMinEditable ? (
                                <input
                                  type="number"
                                  step="any"
                                  className="w-20 text-center text-xs font-semibold px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white text-slate-800"
                                  value={metric.min}
                                  onChange={(e) =>
                                    handleChange({
                                      changeKey: "min",
                                      changeValue: e.target.value,
                                      index: idx,
                                    })
                                  }
                                />
                              ) : (
                                <span className="w-20 text-center text-xs font-semibold text-slate-600">
                                  {metric.min}
                                </span>
                              )}
                              {isPercentage && <span className="text-xs text-slate-400">%</span>}
                            </div>

                            <span className="text-slate-400 font-bold">-</span>

                            {/* Max Value */}
                            <div className="flex items-center gap-1">
                              {metric.isMaxEditable ? (
                                <input
                                  type="number"
                                  step="any"
                                  className="w-20 text-center text-xs font-semibold px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white text-slate-800"
                                  value={metric.max}
                                  onChange={(e) =>
                                    handleChange({
                                      changeKey: "max",
                                      changeValue: e.target.value,
                                      index: idx,
                                    })
                                  }
                                />
                              ) : (
                                <span className="w-20 text-center text-xs font-semibold text-slate-600">
                                  {metric.max}
                                </span>
                              )}
                              {isPercentage && <span className="text-xs text-slate-400">%</span>}
                            </div>

                            {/* Direction Indicator Tooltip */}
                            <div className="ml-3">
                              {metric.higherIsBetter ? (
                                <span
                                  className="inline-flex items-center text-emerald-600"
                                  title="Higher is better"
                                >
                                  <ArrowUp size={16} />
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center text-amber-600"
                                  title="Lower is better"
                                >
                                  <ArrowDown size={16} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Factor in Conditions (Excused vs Unexcused) */}
                        {metric.condition && (
                          <div className="flex items-center gap-4 pl-2 pt-1 border-t border-dashed border-slate-100 text-xs">
                            <span className="font-semibold text-slate-500">Factor in:</span>
                            {Object.entries(metric.condition).map(([condKey, isChecked]) => (
                              <label
                                key={condKey}
                                className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700"
                              >
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const nextChecked = e.target.checked;
                                    const otherKey = condKey === "excused" ? "unexcused" : "excused";
                                    if (!nextChecked && metric.condition?.[otherKey] === false) {
                                      onNotification({
                                        text: "At least one condition (excused or unexcused) must remain selected!",
                                        type: "error",
                                      });
                                      return;
                                    }

                                    handleChange({
                                      changeKey: "condition",
                                      changeValue: {
                                        ...(metric.condition as Condition),
                                        [condKey]: nextChecked,
                                      },
                                      index: idx,
                                    });
                                  }}
                                />
                                <span className="capitalize">{condKey} Callouts</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Disable Driver Rating Confirmation Modal */}
      {disableModalOpen && (
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
          <div
            className="ads-sheet"
            style={{ maxWidth: "460px", width: "100%", overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--ads-s3)",
                padding: "var(--ads-s5) var(--ads-s6) var(--ads-s4)",
                borderBottom: "1px solid var(--ads-hairline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                <AlertTriangle size={18} style={{ color: "var(--ads-amber)" }} />
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.0625rem",
                    fontWeight: 600,
                    letterSpacing: "-0.014em",
                    color: "var(--ads-ink)",
                  }}
                >
                  Disable Driver Rating
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                title="Close"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--ads-r-sm)",
                  color: "var(--ads-ink-tertiary)",
                  cursor: "pointer",
                }}
                onClick={() => setDisableModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "var(--ads-s5) var(--ads-s6)",
                fontSize: "0.8125rem",
                lineHeight: 1.55,
                color: "var(--ads-ink-secondary)",
              }}
            >
              <p style={{ margin: 0 }}>
                Disabling the driver rating system will remove rating tiers and ranking calculations from the Scorecard and Scheduler platforms.
              </p>
              <p style={{ margin: "var(--ads-s2) 0 0", color: "var(--ads-ink-tertiary)" }}>
                Are you sure you want to disable driver ratings for your company?
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
                className="btn-gray-secondary btn-sm"
                onClick={() => setDisableModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-primary btn-sm"
                onClick={() => handleToggleRatingPermission(false)}
                disabled={ratingPermissionLoading}
              >
                <span>{ratingPermissionLoading ? "Disabling..." : "Disable Rating"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverRatingSettingsPanel;
