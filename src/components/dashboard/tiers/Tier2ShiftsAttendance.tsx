import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  PhoneCall,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  ShiftsSummary,
  AttendanceCalloutsSummary,
} from "../../../api/unifiedDashboardApi";
import { ShiftPipelineBarChart } from "../charts/ShiftPipelineBarChart";

interface Props {
  shifts?: ShiftsSummary;
  callouts?: AttendanceCalloutsSummary;
  isLoading?: boolean;
}

export const Tier2ShiftsAttendance: FC<Props> = ({
  shifts,
  callouts,
  isLoading,
}) => {
  const navigate = useNavigate();

  const totalCallouts = callouts?.totalCallouts || 0;
  const excused = callouts?.excused || 0;
  const unexcused = callouts?.unexcused || 0;

  return (
    <div>
      <div className="uop-tier-header">
        <div className="uop-tier-title-wrap">
          <span className="uop-tier-tag">Tier 2</span>
          <h2 className="uop-tier-title">Shifts & Operational Attendance</h2>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-secondary)", fontWeight: 500 }}>
          Roster Execution & Coverage
        </span>
      </div>

      <div className="uop-tier2-grid">
        {/* 1. Shift Pipeline (Chart Card #1) */}
        <div className="uop-card">
          <div className="uop-card-header">
            <h3 className="uop-card-title">
              <span>Shift Pipeline Distribution</span>
            </h3>
            <div className="uop-card-icon blue">
              <CalendarDays size={18} />
            </div>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.45rem", fontWeight: 700, letterSpacing: "-0.022em", color: "var(--ads-ink)" }}>
              {isLoading ? (
                <div className="uop-skeleton" style={{ width: 60, height: 26 }} />
              ) : (
                `${shifts?.total || 0} Total Shifts`
              )}
            </span>
          </div>

          {isLoading ? (
            <div className="uop-skeleton" style={{ width: "100%", height: 50, borderRadius: "var(--ads-r-sm)" }} />
          ) : (
            <ShiftPipelineBarChart data={shifts} />
          )}

          <div className="uop-card-footer" style={{ marginTop: "1rem" }}>
            <span>Live Shift Status</span>
            <span
              className="uop-card-link-hint"
              onClick={() => navigate("/scheduler/shifts")}
              style={{ cursor: "pointer" }}
            >
              <span>Manage Shifts Workspace</span>
              <ChevronRight size={13} />
            </span>
          </div>
        </div>

        {/* 2. Attendance & Callouts (KPI Card) */}
        <div
          className="uop-card clickable"
          onClick={() => navigate("/operations?tab=callout")}
          title="Click to view daily callout notices and driver logs"
        >
          <div className="uop-card-header">
            <h3 className="uop-card-title">
              <span>Attendance & Callouts</span>
            </h3>
            <div className={`uop-card-icon ${totalCallouts > 0 ? "amber" : "emerald"}`}>
              <PhoneCall size={18} />
            </div>
          </div>

          <div className="uop-card-value" style={{ color: totalCallouts > 0 ? "var(--ads-amber)" : "var(--ads-ink)" }}>
            {isLoading ? <div className="uop-skeleton" style={{ width: 60, height: 32 }} /> : totalCallouts}
          </div>

          <div className="uop-sub-badges-row">
            <span
              className="uop-sub-badge"
              style={{
                backgroundColor: "var(--ads-blue-tint)",
                color: "#0058B0",
                border: "1px solid transparent",
              }}
            >
              <CheckCircle size={11} />
              {excused} Excused
            </span>
            <span
              className="uop-sub-badge"
              style={{
                backgroundColor: unexcused > 0 ? "var(--ads-red-tint)" : "var(--uop-wash-strong)",
                color: unexcused > 0 ? "var(--ads-red)" : "var(--ads-ink-secondary)",
                border: "1px solid transparent",
              }}
            >
              <AlertTriangle size={11} />
              {unexcused} Unexcused
            </span>
          </div>

          <div className="uop-card-footer">
            <span>Standby & Roster Coverage</span>
            <span className="uop-card-link-hint">
              <span>View Callout Logs</span>
              <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
