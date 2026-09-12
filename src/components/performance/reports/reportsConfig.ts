export type ReportCategory = "weekly" | "daily" | "weekly_roster" | "archive";

export interface ReportConfigItem {
  key: string;
  label: string;
  category: ReportCategory;
  type: "weekly" | "daily";
  description: string;
  bulkSend?: boolean;
}

// Queen Account LMD Verified Weekly Reports (matching performance-web-production getWeeklyReportName)
export const WEEKLY_REPORTS: ReportConfigItem[] = [
  {
    key: "current_week_scorecard",
    label: "Current Scorecard",
    category: "weekly",
    type: "weekly",
    description: "Weekly performance scorecard metrics for active drivers",
    bulkSend: true,
  },
  {
    key: "negative_customer_feedback_report",
    label: "Negative Customer Feedback",
    category: "weekly",
    type: "weekly",
    description: "Weekly customer feedback complaints, escalations, and CDF rates",
  },
  {
    key: "photo_on_delivery_quality_report",
    label: "Photo on Delivery (POD) Quality",
    category: "weekly",
    type: "weekly",
    description: "POD photo quality compliance percentages and defective delivery scans",
  },
  {
    key: "proper_parking_sequence_report",
    label: "Proper Parking Sequence (PPS)",
    category: "weekly",
    type: "weekly",
    description: "PPS compliance scores, seatbelt, and emergency brake sequences",
  },
  {
    key: "dsp_scorecards",
    label: "DSP Scorecards",
    category: "weekly",
    type: "weekly",
    description: "Overall DSP station ranking, fantastic plus tier, and station metrics",
  },
  {
    key: "da_weekly_overview_report",
    label: "DA Weekly Overview",
    category: "weekly",
    type: "weekly",
    description: "Weekly driver associate activity, delivery completion, and package metrics",
  },
];

// Queen Account LMD Verified Daily Reports (matching performance-web-production getDailyReportName)
export const DAILY_REPORTS: ReportConfigItem[] = [
  {
    key: "daily_driver_scorecard",
    label: "Daily Driver Scorecard",
    category: "daily",
    type: "daily",
    description: "Daily driver scorecard snapshot and live deliveries",
  },
  {
    key: "all_alert_report",
    label: "All Alerts",
    category: "daily",
    type: "daily",
    description: "Netradyne telematics alerts, speeding, stop sign, and distraction events",
  },
  {
    key: "driver_report",
    label: "Driver",
    category: "daily",
    type: "daily",
    description: "Individual driver detailed safety scores and Netradyne events",
  },
  {
    key: "callouts_report",
    label: "Callouts",
    category: "daily",
    type: "daily",
    description: "Driver absences, callouts, unexcused calloffs, and roster updates",
  },
  {
    key: "attendance_and_extras_report",
    label: "Attendance & Extras",
    category: "daily",
    type: "daily",
    description: "Daily scheduled roster, checked-in drivers, and standby extras",
  },
  {
    key: "rescue_report",
    label: "Rescue",
    category: "daily",
    type: "daily",
    description: "Driver rescues, packages transferred, and rescue assist logs",
  },
  {
    key: "e_mentor_report",
    label: "eMentor",
    category: "daily",
    type: "daily",
    description: "eMentor FICO scores, acceleration, braking, cornering, and speeding",
  },
  {
    key: "driver_safety",
    label: "Driver Safety",
    category: "daily",
    type: "daily",
    description: "Safety infractions, risk rankings, and vehicle safety events",
  },
  {
    key: "driver_delivery",
    label: "Driver Delivery",
    category: "daily",
    type: "daily",
    description: "Daily delivery progress, packages delivered, returns, and DCR rates",
  },
  {
    key: "quality_report",
    label: "Quality",
    category: "daily",
    type: "daily",
    description: "Daily delivery quality defects, scan compliance, and missed packages",
  },
  {
    key: "e_signature_report",
    label: "E-Signature",
    category: "daily",
    type: "daily",
    description: "Document signatures, incident writeups, and driver sign-offs",
  },
  {
    key: "inventory_report",
    label: "Inventory",
    category: "daily",
    type: "daily",
    description: "Daily gas cards, pouches, devices, and uniform item assignments",
  },
  {
    key: "eoc_report",
    label: "EOC",
    category: "daily",
    type: "daily",
    description: "End of cycle returns, unattempted packages, and van check-ins",
  },
  {
    key: "suspended_driver_report",
    label: "Suspended Driver",
    category: "daily",
    type: "daily",
    description: "Drivers currently under temporary suspension or pending investigation",
  },
  {
    key: "negative_customer_feedback",
    label: "Negative Customer Feedback",
    category: "daily",
    type: "daily",
    description: "Customer complaints and negative feedback logged today",
  },
  {
    key: "delivery_concessions",
    label: "Delivery Concessions",
    category: "daily",
    type: "daily",
    description: "Customer concessions, lost packages, and delivered not received (DNR)",
  },
  {
    key: "dvic_report",
    label: "DVIC",
    category: "daily",
    type: "daily",
    description: "Daily vehicle inspection reports, groundings, and van maintenance flags",
  },
  {
    key: "working_device_report",
    label: "Working Device",
    category: "daily",
    type: "daily",
    description: "Status and health of driver handheld delivery rabbit devices",
  },
  {
    key: "inventory_assignment",
    label: "Inventory Assignment",
    category: "daily",
    type: "daily",
    description: "Assignment of keys, gas cards, and scanners to active roster",
  },
  {
    key: "quality_rts_report",
    label: "Delivery Completion DPMO",
    category: "daily",
    type: "daily",
    description: "Return to station quality, DPMO defects, and delivery completion metrics",
    bulkSend: true,
  },
  {
    key: "positive_customer_feedback",
    label: "Positive Customer Feedback",
    category: "daily",
    type: "daily",
    description: "Customer praise, compliment notes, and positive driver delivery feedback",
  },
];

// Queen Account LMD Verified Archived Reports (matching performance-web-production getArchiveReportName)
export const ARCHIVED_REPORTS: ReportConfigItem[] = [
  {
    key: "trailing_week_scorecard",
    label: "Trailing Scorecard",
    category: "archive",
    type: "weekly",
    description: "Trailing multi-week aggregated scorecard performance",
  },
  {
    key: "compare_scorecard_report",
    label: "Compare Scorecard",
    category: "archive",
    type: "weekly",
    description: "Comparative scorecard metrics across previous operating periods",
  },
  {
    key: "customer_feedback_report",
    label: "Customer Feedback",
    category: "archive",
    type: "weekly",
    description: "Historical consolidated customer feedback records",
  },
  {
    key: "work_hour_compliance_report",
    label: "Work Hour Compliance",
    category: "archive",
    type: "weekly",
    description: "Driver work hour compliance, meal breaks, and drive-time logs",
  },
  {
    key: "operation_report",
    label: "Operation",
    category: "archive",
    type: "weekly",
    description: "Historical station operational records and dispatch statistics",
  },
  {
    key: "netradyne_auto_coaching",
    label: "Netradyne Auto Coaching",
    category: "archive",
    type: "daily",
    description: "Automated video safety coaching triggers and driver review status",
  },
];

// Queen Account LMD Verified Weekly Roster Report
export const WEEKLY_ROSTER_REPORTS: ReportConfigItem[] = [
  {
    key: "weekly_roster_report",
    label: "Weekly Roster",
    category: "weekly_roster",
    type: "weekly",
    description: "Official weekly shift schedule, route codes, driver assignments, and wave dispatch schedules.",
  },
];

export const ALL_REPORTS: ReportConfigItem[] = [
  ...WEEKLY_REPORTS,
  ...DAILY_REPORTS,
  ...WEEKLY_ROSTER_REPORTS,
  ...ARCHIVED_REPORTS,
];

export const REPORT_MAP = new Map<string, ReportConfigItem>(
  ALL_REPORTS.map((r) => [r.key, r])
);

