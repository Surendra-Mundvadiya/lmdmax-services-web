import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import { useAuthStore } from "../../../store/authStore";
import { useDriverStore } from "../../../store/driverStore";
import {
  schedulerApi,
  SchedulerShiftItem,
  SchedulerDriverItem,
  SchedulerTimeOffItem,
  ScheduleRuleItem,
  getShiftStatusBadge,
} from "../../../api/schedulerApi";
import { ShiftControlBar, ViewMode, ShiftStatusCounts } from "./ShiftControlBar";
import { ShiftGridWeekView } from "./ShiftGridWeekView";
import { ShiftGridDayView } from "./ShiftGridDayView";
import { ShiftGridBiWeeklyView } from "./ShiftGridBiWeeklyView";
import { ShiftGridMonthView } from "./ShiftGridMonthView";
import { ScheduleRulesScreen } from "./ScheduleRulesScreen";
import { CreateShiftModal } from "./CreateShiftModal";
import { PublishScheduleModal } from "./PublishScheduleModal";
import { AutoAssignModal } from "./AutoAssignModal";
import { ScheduleTemplatesModal } from "./ScheduleTemplatesModal";
import { CheckCircle2, AlertCircle } from "lucide-react";

export const ShiftWorkspace: FC = () => {
  const { user, stations } = useAuthStore();
  const globalDrivers = useDriverStore((state) => state.drivers);
  const fetchGlobalDrivers = useDriverStore((state) => state.fetchDrivers);

  // Active station resolution directly bound to Header selection (Rule 1 & Rule 6)
  const activeStationObj = stations.find((s) => s.current) || stations[0];
  const activeStationId = activeStationObj?.company_id
    ? String(activeStationObj.company_id)
    : user?.company_id
    ? String(user.company_id)
    : "566";

  // Dedicated in-page background screen state: "grid" or "rules" (Rule 8: uniform AddDriverScreen pattern)
  const [workspaceView, setWorkspaceView] = useState<"grid" | "rules">("grid");

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  // Real-time status filter & driver search (Shift types filter removed per user request)
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [driverSearchQuery, setDriverSearchQuery] = useState<string>("");

  // Data state
  const [shifts, setShifts] = useState<SchedulerShiftItem[]>([]);
  const [drivers, setDrivers] = useState<SchedulerDriverItem[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<SchedulerTimeOffItem[]>([]);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRuleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [modalInitialDriverId, setModalInitialDriverId] = useState<number | null>(null);
  const [modalInitialDateStr, setModalInitialDateStr] = useState<string | undefined>(undefined);
  const [editingShift, setEditingShift] = useState<SchedulerShiftItem | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isAutoAssignModalOpen, setIsAutoAssignModalOpen] = useState<boolean>(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);

  // Load global drivers if not already loaded
  useEffect(() => {
    if (globalDrivers.length === 0) {
      fetchGlobalDrivers();
    }
  }, [globalDrivers.length, fetchGlobalDrivers]);

  // Format Date to YYYY-MM-DD
  const formatDateISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calculate start and end dates based on viewMode and anchorDate
  const { startDateStr, endDateStr, daysList, dateRangeLabel } = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayStr = formatDateISO(new Date());

    if (viewMode === "day") {
      const dateStr = formatDateISO(anchorDate);
      const label = `${months[anchorDate.getMonth()]} ${anchorDate.getDate()}, ${anchorDate.getFullYear()}`;
      return {
        startDateStr: dateStr,
        endDateStr: dateStr,
        daysList: [
          {
            dateStr,
            dayLabel: daysShort[anchorDate.getDay()],
            dateNumber: String(anchorDate.getDate()),
            isToday: dateStr === todayStr,
          },
        ],
        dateRangeLabel: label,
      };
    }

    if (viewMode === "biweekly") {
      const currentDayOfWeek = anchorDate.getDay();
      const start = new Date(anchorDate);
      start.setDate(anchorDate.getDate() - currentDayOfWeek);

      const end = new Date(start);
      end.setDate(start.getDate() + 13);

      const days = [];
      const iter = new Date(start);
      while (iter <= end) {
        const dStr = formatDateISO(iter);
        days.push({
          dateStr: dStr,
          dayLabel: daysShort[iter.getDay()],
          dateNumber: String(iter.getDate()),
          isToday: dStr === todayStr,
        });
        iter.setDate(iter.getDate() + 1);
      }

      const label = `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;

      return {
        startDateStr: formatDateISO(start),
        endDateStr: formatDateISO(end),
        daysList: days,
        dateRangeLabel: label,
      };
    }

    if (viewMode === "month") {
      const year = anchorDate.getFullYear();
      const month = anchorDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const startDayOfWeek = firstDayOfMonth.getDay();
      const lastDayOfMonth = new Date(year, month + 1, 0);

      // Start from the calendar-aligned Sunday
      const calStart = new Date(year, month, 1 - startDayOfWeek);
      // End on the calendar-aligned Saturday
      const totalDays = startDayOfWeek + lastDayOfMonth.getDate();
      const remainder = totalDays % 7;
      const paddingNeeded = remainder === 0 ? 0 : 7 - remainder;
      const calEnd = new Date(year, month, lastDayOfMonth.getDate() + paddingNeeded);

      const days = [];
      const iter = new Date(calStart);
      while (iter <= calEnd) {
        const dStr = formatDateISO(iter);
        days.push({
          dateStr: dStr,
          dayLabel: daysShort[iter.getDay()],
          dateNumber: String(iter.getDate()),
          isToday: dStr === todayStr,
        });
        iter.setDate(iter.getDate() + 1);
      }

      const label = `${fullMonths[month]} ${year}`;

      return {
        startDateStr: formatDateISO(calStart),
        endDateStr: formatDateISO(calEnd),
        daysList: days,
        dateRangeLabel: label,
      };
    }

    // Default: "week"
    const currentDayOfWeek = anchorDate.getDay();
    const start = new Date(anchorDate);
    start.setDate(anchorDate.getDate() - currentDayOfWeek);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const days = [];
    const iter = new Date(start);
    while (iter <= end) {
      const dStr = formatDateISO(iter);
      days.push({
        dateStr: dStr,
        dayLabel: daysShort[iter.getDay()],
        dateNumber: String(iter.getDate()),
        isToday: dStr === todayStr,
      });
      iter.setDate(iter.getDate() + 1);
    }

    const label = `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;

    return {
      startDateStr: formatDateISO(start),
      endDateStr: formatDateISO(end),
      daysList: days,
      dateRangeLabel: label,
    };
  }, [anchorDate, viewMode]);

  // Date Navigation Handlers
  const handlePrevDate = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "day") next.setDate(next.getDate() - 1);
      else if (viewMode === "biweekly") next.setDate(next.getDate() - 14);
      else if (viewMode === "month") next.setMonth(next.getMonth() - 1);
      else next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextDate = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "day") next.setDate(next.getDate() + 1);
      else if (viewMode === "biweekly") next.setDate(next.getDate() + 14);
      else if (viewMode === "month") next.setMonth(next.getMonth() + 1);
      else next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleToday = () => {
    setAnchorDate(new Date());
  };

  // Fetch Live Schedule Rules
  const loadScheduleRules = useCallback(async () => {
    try {
      const rules = await schedulerApi.getScheduleRules(activeStationId);
      setScheduleRules(rules || []);
    } catch (err) {
      console.warn("Failed to load schedule rules:", err);
    }
  }, [activeStationId]);

  // Load Real Data from Microservice (Rule 6: 100% Real-Time Live Data)
  const loadWorkspaceData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedDrivers, fetchedSchedules, fetchedTimeOff, fetchedRules] = await Promise.all([
        schedulerApi.getSchedulerDrivers(),
        schedulerApi.getSchedules(activeStationId, startDateStr, endDateStr),
        schedulerApi.getTimeOffRequests({ start_date: startDateStr, end_date: endDateStr }),
        schedulerApi.getScheduleRules(activeStationId),
      ]);

      // Normalize roster drivers: use fetchedDrivers or adapt globalDrivers from driverStore
      let rosterList: SchedulerDriverItem[] = [];
      if (fetchedDrivers && fetchedDrivers.length > 0) {
        rosterList = fetchedDrivers;
      } else if (globalDrivers && globalDrivers.length > 0) {
        rosterList = globalDrivers.map((d: any) => ({
          id: Number(d.id || d.driver_id || Date.now()),
          driver_id: Number(d.id || d.driver_id),
          name: d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver",
          transporter_id: d.transporter_id || d.badge_id || "",
          target_hours: 40,
          weekly_hours: 0,
          rating: d.rating || 5.0,
          mobile_number: d.phone_number || d.mobile_number || "",
          availability: null,
          driver_type: d.driver_type || "Standard",
          status: d.status || "active",
        }));
      }

      setDrivers(rosterList);
      setTimeOffRequests(fetchedTimeOff || []);
      setScheduleRules(fetchedRules || []);

      // Correlate time-off conflicts
      const processedShifts = (fetchedSchedules || []).map((shift) => {
        const hasTimeOff = (fetchedTimeOff || []).some(
          (t) =>
            t.driver_id === shift.assign_to &&
            t.leave_status === "approved" &&
            shift.schedule_date >= t.start_date &&
            shift.schedule_date <= t.end_date
        );
        return {
          ...shift,
          isConflict: hasTimeOff,
          conflictReason: hasTimeOff ? "Driver on approved leave" : undefined,
        };
      });

      setShifts(processedShifts);
    } catch (err: any) {
      console.error("Failed to load scheduler workspace data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeStationId, startDateStr, endDateStr, globalDrivers]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Real-time Shift Status Counts live from API shifts
  const statusCounts: ShiftStatusCounts = useMemo(() => {
    const counts: ShiftStatusCounts = {
      total: shifts.length,
      published: 0,
      unpublished: 0,
      confirmed: 0,
      pending: 0,
      declined: 0,
      backup: 0,
      vto: 0,
    };

    shifts.forEach((s) => {
      const badge = getShiftStatusBadge(s);
      if (badge === "published") counts.published++;
      else if (badge === "unpublished" || badge === "open") counts.unpublished++;
      else if (badge === "confirmed") counts.confirmed++;
      else if (badge === "pending") counts.pending++;
      else if (badge === "declined") counts.declined++;
      else if (badge === "backup" || badge === "extras") counts.backup++;
      else if (badge === "vto") counts.vto++;
    });

    return counts;
  }, [shifts]);

  // Filtered Drivers list based on search query
  const filteredDrivers = useMemo(() => {
    if (!driverSearchQuery.trim()) return drivers;
    const q = driverSearchQuery.toLowerCase().trim();
    return drivers.filter((d) => d.name.toLowerCase().includes(q));
  }, [drivers, driverSearchQuery]);

  // Filtered Shifts list based on live statusFilter
  const filteredShifts = useMemo(() => {
    if (!statusFilter || statusFilter === "all") return shifts;
    return shifts.filter((s) => {
      const badge = getShiftStatusBadge(s);
      if (statusFilter === "backup") {
        return badge === "backup" || badge === "extras";
      }
      return badge === statusFilter;
    });
  }, [shifts, statusFilter]);

  // Real-time Draft Shifts Count
  const draftShifts = useMemo(() => {
    return shifts.filter((s) => !s.is_published);
  }, [shifts]);

  // Open Create Shift modal for empty or driver row slot
  const handleCellClick = (driverId: number | null, dateStr: string) => {
    setEditingShift(null);
    setModalInitialDriverId(driverId);
    setModalInitialDateStr(dateStr);
    setIsCreateModalOpen(true);
  };

  // Open Create Shift modal via header button
  const handleOpenCreateShift = () => {
    setEditingShift(null);
    setModalInitialDriverId(null);
    setModalInitialDateStr(startDateStr);
    setIsCreateModalOpen(true);
  };

  // Open Edit Shift modal
  const handleEditShift = (shift: SchedulerShiftItem) => {
    setEditingShift(shift);
    setIsCreateModalOpen(true);
  };

  // Drag and Drop Shift Handler (reschedule across dates / drivers)
  const handleDropShift = async (
    shiftId: number,
    targetDriverId: number,
    targetDate: string
  ) => {
    const targetDriver = drivers.find(
      (d) => (d.driver_id || d.id) === targetDriverId
    );

    // Optimistic UI update
    setShifts((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              assign_to: targetDriverId,
              driver_name: targetDriver?.name || s.driver_name,
              schedule_date: targetDate,
            }
          : s
      )
    );

    try {
      await schedulerApi.rescheduleShift(shiftId, {
        assign_to: targetDriverId,
        schedule_date: targetDate,
      });
      setNotification({
        type: "success",
        message: `Shift rescheduled to ${targetDriver?.name || "driver"} on ${targetDate}.`,
      });
    } catch (err: any) {
      console.error("Failed to reschedule shift:", err);
      setNotification({
        type: "error",
        message: "Failed to reschedule shift on server.",
      });
      loadWorkspaceData();
    }
    setTimeout(() => setNotification(null), 3500);
  };

  // Mark / Unmark shift as Extra (Backup & Attendance)
  const handleMarkExtra = async (shiftId: number, isBackup: boolean) => {
    // Optimistic UI update
    setShifts((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              is_backup: isBackup,
              sch_status: isBackup
                ? "backup"
                : s.sch_status === "backup"
                ? "scheduled"
                : s.sch_status,
            }
          : s
      )
    );

    try {
      await schedulerApi.updateBackup(shiftId, isBackup);
      setNotification({
        type: "success",
        message: isBackup
          ? "Shift marked as Extra (Backup)."
          : "Shift unmarked from Extra.",
      });
    } catch (err: any) {
      console.error("Failed to update extra status:", err);
      setNotification({
        type: "error",
        message: "Failed to update extra status on server.",
      });
      loadWorkspaceData();
    }
    setTimeout(() => setNotification(null), 3500);
  };

  // Shift Creation / Update Mutation with Optimistic UI insertion
  const handleSaveShift = async (shiftData: any) => {
    const isEdit = Boolean(shiftData.id);

    if (isEdit) {
      setShifts((prev) =>
        prev.map((s) => (s.id === shiftData.id ? { ...s, ...shiftData } : s))
      );

      await schedulerApi.updateShift(shiftData.schedule_rule_id || 1, {
        schedules: [shiftData],
      });

      setNotification({ type: "success", message: "Shift updated successfully." });
    } else {
      const tempId = Date.now();
      const optimisticShift: SchedulerShiftItem = {
        id: tempId,
        schedule_rule_id: shiftData.schedule_rule_id || 1,
        assign_to: shiftData.assign_to,
        driver_name: shiftData.driver_name,
        schedule_date: shiftData.schedule_date,
        shift_duration_start: shiftData.shift_duration_start,
        shift_duration_end: shiftData.shift_duration_end,
        break_time: shiftData.break_time,
        is_published: shiftData.is_published,
        route_code: shiftData.route_code,
        wave: shiftData.wave,
        total_hours: shiftData.total_hours,
        vehicle_type: shiftData.vehicle_type,
      };

      setShifts((prev) => [optimisticShift, ...prev]);

      await schedulerApi.createShift({
        schedule_rule_id: shiftData.schedule_rule_id || 1,
        company_id: activeStationId,
        schedules: [shiftData],
      });

      setNotification({
        type: "success",
        message: shiftData.is_published
          ? "Shift created and published."
          : "Draft shift created.",
      });
    }

    setTimeout(() => setNotification(null), 3500);
    loadWorkspaceData();
  };

  // Delete Shift Mutation
  const handleDeleteShift = async (shiftId: number) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    try {
      await schedulerApi.deleteShifts([shiftId]);
      setNotification({ type: "success", message: "Shift deleted." });
    } catch {
      setNotification({ type: "error", message: "Failed to delete shift from server." });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  // Batch Publish Draft Shifts Mutation
  const handleConfirmPublish = async (shiftIds: number[]) => {
    setShifts((prev) =>
      prev.map((s) => (shiftIds.includes(s.id) ? { ...s, is_published: true } : s))
    );

    await schedulerApi.publishShifts(shiftIds);
    setNotification({
      type: "success",
      message: `Successfully published ${shiftIds.length} shifts to drivers!`,
    });
    setTimeout(() => setNotification(null), 4000);
    loadWorkspaceData();
  };

  // Auto-Assign Execution
  const handleRunAutoAssign = async (payload: any) => {
    await schedulerApi.autoSchedule(payload);
    setNotification({
      type: "success",
      message: "Auto-scheduling algorithm executed successfully!",
    });
    setTimeout(() => setNotification(null), 4000);
    loadWorkspaceData();
  };

  // Helper for Browser File Download
  const triggerDownload = (blobData: any, filename: string, mimeType: string) => {
    const blob = new Blob([blobData], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export Shifts to Excel (.xlsx)
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const data = await schedulerApi.exportScheduleExcel(activeStationId, {
        date: startDateStr,
        start_date: startDateStr,
        end_date: endDateStr,
      });
      triggerDownload(
        data,
        `Schedule_${activeStationId}_${startDateStr}_to_${endDateStr}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      setNotification({ type: "success", message: "Schedule exported to Excel successfully." });
    } catch {
      setNotification({ type: "error", message: "Failed to export schedule to Excel." });
    } finally {
      setExportLoading(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Export Shifts to PDF (.pdf)
  const handleExportPdf = async () => {
    setExportLoading(true);
    try {
      const data = await schedulerApi.exportSchedulePdf(activeStationId, {
        date: startDateStr,
        start_date: startDateStr,
        end_date: endDateStr,
      });
      triggerDownload(
        data,
        `Schedule_${activeStationId}_${startDateStr}_to_${endDateStr}.pdf`,
        "application/pdf"
      );
      setNotification({ type: "success", message: "Schedule exported to PDF successfully." });
    } catch {
      setNotification({ type: "error", message: "Failed to export schedule to PDF." });
    } finally {
      setExportLoading(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Export Shifts to CSV (.csv)
  const handleExportCsv = async () => {
    setExportLoading(true);
    try {
      const data = await schedulerApi.exportScheduleCsv(activeStationId, {
        start_date: startDateStr,
        end_date: endDateStr,
        is_backup: false,
      });
      triggerDownload(
        data,
        `Schedule_${activeStationId}_${startDateStr}_to_${endDateStr}.csv`,
        "text/csv"
      );
      setNotification({ type: "success", message: "Schedule exported to CSV successfully." });
    } catch {
      setNotification({ type: "error", message: "Failed to export schedule to CSV." });
    } finally {
      setExportLoading(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div className="sch-workspace-root">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`sch-toast ${notification.type}`}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            padding: "0.75rem 1.25rem",
            borderRadius: "10px",
            backgroundColor: notification.type === "success" ? "#0F172A" : "#FEF2F2",
            color: notification.type === "success" ? "#FFFFFF" : "#991B1B",
            border: notification.type === "success" ? "1px solid #334155" : "1px solid #FECACA",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
          }}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={16} style={{ color: "#10B981" }} />
          ) : (
            <AlertCircle size={16} style={{ color: "#EF4444" }} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* VIEW SWITCHING: Dedicated in-page Schedule Rules Screen vs Shift Matrix Grid */}
      {workspaceView === "rules" ? (
        <ScheduleRulesScreen
          onBack={() => setWorkspaceView("grid")}
          rules={scheduleRules}
          onRefreshRules={loadScheduleRules}
          drivers={drivers}
        />
      ) : (
        <>
          {/* Control Bar (All shift types removed, status counts toolbar added) */}
          <ShiftControlBar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            dateRangeLabel={dateRangeLabel}
            onPrevDate={handlePrevDate}
            onNextDate={handleNextDate}
            onToday={handleToday}
            searchQuery={driverSearchQuery}
            onSearchQueryChange={setDriverSearchQuery}
            onCreateShift={handleOpenCreateShift}
            onAutoAssign={() => setIsAutoAssignModalOpen(true)}
            onPublishSchedule={() => setIsPublishModalOpen(true)}
            draftCount={draftShifts.length}
            loading={loading}
            scheduleRules={scheduleRules}
            onOpenRulesModal={() => setWorkspaceView("rules")}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onExportCsv={handleExportCsv}
            onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
            exportLoading={exportLoading}
            statusCounts={statusCounts}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {/* View Matrix Area */}
          <div className="sch-matrix-wrapper">
            {viewMode === "week" && (
              <ShiftGridWeekView
                days={daysList}
                drivers={filteredDrivers}
                shifts={filteredShifts}
                timeOffRequests={timeOffRequests}
                onCellClick={handleCellClick}
                onEditShift={handleEditShift}
                onDeleteShift={handleDeleteShift}
                onMarkExtra={handleMarkExtra}
                onDropShift={handleDropShift}
                loading={loading}
              />
            )}

            {viewMode === "day" && (
              <ShiftGridDayView
                currentDateStr={startDateStr}
                drivers={filteredDrivers}
                shifts={filteredShifts}
                timeOffRequests={timeOffRequests}
                onCellClick={handleCellClick}
                onEditShift={handleEditShift}
                onDeleteShift={handleDeleteShift}
                onMarkExtra={handleMarkExtra}
                onDropShift={handleDropShift}
                loading={loading}
              />
            )}

            {viewMode === "biweekly" && (
              <ShiftGridBiWeeklyView
                days={daysList}
                drivers={filteredDrivers}
                shifts={filteredShifts}
                timeOffRequests={timeOffRequests}
                onCellClick={handleCellClick}
                onEditShift={handleEditShift}
                onDeleteShift={handleDeleteShift}
                onMarkExtra={handleMarkExtra}
                onDropShift={handleDropShift}
                loading={loading}
              />
            )}

            {viewMode === "month" && (
              <ShiftGridMonthView
                currentDate={anchorDate}
                drivers={filteredDrivers}
                shifts={filteredShifts}
                timeOffRequests={timeOffRequests}
                onCellClick={handleCellClick}
                onEditShift={handleEditShift}
                onDeleteShift={handleDeleteShift}
                onMarkExtra={handleMarkExtra}
                onDropShift={handleDropShift}
                loading={loading}
              />
            )}
          </div>
        </>
      )}

      {/* Interactive Shift Modal */}
      <CreateShiftModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSaveShift}
        initialDriverId={modalInitialDriverId}
        initialDateStr={modalInitialDateStr}
        editingShift={editingShift}
        drivers={drivers}
        timeOffRequests={timeOffRequests}
        scheduleRules={scheduleRules}
      />

      {/* Publish Schedule Modal */}
      <PublishScheduleModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        draftShifts={draftShifts}
        dateRangeLabel={dateRangeLabel}
        onConfirmPublish={handleConfirmPublish}
      />

      {/* Auto-Assign Modal */}
      <AutoAssignModal
        isOpen={isAutoAssignModalOpen}
        onClose={() => setIsAutoAssignModalOpen(false)}
        startDate={startDateStr}
        endDate={endDateStr}
        onRunAutoAssign={handleRunAutoAssign}
      />

      {/* Schedule Templates Modal ("Others" action) */}
      <ScheduleTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        companyId={activeStationId}
        startDateStr={startDateStr}
        endDateStr={endDateStr}
        currentShifts={shifts}
        onTemplateApplied={loadWorkspaceData}
      />
    </div>
  );
};
