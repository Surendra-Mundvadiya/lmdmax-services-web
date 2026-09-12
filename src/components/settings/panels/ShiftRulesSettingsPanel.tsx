import React, { FC, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Save,
  Users,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";

interface ShiftRulesSettingsPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const ShiftRulesSettingsPanel: FC<ShiftRulesSettingsPanelProps> = ({ onNotification }) => {
  const [availabilityDeadlineDay, setAvailabilityDeadlineDay] = useState("Thursday");
  const [availabilityDeadlineTime, setAvailabilityDeadlineTime] = useState("17:00");
  const [maxWeeklyHours, setMaxWeeklyHours] = useState("40");
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState("6");
  const [autoApproveAvailability, setAutoApproveAvailability] = useState(false);
  const [allowDriverShiftSwap, setAllowDriverShiftSwap] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "Shift and scheduling rules updated successfully!",
        type: "success",
      });
    }, 450);
  };

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Rules governing driver availability deadlines, maximum work hours, consecutive day limits, and automated shift approvals
        </p>
      </div>

      {/* 1. Availability Submission Rules */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Clock size={17} />
            <span>Availability Submission Deadlines</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Specify weekly cutoff dates and times for drivers to submit or update their upcoming shift availability.
        </p>

        <div className="settings-form-grid-2">
          <div className="settings-form-field">
            <label className="settings-form-label">Availability Submission Cutoff Day</label>
            <select
              className="settings-form-select"
              value={availabilityDeadlineDay}
              onChange={(e) => setAvailabilityDeadlineDay(e.target.value)}
            >
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday (Standard Amazon DSP)</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">Submission Cutoff Time (Station Local Time)</label>
            <input
              type="time"
              className="settings-form-input"
              value={availabilityDeadlineTime}
              onChange={(e) => setAvailabilityDeadlineTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Scheduling Constraints & Labor Limits */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Users size={17} />
            <span>Labor Constraints & Overtime Prevention</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Automated guardrails enforced by the shift builder to prevent overtime and driver burnout.
        </p>

        <div className="settings-form-grid-2">
          <div className="settings-form-field">
            <label className="settings-form-label">Maximum Weekly Scheduled Hours</label>
            <input
              type="number"
              className="settings-form-input"
              value={maxWeeklyHours}
              min="20"
              max="60"
              onChange={(e) => setMaxWeeklyHours(e.target.value)}
            />
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">Maximum Consecutive Working Days</label>
            <input
              type="number"
              className="settings-form-input"
              value={maxConsecutiveDays}
              min="3"
              max="7"
              onChange={(e) => setMaxConsecutiveDays(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 3. Approvals & Shift Swapping */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <ArrowLeftRight size={17} />
            <span>Automated Approvals & Shift Swaps</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Configurable workflows for automatic roster approvals and driver-to-driver route trades.
        </p>

        <div className="settings-stack">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Automated Shift Approval</span>
              <span className="settings-toggle-desc">
                Automatically approve shift bids when drivers meet qualification and availability criteria
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle automated shift approval">
              <input
                type="checkbox"
                checked={autoApproveAvailability}
                onChange={() => setAutoApproveAvailability(!autoApproveAvailability)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Allow Driver-Initiated Shift Swaps</span>
              <span className="settings-toggle-desc">
                Permit drivers to request shift trades with eligible teammates subject to manager sign-off
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle shift swaps">
              <input
                type="checkbox"
                checked={allowDriverShiftSwap}
                onChange={() => setAllowDriverShiftSwap(!allowDriverShiftSwap)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="settings-footer-actions">
        <button
          type="button"
          className="btn-blue-primary"
          disabled={isSaving}
          onClick={handleSave}
          style={{ color: "#FFFFFF" }}
        >
          <Save size={15} style={{ color: "#FFFFFF" }} />
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Shift Rules"}</span>
        </button>
      </div>
    </div>
  );
};

export default ShiftRulesSettingsPanel;
