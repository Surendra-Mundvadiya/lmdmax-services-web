import React, { FC, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3,
  FileSpreadsheet,
  Gauge,
  Clock,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import ScorecardThresholdView from "../threshold/reports/ScorecardThresholdView";
import DaWeeklyThresholdView from "../threshold/reports/DaWeeklyThresholdView";
import EocThresholdView from "../threshold/reports/EocThresholdView";
import DvicThresholdView from "../threshold/reports/DvicThresholdView";
import DailyDriverScorecardThresholdView from "../threshold/reports/DailyDriverScorecardThresholdView";
import PpsThresholdView from "../threshold/reports/PpsThresholdView";

interface PerformanceThresholdSettingsPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export type ReportThresholdTab =
  | "scorecard"
  | "da_weekly_overview"
  | "eoc_report"
  | "dvic_report"
  | "daily_driver_scorecard"
  | "pps_report";

interface ReportTabConfig {
  id: ReportThresholdTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

const REPORT_TABS: ReportTabConfig[] = [
  {
    id: "scorecard",
    label: "Weekly Metrics",
    icon: BarChart3,
    description: "Weekly driver performance metrics & threshold criteria",
  },
  {
    id: "da_weekly_overview",
    label: "DA Weekly Overview",
    icon: FileSpreadsheet,
    description: "Weekly overview metrics & conflict validation",
  },
  {
    id: "eoc_report",
    label: "EOC",
    icon: Gauge,
    description: "Engine Off Compliance % cutoff & coaching templates",
  },
  {
    id: "dvic_report",
    label: "DVIC",
    icon: Clock,
    description: "Pre/post trip inspection duration thresholds",
  },
  {
    id: "daily_driver_scorecard",
    label: "Daily Driver",
    icon: CalendarCheck,
    description: "Previous-day and 2-days-prior coaching targets",
  },
  {
    id: "pps_report",
    label: "PPS",
    icon: ShieldCheck,
    description: "Proper Parking Sequence compliance benchmarks",
  },
];

export const PerformanceThresholdSettingsPanel: FC<PerformanceThresholdSettingsPanelProps> = ({
  onNotification,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialReport = (searchParams.get("report") as ReportThresholdTab) || "scorecard";

  const [activeReport, setActiveReport] = useState<ReportThresholdTab>(initialReport);

  // Sync state if URL report param changes
  useEffect(() => {
    const reportParam = searchParams.get("report") as ReportThresholdTab;
    if (reportParam && REPORT_TABS.some((t) => t.id === reportParam)) {
      setActiveReport(reportParam);
    }
  }, [searchParams]);

  const handleReportChange = (reportId: ReportThresholdTab) => {
    setActiveReport(reportId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "thresholds");
      next.set("report", reportId);
      return next;
    });
  };

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Live threshold targets and automated coaching rules across all 6 performance reports from the Performance microservice
        </p>
      </div>

      {/* Active Report Threshold View Container */}
      <div className="threshold-active-report-container">
        {activeReport === "scorecard" && (
          <ScorecardThresholdView onNotification={onNotification} />
        )}
        {activeReport === "da_weekly_overview" && (
          <DaWeeklyThresholdView onNotification={onNotification} />
        )}
        {activeReport === "eoc_report" && (
          <EocThresholdView onNotification={onNotification} />
        )}
        {activeReport === "dvic_report" && (
          <DvicThresholdView onNotification={onNotification} />
        )}
        {activeReport === "daily_driver_scorecard" && (
          <DailyDriverScorecardThresholdView onNotification={onNotification} />
        )}
        {activeReport === "pps_report" && (
          <PpsThresholdView onNotification={onNotification} />
        )}
      </div>
    </div>
  );
};

export default PerformanceThresholdSettingsPanel;
