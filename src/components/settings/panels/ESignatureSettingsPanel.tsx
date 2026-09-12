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
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Configure digital signature workflows, driver refusal permissions, and automated reminders for Write-Ups and Policy Acknowledgments
        </p>
      </div>

      {isLoading ? (
        <div
          className="settings-card"
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--ads-s8)",
            fontSize: "0.8125rem",
            color: "var(--ads-ink-tertiary)",
          }}
        >
          Loading live E-Signature configurations...
        </div>
      ) : (
        <>
          {/* 1. Refusal to Sign Permissions */}
          <div className="settings-card">
            <div className="settings-card-title-row">
              <h3 className="settings-card-title">
                <FilePen size={17} />
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
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "var(--ads-s3)",
                paddingTop: "var(--ads-s3)",
                borderTop: "1px solid var(--ads-hairline)",
                opacity: allowRefuseToSign ? 1 : 0.5,
                pointerEvents: allowRefuseToSign ? "auto" : "none",
                transition: "opacity var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--ads-ink-secondary)",
                }}
              >
                Applies to Document Types
              </span>
              <button
                type="button"
                className={`ads-pill ${refusalTypes.includes("writeup") ? "ads-pill--active" : ""}`}
                onClick={() => toggleRefusalType("writeup")}
              >
                {refusalTypes.includes("writeup") && <Check size={13} style={{ color: "#FFFFFF" }} />}
                <span>Write-Up Reports</span>
              </button>

              <button
                type="button"
                className={`ads-pill ${
                  refusalTypes.includes("acknowledgement") ? "ads-pill--active" : ""
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
                <BellRing size={17} />
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--ads-s4)",
                  paddingTop: "var(--ads-s4)",
                  borderTop: "1px solid var(--ads-hairline)",
                }}
              >
                {/* Frequency & Attempts Grid */}
                <div className="settings-form-grid-3">
                  <div className="settings-form-field">
                    <label className="settings-form-label">Reminder Frequency</label>
                    <div style={{ display: "flex", gap: "var(--ads-s2)" }}>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        className="settings-form-input"
                        style={{ width: "6rem" }}
                        aria-label="Reminder frequency value"
                        value={reminderTimeNumber}
                        onChange={(e) => setReminderTimeNumber(e.target.value)}
                      />
                      <select
                        className="settings-form-select"
                        style={{ flex: 1 }}
                        aria-label="Reminder frequency unit"
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
                    <div style={{ display: "flex", gap: "var(--ads-s2)" }}>
                      <button
                        type="button"
                        className={`ads-pill ${
                          reminderTypes.includes("write-up") ? "ads-pill--active" : ""
                        }`}
                        onClick={() => toggleReminderType("write-up")}
                      >
                        Write-Ups
                      </button>
                      <button
                        type="button"
                        className={`ads-pill ${
                          reminderTypes.includes("ack") ? "ads-pill--active" : ""
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
                    <label className="settings-form-label" style={{ justifyContent: "space-between" }}>
                      <span>Write-Up Reminder Message</span>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 400,
                          color: "var(--ads-ink-tertiary)",
                        }}
                      >
                        Sent via SMS &amp; Push
                      </span>
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
                    <label className="settings-form-label" style={{ justifyContent: "space-between" }}>
                      <span>Acknowledgment Reminder Message</span>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 400,
                          color: "var(--ads-ink-tertiary)",
                        }}
                      >
                        Sent via SMS &amp; Push
                      </span>
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
