import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { unifiedDashboardApi } from "../api/unifiedDashboardApi";

export type DashboardMode = "daily" | "weekly";

export function useUnifiedDashboardQueries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // URL-driven state for mode and date
  const modeParam = searchParams.get("mode") as DashboardMode | null;
  const mode: DashboardMode = modeParam === "weekly" ? "weekly" : "daily";

  const todayStr = new Date().toISOString().split("T")[0];
  const date = searchParams.get("date") || todayStr;
  const weekNumber = Number(searchParams.get("week")) || 36;
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  // Calculate start & end date for the selected period
  const startDate = date;
  const endDate = date;

  // Auto-refresh interval (30 seconds or null)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  const pollInterval = autoRefresh ? 30000 : false;

  // Mode & Date Updaters syncing with URL search params
  const setMode = useCallback(
    (newMode: DashboardMode) => {
      setSearchParams(
        (prev) => {
          prev.set("mode", newMode);
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setDate = useCallback(
    (newDate: string) => {
      setSearchParams(
        (prev) => {
          prev.set("date", newDate);
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setWeek = useCallback(
    (newWeek: number) => {
      setSearchParams(
        (prev) => {
          prev.set("week", String(newWeek));
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  /* -------------------------------------------------------------------------
     TanStack Queries
     ------------------------------------------------------------------------- */

  // 1. Scheduler Shifts Pipeline
  const shiftsQuery = useQuery({
    queryKey: ["dashboard", "shifts-summary", mode, startDate, endDate],
    queryFn: () =>
      unifiedDashboardApi.getShiftsSummary({
        range: mode,
        startDate,
        endDate,
      }),
    refetchInterval: pollInterval,
    staleTime: 15000,
  });

  // 2. Attendance Callouts
  const calloutsQuery = useQuery({
    queryKey: ["dashboard", "attendance-callouts", date],
    queryFn: () => unifiedDashboardApi.getAttendanceCallouts(date),
    refetchInterval: pollInterval,
    staleTime: 15000,
  });

  // 3. Weekly Scorecard Quality Matrix
  const scorecardQuery = useQuery({
    queryKey: ["dashboard", "weekly-scorecard", weekNumber, year],
    queryFn: () => unifiedDashboardApi.getWeeklyScorecard({ week: weekNumber, year }),
    refetchInterval: pollInterval,
    staleTime: 60000,
  });

  // 4. Violations Breakdown
  const violationsQuery = useQuery({
    queryKey: ["dashboard", "violations-breakdown", startDate, endDate],
    queryFn: () =>
      unifiedDashboardApi.getViolationsBreakdown({
        startDate,
        endDate,
      }),
    refetchInterval: pollInterval,
    staleTime: 30000,
  });

  // 5. Delivery Volume Metrics
  const deliveryMetricsQuery = useQuery({
    queryKey: ["dashboard", "delivery-metrics", date],
    queryFn: () => unifiedDashboardApi.getDeliveryMetrics({ date }),
    refetchInterval: pollInterval,
    staleTime: 20000,
  });

  // 6. Customer Negative Feedback
  const negativeFeedbackQuery = useQuery({
    queryKey: ["dashboard", "negative-feedback", startDate, endDate],
    queryFn: () =>
      unifiedDashboardApi.getNegativeFeedback({
        startDate,
        endDate,
      }),
    refetchInterval: pollInterval,
    staleTime: 30000,
  });

  // 7. Drivers Leaderboard
  const leaderboardQuery = useQuery({
    queryKey: ["dashboard", "drivers-leaderboard"],
    queryFn: () => unifiedDashboardApi.getDriversLeaderboard(5),
    refetchInterval: pollInterval,
    staleTime: 30000,
  });

  // 8. Fleet Drivers Status Summary
  const driversStatusQuery = useQuery({
    queryKey: ["dashboard", "drivers-status-summary"],
    queryFn: () => unifiedDashboardApi.getDriversStatusSummary(),
    refetchInterval: pollInterval,
    staleTime: 30000,
  });

  // 9. Fleet Vehicles Status Summary
  const vehiclesStatusQuery = useQuery({
    queryKey: ["dashboard", "vehicles-status-summary"],
    queryFn: () => unifiedDashboardApi.getVehiclesStatusSummary(),
    refetchInterval: pollInterval,
    staleTime: 30000,
  });

  // 10. Fleet Vehicles Damage Breakdown
  const damageBreakdownQuery = useQuery({
    queryKey: ["dashboard", "vehicles-damage-breakdown"],
    queryFn: () => unifiedDashboardApi.getVehiclesDamageBreakdown(),
    refetchInterval: pollInterval,
    staleTime: 30000,
  });

  // 11. Inspections Alerts
  const inspectionsAlertsQuery = useQuery({
    queryKey: ["dashboard", "inspections-alerts", date],
    queryFn: () => unifiedDashboardApi.getInspectionsAlerts(date),
    refetchInterval: pollInterval,
    staleTime: 20000,
  });

  // Global Refresh Action
  const refetchAll = useCallback(async () => {
    await Promise.all([
      shiftsQuery.refetch(),
      calloutsQuery.refetch(),
      scorecardQuery.refetch(),
      violationsQuery.refetch(),
      deliveryMetricsQuery.refetch(),
      negativeFeedbackQuery.refetch(),
      leaderboardQuery.refetch(),
      driversStatusQuery.refetch(),
      vehiclesStatusQuery.refetch(),
      damageBreakdownQuery.refetch(),
      inspectionsAlertsQuery.refetch(),
    ]);
    setLastSynced(new Date());
  }, [
    shiftsQuery,
    calloutsQuery,
    scorecardQuery,
    violationsQuery,
    deliveryMetricsQuery,
    negativeFeedbackQuery,
    leaderboardQuery,
    driversStatusQuery,
    vehiclesStatusQuery,
    damageBreakdownQuery,
    inspectionsAlertsQuery,
  ]);

  const isInitialLoading =
    shiftsQuery.isLoading ||
    calloutsQuery.isLoading ||
    scorecardQuery.isLoading ||
    driversStatusQuery.isLoading ||
    vehiclesStatusQuery.isLoading;

  const isRefetching =
    shiftsQuery.isFetching ||
    calloutsQuery.isFetching ||
    scorecardQuery.isFetching ||
    violationsQuery.isFetching ||
    deliveryMetricsQuery.isFetching ||
    negativeFeedbackQuery.isFetching ||
    leaderboardQuery.isFetching ||
    driversStatusQuery.isFetching ||
    vehiclesStatusQuery.isFetching ||
    damageBreakdownQuery.isFetching ||
    inspectionsAlertsQuery.isFetching;

  const hasAnyError =
    shiftsQuery.isError ||
    calloutsQuery.isError ||
    scorecardQuery.isError ||
    violationsQuery.isError ||
    deliveryMetricsQuery.isError ||
    negativeFeedbackQuery.isError ||
    leaderboardQuery.isError ||
    driversStatusQuery.isError ||
    vehiclesStatusQuery.isError ||
    damageBreakdownQuery.isError ||
    inspectionsAlertsQuery.isError;

  return {
    mode,
    setMode,
    date,
    setDate,
    weekNumber,
    setWeek,
    year,
    autoRefresh,
    setAutoRefresh,
    lastSynced,
    refetchAll,
    isInitialLoading,
    isRefetching,
    hasAnyError,

    // Query Data
    shifts: shiftsQuery.data,
    schedules: shiftsQuery.data?.schedules || [],
    callouts: calloutsQuery.data,
    scorecard: scorecardQuery.data,
    violations: violationsQuery.data || [],
    deliveryMetrics: deliveryMetricsQuery.data,
    negativeFeedback: negativeFeedbackQuery.data || [],
    leaderboard: leaderboardQuery.data || { topPerformers: [], bottomPerformers: [] },
    driversStatus: driversStatusQuery.data,
    vehiclesStatus: vehiclesStatusQuery.data,
    damageBreakdown: damageBreakdownQuery.data,
    inspectionsAlerts: inspectionsAlertsQuery.data,

    // Loading states per tier
    tier1Loading: driversStatusQuery.isLoading || vehiclesStatusQuery.isLoading || damageBreakdownQuery.isLoading || inspectionsAlertsQuery.isLoading,
    tier2Loading: shiftsQuery.isLoading || calloutsQuery.isLoading,
    tier3Loading: scorecardQuery.isLoading,
    tier4Loading: violationsQuery.isLoading || deliveryMetricsQuery.isLoading || negativeFeedbackQuery.isLoading || leaderboardQuery.isLoading,
  };
}
