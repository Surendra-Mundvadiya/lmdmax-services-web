import React, { FC, useState } from "react";
import { X, Radio, Search, Paperclip, Loader2, Check } from "lucide-react";
import { ChatThreadItem, BroadcastPayload, chatsApi } from "../../api/chatsApi";

interface CreateBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDrivers: ChatThreadItem[];
  onBroadcastSuccess: () => void;
  stationIds?: string[];
}

export const CreateBroadcastModal: FC<CreateBroadcastModalProps> = ({
  isOpen,
  onClose,
  availableDrivers,
  onBroadcastSuccess,
  stationIds,
}) => {
  const [broadcastName, setBroadcastName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [driverSearch, setDriverSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredDrivers = availableDrivers.filter((d) => {
    if (!driverSearch.trim()) return true;
    const q = driverSearch.toLowerCase();
    return d.name.toLowerCase().includes(q) || (d.phone && d.phone.includes(q));
  });

  const handleToggleDriver = (id: string) => {
    setSelectedDriverIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedDriverIds.size === filteredDrivers.length) {
      setSelectedDriverIds(new Set());
    } else {
      setSelectedDriverIds(new Set(filteredDrivers.map((d) => d.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedDriverIds.size === 0) {
      setErrorMsg("Please select at least one driver to receive the broadcast.");
      return;
    }

    if (!message.trim() && !file) {
      setErrorMsg("Please enter an announcement message or attach a file.");
      return;
    }

    const selectedDrivers = availableDrivers
      .filter((d) => selectedDriverIds.has(d.id))
      .map((d) => ({
        driver_id: d.driver_id || d.id,
        name: d.name,
        stations: d.stations || (stationIds ? stationIds : []),
      }));

    const payload: BroadcastPayload = {
      message: message.trim(),
      broadcastName: broadcastName.trim() || undefined,
      driverList: selectedDrivers,
      attachment: file,
      station_ids: stationIds,
    };

    setIsSubmitting(true);
    try {
      const ok = await chatsApi.createSMSBroadcast(payload);
      if (ok) {
        onBroadcastSuccess();
        onClose();
      } else {
        setErrorMsg("Failed to send broadcast. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="broadcast-modal-title"
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          border: "1px solid var(--ads-hairline)",
          borderRadius: "var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "var(--ads-s5) var(--ads-s6)",
            borderBottom: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--ads-r-sm)",
                background: "var(--ads-blue-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ads-blue)",
                flexShrink: 0,
              }}
            >
              <Radio size={18} />
            </div>
            <div>
              <h3
                id="broadcast-modal-title"
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  letterSpacing: "-0.014em",
                  color: "var(--ads-ink)",
                  margin: 0,
                }}
              >
                Create SMS Broadcast
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", margin: 0 }}>
                Send a real-time mass SMS announcement to selected drivers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close broadcast dialog"
            title="Close"
            style={{
              background: "none",
              border: "1px solid transparent",
              color: "var(--ads-ink-tertiary)",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "var(--ads-r-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition:
                "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "var(--ads-s5) var(--ads-s6)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--ads-s4)" }}>
            {errorMsg && (
              <div
                style={{
                  padding: "var(--ads-s3) var(--ads-s4)",
                  borderRadius: "var(--ads-r-sm)",
                  background: "var(--ads-red-tint)",
                  border: "1px solid rgba(215, 0, 21, 0.22)",
                  color: "var(--ads-red)",
                  fontSize: "0.8125rem",
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Campaign Name */}
            <div>
              <label
                htmlFor="broadcast-name"
                style={{ display: "block", fontSize: "0.8125rem", fontWeight: 550, color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s2)" }}
              >
                Broadcast / Campaign Name (Optional)
              </label>
              <input
                id="broadcast-name"
                type="text"
                placeholder="e.g. Inclement Weather Alert, Morning Standup Reminder"
                value={broadcastName}
                onChange={(e) => setBroadcastName(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 var(--ads-s3)",
                  fontSize: "0.875rem",
                  color: "var(--ads-ink)",
                  background: "var(--ads-material-thick)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-sm)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Recipient Selection */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 550, color: "var(--ads-ink-secondary)" }}>
                  Select Drivers ({selectedDriverIds.size} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--ads-blue)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {selectedDriverIds.size === filteredDrivers.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Driver search box */}
              <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "11px", color: "var(--ads-ink-tertiary)" }} />
                <input
                  type="text"
                  aria-label="Filter drivers by name or phone"
                  placeholder="Filter drivers by name or phone..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  style={{
                    width: "100%",
                    height: "34px",
                    padding: "0 0.75rem 0 2.25rem",
                    fontSize: "0.8125rem",
                    color: "var(--ads-ink)",
                    border: "1px solid var(--ads-hairline)",
                    borderRadius: "var(--ads-r-sm)",
                    background: "var(--ads-material-thick)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Drivers Checkbox List */}
              <div
                style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "var(--ads-s1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--ads-s1)",
                  background: "rgba(0, 0, 0, 0.025)",
                }}
              >
                {filteredDrivers.length === 0 ? (
                  <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.775rem", color: "var(--ads-ink-tertiary)" }}>
                    No drivers available
                  </div>
                ) : (
                  filteredDrivers.map((driver) => {
                    const isChecked = selectedDriverIds.has(driver.id);
                    return (
                      <div
                        key={driver.id}
                        onClick={() => handleToggleDriver(driver.id)}
                        role="checkbox"
                        aria-checked={isChecked}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "var(--ads-s2) var(--ads-s3)",
                          borderRadius: "var(--ads-r-sm)",
                          background: isChecked ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
                          border: `1px solid ${isChecked ? "rgba(0, 113, 227, 0.24)" : "var(--ads-hairline)"}`,
                          cursor: "pointer",
                          fontSize: "0.8125rem",
                          transition:
                            "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: "var(--ads-ink)" }}>{driver.name}</span>
                          {driver.phone && (
                            <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", marginLeft: "0.5rem" }}>
                              {driver.phone}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "var(--ads-r-xs)",
                            border: `1.5px solid ${isChecked ? "var(--ads-blue)" : "var(--ads-hairline-strong)"}`,
                            background: isChecked ? "var(--ads-blue)" : "var(--ads-white)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            flexShrink: 0,
                            transition:
                              "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
                          }}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Announcement Message */}
            <div>
              <label
                htmlFor="broadcast-message"
                style={{ display: "block", fontSize: "0.8125rem", fontWeight: 550, color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s2)" }}
              >
                Announcement Message (Use {"${name}"} for driver's name)
              </label>
              <textarea
                id="broadcast-message"
                rows={4}
                placeholder="Type your broadcast message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--ads-s3)",
                  fontSize: "0.875rem",
                  color: "var(--ads-ink)",
                  background: "var(--ads-material-thick)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* File Attachment */}
            <div>
              <label
                htmlFor="broadcast-file"
                style={{ display: "block", fontSize: "0.8125rem", fontWeight: 550, color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s2)" }}
              >
                Attachment (Optional, max 5MB)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="file"
                  id="broadcast-file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="broadcast-file"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--ads-s2)",
                    padding: "7px 15px",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    boxShadow: "var(--ads-bevel)",
                    fontSize: "0.8125rem",
                    fontWeight: 550,
                    cursor: "pointer",
                    color: "var(--ads-ink)",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  <Paperclip size={14} />
                  <span>Choose File</span>
                </label>
                {file && (
                  <span style={{ fontSize: "0.8125rem", color: "var(--ads-blue)", fontWeight: 550 }}>
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "var(--ads-s4) var(--ads-s6)",
              borderTop: "1px solid var(--ads-hairline)",
              background: "rgba(0, 0, 0, 0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "var(--ads-s3)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: "36px",
                padding: "0 18px",
                borderRadius: "var(--ads-r-pill)",
                border: "1px solid var(--ads-hairline)",
                background: "var(--ads-material-thick)",
                boxShadow: "var(--ads-bevel)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--ads-ink)",
                cursor: "pointer",
                transition:
                  "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || selectedDriverIds.size === 0 || (!message.trim() && !file)}
              style={{
                height: "36px",
                padding: "0 22px",
                borderRadius: "var(--ads-r-pill)",
                border: "1px solid transparent",
                background: "var(--ads-blue)",
                color: "#FFFFFF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                boxShadow: "0 1px 3px rgba(0, 113, 227, 0.26)",
                opacity: isSubmitting || selectedDriverIds.size === 0 || (!message.trim() && !file) ? 0.4 : 1,
                transition:
                  "background-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Sending...</span>
                </>
              ) : (
                <>
                  <Radio size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Send Broadcast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBroadcastModal;
