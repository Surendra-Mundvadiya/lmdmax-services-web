import React, { FC, useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Route,
  Truck,
  AlertTriangle,
  Check,
  Send,
  FileEdit,
} from "lucide-react";
import {
  SchedulerShiftItem,
  SchedulerDriverItem,
  SchedulerTimeOffItem,
} from "../../../api/schedulerApi";

interface CreateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (shiftData: {
    id?: number;
    schedule_rule_id?: number;
    assign_to: number | null;
    driver_name?: string;
    schedule_date: string;
    shift_duration_start: string;
    shift_duration_end: string;
    break_time: number;
    is_published: boolean;
    route_code?: string;
    wave?: string;
    total_hours?: string;
    vehicle_type?: string;
  }) => Promise<void>;
  initialDriverId?: number | null;
  initialDateStr?: string;
  editingShift?: SchedulerShiftItem | null;
  drivers: SchedulerDriverItem[];
  timeOffRequests: SchedulerTimeOffItem[];
  scheduleRules?: any[];
}

export const CreateShiftModal: FC<CreateShiftModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDriverId,
  initialDateStr,
  editingShift,
  drivers,
  timeOffRequests,
  scheduleRules = [],
}) => {
  const [driverId, setDriverId] = useState<number | "unassigned">("unassigned");
  const [scheduleRuleId, setScheduleRuleId] = useState<number | "none">("none");
  const [scheduleDate, setScheduleDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState<string>("09:30");
  const [endTime, setEndTime] = useState<string>("19:30");
  const [breakMinutes, setBreakMinutes] = useState<number>(30);
  const [routeCode, setRouteCode] = useState<string>("");
  const [wave, setWave] = useState<string>("Wave 1");
  const [vehicleType, setVehicleType] = useState<string>("Cargo Van");
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingShift) {
      setDriverId(editingShift.assign_to ?? "unassigned");
      setScheduleRuleId(editingShift.schedule_rule_id ?? "none");
      setScheduleDate(editingShift.schedule_date || new Date().toISOString().split("T")[0]);
      setStartTime(editingShift.shift_duration_start?.slice(0, 5) || "09:30");
      setEndTime(editingShift.shift_duration_end?.slice(0, 5) || "19:30");
      setBreakMinutes(editingShift.break_time ?? 30);
      setRouteCode(editingShift.route_code || "");
      setWave(editingShift.wave || "Wave 1");
      setVehicleType(editingShift.vehicle_type || "Cargo Van");
      setIsPublished(editingShift.is_published ?? false);
    } else {
      setDriverId(initialDriverId ?? "unassigned");
      setScheduleRuleId("none");
      setScheduleDate(initialDateStr || new Date().toISOString().split("T")[0]);
      setStartTime("09:30");
      setEndTime("19:30");
      setBreakMinutes(30);
      setRouteCode("");
      setWave("Wave 1");
      setVehicleType("Cargo Van");
      setIsPublished(false);
    }
    setErrorMsg(null);
  }, [isOpen, editingShift, initialDriverId, initialDateStr]);

  const handleRuleChange = (ruleVal: string) => {
    if (ruleVal === "none") {
      setScheduleRuleId("none");
      return;
    }
    const rId = Number(ruleVal);
    setScheduleRuleId(rId);
    const matched = scheduleRules.find((r) => r.id === rId);
    if (matched) {
      if (matched.break_time != null) setBreakMinutes(matched.break_time);
      if (matched.working_hours) {
        try {
          const wh = typeof matched.working_hours === "string" ? JSON.parse(matched.working_hours) : matched.working_hours;
          const item = Array.isArray(wh) ? wh[0] : wh;
          if (item?.shift_duration_start) setStartTime(item.shift_duration_start.slice(0, 5));
          if (item?.shift_duration_end) setEndTime(item.shift_duration_end.slice(0, 5));
        } catch {
          // ignore
        }
      }
    }
  };

  const calculatedHours = useMemo(() => {
    try {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      return (diffMinutes / 60).toFixed(1);
    } catch {
      return "10.0";
    }
  }, [startTime, endTime]);

  const conflict = useMemo(() => {
    if (driverId === "unassigned") return null;
    return timeOffRequests.find(
      (t) =>
        t.driver_id === driverId &&
        (t.leave_status === "approved" || t.status === "approved") &&
        scheduleDate >= t.start_date &&
        scheduleDate <= t.end_date
    );
  }, [driverId, scheduleDate, timeOffRequests]);

  const selectedDriver = useMemo(() => {
    if (driverId === "unassigned") return null;
    return drivers.find((d) => d.id === driverId) || null;
  }, [driverId, drivers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setLoading(true);
    try {
      const resolvedRuleId =
        scheduleRuleId !== "none"
          ? scheduleRuleId
          : editingShift?.schedule_rule_id || (scheduleRules[0]?.id ?? 1);

      await onSubmit({
        id: editingShift?.id,
        schedule_rule_id: resolvedRuleId,
        assign_to: driverId === "unassigned" ? null : driverId,
        driver_name: selectedDriver?.name || "Unassigned",
        schedule_date: scheduleDate,
        shift_duration_start: startTime.length === 5 ? `${startTime}:00` : startTime,
        shift_duration_end: endTime.length === 5 ? `${endTime}:00` : endTime,
        break_time: breakMinutes,
        is_published: isPublished,
        route_code: routeCode.trim(),
        wave,
        total_hours: calculatedHours,
        vehicle_type: vehicleType,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save shift. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="sch-modal-backdrop"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.32)",
        WebkitBackdropFilter: "blur(6px)",
        backdropFilter: "blur(6px)",
        padding: "var(--ads-s4)",
      }}
    >
      <div
        className="sch-modal-dialog"
        style={{
          background: "var(--ads-material-thick)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          backdropFilter: "var(--ads-blur-lg)",
          border: "1px solid var(--ads-hairline)",
          borderRadius: "var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
        }}
      >
        {/* Header */}
        <div
          className="sch-modal-header"
          style={{
            background: "transparent",
            borderBottom: "1px solid var(--ads-hairline)",
            padding: "var(--ads-s4) var(--ads-s5)",
          }}
        >
          <div className="sch-modal-title-group">
            <div
              className="sch-modal-icon-badge"
              style={{
                background: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                borderRadius: "var(--ads-r-sm)",
              }}
            >
              {editingShift ? <FileEdit size={18} /> : <Clock size={18} />}
            </div>
            <div>
              <h2 className="sch-modal-title" style={{ color: "var(--ads-ink)" }}>
                {editingShift ? "Edit Shift Details" : "Create New Shift"}
              </h2>
              <p className="sch-modal-subtitle" style={{ color: "var(--ads-ink-tertiary)" }}>
                Assign driver, schedule window, route & wave
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sch-modal-close-btn"
            style={{ color: "var(--ads-ink-tertiary)", borderRadius: "var(--ads-r-sm)" }}
            aria-label="Close shift dialog"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conflict Warning Banner */}
        {conflict && (
          <div
            style={{
              margin: "var(--ads-s4) var(--ads-s5) 0",
              padding: "var(--ads-s3)",
              borderRadius: "var(--ads-r-sm)",
              background: "var(--ads-red-tint)",
              border: "1px solid rgba(215, 0, 21, 0.28)",
              color: "var(--ads-red)",
              fontSize: "0.75rem",
              display: "flex",
              gap: "var(--ads-s2)",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontWeight: 600 }}>Time-Off Conflict Warning</p>
              <p style={{ marginTop: "2px" }}>
                {selectedDriver?.name || "This driver"} has approved leave from{" "}
                <strong>{conflict.start_date}</strong> to <strong>{conflict.end_date}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              margin: "var(--ads-s4) var(--ads-s5) 0",
              padding: "var(--ads-s3)",
              borderRadius: "var(--ads-r-sm)",
              background: "var(--ads-red-tint)",
              border: "1px solid rgba(215, 0, 21, 0.28)",
              color: "var(--ads-red)",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="sch-modal-body"
          style={{ padding: "var(--ads-s5)", gap: "var(--ads-s4)" }}
        >
          {/* Driver Selection */}
          <div className="sch-form-field">
            <label className="sch-form-label">Assign to Driver</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <User size={15} style={{ position: "absolute", left: "0.75rem", color: "var(--ads-ink-quaternary)", pointerEvents: "none" }} />
              <select
                value={driverId}
                onChange={(e) =>
                  setDriverId(e.target.value === "unassigned" ? "unassigned" : Number(e.target.value))
                }
                className="sch-form-select ads-select"
                style={{ width: "100%", paddingLeft: "2.2rem" }}
              >
                <option value="unassigned">— Unassigned (Open Shift) —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Rule Preset Selector */}
          {scheduleRules.length > 0 && (
            <div className="sch-form-field">
              <label className="sch-form-label">Schedule Rule Preset</label>
              <select
                value={scheduleRuleId}
                onChange={(e) => handleRuleChange(e.target.value)}
                className="sch-form-select ads-select"
                style={{ width: "100%" }}
              >
                <option value="none">— Custom / Default Timing —</option>
                {scheduleRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Rule #{r.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Shift Date */}
          <div className="sch-form-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="sch-form-label">Shift Date</label>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  onClick={() => setScheduleDate(new Date().toISOString().split("T")[0])}
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--ads-blue)",
                    background: "var(--ads-blue-tint)",
                    border: "1px solid rgba(0, 113, 227, 0.22)",
                    borderRadius: "var(--ads-r-pill)",
                    padding: "2px var(--ads-s2)",
                    cursor: "pointer",
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setScheduleDate(tomorrow.toISOString().split("T")[0]);
                  }}
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--ads-ink-secondary)",
                    background: "var(--ads-material-thick)",
                    border: "1px solid var(--ads-hairline)",
                    borderRadius: "var(--ads-r-pill)",
                    padding: "2px var(--ads-s2)",
                    cursor: "pointer",
                  }}
                >
                  Tomorrow
                </button>
              </div>
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Calendar size={15} style={{ position: "absolute", left: "0.75rem", color: "var(--ads-ink-quaternary)", pointerEvents: "none" }} />
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
                className="sch-form-input ads-input"
                style={{ width: "100%", paddingLeft: "2.2rem" }}
              />
            </div>
          </div>

          {/* Time Pickers (Start / End) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="sch-form-field">
              <label className="sch-form-label">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="sch-form-input ads-input"
              />
            </div>

            <div className="sch-form-field">
              <label className="sch-form-label">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="sch-form-input ads-input"
              />
            </div>
          </div>

          {/* Break & Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "center" }}>
            <div className="sch-form-field">
              <label className="sch-form-label">Break Duration</label>
              <select
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className="sch-form-select ads-select"
              >
                <option value={0}>No Break</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div
              style={{
                padding: "var(--ads-s2) var(--ads-s3)",
                borderRadius: "var(--ads-r-sm)",
                background: "var(--ads-material-thin)",
                border: "1px solid var(--ads-hairline)",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.625rem",
                  color: "var(--ads-ink-tertiary)",
                  textTransform: "capitalize",
                  fontWeight: 600,
                  display: "block",
                }}
              >
                Total duration
              </span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 650, color: "var(--ads-blue)" }}>
                {calculatedHours} hours
              </span>
            </div>
          </div>

          {/* Route & Wave */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="sch-form-field">
              <label className="sch-form-label">Route Code</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Route size={14} style={{ position: "absolute", left: "0.75rem", color: "var(--ads-ink-quaternary)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="e.g. CX101"
                  value={routeCode}
                  onChange={(e) => setRouteCode(e.target.value)}
                  className="sch-form-input ads-input"
                  style={{ width: "100%", paddingLeft: "2.1rem" }}
                />
              </div>
            </div>

            <div className="sch-form-field">
              <label className="sch-form-label">Wave Time</label>
              <select
                value={wave}
                onChange={(e) => setWave(e.target.value)}
                className="sch-form-select ads-select"
              >
                <option value="Wave 1">Wave 1 (09:45 AM)</option>
                <option value="Wave 2">Wave 2 (10:15 AM)</option>
                <option value="Wave 3">Wave 3 (10:45 AM)</option>
                <option value="Rescue Wave">Rescue Wave (11:30 AM)</option>
                <option value="Cycle 2">Cycle 2 (Evening)</option>
              </select>
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="sch-form-field">
            <label className="sch-form-label">Vehicle Type</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Truck size={14} style={{ position: "absolute", left: "0.75rem", color: "var(--ads-ink-quaternary)", pointerEvents: "none" }} />
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="sch-form-select ads-select"
                style={{ width: "100%", paddingLeft: "2.1rem" }}
              >
                <option value="Cargo Van">Cargo Van (Standard)</option>
                <option value="Step Van">Step Van (Large)</option>
                <option value="Box Truck">Box Truck</option>
                <option value="Personal Vehicle">Personal Vehicle (Flex)</option>
              </select>
            </div>
          </div>

          {/* Save as Draft vs Publish Immediately */}
          <div
            style={{
              paddingTop: "var(--ads-s2)",
              borderTop: "1px solid var(--ads-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--ads-s3)",
            }}
          >
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                Publish Immediately
              </p>
              <p style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", marginTop: "2px" }}>
                {isPublished
                  ? "Shift will be live and active immediately."
                  : "Save as draft with dashed amber border for review."}
              </p>
            </div>

            <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                aria-label="Publish shift immediately"
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--ads-blue)",
                  cursor: "pointer",
                }}
              />
            </label>
          </div>

          {/* Footer */}
          <div
            className="sch-modal-footer"
            style={{
              background: "transparent",
              borderTop: "1px solid var(--ads-hairline)",
              padding: "var(--ads-s4) 0 0",
              margin: "0",
              gap: "var(--ads-s2)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="sch-btn-secondary ads-btn ads-btn--secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="sch-btn-primary ads-btn ads-btn--primary"
            >
              {loading ? (
                <span>Saving...</span>
              ) : isPublished ? (
                <>
                  <Send size={13} style={{ color: "#FFFFFF" }} />
                  <span>Publish Shift</span>
                </>
              ) : (
                <>
                  <Check size={14} style={{ color: "#FFFFFF" }} />
                  <span>Save as Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
