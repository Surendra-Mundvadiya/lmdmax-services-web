import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  MessageSquareX,
  ChevronRight,
} from "lucide-react";
import {
  ViolationBreakdownItem,
  NegativeFeedbackItem,
  DriversLeaderboardSummary,
  DriverSummary,
} from "../../../api/unifiedDashboardApi";
import { DriverPerformanceRankingCard } from "../DriverPerformanceRankingCard";
import { ViolationsPieChart } from "../charts/ViolationsPieChart";
import { NegativeFeedbackBarChart } from "../charts/NegativeFeedbackBarChart";

interface Props {
  leaderboard?: DriversLeaderboardSummary;
  onSelectDriver: (driver: DriverSummary) => void;
  violations: ViolationBreakdownItem[];
  negativeFeedback: NegativeFeedbackItem[];
  isLoading?: boolean;
}

export const Tier4PerformanceVolume: FC<Props> = ({
  leaderboard,
  onSelectDriver,
  violations,
  negativeFeedback,
  isLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="uop-analytics-3card-grid">
      {/* 1. Driver Performance Rankings (Top 5 / Bottom 5 Switcher) */}
      <DriverPerformanceRankingCard
        leaderboard={leaderboard}
        onSelectDriver={onSelectDriver}
        isLoading={isLoading}
      />

      {/* 2. Driver Violations Breakdown (Pie Chart) */}
      <div className="uop-card" style={{ height: "100%" }}>
        <div className="uop-card-header">
          <h3 className="uop-card-title">
            <span>Violations Breakdown</span>
          </h3>
          <div className="uop-card-icon red">
            <AlertTriangle size={18} />
          </div>
        </div>

        {isLoading ? (
          <div className="uop-skeleton" style={{ width: "100%", height: 180, borderRadius: 8 }} />
        ) : (
          <ViolationsPieChart data={violations} />
        )}

        <div className="uop-card-footer" style={{ marginTop: "auto" }}>
          <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
            Real-time telemetry alerts
          </span>
          <span
            className="uop-card-link-hint"
            onClick={() => navigate("/performance/reports?report=all_alert_report")}
            style={{ cursor: "pointer" }}
          >
            <span>Safety Events</span>
            <ChevronRight size={13} />
          </span>
        </div>
      </div>

      {/* 3. Customer Negative Feedback Breakdown (Bar Graph) */}
      <div className="uop-card" style={{ height: "100%" }}>
        <div className="uop-card-header">
          <h3 className="uop-card-title">
            <span>Customer Feedback Defects</span>
          </h3>
          <div className="uop-card-icon amber">
            <MessageSquareX size={18} />
          </div>
        </div>

        {isLoading ? (
          <div className="uop-skeleton" style={{ width: "100%", height: 180, borderRadius: 8 }} />
        ) : (
          <NegativeFeedbackBarChart data={negativeFeedback} />
        )}

        <div className="uop-card-footer" style={{ marginTop: "auto" }}>
          <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
            Customer defect attribution
          </span>
          <span
            className="uop-card-link-hint"
            onClick={() => navigate("/performance/reports?report=negative_customer_feedback_daily_report")}
            style={{ cursor: "pointer" }}
          >
            <span>Feedback</span>
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default Tier4PerformanceVolume;
