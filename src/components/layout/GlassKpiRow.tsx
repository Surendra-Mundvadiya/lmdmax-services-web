import React, { FC } from "react";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

interface GlassKpiRowProps {
  totalScheduled?: number;
  completedCount?: number;
  upcomingCount?: number;
  completionRate?: number;
  upcomingRate?: number;
  year?: number;
  isLoading?: boolean;
}

export const GlassKpiRow: FC<GlassKpiRowProps> = ({
  totalScheduled = 0,
  completedCount = 0,
  upcomingCount = 0,
  completionRate = 0,
  upcomingRate = 100,
  year = new Date().getFullYear(),
  isLoading = false,
}) => {
  return (
    <div className="glass-kpi-grid">
      {/* ── CARD 1: Surveys / Routes scheduled for current year/period ── */}
      <div className="glass-kpi-card">
        <div className="glass-kpi-info">
          <span className="glass-kpi-title">Surveys & Routes scheduled for {year}</span>
          <div className="glass-kpi-metric-row">
            <span className="glass-kpi-value">
              {isLoading ? "..." : totalScheduled}
            </span>
          </div>
        </div>
        <div className="glass-kpi-icon-wrap blue">
          <Calendar size={22} />
        </div>
      </div>

      {/* ── CARD 2: Surveys / Inspections completed till date ── */}
      <div className="glass-kpi-card">
        <div className="glass-kpi-info">
          <span className="glass-kpi-title">Surveys scheduled till date in {year}</span>
          <div className="glass-kpi-metric-row">
            <span className="glass-kpi-value">
              {isLoading ? "..." : `${completedCount} / ${totalScheduled}`}
            </span>
            <span className="glass-kpi-pill success">
              {completionRate}%
            </span>
          </div>
        </div>
        <div className="glass-kpi-icon-wrap green">
          <CheckCircle2 size={22} />
        </div>
      </div>

      {/* ── CARD 3: Upcoming schedules in current year ── */}
      <div className="glass-kpi-card">
        <div className="glass-kpi-info">
          <span className="glass-kpi-title">Upcoming schedules & shifts in {year}</span>
          <div className="glass-kpi-metric-row">
            <span className="glass-kpi-value">
              {isLoading ? "..." : `${upcomingCount} / ${totalScheduled}`}
            </span>
            <span className="glass-kpi-pill primary">
              {upcomingRate}%
            </span>
          </div>
        </div>
        <div className="glass-kpi-icon-wrap cyan">
          <ClipboardList size={22} />
        </div>
      </div>
    </div>
  );
};

export default GlassKpiRow;
