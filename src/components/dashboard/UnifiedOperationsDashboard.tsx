import React, { FC, useState } from "react";
import GlassAppLayout from "../layout/GlassAppLayout";
import { useUnifiedDashboardQueries } from "../../hooks/useUnifiedDashboardQueries";
import { GlobalControlsBar } from "./GlobalControlsBar";
import { CompactKpiCards } from "./CompactKpiCards";
import { ShiftPipelineCard } from "./ShiftPipelineCard";
import { Tier3ScorecardMatrix } from "./tiers/Tier3ScorecardMatrix";
import { Tier4PerformanceVolume } from "./tiers/Tier4PerformanceVolume";
import { DriverQuickModal } from "./DriverQuickModal";
import { DriverSummary } from "../../api/unifiedDashboardApi";
import { AlertCircle, RefreshCw } from "lucide-react";

export const UnifiedOperationsDashboard: FC = () => {
  const {
    mode,
    setMode,
    date,
    setDate,
    weekNumber,
    setWeek,
    autoRefresh,
    setAutoRefresh,
    lastSynced,
    refetchAll,
    isRefetching,
    hasAnyError,

    // Data
    shifts,
    callouts,
    scorecard,
    violations,
    deliveryMetrics,
    negativeFeedback,
    leaderboard,
    driversStatus,
    vehiclesStatus,
    damageBreakdown,
    inspectionsAlerts,

    // Loading states
    tier1Loading,
    tier2Loading,
    tier3Loading,
    tier4Loading,
  } = useUnifiedDashboardQueries();

  const [selectedDriver, setSelectedDriver] = useState<DriverSummary | null>(null);

  return (
    <GlassAppLayout currentRoute="dashboard" activeBreadcrumb={{ section: "Network Overview", page: "Operations Dashboard" }}>
      <div className="uop-page-shell">
        {/* Main Dashboard Content */}
        <main className="uop-main-container">
        {/* Transparent Operations Toolbar (AppDateNavigator calendar + Mode toggle) */}
        <GlobalControlsBar
          mode={mode}
          onModeChange={setMode}
          date={date}
          onDateChange={setDate}
          weekNumber={weekNumber}
          onWeekChange={setWeek}
        />

        {/* Global Error Notice if any microservice encountered connectivity drops */}
        {hasAnyError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderRadius: "var(--ads-r-lg)",
              backgroundColor: "var(--ads-amber-tint)",
              border: "1px solid var(--ads-hairline)",
              boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
              color: "var(--ads-amber)",
              fontSize: "0.8125rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={16} style={{ color: "var(--ads-amber)" }} />
              <span>
                One or more live microservices took longer to respond. Cached telemetry is currently displayed.
              </span>
            </div>
            <button
              type="button"
              onClick={() => refetchAll()}
              style={{
                background: "none",
                border: "none",
                color: "var(--ads-blue)",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--ads-r-pill)",
                transition: "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <RefreshCw size={12} />
              <span>Retry Sync</span>
            </button>
          </div>
        )}

        {/* Tier 1: Symmetrical Top KPI Row (Drivers, Vehicles [2x], Alerts, Callouts, Deliveries) */}
        <CompactKpiCards
          drivers={driversStatus}
          vehicles={vehiclesStatus}
          damage={damageBreakdown}
          inspections={inspectionsAlerts}
          callouts={callouts}
          deliveryMetrics={deliveryMetrics}
          isLoading={tier1Loading || tier2Loading || tier4Loading}
        />

        {/* Tier 2: Operations Benchmark Grid (Shift Pipeline [Enlarged 60% Width] + Weekly Scorecard Matrix) */}
        <div className="uop-operations-benchmark-grid">
          <ShiftPipelineCard
            shifts={shifts}
            isLoading={tier2Loading}
          />
          <Tier3ScorecardMatrix
            scorecard={scorecard}
            isLoading={tier3Loading}
          />
        </div>

        {/* Tier 3: Driver Excellence & Compliance Analytics (3 Columns: Driver Rankings + Violations Pie + Negative Feedback Bar) */}
        <Tier4PerformanceVolume
          leaderboard={leaderboard}
          onSelectDriver={(driver) => setSelectedDriver(driver)}
          violations={violations}
          negativeFeedback={negativeFeedback}
          isLoading={tier4Loading}
        />
      </main>

      {/* Driver Quick Detail Modal */}
      <DriverQuickModal
        driver={selectedDriver}
        onClose={() => setSelectedDriver(null)}
      />
      </div>
    </GlassAppLayout>
  );
};

export default UnifiedOperationsDashboard;
