import React, { FC, useState } from "react";
import {
  BellRing,
  Mic,
  Save,
  Clock,
  PhoneForwarded,
  CheckCircle2,
} from "lucide-react";

interface RemindersSettingsPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const RemindersSettingsPanel: FC<RemindersSettingsPanelProps> = ({ onNotification }) => {
  const [shiftReminderSms, setShiftReminderSms] = useState(true);
  const [shiftReminderHoursPrior, setShiftReminderHoursPrior] = useState("2");
  const [calloutStandbySms, setCalloutStandbySms] = useState(true);

  // LMD Voice Assistant
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(true);
  const [autoOfferStandbyReplacements, setAutoOfferStandbyReplacements] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "Reminders & Alerts settings updated successfully!",
        type: "success",
      });
    }, 450);
  };

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Configure automated SMS shift wave reminders, standby callout broadcasts, and AI voice replacement dialing
        </p>
      </div>

      {/* 1. SMS & Automated Driver Reminders */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <BellRing size={17} />
            <span>SMS Alerts & Shift Reminders</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Automated text notifications delivered directly to driver phone numbers prior to scheduled launch.
        </p>

        <div className="settings-stack">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Pre-Shift Wave Reminder SMS</span>
              <span className="settings-toggle-desc">
                Sends an SMS alert confirming wave time and loadout pad before morning launch
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle pre-shift SMS">
              <input
                type="checkbox"
                checked={shiftReminderSms}
                onChange={() => setShiftReminderSms(!shiftReminderSms)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          {shiftReminderSms && (
            <div className="settings-form-field">
              <label className="settings-form-label">Send Reminder Prior to Shift Wave (Hours)</label>
              <select
                className="settings-form-select max-w-xs"
                value={shiftReminderHoursPrior}
                onChange={(e) => setShiftReminderHoursPrior(e.target.value)}
              >
                <option value="1">1 Hour Prior</option>
                <option value="2">2 Hours Prior (Standard)</option>
                <option value="3">3 Hours Prior</option>
                <option value="12">Night Before (12 Hours)</option>
              </select>
            </div>
          )}

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Standby Callout Broadcast Alert</span>
              <span className="settings-toggle-desc">
                Sends SMS blast to designated backup drivers when an unassigned callout route opens up
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle standby SMS">
              <input
                type="checkbox"
                checked={calloutStandbySms}
                onChange={() => setCalloutStandbySms(!calloutStandbySms)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* 2. LMD Voice Assistant */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Mic size={17} className="text-purple-600" />
            <span>LMD Voice Assistant Automation</span>
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
            AI Automated Callout
          </span>
        </div>
        <p className="settings-card-desc">
          Automated phone assistant that receives incoming driver callouts, logs reasons, and dials standby replacements.
        </p>

        <div className="settings-stack">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Enable AI Voice Assistant for Driver Callouts</span>
              <span className="settings-toggle-desc">
                Accepts incoming calls when dispatch desk is unmanned and transcribes driver notes into Shift Rosters
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle Voice Assistant">
              <input
                type="checkbox"
                checked={voiceAssistantEnabled}
                onChange={() => setVoiceAssistantEnabled(!voiceAssistantEnabled)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Auto-Dial Next Available Standby Replacement</span>
              <span className="settings-toggle-desc">
                Immediately dials the top reserve driver in the standby rotation upon verified callout recording
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle auto-dial replacement">
              <input
                type="checkbox"
                checked={autoOfferStandbyReplacements}
                onChange={() => setAutoOfferStandbyReplacements(!autoOfferStandbyReplacements)}
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
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Reminder Settings"}</span>
        </button>
      </div>
    </div>
  );
};

export default RemindersSettingsPanel;
