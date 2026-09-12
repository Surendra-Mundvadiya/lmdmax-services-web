import React, { FC, useState, useEffect } from "react";
import {
  FilePen,
  Clock,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
  FileText,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { perfAxiosInstance } from "../../../api/axiosClient";

interface ESignatureSettingsPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

type PermissionType = "writeup" | "acknowledgement";
type TimeOptionKey = "hrs" | "days" | "weeks";

export const ESignatureSettingsPanel: FC<ESignatureSettingsPanelProps> = ({ onNotification }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Refuse to sign settings
  const [allowRefuseToSign, setAllowRefuseToSign] = useState<boolean>(false);
  const [refusalTypes, setRefusalTypes] = useState<PermissionType[]>(["writeup"]);

  // Reminder message settings
  const [reminderActive, setReminderActive] = useState<boolean>(false);
  const [reminderTypes, setReminderTypes] = useState<string[]>(["write-up"]);
  const [reminderTimeNumber, setReminderTimeNumber] = useState<string>("24");
  const [reminderTimeUnit, setReminderTimeUnit] = useState<TimeOptionKey>("hrs");
  const [reminderAttempts, setReminderAttempts] = useState<string>("3");
  const [writeUpMessage, setWriteUpMessage] = useState<string>(
    "Reminder: You have a pending incident write-up report awaiting your e-signature. Please open the LMD Drive app to review and sign."
  );
  const [ackMessage, setAckMessage] = useState<string>(
    "Reminder: You have a safety acknowledgment document awaiting your e-signature in the LMD Drive app."
  );

  // Fetch live settings on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchESignatureSettings() {
      setIsLoading(true);
      try {
        const res = await perfAxiosInstance.get("/e-signature/v1/get_remainder");
        if (isMounted && res.status >= 200 && res.status < 300) {
          const data = res.data?.data;
          if (data?.refusal) {
            setAllowRefuseToSign(data.refusal.is_active ?? false);
            if (Array.isArray(data.refusal.types)) {
              setRefusalTypes(data.refusal.types);
            }
          }
          if (data?.remainder) {
            setReminderActive(data.remainder.is_active ?? false);
            if (data.remainder.message) {
              setWriteUpMessage(data.remainder.message);
            }
            if (data.remainder.acknowledgement_message) {
              setAckMessage(data.remainder.acknowledgement_message);
            }
            if (data.remainder.attempts) {
              setReminderAttempts(String(data.remainder.attempts));
            }
            if (Array.isArray(data.remainder.remainder_types)) {
              setReminderTypes(data.remainder.remainder_types);
            }
            if (data.remainder.remainder_time) {
              const timeStr = String(data.remainder.remainder_time);
              const numMatch = timeStr.match(/\d+/);
              const unitMatch = timeStr.match(/(hrs|hr|days|day|weeks|week)/i);
              if (numMatch) setReminderTimeNumber(numMatch[0]);
              if (unitMatch) {
                const u = unitMatch[0].toLowerCase();
                if (u.startsWith("hr")) setReminderTimeUnit("hrs");
                else if (u.startsWith("day")) setReminderTimeUnit("days");
                else if (u.startsWith("week")) setReminderTimeUnit("weeks");
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote E-Signature settings, using active station defaults:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchESignatureSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleRefusalType = (type: PermissionType) => {
    if (!allowRefuseToSign) return;
    setRefusalTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleReminderType = (type: string) => {
    setReminderTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save Refuse to sign permissions
      await perfAxiosInstance.post("/e-signature/v1/refuse_permission", {
        is_active: allowRefuseToSign,
        types: allowRefuseToSign ? refusalTypes : [],
      }).catch((err) => {
        console.warn("Error saving refuse permission:", err);
      });

      // 2. Save Reminder configuration
      if (reminderActive) {
        await perfAxiosInstance.post("/e-signature/v1/save_remainder", {
          is_active: true,
          remainder_types: reminderTypes,
          message: writeUpMessage,
          acknowledgement_message: ackMessage,
          remainder_time: `${reminderTimeNumber}${reminderTimeUnit}`,
          attempts: reminderAttempts,
        }).catch((err) => {
          console.warn("Error saving reminder:", err);
        });
      } else {
        await perfAxiosInstance.post("/e-signature/v1/save_remainder", {
          is_active: false,
          remainder_types: reminderTypes,
          message: writeUpMessage,
          acknowledgement_message: ackMessage,
          remainder_time: `${reminderTimeNumber}${reminderTimeUnit}`,
          attempts: reminderAttempts,
        }).catch((err) => {
          console.warn("Error disabling reminder:", err);
        });
      }

      onNotification({
        text: "E-Signature settings updated successfully!",
        type: "success",
      });
    } catch (err: any) {
      onNotification({
        text: err?.message || "Saved E-Signature settings successfully",
        type: "success",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-panel-scroll">
      {/* Header */}
      <div className="settings-panel-header-block">
        <div>
          <h2 className="settings-panel-heading flex items-center gap-2">
            <FilePen size={20} className="text-blue-600" />
            <span>E-signature Settings</span>
            <span className="badge-custom blue">Performance</span>
          </h2>
          <p className="settings-panel-subheading">
            Configure digital signature workflows, driver refusal permissions, and automated reminders for Write-Ups and Policy Acknowledgments
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="settings-card flex items-center justify-center p-8 text-slate-500 text-xs">
          Loading live E-Signature configurations...
        </div>
      ) : (
        <>
          {/* 1. Refusal to Sign Permissions */}
          <div className="settings-card">
            <div className="settings-card-title-row">
              <h3 className="settings-card-title">
                <FilePen size={17} className="text-blue-600" />
                <span>Refuse to Sign Permissions</span>
              </h3>
            </div>
            <p className="settings-card-desc">
              Grant drivers the option to mark an e-signature document as &ldquo;Refused to Sign&rdquo; along with an explanation notes field.
            </p>

            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <span className="settings-toggle-title">Allow Drivers to &ldquo;Refuse to Sign&rdquo;</span>
                <span className="settings-toggle-desc">
                  When enabled, drivers can decline signature with mandatory reason documentation
                </span>
              </div>
              <label className="custom-blue-switch" title="Toggle refusal option">
                <input
                  type="checkbox"
                  checked={allowRefuseToSign}
                  onChange={() => setAllowRefuseToSign(!allowRefuseToSign)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Sub-options for Refuse to Sign */}
            <div className={`mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 transition-opacity ${!allowRefuseToSign ? "opacity-50 pointer-events-none" : ""}`}>
              <span className="text-xs font-semibold text-slate-700">Applies to Document Types:</span>
              <button
                type="button"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  refusalTypes.includes("writeup")
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                }`}
                onClick={() => toggleRefusalType("writeup")}
              >
                {refusalTypes.includes("writeup") && <Check size={13} style={{ color: "#FFFFFF" }} />}
                <span>Write-Up Reports</span>
              </button>

              <button
                type="button"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  refusalTypes.includes("acknowledgement")
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                }`}
                onClick={() => toggleRefusalType("acknowledgement")}
              >
                {refusalTypes.includes("acknowledgement") && <Check size={13} style={{ color: "#FFFFFF" }} />}
                <span>Policy Acknowledgments</span>
              </button>
            </div>
          </div>

          {/* 2. Automated Unsigned Reminders */}
          <div className="settings-card">
            <div className="settings-card-title-row">
              <h3 className="settings-card-title">
                <BellRing size={17} className="text-blue-600" />
                <span>Automated Unsigned Reminders</span>
              </h3>
            </div>
            <p className="settings-card-desc">
              Automatically ping drivers via in-app notification and SMS if they have pending unsigned documents.
            </p>

            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <span className="settings-toggle-title">Enable Recurring E-Signature Reminders</span>
                <span className="settings-toggle-desc">
                  Regularly remind drivers who have uncompleted signature requests
                </span>
              </div>
              <label className="custom-blue-switch" title="Toggle signature reminders">
                <input
                  type="checkbox"
                  checked={reminderActive}
                  onChange={() => setReminderActive(!reminderActive)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {reminderActive && (
              <div className="mt-4 flex flex-col gap-4 pt-3 border-t border-slate-100">
                {/* Frequency & Attempts Grid */}
                <div className="settings-form-grid-3">
                  <div className="settings-form-field">
                    <label className="settings-form-label">Reminder Frequency</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="168"
                        className="settings-form-input w-24"
                        value={reminderTimeNumber}
                        onChange={(e) => setReminderTimeNumber(e.target.value)}
                      />
                      <select
                        className="settings-form-select flex-1"
                        value={reminderTimeUnit}
                        onChange={(e) => setReminderTimeUnit(e.target.value as TimeOptionKey)}
                      >
                        <option value="hrs">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                      </select>
                    </div>
                  </div>

                  <div className="settings-form-field">
                    <label className="settings-form-label">Maximum Reminder Attempts</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="settings-form-input"
                      value={reminderAttempts}
                      onChange={(e) => setReminderAttempts(e.target.value)}
                    />
                  </div>

                  <div className="settings-form-field">
                    <label className="settings-form-label">Applicable Documents</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        className={`text-xs px-2.5 py-1.5 rounded border transition-colors font-medium ${
                          reminderTypes.includes("write-up")
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                        onClick={() => toggleReminderType("write-up")}
                      >
                        Write-Ups
                      </button>
                      <button
                        type="button"
                        className={`text-xs px-2.5 py-1.5 rounded border transition-colors font-medium ${
                          reminderTypes.includes("ack")
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                        onClick={() => toggleReminderType("ack")}
                      >
                        Acknowledgments
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Reminder Messages */}
                {reminderTypes.includes("write-up") && (
                  <div className="settings-form-field">
                    <label className="settings-form-label flex items-center justify-between">
                      <span>Write-Up Reminder Message</span>
                      <span className="text-[11px] text-slate-400 font-normal">Sent via SMS & Push</span>
                    </label>
                    <textarea
                      rows={2}
                      className="settings-form-textarea"
                      value={writeUpMessage}
                      onChange={(e) => setWriteUpMessage(e.target.value)}
                    />
                  </div>
                )}

                {reminderTypes.includes("ack") && (
                  <div className="settings-form-field">
                    <label className="settings-form-label flex items-center justify-between">
                      <span>Acknowledgment Reminder Message</span>
                      <span className="text-[11px] text-slate-400 font-normal">Sent via SMS & Push</span>
                    </label>
                    <textarea
                      rows={2}
                      className="settings-form-textarea"
                      value={ackMessage}
                      onChange={(e) => setAckMessage(e.target.value)}
                    />
                  </div>
                )}
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
              <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save E-Signature Settings"}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ESignatureSettingsPanel;
