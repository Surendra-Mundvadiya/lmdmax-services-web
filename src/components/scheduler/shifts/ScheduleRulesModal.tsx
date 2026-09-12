import React, { FC, useState, useEffect, useMemo, useRef } from "react";
import {
  X,
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
  ArrowLeft,
} from "lucide-react";
import {
  schedulerApi,
  ScheduleRuleItem,
  CreateScheduleRulePayload,
  UpdateScheduleRulePayload,
  SchedulerDriverItem,
} from "../../../api/schedulerApi";
import LoadingSpinner from "../../common/LoadingSpinner";

interface ScheduleRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: ScheduleRuleItem[];
  onRefreshRules: () => Promise<void>;
  drivers: SchedulerDriverItem[];
}

const PRESET_COLORS = [
  "#0F172A", // Black / Slate (as in production screenshot)
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

// Convert 12h string ("10:00 AM") to minutes from midnight
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

// Calculate hours difference between two 12h strings
function calculateHours(start: string, end: string): string {
  const sMin = timeToMinutes(start);
  const eMin = timeToMinutes(end);
  let diff = eMin - sMin;
  if (diff <= 0) diff += 24 * 60; // overnight span
  return (diff / 60).toFixed(1);
}

// Convert 12h ("10:00 AM") to 24h ("10:00:00")
function to24Hour(timeStr: string): string {
  const min = timeToMinutes(timeStr);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

// Convert 24h ("10:00:00" or "10:00") to 12h ("10:00 AM")
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
}

interface MessageTemplateConfig {
  name: string;
  displayName: string;
  isSelected: boolean;
  templateMessage: string;
  form_active_time: string;
  duration: string;
  form_decline_time?: string;
  form_decline_duration?: string;
}

const DEFAULT_MESSAGE_TEMPLATES: MessageTemplateConfig[] = [
  {
    name: "confirmation pending",
    displayName: "Shift Confirmation Pending",
    isSelected: true,
    form_active_time: "24",
    duration: "hours",
    form_decline_time: "2",
    form_decline_duration: "hours",
    templateMessage:
      "Hi ${DriverName}, you have been scheduled for a shift on ${Date} from ${StartTime} to ${EndTime}. Please confirm your attendance.",
  },
  {
    name: "upcoming reminder",
    displayName: "Upcoming Shift Reminder",
    isSelected: true,
    form_active_time: "2",
    duration: "hours",
    templateMessage:
      "Reminder: Your upcoming shift starts at ${StartTime} on ${Date}. Please report on time.",
  },
  {
    name: "VTO Management",
    displayName: "Voluntary Time Off (VTO)",
    isSelected: true,
    form_active_time: "15",
    duration: "minutes",
    templateMessage:
      "You have been offered Voluntary Time off (VTO) for the following shift. Please click to claim or decline.",
  },
  {
    name: "open shift assignment",
    displayName: "Open Shift Claim Notice",
    isSelected: false,
    form_active_time: "1",
    duration: "hours",
    templateMessage:
      "An open shift has been posted on ${Date}. Click the link to claim this shift immediately.",
  },
  {
    name: "shift cancelled",
    displayName: "Shift Update & Cancellation",
    isSelected: true,
    form_active_time: "1",
    duration: "hours",
    templateMessage:
      "The shift assigned to you on ${Date} has been updated or cancelled. Please review your schedule in the app.",
  },
];

export const ScheduleRulesModal: FC<ScheduleRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onRefreshRules,
  drivers,
}) => {
  // Navigation / View mode: "catalog" (rules list) or "wizard" (3-step Add/Edit)
  const [viewMode, setViewMode] = useState<"catalog" | "wizard">("catalog");
  const [editingRule, setEditingRule] = useState<ScheduleRuleItem | null>(null);

  // Tab: "lmd" (Day Specific Schedule) or "mmd" (Flexible Shift Schedule)
  const [scheduleType, setScheduleType] = useState<"lmd" | "mmd">("lmd");

  // Stepper: 1: Add Details, 2: Select Messages, 3: Preview
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Add Details State
  const [scheduleName, setScheduleName] = useState<string>("");
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Day Specific Working Hours
  const [allDaysChecked, setAllDaysChecked] = useState<boolean>(true);
  const [allStartTime, setAllStartTime] = useState<string>("10:00 AM");
  const [allEndTime, setAllEndTime] = useState<string>("06:00 PM");
  const [dayWorkingHours, setDayWorkingHours] = useState<DayWorkingHourState[]>(
    DAYS_OF_WEEK.map((day) => ({
      title: day,
      isSelected: true,
      startTime: "10:00 AM",
      endTime: "06:00 PM",
      totalHours: "8.0",
    }))
  );

  // Flexible Shift State
  const [flexStartTime, setFlexStartTime] = useState<string>("10:00 AM");
  const [flexEndTime, setFlexEndTime] = useState<string>("06:00 PM");
  const [flexActiveDays, setFlexActiveDays] = useState<string[]>([...DAYS_OF_WEEK]);
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
  const [targetShiftsPerWeek, setTargetShiftsPerWeek] = useState<number>(4);

  // Break State
  const [setBreak, setSetBreak] = useState<boolean>(true);
  const [breakTime, setBreakTime] = useState<number>(30);
  const [breakDurationStart, setBreakDurationStart] = useState<string>("01:00 PM");

  // Step 2: Message Templates State
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplateConfig[]>(
    DEFAULT_MESSAGE_TEMPLATES
  );

  // Step 3: Preferred Drivers State
  const [selectedDriverIds, setSelectedDriverIds] = useState<number[]>([]);
  const [driverSearchQuery, setDriverSearchQuery] = useState<string>("");

  // Operational State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Close color popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    };
    if (isColorPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColorPickerOpen]);

  // Load message templates from backend on open
  useEffect(() => {
    if (isOpen) {
      schedulerApi.getCompanyMessageTemplates().then((liveTemplates) => {
        if (liveTemplates && liveTemplates.length > 0) {
          setMessageTemplates((prev) =>
            prev.map((tmpl) => {
              const matched = liveTemplates.find((lt) => lt.name === tmpl.name);
              if (matched) {
                return {
                  ...tmpl,
                  templateMessage: matched.template_message || tmpl.templateMessage,
                  displayName: matched.display_name || tmpl.displayName,
                };
              }
              return tmpl;
            })
          );
        }
      });
    }
  }, [isOpen]);

  // Initialize wizard for Create
  const handleStartCreate = () => {
    setEditingRule(null);
    setScheduleType("lmd");
    setCurrentStep(1);
    setScheduleName("");
    setColor(PRESET_COLORS[0]);
    setIsColorPickerOpen(false);

    setAllDaysChecked(true);
    setAllStartTime("10:00 AM");
    setAllEndTime("06:00 PM");
    setDayWorkingHours(
      DAYS_OF_WEEK.map((day) => ({
        title: day,
        isSelected: true,
        startTime: "10:00 AM",
        endTime: "06:00 PM",
        totalHours: "8.0",
      }))
    );

    setFlexStartTime("10:00 AM");
    setFlexEndTime("06:00 PM");
    setFlexActiveDays([...DAYS_OF_WEEK]);
    setIsMultiDay(false);
    setTargetShiftsPerWeek(4);

    setSetBreak(true);
    setBreakTime(30);
    setBreakDurationStart("01:00 PM");

    setMessageTemplates(DEFAULT_MESSAGE_TEMPLATES);
    setSelectedDriverIds([]);
    setDriverSearchQuery("");
    setErrorBanner(null);
    setSuccessBanner(null);
    setViewMode("wizard");
  };

  // Initialize wizard for Edit
  const handleStartEdit = (rule: ScheduleRuleItem) => {
    setEditingRule(rule);
    setScheduleType(rule.type === "mmd" ? "mmd" : "lmd");
    setCurrentStep(1);
    setScheduleName(rule.name || "");
    setColor(rule.color || PRESET_COLORS[0]);
    setIsColorPickerOpen(false);

    // Parse working hours
    let parsedHours: any[] = [];
    if (rule.working_hours) {
      try {
        parsedHours =
          typeof rule.working_hours === "string"
            ? JSON.parse(rule.working_hours)
            : rule.working_hours;
      } catch {
        parsedHours = [];
      }
    }

    if (rule.type === "mmd") {
      // Flexible shift
      const first = Array.isArray(parsedHours) && parsedHours[0] ? parsedHours[0] : null;
      if (first) {
        setFlexStartTime(to12Hour(first.shift_duration_start || first.startTime));
        setFlexEndTime(to12Hour(first.shift_duration_end || first.endTime));
      }
      setFlexActiveDays([...DAYS_OF_WEEK]);
    } else {
      // Day specific
      if (Array.isArray(parsedHours) && parsedHours.length > 0) {
        const mapped = DAYS_OF_WEEK.map((day) => {
          const found = parsedHours.find(
            (p: any) =>
              (p.title && p.title.toLowerCase() === day.toLowerCase()) ||
              (p.day && p.day.toLowerCase() === day.toLowerCase())
          );
          if (found) {
            const s = to12Hour(found.startTime || found.shift_duration_start);
            const e = to12Hour(found.endTime || found.shift_duration_end);
            return {
              title: day,
              isSelected: found.isSelected !== false,
              startTime: s,
              endTime: e,
              totalHours: calculateHours(s, e),
            };
          }
          return {
            title: day,
            isSelected: true,
            startTime: "10:00 AM",
            endTime: "06:00 PM",
            totalHours: "8.0",
          };
        });
        setDayWorkingHours(mapped);
        setAllDaysChecked(mapped.every((d) => d.isSelected));
      } else {
        setDayWorkingHours(
          DAYS_OF_WEEK.map((day) => ({
            title: day,
            isSelected: true,
            startTime: "10:00 AM",
            endTime: "06:00 PM",
            totalHours: "8.0",
          }))
        );
        setAllDaysChecked(true);
      }
    }

    // Break settings
    setSetBreak(rule.set_break ?? true);
    setBreakTime(rule.break_time ?? 30);
    setBreakDurationStart(to12Hour(rule.break_duration_start || "13:00:00"));

    // Message templates
    if (rule.message_templates && Array.isArray(rule.message_templates)) {
      setMessageTemplates((prev) =>
        prev.map((tmpl) => {
          const found = (rule.message_templates as any[])?.find((m: any) => m.name === tmpl.name);
          if (found) {
            return {
              ...tmpl,
              isSelected: found.isSelected !== false,
              form_active_time: String(found.form_active_time || tmpl.form_active_time),
              duration: found.duration || tmpl.duration,
              templateMessage: found.templateMessage || tmpl.templateMessage,
            };
          }
          return tmpl;
        })
      );
    }

    // Preferred Drivers
    let prefDrivers: number[] = [];
    if (rule.preferred_driver) {
      if (Array.isArray(rule.preferred_driver)) {
        prefDrivers = rule.preferred_driver.map(Number);
      } else if (typeof rule.preferred_driver === "string") {
        prefDrivers = rule.preferred_driver
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n));
      }
    }
    setSelectedDriverIds(prefDrivers);
    setDriverSearchQuery("");
    setErrorBanner(null);
    setSuccessBanner(null);
    setViewMode("wizard");
  };

  // Delete Rule
  const handleDeleteRule = async (id: number, rName: string) => {
    if (!window.confirm(`Are you sure you want to delete the schedule rule "${rName}"?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await schedulerApi.deleteScheduleRule(id);
      await onRefreshRules();
      setSuccessBanner(`Schedule rule "${rName}" deleted successfully.`);
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (err: any) {
      setErrorBanner(err?.response?.data?.message || "Failed to delete schedule rule.");
      setTimeout(() => setErrorBanner(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Day Specific Handler: Toggle Master "All"
  const handleToggleAll = (checked: boolean) => {
    setAllDaysChecked(checked);
    setDayWorkingHours((prev) =>
      prev.map((d) => ({
        ...d,
        isSelected: checked,
        startTime: allStartTime,
        endTime: allEndTime,
        totalHours: calculateHours(allStartTime, allEndTime),
      }))
    );
  };

  // Day Specific Handler: Master Time Change
  const handleMasterTimeChange = (type: "start" | "end", val: string) => {
    if (type === "start") {
      setAllStartTime(val);
      setDayWorkingHours((prev) =>
        prev.map((d) =>
          d.isSelected
            ? { ...d, startTime: val, totalHours: calculateHours(val, d.endTime) }
            : d
        )
      );
    } else {
      setAllEndTime(val);
      setDayWorkingHours((prev) =>
        prev.map((d) =>
          d.isSelected
            ? { ...d, endTime: val, totalHours: calculateHours(d.startTime, val) }
            : d
        )
      );
    }
  };

  // Day Specific Handler: Individual Day Toggle
  const handleToggleDay = (index: number) => {
    setDayWorkingHours((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isSelected: !next[index].isSelected };
      setAllDaysChecked(next.every((d) => d.isSelected));
      return next;
    });
  };

  // Day Specific Handler: Individual Day Time Change
  const handleDayTimeChange = (
    index: number,
    type: "start" | "end",
    val: string
  ) => {
    setDayWorkingHours((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (type === "start") {
        item.startTime = val;
      } else {
        item.endTime = val;
      }
      item.totalHours = calculateHours(item.startTime, item.endTime);
      next[index] = item;
      return next;
    });
  };

  // Total calculated weekly hours
  const totalWeeklyHours = useMemo(() => {
    if (scheduleType === "lmd") {
      const sum = dayWorkingHours
        .filter((d) => d.isSelected)
        .reduce((acc, d) => acc + parseFloat(d.totalHours || "0"), 0);
      return sum.toFixed(1);
    } else {
      const shiftHrs = parseFloat(calculateHours(flexStartTime, flexEndTime));
      const activeCount = flexActiveDays.length;
      return (shiftHrs * activeCount).toFixed(1);
    }
  }, [scheduleType, dayWorkingHours, flexStartTime, flexEndTime, flexActiveDays]);

  // Step 1 Validation & Next
  const handleStep1Next = () => {
    if (!scheduleName.trim()) {
      setErrorBanner("Schedule Name is required.");
      return;
    }
    if (scheduleType === "lmd") {
      const hasAnySelected = dayWorkingHours.some((d) => d.isSelected);
      if (!hasAnySelected) {
        setErrorBanner("Please select at least one active working day.");
        return;
      }
    } else {
      if (flexActiveDays.length === 0) {
        setErrorBanner("Please select at least one applicable day for flexible shifts.");
        return;
      }
    }
    setErrorBanner(null);
    setCurrentStep(2);
  };

  // Step 2 Validation & Next
  const handleStep2Next = () => {
    // Validate that Confirmation Pending active time is not "0" (backend constraint)
    const confTmpl = messageTemplates.find(
      (m) => m.name === "confirmation pending" && m.isSelected
    );
    if (confTmpl && (confTmpl.form_active_time === "0" || !confTmpl.form_active_time.trim())) {
      setErrorBanner("Value of follow up message cannot be 0 for Shift Confirmation.");
      return;
    }
    setErrorBanner(null);
    setCurrentStep(3);
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorBanner(null);

    try {
      let workingHoursPayload: any[];

      if (scheduleType === "lmd") {
        workingHoursPayload = dayWorkingHours.map((d) => ({
          title: d.title,
          startTime: d.startTime,
          endTime: d.endTime,
          shift_duration_start: to24Hour(d.startTime),
          shift_duration_end: to24Hour(d.endTime),
          isSelected: d.isSelected,
          totalHours: d.totalHours,
          total_hours: d.totalHours,
        }));
      } else {
        const hoursEach = calculateHours(flexStartTime, flexEndTime);
        workingHoursPayload = [
          {
            title: "Flexible Shift",
            startTime: flexStartTime,
            endTime: flexEndTime,
            shift_duration_start: to24Hour(flexStartTime),
            shift_duration_end: to24Hour(flexEndTime),
            isSelected: true,
            totalHours: hoursEach,
            total_hours: hoursEach,
            applicable_days: flexActiveDays,
            is_multiday: isMultiDay,
            target_shifts_per_week: targetShiftsPerWeek,
          },
        ];
      }

      const templatesPayload = messageTemplates.map((t) => ({
        name: t.name,
        displayName: t.displayName,
        templateMessage: t.templateMessage,
        form_active_time: t.form_active_time,
        duration: t.duration,
        form_decline_time: t.form_decline_time || "2",
        form_decline_duration: t.form_decline_duration || "hours",
        isSelected: t.isSelected,
      }));

      if (editingRule) {
        // Update rule
        const updatePayload: UpdateScheduleRulePayload = {
          name: scheduleName.trim(),
          color,
          working_hours: workingHoursPayload,
          message_templates: templatesPayload,
          preferred_driver: selectedDriverIds,
          break_time: breakTime,
          set_break: setBreak,
          break_duration_start: to24Hour(breakDurationStart),
          type: scheduleType,
        };

        await schedulerApi.updateScheduleRule(editingRule.id, updatePayload);
        setSuccessBanner("Schedule rule updated successfully.");
      } else {
        // Create rule
        const createPayload: CreateScheduleRulePayload = {
          name: scheduleName.trim(),
          color,
          working_hours: workingHoursPayload,
          message_templates: templatesPayload,
          preferred_driver: selectedDriverIds,
          break_time: breakTime,
          set_break: setBreak,
          break_duration_start: to24Hour(breakDurationStart),
          type: scheduleType,
        };

        await schedulerApi.createScheduleRule(createPayload);
        setSuccessBanner("Schedule rule created successfully.");
      }

      await onRefreshRules();

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessBanner(null);
        setViewMode("catalog");
        setEditingRule(null);
      }, 1000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save schedule rule. Please verify inputs.";
      setErrorBanner(msg);
      setIsSubmitting(false);
    }
  };

  // Filtered drivers for search in Step 3
  const filteredDrivers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    if (!driverSearchQuery.trim()) return drivers;
    const q = driverSearchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.transporter_id?.toLowerCase().includes(q)
    );
  }, [drivers, driverSearchQuery]);

  // Toggle preferred driver selection
  const toggleDriver = (dId: number) => {
    setSelectedDriverIds((prev) =>
      prev.includes(dId) ? prev.filter((id) => id !== dId) : [...prev, dId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="sch-modal-overlay">
      <div className="sch-modal-window">
        {/* =================================================================
            VIEW MODE 1: CATALOG OF SCHEDULE RULES
            ================================================================= */}
        {viewMode === "catalog" ? (
          <>
            <div className="sch-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <Layers size={20} style={{ color: "#2563EB" }} />
                <h3 className="sch-modal-title" style={{ color: "#0F172A" }}>
                  Schedule Rules
                </h3>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#2563EB",
                    background: "#EFF6FF",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "12px",
                  }}
                >
                  {rules.length} {rules.length === 1 ? "Rule" : "Rules"}
                </span>
              </div>
              <button
                type="button"
                className="sch-modal-close-btn"
                onClick={onClose}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="sch-modal-body" style={{ minHeight: "340px" }}>
              {errorBanner && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: "8px",
                    color: "#DC2626",
                    fontSize: "0.8125rem",
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{errorBanner}</span>
                </div>
              )}

              {successBanner && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "8px",
                    color: "#15803D",
                    fontSize: "0.8125rem",
                  }}
                >
                  <Check size={15} />
                  <span>{successBanner}</span>
                </div>
              )}

              {rules.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    color: "#64748B",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "#EFF6FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                      color: "#2563EB",
                    }}
                  >
                    <Sparkles size={24} />
                  </div>
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#1E293B",
                      margin: "0 0 0.35rem 0",
                    }}
                  >
                    No Schedule Rules Defined
                  </h4>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "#64748B",
                      maxWidth: "340px",
                      margin: "0 0 1.25rem 0",
                    }}
                  >
                    Create rules to automate shift timings, driver assignment preferences,
                    and confirmation messaging.
                  </p>
                  <button
                    type="button"
                    className="sch-footer-next-btn"
                    onClick={handleStartCreate}
                  >
                    <Plus size={16} />
                    <span>Add First Schedule</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {rules.map((rule) => {
                    const ruleColor = rule.color || "#2563EB";
                    const isMmd = rule.type === "mmd";

                    // Calculate active days count
                    let daysDisplay = "Standard Shift";
                    if (rule.working_hours) {
                      try {
                        const wh =
                          typeof rule.working_hours === "string"
                            ? JSON.parse(rule.working_hours)
                            : rule.working_hours;
                        if (Array.isArray(wh)) {
                          const active = wh.filter((w) => w.isSelected !== false);
                          daysDisplay = `${active.length} Days / Week`;
                        }
                      } catch {
                        // ignore
                      }
                    }

                    return (
                      <div
                        key={rule.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "1rem 1.15rem",
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "12px",
                          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                          transition: "border-color 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "4px",
                              backgroundColor: ruleColor,
                              boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.05)",
                            }}
                          />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span
                                style={{
                                  fontSize: "0.9375rem",
                                  fontWeight: 700,
                                  color: "#0F172A",
                                }}
                              >
                                {rule.name}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.6875rem",
                                  fontWeight: 700,
                                  color: isMmd ? "#7C3AED" : "#2563EB",
                                  background: isMmd ? "#F5F3FF" : "#EFF6FF",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "6px",
                                }}
                              >
                                {isMmd ? "Flexible Shift" : "Day Specific"}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                marginTop: "0.25rem",
                                fontSize: "0.775rem",
                                color: "#64748B",
                              }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Clock size={12} />
                                {daysDisplay}
                              </span>
                              {rule.break_time ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <Coffee size={12} />
                                  {rule.break_time} min break
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(rule)}
                            style={{
                              padding: "0.4rem 0.75rem",
                              borderRadius: "6px",
                              border: "1px solid #CBD5E1",
                              background: "#FFFFFF",
                              color: "#1E293B",
                              fontSize: "0.775rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <Edit2 size={13} style={{ color: "#2563EB" }} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                            disabled={isSubmitting}
                            style={{
                              padding: "0.4rem",
                              borderRadius: "6px",
                              border: "1px solid #FECACA",
                              background: "#FEF2F2",
                              color: "#DC2626",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Delete Rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sch-modal-footer">
              <button
                type="button"
                className="sch-footer-cancel-btn"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="sch-footer-next-btn"
                onClick={handleStartCreate}
              >
                <Plus size={16} />
                <span>Add Schedule</span>
              </button>
            </div>
          </>
        ) : (
          /* =================================================================
              VIEW MODE 2: 3-STEP WIZARD (DAY SPECIFIC & FLEXIBLE SHIFT)
              ================================================================= */
          <>
            {/* Header: Title & Close */}
            <div className="sch-modal-header">
              <h3 className="sch-modal-title">
                {editingRule ? "Edit Schedule" : "Add Schedule"}
              </h3>
              <button
                type="button"
                className="sch-modal-close-btn"
                onClick={() => setViewMode("catalog")}
                title="Back to rules"
              >
                <X size={18} />
              </button>
            </div>

            {/* Two Tabs: Day Specific Schedule vs Flexible Shift Schedule */}
            <div className="sch-type-tabs">
              <button
                type="button"
                className={`sch-type-tab-btn ${scheduleType === "lmd" ? "active" : ""}`}
                onClick={() => setScheduleType("lmd")}
              >
                Day Specific Schedule
              </button>
              <button
                type="button"
                className={`sch-type-tab-btn ${scheduleType === "mmd" ? "active" : ""}`}
                onClick={() => setScheduleType("mmd")}
              >
                Flexible Shift Schedule
              </button>
            </div>

            {/* Stepper Bar: (1) Add Details -> (2) Select Messages -> (3) Preview */}
            <div className="sch-stepper-bar">
              {/* Step 1 Node */}
              <div
                className={`sch-step-node ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}
                onClick={() => setCurrentStep(1)}
              >
                <div
                  className={`sch-step-circle ${
                    currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""
                  }`}
                >
                  {currentStep > 1 ? <Check size={16} strokeWidth={3} /> : "1"}
                </div>
                <span className="sch-step-label">Add Details</span>
              </div>

              <div
                className={`sch-step-connector ${currentStep > 1 ? "completed" : ""}`}
              />

              {/* Step 2 Node */}
              <div
                className={`sch-step-node ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}
                onClick={() => {
                  if (scheduleName.trim()) setCurrentStep(2);
                }}
              >
                <div
                  className={`sch-step-circle ${
                    currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""
                  }`}
                >
                  {currentStep > 2 ? <Check size={16} strokeWidth={3} /> : "2"}
                </div>
                <span className="sch-step-label">Select Messages</span>
              </div>

              <div
                className={`sch-step-connector ${currentStep > 2 ? "completed" : ""}`}
              />

              {/* Step 3 Node */}
              <div
                className={`sch-step-node ${currentStep === 3 ? "active" : ""}`}
                onClick={() => {
                  if (scheduleName.trim()) setCurrentStep(3);
                }}
              >
                <div className={`sch-step-circle ${currentStep === 3 ? "active" : ""}`}>
                  3
                </div>
                <span className="sch-step-label">Preview</span>
              </div>
            </div>

            {/* Error Banner */}
            {errorBanner && (
              <div
                style={{
                  margin: "0 1.75rem 0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 0.85rem",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  color: "#DC2626",
                  fontSize: "0.8125rem",
                }}
              >
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorBanner}</span>
              </div>
            )}

            {/* Wizard Body */}
            <div className="sch-modal-body">
              {/* -------------------------------------------------------------
                  STEP 1: ADD DETAILS
                  ------------------------------------------------------------- */}
              {currentStep === 1 && (
                <>
                  {/* Top Row: Schedule Name & Color Picker */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1.25rem",
                    }}
                  >
                    {/* Schedule Name */}
                    <div style={{ flex: 1 }}>
                      <label className="sch-field-label">
                        SCHEDULE NAME<span className="req">*</span>
                      </label>
                      <div className="add-driver-input-wrap">
                        <input
                          type="text"
                          className="add-driver-input"
                          placeholder="Enter title here"
                          value={scheduleName}
                          onChange={(e) => {
                            setScheduleName(e.target.value);
                            if (errorBanner) setErrorBanner(null);
                          }}
                        />
                      </div>
                    </div>

                    {/* Color Picker */}
                    <div style={{ position: "relative" }} ref={colorPickerRef}>
                      <label className="sch-field-label">
                        COLOR<span className="req">*</span>
                      </label>
                      <button
                        type="button"
                        className="sch-color-trigger"
                        onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                      >
                        <div
                          className="sch-color-swatch"
                          style={{ backgroundColor: color }}
                        />
                        <ChevronDown size={14} style={{ color: "#64748B" }} />
                      </button>

                      {isColorPickerOpen && (
                        <div className="sch-color-popover">
                          {PRESET_COLORS.map((c) => (
                            <div
                              key={c}
                              className="sch-color-dot"
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                setColor(c);
                                setIsColorPickerOpen(false);
                              }}
                            >
                              {color === c && (
                                <Check size={14} style={{ color: "#FFFFFF" }} strokeWidth={3} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule Details: Day Specific vs Flexible Shift */}
                  {scheduleType === "lmd" ? (
                    /* Day Specific Schedule Hours */
                    <div className="sch-working-hours-container">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "0.25rem",
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
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                          }}
                        >
                          Total: {totalWeeklyHours} hrs / week
                        </span>
                      </div>

                      {/* Master Row: [x] All + Times */}
                      <div className="sch-master-time-row">
                        <label className="sch-day-label-wrap" style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            className="sch-day-checkbox"
                            checked={allDaysChecked}
                            onChange={(e) => handleToggleAll(e.target.checked)}
                          />
                          <span style={{ fontWeight: 700, color: "#0F172A" }}>All</span>
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

                      {/* Daily Rows: Sunday through Saturday */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {dayWorkingHours.map((dayItem, idx) => (
                          <div key={dayItem.title} className="sch-day-time-row">
                            <label className="sch-day-label-wrap" style={{ cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                className="sch-day-checkbox"
                                checked={dayItem.isSelected}
                                onChange={() => handleToggleDay(idx)}
                              />
                              <span
                                style={{
                                  color: dayItem.isSelected ? "#1E293B" : "#94A3B8",
                                }}
                              >
                                {dayItem.title}
                              </span>
                            </label>

                            <div className="sch-time-selectors-group">
                              <select
                                className="sch-time-select"
                                value={dayItem.startTime}
                                disabled={!dayItem.isSelected}
                                onChange={(e) =>
                                  handleDayTimeChange(idx, "start", e.target.value)
                                }
                                style={{
                                  opacity: dayItem.isSelected ? 1 : 0.45,
                                }}
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={`${dayItem.title}-s-${t}`} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <span
                                className="sch-time-separator"
                                style={{ opacity: dayItem.isSelected ? 1 : 0.45 }}
                              >
                                -
                              </span>
                              <select
                                className="sch-time-select"
                                value={dayItem.endTime}
                                disabled={!dayItem.isSelected}
                                onChange={(e) =>
                                  handleDayTimeChange(idx, "end", e.target.value)
                                }
                                style={{
                                  opacity: dayItem.isSelected ? 1 : 0.45,
                                }}
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={`${dayItem.title}-e-${t}`} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <span
                                className="sch-daily-hours-badge"
                                style={{
                                  opacity: dayItem.isSelected ? 1 : 0.35,
                                }}
                              >
                                {dayItem.isSelected ? `${dayItem.totalHours}h` : "Off"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Flexible Shift Schedule Settings */
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                      <div>
                        <label className="sch-field-label">
                          SHIFT TIMING WINDOW<span className="req">*</span>
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.85rem 1rem",
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "10px",
                          }}
                        >
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
                          <span className="sch-daily-hours-badge">
                            {calculateHours(flexStartTime, flexEndTime)}h / shift
                          </span>
                        </div>
                      </div>

                      {/* Applicable Days Selector */}
                      <div>
                        <label className="sch-field-label">
                          APPLICABLE DAYS<span className="req">*</span>
                        </label>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}
                        >
                          {DAYS_OF_WEEK.map((d) => {
                            const isAct = flexActiveDays.includes(d);
                            return (
                              <button
                                key={`flex-day-${d}`}
                                type="button"
                                onClick={() => {
                                  setFlexActiveDays((prev) =>
                                    prev.includes(d)
                                      ? prev.filter((item) => item !== d)
                                      : [...prev, d]
                                  );
                                }}
                                style={{
                                  padding: "0.45rem 0.85rem",
                                  borderRadius: "8px",
                                  fontSize: "0.8125rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                  border: isAct
                                    ? "1.5px solid #2563EB"
                                    : "1.5px solid #E2E8F0",
                                  background: isAct ? "#EFF6FF" : "#FFFFFF",
                                  color: isAct ? "#2563EB" : "#64748B",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {d.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Multi-Day / Overnight Shift Toggle */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.85rem 1rem",
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                            Multi-Day / Overnight Shift
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                            Allow shift to span across consecutive calendar days
                          </div>
                        </div>
                        <label className="sch-toggle-switch">
                          <input
                            type="checkbox"
                            checked={isMultiDay}
                            onChange={(e) => setIsMultiDay(e.target.checked)}
                          />
                          <span className="sch-toggle-slider" />
                        </label>
                      </div>

                      {/* Target Shifts per Week */}
                      <div>
                        <label className="sch-field-label">TARGET SHIFTS PER WEEK</label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <input
                            type="number"
                            min={1}
                            max={7}
                            className="add-driver-input"
                            style={{
                              width: "100px",
                              height: "38px",
                              padding: "0 0.75rem",
                              border: "1.5px solid #CBD5E1",
                              borderRadius: "8px",
                            }}
                            value={targetShiftsPerWeek}
                            onChange={(e) =>
                              setTargetShiftsPerWeek(parseInt(e.target.value, 10) || 1)
                            }
                          />
                          <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
                            Estimated weekly load: {totalWeeklyHours} hours
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Break Settings (Uniform for both types) */}
                  <div
                    style={{
                      borderTop: "1px solid #E2E8F0",
                      paddingTop: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Coffee size={16} style={{ color: "#2563EB" }} />
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                          Meal & Rest Break
                        </span>
                      </div>
                      <label className="sch-toggle-switch">
                        <input
                          type="checkbox"
                          checked={setBreak}
                          onChange={(e) => setSetBreak(e.target.checked)}
                        />
                        <span className="sch-toggle-slider" />
                      </label>
                    </div>

                    {setBreak && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1.5rem",
                          padding: "0.75rem 1rem",
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#475569" }}>
                            Duration:
                          </span>
                          <select
                            className="sch-time-select"
                            value={breakTime}
                            onChange={(e) => setBreakTime(parseInt(e.target.value, 10))}
                            style={{ height: "34px" }}
                          >
                            <option value={15}>15 mins</option>
                            <option value={30}>30 mins</option>
                            <option value={45}>45 mins</option>
                            <option value={60}>60 mins</option>
                          </select>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#475569" }}>
                            Start Time:
                          </span>
                          <select
                            className="sch-time-select"
                            value={breakDurationStart}
                            onChange={(e) => setBreakDurationStart(e.target.value)}
                            style={{ height: "34px" }}
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
                </>
              )}

              {/* -------------------------------------------------------------
                  STEP 2: SELECT MESSAGES
                  ------------------------------------------------------------- */}
              {currentStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.65rem 0.85rem",
                      background: "#EFF6FF",
                      border: "1px solid #DBEAFE",
                      borderRadius: "8px",
                      color: "#1E40AF",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <Info size={16} className="flex-shrink-0" />
                    <span>
                      Configure live SMS & Push notifications dispatched for shifts linked
                      to this schedule rule.
                    </span>
                  </div>

                  {messageTemplates.map((tmpl, idx) => (
                    <div
                      key={tmpl.name}
                      className={`sch-msg-card ${tmpl.isSelected ? "active" : ""}`}
                    >
                      <div className="sch-msg-header">
                        <div>
                          <div className="sch-msg-title">{tmpl.displayName}</div>
                          <div className="sch-msg-desc">
                            Triggered automatically by the scheduler dispatch service
                          </div>
                        </div>
                        <label className="sch-toggle-switch">
                          <input
                            type="checkbox"
                            checked={tmpl.isSelected}
                            onChange={(e) => {
                              const updated = [...messageTemplates];
                              updated[idx] = {
                                ...updated[idx],
                                isSelected: e.target.checked,
                              };
                              setMessageTemplates(updated);
                            }}
                          />
                          <span className="sch-toggle-slider" />
                        </label>
                      </div>

                      {tmpl.isSelected && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span
                                style={{
                                  fontSize: "0.775rem",
                                  fontWeight: 600,
                                  color: "#475569",
                                }}
                              >
                                Response Window:
                              </span>
                              <input
                                type="number"
                                min={1}
                                style={{
                                  width: "60px",
                                  height: "32px",
                                  border: "1.5px solid #CBD5E1",
                                  borderRadius: "6px",
                                  padding: "0 0.5rem",
                                  fontSize: "0.8125rem",
                                  fontWeight: 600,
                                  textAlign: "center",
                                }}
                                value={tmpl.form_active_time}
                                onChange={(e) => {
                                  const updated = [...messageTemplates];
                                  updated[idx] = {
                                    ...updated[idx],
                                    form_active_time: e.target.value,
                                  };
                                  setMessageTemplates(updated);
                                }}
                              />
                              <select
                                className="sch-time-select"
                                style={{ height: "32px", padding: "0 0.5rem" }}
                                value={tmpl.duration}
                                onChange={(e) => {
                                  const updated = [...messageTemplates];
                                  updated[idx] = {
                                    ...updated[idx],
                                    duration: e.target.value,
                                  };
                                  setMessageTemplates(updated);
                                }}
                              >
                                <option value="hours">hours</option>
                                <option value="minutes">minutes</option>
                                <option value="days">days</option>
                              </select>
                            </div>

                            {tmpl.name === "confirmation pending" && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.775rem",
                                    fontWeight: 600,
                                    color: "#475569",
                                  }}
                                >
                                  Decline Window:
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  style={{
                                    width: "60px",
                                    height: "32px",
                                    border: "1.5px solid #CBD5E1",
                                    borderRadius: "6px",
                                    padding: "0 0.5rem",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    textAlign: "center",
                                  }}
                                  value={tmpl.form_decline_time || "2"}
                                  onChange={(e) => {
                                    const updated = [...messageTemplates];
                                    updated[idx] = {
                                      ...updated[idx],
                                      form_decline_time: e.target.value,
                                    };
                                    setMessageTemplates(updated);
                                  }}
                                />
                                <span style={{ fontSize: "0.775rem", color: "#64748B" }}>
                                  hours
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="sch-msg-body">
                            "{tmpl.templateMessage}"
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* -------------------------------------------------------------
                  STEP 3: PREVIEW & PREFERRED DRIVERS
                  ------------------------------------------------------------- */}
              {currentStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Summary Header Banner */}
                  <div className="sch-preview-banner">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          backgroundColor: color,
                          boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.08)",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0F172A" }}>
                          {scheduleName}
                        </div>
                        <div style={{ fontSize: "0.775rem", color: "#64748B" }}>
                          {scheduleType === "lmd"
                            ? "Day Specific Shift Schedule"
                            : "Flexible Shift Schedule"}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#2563EB" }}>
                        {totalWeeklyHours} hrs
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        Total Weekly Scheduled
                      </div>
                    </div>
                  </div>

                  {/* Working Hours Breakdown Table */}
                  <div>
                    <label className="sch-field-label">SCHEDULE TIMINGS BREAKDOWN</label>
                    {scheduleType === "lmd" ? (
                      <table className="sch-preview-table">
                        <thead>
                          <tr>
                            <th>Day</th>
                            <th>Status</th>
                            <th>Shift Start</th>
                            <th>Shift End</th>
                            <th style={{ textAlign: "right" }}>Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayWorkingHours.map((d) => (
                            <tr key={`prev-${d.title}`}>
                              <td style={{ fontWeight: 600 }}>{d.title}</td>
                              <td>
                                {d.isSelected ? (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      color: "#16A34A",
                                      background: "#F0FDF4",
                                      padding: "0.15rem 0.45rem",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    Active
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      color: "#94A3B8",
                                    }}
                                  >
                                    Off
                                  </span>
                                )}
                              </td>
                              <td>{d.isSelected ? d.startTime : "-"}</td>
                              <td>{d.isSelected ? d.endTime : "-"}</td>
                              <td style={{ textAlign: "right", fontWeight: 700, color: "#2563EB" }}>
                                {d.isSelected ? `${d.totalHours}h` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div
                        style={{
                          padding: "1rem",
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                            {flexStartTime} - {flexEndTime}
                          </div>
                          <div style={{ fontSize: "0.775rem", color: "#64748B", marginTop: "0.2rem" }}>
                            Active on: {flexActiveDays.map((d) => d.slice(0, 3)).join(", ")}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              color: "#2563EB",
                            }}
                          >
                            {calculateHours(flexStartTime, flexEndTime)} hrs / shift
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preferred Driver Searchable Multi-Select */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <label className="sch-field-label" style={{ margin: 0 }}>
                        PREFERRED DRIVERS ({selectedDriverIds.length} Selected)
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDriverIds(drivers.map((d) => d.id))
                          }
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#2563EB",
                            cursor: "pointer",
                          }}
                        >
                          Select All
                        </button>
                        <span style={{ color: "#CBD5E1" }}>|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedDriverIds([])}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#64748B",
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="sch-driver-picker-box">
                      <div className="sch-driver-search-bar">
                        <Search size={14} style={{ color: "#94A3B8" }} />
                        <input
                          type="text"
                          placeholder="Search active drivers by name or transporter ID..."
                          value={driverSearchQuery}
                          onChange={(e) => setDriverSearchQuery(e.target.value)}
                          style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            fontSize: "0.8125rem",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>

                      <div className="sch-driver-list-scroll">
                        {filteredDrivers.length === 0 ? (
                          <div
                            style={{
                              padding: "1rem",
                              textAlign: "center",
                              fontSize: "0.8125rem",
                              color: "#94A3B8",
                            }}
                          >
                            No matching active drivers found
                          </div>
                        ) : (
                          filteredDrivers.map((drv) => {
                            const isSelected = selectedDriverIds.includes(drv.id);
                            return (
                              <div
                                key={drv.id}
                                className={`sch-driver-row ${isSelected ? "selected" : ""}`}
                                onClick={() => toggleDriver(drv.id)}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.65rem",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "50%",
                                      background: isSelected ? "#2563EB" : "#E2E8F0",
                                      color: isSelected ? "#FFFFFF" : "#475569",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 700,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {drv.name ? drv.name.slice(0, 2).toUpperCase() : "DR"}
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                        color: "#1E293B",
                                      }}
                                    >
                                      {drv.name}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  {isSelected ? (
                                    <CheckSquare size={16} style={{ color: "#2563EB" }} />
                                  ) : (
                                    <Square size={16} style={{ color: "#CBD5E1" }} />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary of Break Settings */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Coffee size={15} style={{ color: "#2563EB" }} />
                      <span style={{ fontWeight: 600, color: "#1E293B" }}>
                        Meal Break:
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>
                      {setBreak
                        ? `${breakTime} mins at ${breakDurationStart}`
                        : "No break configured"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation Buttons */}
            <div className="sch-modal-footer">
              <button
                type="button"
                className="sch-footer-cancel-btn"
                onClick={() => setViewMode("catalog")}
              >
                Cancel
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="sch-footer-back-btn"
                  disabled={currentStep === 1 || isSubmitting}
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    className="sch-footer-next-btn"
                    onClick={currentStep === 1 ? handleStep1Next : handleStep2Next}
                  >
                    <span>Next</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sch-footer-next-btn"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        <span style={{ color: "#FFFFFF !important" }}>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} style={{ color: "#FFFFFF" }} />
                        <span style={{ color: "#FFFFFF !important" }}>
                          {editingRule ? "Update Schedule" : "Save Schedule"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleRulesModal;
