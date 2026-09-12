import React, { FC, useState } from "react";
import {
  MessageSquare,
  Radio,
  Camera,
  CheckCheck,
  Users2,
  Save,
  CheckCircle2,
} from "lucide-react";

interface InAppChatAccessPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const InAppChatAccessPanel: FC<InAppChatAccessPanelProps> = ({ onNotification }) => {
  const [inAppChatEnabled, setInAppChatEnabled] = useState(true);
  const [allowMediaUploads, setAllowMediaUploads] = useState(true);
  const [enableReadReceipts, setEnableReadReceipts] = useState(true);
  const [allowDriverToDriverChat, setAllowDriverToDriverChat] = useState(false);

  // Channels
  const [announcementsChannel, setAnnouncementsChannel] = useState(true);
  const [shiftTradesChannel, setShiftTradesChannel] = useState(true);
  const [emergencyAlertsChannel, setEmergencyAlertsChannel] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "In-App Chat Access settings updated successfully!",
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
            <span>In-App Chat Access</span>
            <span className="badge-custom blue">Communications</span>
          </h2>
          <p className="settings-panel-subheading">
            Manage driver-to-dispatch messaging channels, photo attachments, read receipts, and broadcast channels
          </p>
        </div>
      </div>

      {/* 1. Core Chat Permissions */}
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
              <span className="settings-toggle-title flex items-center gap-1.5">
                <Camera size={14} className="text-blue-600" />
                <span>Allow Photo Attachments & Damage Evidence</span>
              </span>
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
              <span className="settings-toggle-title flex items-center gap-1.5">
                <CheckCheck size={14} className="text-blue-600" />
                <span>Message Read Receipts</span>
              </span>
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

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title flex items-center gap-1.5">
                <Users2 size={14} className="text-blue-600" />
                <span>Driver-to-Driver Chat Permission</span>
              </span>
              <span className="settings-toggle-desc">
                Allow active drivers to message other on-road teammates for route guidance or rescue coordination
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle driver-to-driver chat">
              <input
                type="checkbox"
                checked={allowDriverToDriverChat}
                onChange={() => setAllowDriverToDriverChat(!allowDriverToDriverChat)}
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
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Chat Settings"}</span>
        </button>
      </div>
    </div>
  );
};

export default InAppChatAccessPanel;
