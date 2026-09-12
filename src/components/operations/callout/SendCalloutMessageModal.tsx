import React, { FC, useState, useMemo } from "react";
import {
  X,
  Send,
  MessageSquare,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Users,
  Eye,
  Edit3,
  Loader2,
} from "lucide-react";
import { calloutRescueApi, type CalloutItem } from "../../../api/calloutRescueApi";

interface SendCalloutMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: CalloutItem[];
  currentDate: string;
  onSuccess: (sentIds: (string | number)[]) => void;
}

export const SendCalloutMessageModal: FC<SendCalloutMessageModalProps> = ({
  isOpen,
  onClose,
  recipients,
  currentDate,
  onSuccess,
}) => {
  const [channels, setChannels] = useState<("sms" | "inapp")[]>(["sms"]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [previewDriverIndex, setPreviewDriverIndex] = useState(0);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize recipients
  React.useEffect(() => {
    if (isOpen) {
      setSelectedRecipientIds(recipients.map((r) => String(r.driver_id)));
      setError(null);
      setActiveTab("compose");
      setAdditionalNotes("");
      setPreviewDriverIndex(0);
    }
  }, [isOpen, recipients]);

  const activeRecipients = useMemo(() => {
    return recipients.filter((r) => selectedRecipientIds.includes(String(r.driver_id)));
  }, [recipients, selectedRecipientIds]);

  if (!isOpen) return null;

  const toggleChannel = (channel: "sms" | "inapp") => {
    if (channels.includes(channel)) {
      if (channels.length === 1) return; // Keep at least one
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const toggleRecipient = (driverId: string | number) => {
    const sId = String(driverId);
    if (selectedRecipientIds.includes(sId)) {
      if (selectedRecipientIds.length === 1) return; // Keep at least one
      setSelectedRecipientIds((prev) => prev.filter((id) => id !== sId));
    } else {
      setSelectedRecipientIds((prev) => [...prev, sId]);
    }
  };

  const formatDisplayDate = (d: string) => {
    try {
      const parts = d.split("-");
      if (parts.length === 3) {
        const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    } catch {}
    return d;
  };

  const buildMessageForDriver = (driver: CalloutItem) => {
    const dateFormatted = formatDisplayDate(driver.date || currentDate);
    let msg = `Hi ${driver.name},\n\nThis is your callout summary for ${dateFormatted}.\nCallout Type: ${driver.callout_time || "Call Out"}\nExcused: ${driver.excused || "No"}`;
    if (driver.reason) {
      msg += `\nReason: ${driver.reason}`;
    }
    if (additionalNotes.trim()) {
      msg += `\n\nNotes: ${additionalNotes.trim()}`;
    }
    return msg;
  };

  const handleSend = async () => {
    if (activeRecipients.length === 0) {
      setError("No recipients selected. Please select at least one driver.");
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      const driversPayload = activeRecipients.map((r) => ({
        driver_id: String(r.driver_id),
        message: buildMessageForDriver(r),
        _id: r._id,
      }));

      await calloutRescueApi.sendCalloutMessage({
        send_option: channels,
        drivers: driversPayload,
      });

      onSuccess(activeRecipients.map((r) => r.driver_id));
      onClose();
    } catch (err: any) {
      console.error("Failed to send callout notifications:", err);
      setError(err?.message || "Failed to dispatch callout messages. Please check network.");
    } finally {
      setIsSending(false);
    }
  };

  const currentPreviewRecipient = activeRecipients[previewDriverIndex] || activeRecipients[0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(3px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.2)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.1rem 1.4rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Send Callout Notifications
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0.15rem 0 0 0" }}>
                Dispatch real-time SMS or in-app notifications to {activeRecipients.length} driver{activeRecipients.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#64748B",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "1.25rem 1.4rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
          }}
        >
          {error && (
            <div
              style={{
                padding: "0.75rem 0.9rem",
                borderRadius: "10px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#991B1B",
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Delivery Channels */}
          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block", marginBottom: "0.45rem" }}>
              Delivery Channels
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              {/* SMS Option */}
              <div
                onClick={() => toggleChannel("sms")}
                style={{
                  padding: "0.75rem 0.9rem",
                  borderRadius: "10px",
                  border: channels.includes("sms") ? "2px solid #2563EB" : "1px solid #E2E8F0",
                  backgroundColor: channels.includes("sms") ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MessageSquare size={16} style={{ color: channels.includes("sms") ? "#2563EB" : "#64748B" }} />
                  <div>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: channels.includes("sms") ? "#1D4ED8" : "#1E293B", display: "block" }}>
                      SMS Text
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Twilio Gateway</span>
                  </div>
                </div>
                {channels.includes("sms") && <CheckCircle2 size={16} style={{ color: "#2563EB" }} />}
              </div>

              {/* In-App Option */}
              <div
                onClick={() => toggleChannel("inapp")}
                style={{
                  padding: "0.75rem 0.9rem",
                  borderRadius: "10px",
                  border: channels.includes("inapp") ? "2px solid #2563EB" : "1px solid #E2E8F0",
                  backgroundColor: channels.includes("inapp") ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Smartphone size={16} style={{ color: channels.includes("inapp") ? "#2563EB" : "#64748B" }} />
                  <div>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: channels.includes("inapp") ? "#1D4ED8" : "#1E293B", display: "block" }}>
                      In-App Chat
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Driver Mobile App</span>
                  </div>
                </div>
                {channels.includes("inapp") && <CheckCircle2 size={16} style={{ color: "#2563EB" }} />}
              </div>
            </div>
          </div>

          {/* Recipients List */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B" }}>
                Target Recipients ({activeRecipients.length} of {recipients.length})
              </label>
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Click to toggle driver
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                maxHeight: "90px",
                overflowY: "auto",
                padding: "0.5rem",
                backgroundColor: "#F8FAFC",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
              }}
            >
              {recipients.map((r) => {
                const isSelected = selectedRecipientIds.includes(String(r.driver_id));
                return (
                  <button
                    key={r.driver_id}
                    type="button"
                    onClick={() => toggleRecipient(r.driver_id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: isSelected ? "1px solid #93C5FD" : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                      color: isSelected ? "#1D4ED8" : "#94A3B8",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{r.name}</span>
                    {r.msg_sent && (
                      <span style={{ fontSize: "0.6875rem", color: "#10B981" }} title="Already sent message">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Navigation: Compose vs Preview */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #E2E8F0",
              gap: "1.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("compose")}
              style={{
                border: "none",
                background: "none",
                padding: "0.5rem 0",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: activeTab === "compose" ? "#2563EB" : "#64748B",
                borderBottom: activeTab === "compose" ? "2px solid #2563EB" : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Edit3 size={14} />
              <span>Compose Message</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              style={{
                border: "none",
                background: "none",
                padding: "0.5rem 0",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: activeTab === "preview" ? "#2563EB" : "#64748B",
                borderBottom: activeTab === "preview" ? "2px solid #2563EB" : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Eye size={14} />
              <span>Live Preview</span>
            </button>
          </div>

          {/* COMPOSE VIEW */}
          {activeTab === "compose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.3rem" }}>
                  Standard Template Body (Automated)
                </label>
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "0.65rem 0.85rem",
                    fontSize: "0.75rem",
                    color: "#475569",
                    whiteSpace: "pre-line",
                    lineHeight: 1.5,
                  }}
                >
                  {`Hi \${name},\n\nThis is your callout summary for \${date}.\nCallout Type: \${callout_time}\nExcused: \${excused}`}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B" }}>
                    Additional Message Notes (Optional)
                  </label>
                  <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                    Appended to driver notification
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Please submit your medical note to dispatch before your next shift..."
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.8125rem",
                    color: "#1E293B",
                    fontFamily: "inherit",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {/* PREVIEW VIEW */}
          {activeTab === "preview" && currentPreviewRecipient && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {activeRecipients.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                    Previewing message for:
                  </span>
                  <select
                    value={previewDriverIndex}
                    onChange={(e) => setPreviewDriverIndex(Number(e.target.value))}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#1E293B",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    {activeRecipients.map((r, i) => (
                      <option key={r.driver_id} value={i}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", borderBottom: "1px solid #EFF6FF", paddingBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1D4ED8" }}>
                    To: {currentPreviewRecipient.name}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#64748B" }}>
                    via {channels.map((c) => (c === "sms" ? "SMS" : "In-App Chat")).join(" & ")}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    color: "#1E293B",
                    whiteSpace: "pre-line",
                    lineHeight: 1.6,
                  }}
                >
                  {buildMessageForDriver(currentPreviewRecipient)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "0.85rem 1.4rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.65rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || activeRecipients.length === 0}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: isSending || activeRecipients.length === 0 ? "#93C5FD" : "#2563EB",
              color: "#FFFFFF !important",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: isSending || activeRecipients.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
            }}
          >
            {isSending ? (
              <>
                <Loader2 size={15} className="animate-spin" style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Sending...</span>
              </>
            ) : (
              <>
                <Send size={15} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>
                  Send Notification ({activeRecipients.length})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendCalloutMessageModal;
