import React, { FC, useState } from "react";
import {
  MessageSquare,
  Radio,
  BellRing,
  Mic,
  Save,
  CheckCircle2,
  Smartphone,
  PhoneCall,
} from "lucide-react";

interface CommunicationSettingsPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const CommunicationSettingsPanel: FC<CommunicationSettingsPanelProps> = ({
  onNotification,
}) => {
  // In-App Chat
  const [inAppChatEnabled, setInAppChatEnabled] = useState(true);
  const [allowMediaUploads, setAllowMediaUploads] = useState(true);
  const [enableReadReceipts, setEnableReadReceipts] = useState(true);

  // Channels
  const [announcementsChannel, setAnnouncementsChannel] = useState(true);
  const [shiftTradesChannel, setShiftTradesChannel] = useState(true);
  const [emergencyAlertsChannel, setEmergencyAlertsChannel] = useState(true);

  // SMS & Reminders
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
        text: "Communication settings updated successfully!",
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
            <MessageSquare size={20} className="text-blue-600" />
            <span>Communications & Alert Settings</span>
          </h2>
          <p className="settings-panel-subheading">
            Manage dispatch-driver messaging channels, SMS reminders, broadcast rules, and LMD Voice Assistant automation
          </p>
        </div>
      </div>

      {/* 1. In-App Driver Chat */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <MessageSquare size={17} className="text-blue-600" />
            <span>In-App Driver Messaging & Dispatch Chat</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Direct messaging between desk dispatchers and active on-road drivers through the mobile app.
        </p>

        <div className="flex flex-col gap-2.5">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Enable In-App Driver Communication</span>
              <span className="settings-toggle-desc">
                Activates the Chats tab in the Unified App and enables driver mobile messaging
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle in-app chat">
              <input
                type="checkbox"
                checked={inAppChatEnabled}
                onChange={() => setInAppChatEnabled(!inAppChatEnabled)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Allow Photo Attachments & Damage Evidence</span>
              <span className="settings-toggle-desc">
                Permits drivers to send real-time pictures of customer delivery locations or roadside issues
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle photo uploads">
              <input
                type="checkbox"
                checked={allowMediaUploads}
                onChange={() => setAllowMediaUploads(!allowMediaUploads)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Message Read Receipts</span>
              <span className="settings-toggle-desc">
                Displays timestamp when driver views safety announcements or route change messages
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle read receipts">
              <input
                type="checkbox"
                checked={enableReadReceipts}
                onChange={() => setEnableReadReceipts(!enableReadReceipts)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Message Channel Configuration */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Radio size={17} className="text-blue-600" />
            <span>Broadcast & Message Channels</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Organize broadcast channels for all active drivers assigned to the delivery station.
        </p>

        <div className="flex flex-col gap-2.5">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Station Announcements Channel</span>
              <span className="settings-toggle-desc">
                One-way broadcast channel for morning standup notes, weather warnings, and schedule notices
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle announcements channel">
              <input
                type="checkbox"
                checked={announcementsChannel}
                onChange={() => setAnnouncementsChannel(!announcementsChannel)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Shift Swap & Available Routes Channel</span>
              <span className="settings-toggle-desc">
                Community channel where drivers can request shift swaps or pick up open standby routes
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle shift swap channel">
              <input
                type="checkbox"
                checked={shiftTradesChannel}
                onChange={() => setShiftTradesChannel(!shiftTradesChannel)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Emergency Roadside & Urgent Alerts</span>
              <span className="settings-toggle-desc">
                High-priority alert channel with audible chime for van breakdowns and urgent dispatch instructions
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle emergency alerts">
              <input
                type="checkbox"
                checked={emergencyAlertsChannel}
                onChange={() => setEmergencyAlertsChannel(!emergencyAlertsChannel)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* 3. SMS & Automated Driver Reminders */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <BellRing size={17} className="text-blue-600" />
            <span>SMS Alerts & Shift Reminders</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Automated text notifications delivered directly to driver phone numbers.
        </p>

        <div className="flex flex-col gap-2.5">
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

      {/* 4. LMD Voice Assistant */}
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

        <div className="flex flex-col gap-2.5">
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
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Communication Settings"}</span>
        </button>
      </div>
    </div>
  );
};

export default CommunicationSettingsPanel;
