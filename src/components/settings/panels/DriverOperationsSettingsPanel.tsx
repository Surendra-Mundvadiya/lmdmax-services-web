import React, { FC, useState } from "react";
import {
  Users,
  Smartphone,
  ShieldCheck,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  Save,
} from "lucide-react";

interface DriverOperationsSettingsPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const DriverOperationsSettingsPanel: FC<DriverOperationsSettingsPanelProps> = ({
  onNotification,
}) => {
  const [defaultSigninEnabled, setDefaultSigninEnabled] = useState(true);
  const [defaultInspectionEnabled, setDefaultInspectionEnabled] = useState(true);
  const [allowDriverShiftSwap, setAllowDriverShiftSwap] = useState(true);
  const [autoApproveAvailability, setAutoApproveAvailability] = useState(false);
  const [requireManagerLeaveApproval, setRequireManagerLeaveApproval] = useState(true);

  // Driver Availability & Weekly Rules
  const [availabilityDeadlineDay, setAvailabilityDeadlineDay] = useState("Thursday");
  const [availabilityDeadlineTime, setAvailabilityDeadlineTime] = useState("17:00");
  const [maxWeeklyHours, setMaxWeeklyHours] = useState("40");
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState("6");

  // Rate your Drivers
  const [driverRatingEnabled, setDriverRatingEnabled] = useState(true);
  const [ratingCycle, setRatingCycle] = useState("weekly");
  const [showScoreToDrivers, setShowScoreToDrivers] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "Driver operations settings updated successfully!",
        type: "success",
      });
    }, 450);
  };

  return (
    <div className="settings-panel-scroll">
      {/* Header */}
      <div className="settings-panel-header-block">
        <div>
          <h2 className="settings-panel-heading flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <span>Driver & Operations Settings</span>
          </h2>
          <p className="settings-panel-subheading">
            Configure driver mobile app access, availability submission windows, automated shift approvals, and driver performance ratings
          </p>
        </div>
      </div>

      {/* 1. Mobile App Sign-In & DVIC Inspection Defaults */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Smartphone size={17} className="text-blue-600" />
            <span>Driver Mobile App Access Defaults</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Set default permissions assigned automatically to newly registered drivers.
        </p>

        <div className="flex flex-col gap-2.5">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Enable LMD Drive Sign-in by Default</span>
              <span className="settings-toggle-desc">
                Allow drivers to log into the mobile app upon addition without manual approval
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle default sign-in">
              <input
                type="checkbox"
                checked={defaultSigninEnabled}
                onChange={() => setDefaultSigninEnabled(!defaultSigninEnabled)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Enable Daily Vehicle Inspection (DVIC) by Default</span>
              <span className="settings-toggle-desc">
                Require drivers to complete pre-trip and post-trip vehicle inspection checks in the mobile app
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle default inspection">
              <input
                type="checkbox"
                checked={defaultInspectionEnabled}
                onChange={() => setDefaultInspectionEnabled(!defaultInspectionEnabled)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Availability & Scheduling Rules (from Scheduler) */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Calendar size={17} className="text-blue-600" />
            <span>Availability Submission & Shift Rules</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Rules governing driver weekly availability submission windows and overtime constraints.
        </p>

        <div className="settings-form-grid-2">
          <div className="settings-form-field">
            <label className="settings-form-label">
              Availability Submission Cutoff Day
            </label>
            <select
              className="settings-form-select"
              value={availabilityDeadlineDay}
              onChange={(e) => setAvailabilityDeadlineDay(e.target.value)}
            >
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday (Recommended)</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">
              Submission Cutoff Time (Station Local Time)
            </label>
            <input
              type="time"
              className="settings-form-input"
              value={availabilityDeadlineTime}
              onChange={(e) => setAvailabilityDeadlineTime(e.target.value)}
            />
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">
              Maximum Weekly Scheduled Hours
            </label>
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
            <label className="settings-form-label">
              Maximum Consecutive Working Days
            </label>
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

        <div className="flex flex-col gap-2.5 mt-2">
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

      {/* 3. Rate your Drivers (from Performance application) */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Star size={17} className="text-amber-500" />
            <span>Driver Performance Rating Program</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Empower dispatchers and operations leads to record internal performance ratings.
        </p>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <span className="settings-toggle-title">Enable Internal Driver Rating System</span>
            <span className="settings-toggle-desc">
              Activate star ratings and performance evaluation cards on driver profiles
            </span>
          </div>
          <label className="custom-blue-switch" title="Toggle driver ratings">
            <input
              type="checkbox"
              checked={driverRatingEnabled}
              onChange={() => setDriverRatingEnabled(!driverRatingEnabled)}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {driverRatingEnabled && (
          <div className="settings-form-grid-2 mt-1">
            <div className="settings-form-field">
              <label className="settings-form-label">Rating Frequency Cycle</label>
              <select
                className="settings-form-select"
                value={ratingCycle}
                onChange={(e) => setRatingCycle(e.target.value)}
              >
                <option value="weekly">Weekly Scorecard Review</option>
                <option value="biweekly">Bi-weekly Operational Cycle</option>
                <option value="monthly">Monthly Performance Evaluation</option>
              </select>
            </div>

            <div className="settings-form-field">
              <label className="settings-form-label">Visibility to Drivers</label>
              <select
                className="settings-form-select"
                value={showScoreToDrivers ? "visible" : "hidden"}
                onChange={(e) => setShowScoreToDrivers(e.target.value === "visible")}
              >
                <option value="visible">Visible in Driver Mobile App</option>
                <option value="hidden">Internal Dispatch & Management Only</option>
              </select>
            </div>
          </div>
        )}
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
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Driver Settings"}</span>
        </button>
      </div>
    </div>
  );
};

export default DriverOperationsSettingsPanel;
