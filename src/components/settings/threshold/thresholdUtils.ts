export interface LegendItem {
  value: string;
  color: string;
}

export type LegendType = "scorecard" | "lmd" | "scorecard_report" | "lmd_report";

const baseLegends = {
  scorecard: [
    { value: "Poor", color: "#F87171" },
    { value: "No Data / Neutral", color: "#FBBF24" },
    { value: "Good", color: "#34D399" },
  ],
  lmd: [
    { value: "Platinum", color: "#005C87" },
    { value: "Gold", color: "#8A6800" },
    { value: "Silver", color: "#5F6E7A" },
    { value: "Bronze", color: "#AE4500" },
    { value: "No Data", color: "#94A3B8" },
  ],
} as const;

export const getColorLegend = (type: LegendType): readonly LegendItem[] => {
  switch (type) {
    case "scorecard":
      return baseLegends.scorecard;
    case "lmd":
      return baseLegends.lmd;
    case "scorecard_report":
      return [...baseLegends.scorecard, { value: "Non-color-coded data", color: "#334155" }];
    case "lmd_report":
      return [...baseLegends.lmd, { value: "Non-color-coded data", color: "#334155" }];
    default:
      return baseLegends.scorecard;
  }
};

const labelMap: Record<string, string> = {
  cdf_dpmo: "Customer Delivery Feedback DPMO",
  customer_delivery_feedback_dpmo: "Customer Delivery Feedback DPMO",
  cdf: "Customer Delivery Feedback",
  ced: "Customer Escalation Defect",
  dcr: "Delivery Completion Rate",
  dar: "Delivered and Received",
  pod: "Photo-On-Delivery",
  pps: "PPS",
  eoc: "EOC (Engine Off Compliance)",
  rts: "Return to Station",
  dvic: "DVIC",
  swc_cc: "Contact Compliance",
  swc_ad: "Attended Delivery",
  dnrs: "Delivered Not Received",
  dnr: "Delivered Not Received",
  "delivery_concessions_(dnr)": "Delivery Concessions (DNR)",
  high_low_performer_status: "High/Low Performer Status",
  cdf_score: "CDF Score",
  swc_sc: "SWC-SC",
  pod_opps: "POD Opps.",
  cc_opps: "CC Opps.",
  psb: "Pickup Success Behaviors",
  sign_signal_violations_rate: "Sign/Signal Violations Rate",
  followed_instructi_ons: "Followed Instructions",
  "Followed instructi-ons": "Followed Instructions",
  "Driver mishandled package": "Driver Mishandled Package",
  "Never received delivery": "Never Received Delivery",
  "Delivered to wrong address": "Delivered to Wrong Address",
  dsb: "Delivery Success Behaviors",
  dsb_dnr: "Delivery Success Behaviors DNR",
  customer_escalation_defect_dpmo: "Customer Escalation Defect DPMO",
  "#_total_pps_followed": "# Total PPS Followed",
  "%_total_pps_followed": "% Total PPS Followed",
  invalid_pps: "Invalid PPS",
  "%_invalid_pps": "% Invalid PPS",
  pps_compliance: "PPS Compliance",
  "%_pps_compliance": "% PPS Compliance",
  "comprehensive_audit_(cas)": "Comprehensive Audit (CAS)",
  breach_of_contract: "Breach of Contract",
  vin: "VIN / Vehicle Name",
  "pps_compliance_(%_)": "PPS Compliance (%)",
  "missing_parking_brake_(%_)": "Missing Parking Brake (%)",
  missing_parking_brake_stops: "Missing Parking Brake Stops",
  "missing_gear_in_park_(%_)": "Missing Gear in Park (%)",
  missing_gear_in_park_stops: "Missing Gear in Park Stops",
  total_evaluated_stops: "Total Evaluated Stops",
  dc_dpmo: "Delivery Completion DPMO",
  packages_delivered: "Packages Delivered",
  delivered: "Packages Delivered",
  fico: "FICO Metric",
  fico_metric: "FICO Metric",
  overall_standing: "Overall Standing",
  overall_tier: "Overall Tier",
  key_focus_area: "Key Focus Area",
  on_road_safety_score: "On-Road Safety Score",
  overall_quality_score: "Overall Quality Score",
  fico_tier: "FICO Tier",
  speeding_event_rate_tier: "Speeding Event Rate Tier",
  seatbelt_off_rate_tier: "Seatbelt-Off Rate Tier",
  distractions_rate_tier: "Distractions Rate Tier",
  sign_signal_violations_rate_tier: "Sign/Signal Violations Rate Tier",
  following_distance_rate_tier: "Following Distance Rate Tier",
  cdf_dpmo_tier: "CDF DPMO Tier",
  ced_tier: "CED Tier",
  dcr_tier: "DCR Tier",
  dsb_dpmo_tier: "DSB DPMO Tier",
  pod_tier: "POD Tier",
  psb_tier: "PSB Tier",
};

const forceUppercase = new Set(["dnr", "pod", "cdf", "dpmo", "ced", "dcr", "dsb", "psb", "rts", "dsp", "dvic", "sms", "dc", "da", "fico"]);

export const getMetricLabel = (field: string): string => {
  if (!field) return "";
  let normalized = field.trim();
  if (normalized.startsWith("da_") && normalized !== "da_selected_rts_code") {
    normalized = normalized.slice(3);
  }
  if (labelMap[normalized]) {
    return labelMap[normalized];
  }
  if (labelMap[field]) {
    return labelMap[field];
  }

  // Capitalize words separated by underscore or spaces
  const parts = normalized.split(/[_\s]+/);
  return parts
    .map((part) => {
      const lower = part.toLowerCase();
      if (forceUppercase.has(lower)) {
        return lower.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
};

export const FIELD_RENAME_MAP: Record<string, string> = {
  delivered: "packages_delivered",
  fico: "fico_metric",
  customer_escalation_defect: "ced",
  customer_delivery_feedback: "cdf_dpmo",
  dnrs: "dnr",
  seatbelt_off_rate: "seatbelt_off_rate_(per_trip)",
  speeding_event_rate: "speeding_event_rate_(per_trip)",
  distraction: "distractions_rate_(per_trip)",
  distractions_rate: "distractions_rate_(per_trip)",
  following_distance_rate: "following_distance_rate_(per_trip)",
  sign_signal_violations_rate: "sign_signal_violations_rate_(per_trip)",
  dsb: "dsb_dpmo",
  swc_pod: "pod",
};

export const REVERSE_RENAME_MAP = new Map(
  Object.entries(FIELD_RENAME_MAP).map(([oldField, newField]) => [newField, oldField])
);
