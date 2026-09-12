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
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
              }}
            >
              <Radio size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Create SMS Broadcast
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>
                Send a real-time mass SMS announcement to selected drivers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {errorMsg && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: "#B91C1C",
                  fontSize: "0.8125rem",
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Campaign Name */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Broadcast / Campaign Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Inclement Weather Alert, Morning Standup Reminder"
                value={broadcastName}
                onChange={(e) => setBroadcastName(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 0.75rem",
                  fontSize: "0.875rem",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
            </div>

            {/* Recipient Selection */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#334155" }}>
                  Select Drivers ({selectedDriverIds.size} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563EB",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {selectedDriverIds.size === filteredDrivers.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Driver search box */}
              <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "11px", color: "#94A3B8" }} />
                <input
                  type="text"
                  placeholder="Filter drivers by name or phone..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  style={{
                    width: "100%",
                    height: "34px",
                    padding: "0 0.75rem 0 2.25rem",
                    fontSize: "0.8125rem",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    backgroundColor: "#F8FAFC",
                    outline: "none",
                  }}
                />
              </div>

              {/* Drivers Checkbox List */}
              <div
                style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "0.4rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  backgroundColor: "#F8FAFC",
                }}
              >
                {filteredDrivers.length === 0 ? (
                  <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.775rem", color: "#94A3B8" }}>
                    No drivers available
                  </div>
                ) : (
                  filteredDrivers.map((driver) => {
                    const isChecked = selectedDriverIds.has(driver.id);
                    return (
                      <div
                        key={driver.id}
                        onClick={() => handleToggleDriver(driver.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.4rem 0.6rem",
                          borderRadius: "6px",
                          backgroundColor: isChecked ? "#EFF6FF" : "#FFFFFF",
                          border: `1px solid ${isChecked ? "#BFDBFE" : "#F1F5F9"}`,
                          cursor: "pointer",
                          fontSize: "0.8125rem",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: "#1E293B" }}>{driver.name}</span>
                          {driver.phone && (
                            <span style={{ fontSize: "0.75rem", color: "#64748B", marginLeft: "0.5rem" }}>
                              {driver.phone}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            border: `1.5px solid ${isChecked ? "#2563EB" : "#CBD5E1"}`,
                            backgroundColor: isChecked ? "#2563EB" : "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
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
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Announcement Message (Use {"${name}"} for driver's name)
              </label>
              <textarea
                rows={4}
                placeholder="Type your broadcast message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  fontSize: "0.875rem",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* File Attachment */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
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
                    gap: "0.4rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#F8FAFC",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  <Paperclip size={14} />
                  <span>Choose File</span>
                </label>
                {file && (
                  <span style={{ fontSize: "0.8125rem", color: "#2563EB", fontWeight: 500 }}>
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: "36px",
                padding: "0 1rem",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#475569",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || selectedDriverIds.size === 0 || (!message.trim() && !file)}
              style={{
                height: "36px",
                padding: "0 1.25rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                opacity: isSubmitting || selectedDriverIds.size === 0 || (!message.trim() && !file) ? 0.6 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Radio size={15} />
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
