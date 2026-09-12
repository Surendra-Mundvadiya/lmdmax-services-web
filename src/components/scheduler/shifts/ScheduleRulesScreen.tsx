import React, { FC, useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Search,
  CheckSquare,
  Square,
  Layers,
  Info,
  Coffee,
  ArrowRight,
  Save,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  schedulerApi,
  ScheduleRuleItem,
  CreateScheduleRulePayload,
  UpdateScheduleRulePayload,
  SchedulerDriverItem,
} from "../../../api/schedulerApi";
import LoadingSpinner from "../../common/LoadingSpinner";

interface ScheduleRulesScreenProps {
  onBack: () => void;
  rules: ScheduleRuleItem[];
  onRefreshRules: () => Promise<void>;
  drivers: SchedulerDriverItem[];
}

const PRESET_COLORS = [
  "#0F172A", // Slate / Black
  "#2563EB", // Royal Blue
  "#059669", // Emerald Green
  "#D97706", // Amber
  "#7C3AED", // Violet
  "#DC2626", // Red
  "#0891B2", // Cyan
  "#DB2777", // Pink
];

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Generate 30-minute interval times in 12-hour format e.g. "10:00 AM"
const TIME_OPTIONS = (() => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const formatted = `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
      options.push(formatted);
    }
  }
  return options;
})();

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function calculateHours(start: string, end: string): string {
  const sMin = timeToMinutes(start);
  const eMin = timeToMinutes(end);
  let diff = eMin - sMin;
  if (diff <= 0) diff += 24 * 60;
  return (diff / 60).toFixed(1);
}

function to24Hour(timeStr: string): string {
  const min = timeToMinutes(timeStr);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function to12Hour(timeStr?: string): string {
  if (!timeStr) return "10:00 AM";
  const parts = timeStr.split(":");
  if (parts.length < 2) return "10:00 AM";
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

interface DayWorkingHourState {
  title: string;
  isSelected: boolean;
  startTime: string;
  endTime: string;
  totalHours: string;
  vehicleType: string;
}

export const ScheduleRulesScreen: FC<ScheduleRulesScreenProps> = ({
  onBack,
  rules,
  onRefreshRules,
  drivers,
}) => {
  // Screen sub-mode: "list" | "wizard"
  const [screenMode, setScreenMode] = useState<"list" | "wizard">("list");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [editingRule, setEditingRule] = useState<ScheduleRuleItem | null>(null);

  // Search in list view
  const [rulesSearchQuery, setRulesSearchQuery] = useState<string>("");

  // Loading & notification states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusAlert, setStatusAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ─────────────────────────────────────────────────────────────
  // WIZARD FORM STATE
  // ─────────────────────────────────────────────────────────────
  const [ruleType, setRuleType] = useState<"lmd" | "mmd">("lmd");
  const [name, setName] = useState<string>("");
  const [color, setColor] = useState<string>("#0F172A");

  // Step 1: Day Specific Working Hours
  const [dayWorkingHours, setDayWorkingHours] = useState<DayWorkingHourState[]>(() =>
    DAYS_OF_WEEK.map((d) => ({
      title: d,
      isSelected: true,
      startTime: "10:00 AM",
      endTime: "08:00 PM",
      totalHours: "10.0",
      vehicleType: "Cargo Van",
    }))
  );

  // Master quick-set row for Day Specific Schedule
  const [allDaysChecked, setAllDaysChecked] = useState<boolean>(true);
  const [allStartTime, setAllStartTime] = useState<string>("10:00 AM");
  const [allEndTime, setAllEndTime] = useState<string>("08:00 PM");

  // Step 1: Flexible Working Hours
  const [flexStartTime, setFlexStartTime] = useState<string>("10:00 AM");
  const [flexEndTime, setFlexEndTime] = useState<string>("08:00 PM");
  const [flexActiveDays, setFlexActiveDays] = useState<string[]>(DAYS_OF_WEEK);
  const [targetShiftsPerWeek, setTargetShiftsPerWeek] = useState<number>(4);
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);

  // Step 1: Break settings
  const [breakMinutes, setBreakMinutes] = useState<number>(30);
  const [setBreak, setSetBreak] = useState<boolean>(false);
  const [breakStartTime, setBreakStartTime] = useState<string>("02:00 PM");

  // Step 2: Message templates
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<any[]>([]);
  const [reminderMinutes, setReminderMinutes] = useState<number>(60);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);

  // Step 3: Preferred Drivers
  const [preferredDrivers, setPreferredDrivers] = useState<number[]>([]);
  const [initialPreferredDrivers, setInitialPreferredDrivers] = useState<number[]>([]);
  const [driverFilterQuery, setDriverFilterQuery] = useState<string>("");

  // Load message templates from backend
  useEffect(() => {
    schedulerApi
      .getCompanyMessageTemplates()
      .then((res) => {
        if (Array.isArray(res)) setAvailableTemplates(res);
      })
      .catch((err) => console.warn("Could not fetch message templates:", err));
  }, []);

  // Total weekly hours calculation for Day Specific Schedule
  const totalWeeklyHours = useMemo(() => {
    return dayWorkingHours
      .filter((d) => d.isSelected)
      .reduce((acc, curr) => acc + parseFloat(curr.totalHours || "0"), 0)
      .toFixed(1);
  }, [dayWorkingHours]);

  // Master Toggle All Days
  const handleToggleAllDays = (checked: boolean) => {
    setAllDaysChecked(checked);
    setDayWorkingHours((prev) =>
      prev.map((d) => ({
        ...d,
        isSelected: checked,
      }))
    );
  };

  // Master Time Changes (Applies to all selected days)
  const handleMasterTimeChange = (type: "start" | "end", val: string) => {
    if (type === "start") setAllStartTime(val);
    if (type === "end") setAllEndTime(val);

    const sTime = type === "start" ? val : allStartTime;
    const eTime = type === "end" ? val : allEndTime;
    const calculated = calculateHours(sTime, eTime);

    setDayWorkingHours((prev) =>
      prev.map((d) => ({
        ...d,
        startTime: sTime,
        endTime: eTime,
        totalHours: calculated,
      }))
    );
  };

  // Individual Day Toggle
  const handleToggleDay = (idx: number) => {
    setDayWorkingHours((prev) => {
      const updated = prev.map((item, i) =>
        i === idx ? { ...item, isSelected: !item.isSelected } : item
      );
      setAllDaysChecked(updated.every((d) => d.isSelected));
      return updated;
    });
  };

  // Individual Day Time Change
  const handleDayTimeChange = (idx: number, field: "startTime" | "endTime", val: string) => {
    setDayWorkingHours((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newStart = field === "startTime" ? val : item.startTime;
        const newEnd = field === "endTime" ? val : item.endTime;
        return {
          ...item,
          [field]: val,
          totalHours: calculateHours(newStart, newEnd),
        };
      })
    );
  };

  // Flexible Schedule Day Toggle
  const handleToggleFlexDay = (dayName: string) => {
    setFlexActiveDays((prev) =>
      prev.includes(dayName) ? prev.filter((d) => d !== dayName) : [...prev, dayName]
    );
  };

  // Initialize wizard for Add
  const handleOpenAddWizard = () => {
    setEditingRule(null);
    setRuleType("lmd");
    setName("");
    setColor("#0F172A");
    setDayWorkingHours(
      DAYS_OF_WEEK.map((d) => ({
        title: d,
        isSelected: true,
        startTime: "10:00 AM",
        endTime: "08:00 PM",
        totalHours: "10.0",
        vehicleType: "Cargo Van",
      }))
    );
    setAllDaysChecked(true);
    setAllStartTime("10:00 AM");
    setAllEndTime("08:00 PM");
    setFlexStartTime("10:00 AM");
    setFlexEndTime("08:00 PM");
    setFlexActiveDays(DAYS_OF_WEEK);
    setTargetShiftsPerWeek(4);
    setIsMultiDay(false);
    setBreakMinutes(30);
    setSetBreak(false);
    setBreakStartTime("02:00 PM");
    setSelectedTemplates([]);
    setReminderMinutes(60);
    setReminderEnabled(true);
    setPreferredDrivers([]);
    setInitialPreferredDrivers([]);
    setCurrentStep(1);
    setStatusAlert(null);
    setScreenMode("wizard");
  };

  // Initialize wizard for Edit
  const handleOpenEditWizard = (rule: ScheduleRuleItem) => {
    setEditingRule(rule);
    const type = rule.type === "mmd" ? "mmd" : "lmd";
    setRuleType(type);
    setName(rule.name || "");
    setColor(rule.color || "#0F172A");

    if (type === "lmd") {
      const wh = rule.working_hours || {};
      const updated = DAYS_OF_WEEK.map((d) => {
        const item = wh[d];
        if (item) {
          const s = to12Hour(item.shift_duration_start);
          const e = to12Hour(item.shift_duration_end);
          return {
            title: d,
            isSelected: true,
            startTime: s,
            endTime: e,
            totalHours: item.total_hours ? String(item.total_hours) : calculateHours(s, e),
            vehicleType: item.vehicle_type || "Cargo Van",
          };
        } else {
          return {
            title: d,
            isSelected: false,
            startTime: "10:00 AM",
            endTime: "08:00 PM",
            totalHours: "10.0",
            vehicleType: "Cargo Van",
          };
        }
      });
      setDayWorkingHours(updated);
      setAllDaysChecked(updated.every((d) => d.isSelected));
    } else {
      const arr = Array.isArray(rule.working_hours) ? rule.working_hours : [];
      if (arr.length > 0) {
        setFlexStartTime(to12Hour(arr[0].shift_duration_start));
        setFlexEndTime(to12Hour(arr[0].shift_duration_end));
      }
    }

    setBreakMinutes(rule.break_time != null ? Number(rule.break_time) : 30);
    setSetBreak(Boolean(rule.set_break));
    setBreakStartTime(to12Hour(rule.break_duration_start || "14:00:00"));

    setSelectedTemplates(Array.isArray(rule.message_templates) ? rule.message_templates : []);

    let existingDrivers: number[] = [];
    if (Array.isArray(rule.preferred_driver)) {
      existingDrivers = rule.preferred_driver.map(Number);
    } else if (typeof rule.preferred_driver === "string" && rule.preferred_driver.trim()) {
      existingDrivers = rule.preferred_driver.split(",").map(Number).filter(Boolean);
    }
    setPreferredDrivers(existingDrivers);
    setInitialPreferredDrivers(existingDrivers);

    setCurrentStep(1);
    setStatusAlert(null);
    setScreenMode("wizard");
  };

  const handleCancelWizard = () => {
    setScreenMode("list");
    setEditingRule(null);
    setStatusAlert(null);
  };

  // Step 3 Driver helper mutations
  const filteredDrivers = useMemo(() => {
    if (!driverFilterQuery.trim()) return drivers;
    const q = driverFilterQuery.toLowerCase().trim();
    return drivers.filter((d) => d.name.toLowerCase().includes(q));
  }, [drivers, driverFilterQuery]);

  const handleToggleDriver = (id: number) => {
    setPreferredDrivers((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleSelectAllDrivers = () => {
    const allIds = filteredDrivers.map((d) => d.id);
    const merged = Array.from(new Set([...preferredDrivers, ...allIds]));
    setPreferredDrivers(merged);
  };

  const handleDeselectAllDrivers = () => {
    const filteredIds = new Set(filteredDrivers.map((d) => d.id));
    setPreferredDrivers((prev) => prev.filter((id) => !filteredIds.has(id)));
  };

  // Validation
  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      setStatusAlert({ type: "error", message: "Schedule Rule Name is required." });
      return false;
    }
    if (ruleType === "lmd") {
      const anySelected = dayWorkingHours.some((d) => d.isSelected);
      if (!anySelected) {
        setStatusAlert({ type: "error", message: "Please select at least one active working day." });
        return false;
      }
    }
    setStatusAlert(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Save Schedule Rule (Create or Edit)
  const handleSave = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    setStatusAlert(null);

    try {
      let workingHoursPayload: any;
      if (ruleType === "lmd") {
        workingHoursPayload = {};
        dayWorkingHours.forEach((d) => {
          if (d.isSelected) {
            workingHoursPayload[d.title] = {
              shift_duration_start: to24Hour(d.startTime),
              shift_duration_end: to24Hour(d.endTime),
              total_hours: d.totalHours,
              vehicle_type: d.vehicleType,
            };
          }
        });
      } else {
        const calculated = calculateHours(flexStartTime, flexEndTime);
        workingHoursPayload = [
          {
            title: "Flexible Shift",
            shift_duration_start: to24Hour(flexStartTime),
            shift_duration_end: to24Hour(flexEndTime),
            total_hours: calculated,
            vehicle_type: "Cargo Van",
            applicable_days: flexActiveDays,
            is_multiday: isMultiDay,
            target_shifts_per_week: targetShiftsPerWeek,
          },
        ];
      }

      if (editingRule) {
        const uncheck = initialPreferredDrivers.filter((id) => !preferredDrivers.includes(id));
        const payload: UpdateScheduleRulePayload = {
          name: name.trim(),
          color,
          type: ruleType,
          working_hours: workingHoursPayload,
          break_time: breakMinutes,
          set_break: setBreak,
          break_duration_start: setBreak ? to24Hour(breakStartTime) : undefined,
          preferred_driver: preferredDrivers,
          uncheck_pref_drivers: uncheck.length > 0 ? uncheck : undefined,
          message_templates: selectedTemplates,
        };

        await schedulerApi.updateScheduleRule(editingRule.id, payload);
        setStatusAlert({ type: "success", message: `Schedule rule "${name}" updated successfully.` });
      } else {
        const payload: CreateScheduleRulePayload = {
          name: name.trim(),
          color,
          type: ruleType,
          working_hours: workingHoursPayload,
          break_time: breakMinutes,
          set_break: setBreak,
          break_duration_start: setBreak ? to24Hour(breakStartTime) : undefined,
          preferred_driver: preferredDrivers,
          message_templates: selectedTemplates,
        };

        await schedulerApi.createScheduleRule(payload);
        setStatusAlert({ type: "success", message: `Schedule rule "${name}" created successfully.` });
      }

      await onRefreshRules();

      setTimeout(() => {
        setScreenMode("list");
        setEditingRule(null);
        setStatusAlert(null);
      }, 1200);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save schedule rule. Please verify inputs.";
      setStatusAlert({ type: "error", message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Schedule Rule
  const handleDelete = async (id: number, ruleName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${ruleName}"?`)) return;

    setDeletingId(id);
    try {
      await schedulerApi.deleteScheduleRule(id);
      await onRefreshRules();
      setStatusAlert({ type: "success", message: `Rule "${ruleName}" deleted.` });
      setTimeout(() => setStatusAlert(null), 3000);
    } catch (err: any) {
      setStatusAlert({
        type: "error",
        message: err.response?.data?.message || "Failed to delete schedule rule.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRulesList = useMemo(() => {
    if (!rulesSearchQuery.trim()) return rules;
    const q = rulesSearchQuery.toLowerCase().trim();
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.type && r.type.toLowerCase().includes(q))
    );
  }, [rules, rulesSearchQuery]);

  return (
    <div
      className="add-driver-screen-container"
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        padding: "1.5rem",
      }}
    >
      {/* 1. Header: Back + Title on Left, Cancel & Submit Button on Right */}
      <div
        className="add-driver-header"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          paddingBottom: "0.85rem",
          borderBottom: "1px solid #E2E8F0",
          marginBottom: "1.25rem",
        }}
      >
        <div
          className="add-driver-header-left"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <button
            type="button"
            className="back-btn"
            onClick={screenMode === "wizard" ? handleCancelWizard : onBack}
          >
            <ArrowLeft size={16} />
            <span>{screenMode === "wizard" ? "Back to Rules" : "Back to Schedule"}</span>
          </button>
          <div
            className="screen-title-divider"
            style={{ width: "1px", height: "20px", backgroundColor: "#CBD5E1" }}
          />
          <h2
            className="screen-heading"
            style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0F172A" }}
          >
            {screenMode === "wizard"
              ? editingRule
                ? `Edit Schedule Rule: ${editingRule.name}`
                : "Create Schedule Rule"
              : "Schedule Rules"}
          </h2>
        </div>

        <div
          className="add-driver-header-right"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.85rem",
            marginLeft: "auto",
          }}
        >
          {screenMode === "list" ? (
            <button
              type="button"
              onClick={handleOpenAddWizard}
              className="btn-blue-primary"
              style={{ color: "#FFFFFF" }}
            >
              <Plus size={15} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Add Schedule Rule</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-outline-cancel"
                onClick={handleCancelWizard}
                disabled={isSaving}
              >
                Cancel
              </button>
              {currentStep < 3 ? (
                <button
                  type="button"
                  className="btn-blue-primary"
                  onClick={handleNext}
                  style={{ color: "#FFFFFF" }}
                >
                  <span style={{ color: "#FFFFFF" }}>Next Step</span>
                  <ArrowRight size={14} style={{ color: "#FFFFFF" }} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-blue-primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ color: "#FFFFFF" }}
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span style={{ color: "#FFFFFF" }}>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} style={{ color: "#FFFFFF" }} />
                      <span style={{ color: "#FFFFFF" }}>
                        {editingRule ? "Save Changes" : "Save Schedule Rule"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {statusAlert && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            fontSize: "0.8125rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: statusAlert.type === "success" ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${statusAlert.type === "success" ? "#BBF7D0" : "#FECACA"}`,
            color: statusAlert.type === "success" ? "#166534" : "#991B1B",
          }}
        >
          {statusAlert.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusAlert.message}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SCREEN MODE 1: RULES LIST CATALOGUE
          ───────────────────────────────────────────────────────────── */}
      {screenMode === "list" && (
        <div className="add-driver-card" style={{ padding: "1.5rem" }}>
          {/* Top filter row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", width: "300px" }}>
              <Search
                size={14}
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
              />
              <input
                type="text"
                placeholder="Search schedule rules..."
                value={rulesSearchQuery}
                onChange={(e) => setRulesSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2rem",
                  fontSize: "0.8125rem",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64748B" }}>
              Total Rules: <span style={{ color: "#0F172A", fontWeight: 700 }}>{filteredRulesList.length}</span>
            </div>
          </div>

          {/* Rules Cards Grid */}
          {filteredRulesList.length === 0 ? (
            <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#94A3B8" }}>
              <Layers size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>No schedule rules found</p>
              <p style={{ margin: "0.25rem 0 1rem", fontSize: "0.75rem" }}>
                Create a schedule rule to define working hours, break parameters, and driver assignments.
              </p>
              <button
                type="button"
                onClick={handleOpenAddWizard}
                className="btn-blue-primary"
                style={{ margin: "0 auto", color: "#FFFFFF" }}
              >
                <Plus size={14} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Add First Schedule Rule</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
              {filteredRulesList.map((rule) => {
                const ruleColor = rule.color || "#0F172A";
                const isMmd = rule.type === "mmd";

                let activeDaysCount = 0;
                if (rule.working_hours) {
                  if (typeof rule.working_hours === "object" && !Array.isArray(rule.working_hours)) {
                    activeDaysCount = Object.keys(rule.working_hours).length;
                  } else if (Array.isArray(rule.working_hours)) {
                    activeDaysCount = rule.working_hours.length;
                  }
                }

                let preferredCount = 0;
                if (Array.isArray(rule.preferred_driver)) {
                  preferredCount = rule.preferred_driver.length;
                } else if (typeof rule.preferred_driver === "string" && rule.preferred_driver) {
                  preferredCount = rule.preferred_driver.split(",").filter(Boolean).length;
                }

                return (
                  <div
                    key={rule.id}
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ height: "4px", backgroundColor: ruleColor }} />

                    <div style={{ padding: "1.1rem" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "3px",
                              backgroundColor: ruleColor,
                              flexShrink: 0,
                            }}
                          />
                          <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A" }}>
                            {rule.name}
                          </h4>
                        </div>

                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            backgroundColor: isMmd ? "#F5F3FF" : "#EFF6FF",
                            color: isMmd ? "#7C3AED" : "#2563EB",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isMmd ? "Flexible Shift" : "Day Specific"}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.85rem", fontSize: "0.75rem", color: "#64748B" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={13} style={{ color: "#94A3B8" }} />
                          <span>{activeDaysCount} Active {isMmd ? "Shifts" : "Days"}</span>
                        </div>

                        {rule.break_time ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Coffee size={13} style={{ color: "#94A3B8" }} />
                            <span>{rule.break_time}m Break</span>
                          </div>
                        ) : null}

                        {preferredCount > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ fontWeight: 600, color: "#2563EB" }}>{preferredCount}</span>
                            <span>Drivers</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "0.75rem 1.1rem",
                        backgroundColor: "#F8FAFC",
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "0.6875rem", color: "#94A3B8", fontWeight: 600 }}>
                        ID #{rule.id}
                      </span>

                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditWizard(rule)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "6px",
                            border: "1px solid #CBD5E1",
                            backgroundColor: "#FFFFFF",
                            color: "#334155",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Edit2 size={12} style={{ color: "#2563EB" }} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(rule.id, rule.name)}
                          disabled={deletingId === rule.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "6px",
                            border: "1px solid #FEE2E2",
                            backgroundColor: "#FEF2F2",
                            color: "#DC2626",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={12} />
                          <span>{deletingId === rule.id ? "..." : "Delete"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SCREEN MODE 2: DEDICATED 3-STEP WIZARD (Add / Edit)
          ───────────────────────────────────────────────────────────── */}
      {screenMode === "wizard" && (
        <div className="add-driver-card" style={{ padding: "1.75rem 2rem" }}>
          {/* Top Segmented Tab Switcher: Day Specific vs Flexible Shift */}
          <div className="sch-type-tabs" style={{ padding: 0, marginBottom: "1.75rem" }}>
            <button
              type="button"
              className={`sch-type-tab-btn ${ruleType === "lmd" ? "active" : ""}`}
              onClick={() => setRuleType("lmd")}
            >
              Day Specific Schedule
            </button>
            <button
              type="button"
              className={`sch-type-tab-btn ${ruleType === "mmd" ? "active" : ""}`}
              onClick={() => setRuleType("mmd")}
            >
              Flexible Shift Schedule
            </button>
          </div>

          {/* Stepper Navigation Bar */}
          <div className="sch-stepper-bar" style={{ padding: "0 0 1.75rem 0", marginBottom: "1.75rem", borderBottom: "1px solid #E2E8F0" }}>
            {/* Step 1 Node */}
            <div
              className={`sch-step-node ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}
              onClick={() => setCurrentStep(1)}
            >
              <div className={`sch-step-circle ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}>
                {currentStep > 1 ? <Check size={16} strokeWidth={3} /> : "1"}
              </div>
              <span className="sch-step-label">Basic Info & Hours</span>
            </div>

            <div className={`sch-step-connector ${currentStep > 1 ? "completed" : ""}`} />

            {/* Step 2 Node */}
            <div
              className={`sch-step-node ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
            >
              <div className={`sch-step-circle ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}>
                {currentStep > 2 ? <Check size={16} strokeWidth={3} /> : "2"}
              </div>
              <span className="sch-step-label">Messages & Notifications</span>
            </div>

            <div className={`sch-step-connector ${currentStep > 2 ? "completed" : ""}`} />

            {/* Step 3 Node */}
            <div
              className={`sch-step-node ${currentStep === 3 ? "active" : ""}`}
              onClick={() => {
                if (validateStep1()) setCurrentStep(3);
              }}
            >
              <div className={`sch-step-circle ${currentStep === 3 ? "active" : ""}`}>
                3
              </div>
              <span className="sch-step-label">Preferred Drivers</span>
            </div>
          </div>

          {/* STEP 1: Basic Info & Working Hours */}
          {currentStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Row 1: Rule Name & Accent Color (Clean 2-Column Grid) */}
              <div className="add-driver-grid-2">
                <div className="add-driver-field-group">
                  <label className="add-driver-label">
                    Schedule Rule Name <span className="text-red-500">*</span>
                  </label>
                  <div className="add-driver-input-wrap">
                    <FileText size={15} className="add-driver-input-icon" />
                    <input
                      type="text"
                      className="add-driver-input"
                      placeholder="e.g. Morning Wave 1 Standard"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="add-driver-field-group">
                  <label className="add-driver-label">
                    Accent Color
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "42px" }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: c,
                          border: color === c ? "2.5px solid #2563EB" : "1.5px solid rgba(0,0,0,0.12)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                          boxShadow: color === c ? "0 0 0 3px rgba(37,99,235,0.2)" : "none",
                        }}
                      >
                        {color === c && <Check size={14} style={{ color: "#FFFFFF" }} strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Working Hours: Day Specific */}
              {ruleType === "lmd" ? (
                <div className="sch-working-hours-container">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <label className="sch-field-label" style={{ margin: 0 }}>
                      WORKING HOURS<span className="req">*</span>
                    </label>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#2563EB",
                        background: "#EFF6FF",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "6px",
                      }}
                    >
                      Total: {totalWeeklyHours} hrs / week
                    </span>
                  </div>

                  {/* Master Quick-Set Row: [x] All + Dropdowns */}
                  <div className="sch-master-time-row">
                    <label className="sch-day-label-wrap" style={{ cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        className="sch-day-checkbox"
                        checked={allDaysChecked}
                        onChange={(e) => handleToggleAllDays(e.target.checked)}
                      />
                      <span style={{ fontWeight: 700, color: "#0F172A" }}>All Days</span>
                    </label>

                    <div className="sch-time-selectors-group">
                      <select
                        className="sch-time-select"
                        value={allStartTime}
                        onChange={(e) => handleMasterTimeChange("start", e.target.value)}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={`all-s-${t}`} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="sch-time-separator">-</span>
                      <select
                        className="sch-time-select"
                        value={allEndTime}
                        onChange={(e) => handleMasterTimeChange("end", e.target.value)}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={`all-e-${t}`} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Individual Day Rows */}
                  {dayWorkingHours.map((d, idx) => (
                    <div key={d.title} className="sch-day-time-row">
                      <label className="sch-day-label-wrap" style={{ cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          className="sch-day-checkbox"
                          checked={d.isSelected}
                          onChange={() => handleToggleDay(idx)}
                        />
                        <span style={{ color: d.isSelected ? "#0F172A" : "#94A3B8" }}>{d.title}</span>
                      </label>

                      <div className="sch-time-selectors-group">
                        <select
                          className="sch-time-select"
                          value={d.startTime}
                          disabled={!d.isSelected}
                          onChange={(e) => handleDayTimeChange(idx, "startTime", e.target.value)}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={`${d.title}-s-${t}`} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="sch-time-separator">-</span>
                        <select
                          className="sch-time-select"
                          value={d.endTime}
                          disabled={!d.isSelected}
                          onChange={(e) => handleDayTimeChange(idx, "endTime", e.target.value)}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={`${d.title}-e-${t}`} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="sch-daily-hours-badge">
                          {d.isSelected ? `${d.totalHours}h` : "--"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Working Hours: Flexible Shift Schedule */
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <label className="sch-field-label" style={{ margin: 0 }}>
                        FLEXIBLE SHIFT DURATIONS<span className="req">*</span>
                      </label>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#2563EB",
                          background: "#EFF6FF",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "6px",
                        }}
                      >
                        {calculateHours(flexStartTime, flexEndTime)} hrs per shift
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.85rem 1rem",
                        backgroundColor: "#F8FAFC",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div className="sch-time-selectors-group">
                        <select
                          className="sch-time-select"
                          value={flexStartTime}
                          onChange={(e) => setFlexStartTime(e.target.value)}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={`flex-s-${t}`} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="sch-time-separator">-</span>
                        <select
                          className="sch-time-select"
                          value={flexEndTime}
                          onChange={(e) => setFlexEndTime(e.target.value)}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={`flex-e-${t}`} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Applicable Days */}
                  <div>
                    <label className="sch-field-label" style={{ marginBottom: "0.5rem" }}>
                      APPLICABLE DAYS
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {DAYS_OF_WEEK.map((d) => {
                        const isSel = flexActiveDays.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleToggleFlexDay(d)}
                            style={{
                              padding: "0.45rem 0.85rem",
                              borderRadius: "8px",
                              border: isSel ? "1.5px solid #2563EB" : "1px solid #CBD5E1",
                              backgroundColor: isSel ? "#EFF6FF" : "#FFFFFF",
                              color: isSel ? "#2563EB" : "#475569",
                              fontWeight: isSel ? 700 : 500,
                              fontSize: "0.8125rem",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {d.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Shifts */}
                  <div style={{ maxWidth: "260px" }}>
                    <label className="sch-field-label">TARGET SHIFTS PER WEEK</label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      className="add-driver-input"
                      value={targetShiftsPerWeek}
                      onChange={(e) => setTargetShiftsPerWeek(parseInt(e.target.value, 10) || 4)}
                    />
                  </div>
                </div>
              )}

              {/* Meal & Rest Break Settings */}
              <div
                style={{
                  padding: "1rem 1.15rem",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <Coffee size={17} style={{ color: "#2563EB" }} />
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>
                        Meal & Rest Break
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        Automatically schedule standard meal/rest pauses during shifts
                      </div>
                    </div>
                  </div>

                  {/* iOS Style Switch */}
                  <label style={{ position: "relative", display: "inline-block", width: "42px", height: "24px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={setBreak}
                      onChange={(e) => setSetBreak(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: setBreak ? "#2563EB" : "#CBD5E1",
                        borderRadius: "24px",
                        transition: "0.2s",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          height: "18px",
                          width: "18px",
                          left: setBreak ? "20px" : "3px",
                          bottom: "3px",
                          backgroundColor: "#FFFFFF",
                          borderRadius: "50%",
                          transition: "0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </span>
                  </label>
                </div>

                {setBreak && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                      marginTop: "1rem",
                      paddingTop: "0.85rem",
                      borderTop: "1px solid #E2E8F0",
                    }}
                  >
                    <div>
                      <label className="sch-field-label">BREAK DURATION</label>
                      <select
                        className="sch-time-select"
                        style={{ width: "100%" }}
                        value={breakMinutes}
                        onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes (Standard)</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes (1 hour)</option>
                      </select>
                    </div>

                    <div>
                      <label className="sch-field-label">BREAK WINDOW START</label>
                      <select
                        className="sch-time-select"
                        style={{ width: "100%" }}
                        value={breakStartTime}
                        onChange={(e) => setBreakStartTime(e.target.value)}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={`break-${t}`} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Wizard Navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.5rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid #E2E8F0",
                }}
              >
                <button
                  type="button"
                  className="btn-outline-cancel"
                  onClick={handleCancelWizard}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-blue-primary"
                  onClick={handleNext}
                  style={{ color: "#FFFFFF" }}
                >
                  <span style={{ color: "#FFFFFF" }}>Next: Messages & Notifications</span>
                  <ArrowRight size={14} style={{ color: "#FFFFFF" }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Messages & Notifications */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label className="add-driver-label" style={{ marginBottom: "0.25rem" }}>
                  Company Message Templates
                </label>
                <p style={{ margin: "0 0 0.85rem", fontSize: "0.75rem", color: "#64748B" }}>
                  Select communication templates automatically dispatched for shifts under this rule.
                </p>

                {availableTemplates.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: "0.8125rem",
                    }}
                  >
                    Standard system notifications will be dispatched automatically.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {availableTemplates.map((tpl) => {
                      const isChecked = selectedTemplates.some((t) => t.id === tpl.id);
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => {
                            setSelectedTemplates((prev) =>
                              isChecked ? prev.filter((t) => t.id !== tpl.id) : [...prev, tpl]
                            );
                          }}
                          style={{
                            padding: "0.85rem 1.15rem",
                            borderRadius: "10px",
                            border: isChecked ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
                            backgroundColor: isChecked ? "#EFF6FF" : "#FFFFFF",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0F172A" }}>
                              {tpl.title || tpl.name || `Template #${tpl.id}`}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "0.15rem" }}>
                              {tpl.message || tpl.content}
                            </div>
                          </div>
                          {isChecked && <CheckCircle2 size={18} style={{ color: "#2563EB", flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Automated Reminder Card */}
              <div
                style={{
                  padding: "1rem 1.15rem",
                  borderRadius: "10px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  <Clock size={15} style={{ color: "#2563EB" }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>
                    Automated Shift Reminders
                  </span>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginBottom: "0.75rem" }}>
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                  />
                  <span style={{ fontSize: "0.8125rem", color: "#334155" }}>
                    Send automated reminder prior to shift start
                  </span>
                </label>

                {reminderEnabled && (
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="add-driver-input"
                    style={{ maxWidth: "300px" }}
                  >
                    <option value={30}>30 minutes before shift</option>
                    <option value={60}>1 hour before shift</option>
                    <option value={120}>2 hours before shift</option>
                    <option value={720}>12 hours before shift</option>
                    <option value={1440}>24 hours before shift</option>
                  </select>
                )}
              </div>

              {/* Bottom Wizard Navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.5rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid #E2E8F0",
                }}
              >
                <button
                  type="button"
                  className="btn-outline-cancel"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft size={14} />
                  <span>Previous: Basic Info</span>
                </button>
                <button
                  type="button"
                  className="btn-blue-primary"
                  onClick={handleNext}
                  style={{ color: "#FFFFFF" }}
                >
                  <span style={{ color: "#FFFFFF" }}>Next: Preferred Drivers</span>
                  <ArrowRight size={14} style={{ color: "#FFFFFF" }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preferred Drivers */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>
                    Assign Preferred Drivers
                  </span>
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>
                    Drivers prioritized during auto-scheduling for shifts under this rule.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={handleSelectAllDrivers}
                    style={{
                      padding: "0.3rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#2563EB",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllDrivers}
                    style={{
                      padding: "0.3rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#64748B",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Driver search input */}
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
                />
                <input
                  type="text"
                  placeholder="Search drivers by name..."
                  value={driverFilterQuery}
                  onChange={(e) => setDriverFilterQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.75rem 0.45rem 2rem",
                    fontSize: "0.8125rem",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    outline: "none",
                  }}
                />
              </div>

              {/* Selected Count Indicator */}
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2563EB" }}>
                {preferredDrivers.length} of {drivers.length} drivers selected
              </div>

              {/* Drivers Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "0.6rem",
                  maxHeight: "360px",
                  overflowY: "auto",
                  padding: "0.25rem",
                }}
              >
                {filteredDrivers.map((d) => {
                  const isChecked = preferredDrivers.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      onClick={() => handleToggleDriver(d.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "8px",
                        border: isChecked ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
                        backgroundColor: isChecked ? "#EFF6FF" : "#FFFFFF",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ cursor: "pointer" }}
                      />
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {d.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Wizard Navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.5rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid #E2E8F0",
                }}
              >
                <button
                  type="button"
                  className="btn-outline-cancel"
                  onClick={() => setCurrentStep(2)}
                >
                  <ArrowLeft size={14} />
                  <span>Previous: Messages</span>
                </button>

                <button
                  type="button"
                  className="btn-blue-primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ color: "#FFFFFF" }}
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span style={{ color: "#FFFFFF" }}>Saving Rule...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} style={{ color: "#FFFFFF" }} />
                      <span style={{ color: "#FFFFFF" }}>
                        {editingRule ? "Save Changes" : "Save Schedule Rule"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
