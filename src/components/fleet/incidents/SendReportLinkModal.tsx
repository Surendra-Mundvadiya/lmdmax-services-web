import React, { FC, useState, useEffect, useMemo } from "react";
import {
  Send,
  X,
  Search,
  CheckSquare,
  Square,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  MessageSquare,
  Mail,
  Smartphone,
  ShieldAlert,
} from "lucide-react";
import { axiosInstance } from "../../../api/axiosClient";

interface DriverOption {
  id: number;
  name: string;
  phone?: string;
  status?: string;
  allow_signin?: boolean | null;
}

interface GeneratedLink {
  driver_id: string | number;
  driver_name: string;
  token: string;
  link: string;
}

interface SendReportLinkModalProps {
  open: boolean;
  initialType?: "accident" | "injury";
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const SendReportLinkModal: FC<SendReportLinkModalProps> = ({
  open,
  initialType = "accident",
  onClose,
  onSuccessToast,
}) => {
  const [reportType, setReportType] = useState<"accident" | "injury">(initialType);
  const [channels, setChannels] = useState<string[]>(["sms"]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDriverIds, setSelectedDriverIds] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    setReportType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (!open) {
      setSelectedDriverIds([]);
      setSearch("");
      setGeneratedLinks([]);
      setCopiedToken(null);
      return;
    }

    setLoadingDrivers(true);
    axiosInstance
      .get("drivers/v1/drivers/all_stations?limit=700&is_deleted=false")
      .then((res) => {
        const raw = res.data?.data?.data || res.data?.data || res.data || [];
        const list: any[] = Array.isArray(raw) ? raw : raw?.drivers || [];
        const mapped: DriverOption[] = list
          .filter((d: any) => d.status !== "inactive" && d.status !== "terminated")
          .map((d: any) => ({
            id: Number(d.id),
            name: String(d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Driver #${d.id}`),
            phone: d.phone || d.phone_number || "",
            status: d.status || "active",
            allow_signin: d.allow_signin,
          }));
        setDrivers(mapped);
      })
      .catch(() => {
        // Fallback to single station drivers
        axiosInstance
          .get("drivers/v1/drivers?limit=700")
          .then((res) => {
            const raw = res.data?.data?.data || res.data?.data || res.data || [];
            const list: any[] = Array.isArray(raw) ? raw : raw?.drivers || [];
            const mapped: DriverOption[] = list.map((d: any) => ({
              id: Number(d.id),
              name: String(d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Driver #${d.id}`),
              phone: d.phone || d.phone_number || "",
              status: d.status || "active",
              allow_signin: d.allow_signin,
            }));
            setDrivers(mapped);
          })
          .catch(() => setDrivers([]));
      })
      .finally(() => setLoadingDrivers(false));
  }, [open]);

  const filteredDrivers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.phone && d.phone.includes(q)) ||
        String(d.id).includes(q)
    );
  }, [drivers, search]);

  const toggleDriver = (id: number) => {
    setSelectedDriverIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedDriverIds.length === filteredDrivers.length) {
      setSelectedDriverIds([]);
    } else {
      setSelectedDriverIds(filteredDrivers.map((d) => d.id));
    }
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? (prev.length > 1 ? prev.filter((c) => c !== ch) : prev) : [...prev, ch]
    );
  };

  const handleGenerateAndSend = async () => {
    if (selectedDriverIds.length === 0) return;
    setIsSending(true);
    try {
      const isInjury = reportType === "injury";
      const res = await axiosInstance.get("/incident_report_form/v1/get_token_for_driverIds", {
        params: {
          driverIds: selectedDriverIds,
          injury_form_id: null,
          is_injury: isInjury,
        },
      });

      const raw = res.data?.data || res.data || [];
      const tokenList = Array.isArray(raw) ? raw : [];

      const origin = window.location.origin;
      const links: GeneratedLink[] = tokenList.map((item: any) => {
        const token = item.token || "";
        const driverId = item.driver_id || "";
        const driverName = item.driver_name || drivers.find((d) => d.id === Number(driverId))?.name || "Driver";
        const formPath = isInjury
          ? `/reportform/v1/verifytoken?token=${token}`
          : `/reportform/v1/verifytoken?token=${token}`;
        return {
          driver_id: driverId,
          driver_name: driverName,
          token,
          link: `${origin}${formPath}`,
        };
      });

      setGeneratedLinks(links);

      // Attempt sending messages via messaging endpoint if configured
      try {
        const messagePayload = {
          receiverList: links.map((l) => ({
            driver_id: l.driver_id,
            message: `Hi ${l.driver_name}!\nThis is your ${isInjury ? "Injury" : "Accident"} report form link. Please fill in the required details and submit it:\n\nLink: ${l.link}\n\nThanks, Fleet Operations`,
          })),
          channels,
        };
        await axiosInstance.post("/users/v1/bulk_send_messages", messagePayload).catch(() => {});
      } catch {
        // Continue even if automatic SMS service fails; links are displayed for copying
      }

      if (onSuccessToast) {
        onSuccessToast(`Generated ${links.length} ${reportType} report link(s) successfully!`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to generate report links.";
      if (onSuccessToast) onSuccessToast(msg);
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #E2E8F0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={18} color="#2563EB" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0F172A" }}>
                Send Incident Report Link
              </h3>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>
                Generate secure submission links and dispatch them directly to drivers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748B",
              padding: "6px",
              borderRadius: "8px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="scrollable" style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          {/* 1. Report Type Selector */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              1. Choose Report Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setReportType("accident")}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: reportType === "accident" ? "2px solid #2563EB" : "1px solid #E2E8F0",
                  backgroundColor: reportType === "accident" ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    backgroundColor: reportType === "accident" ? "#2563EB" : "#F1F5F9",
                    color: reportType === "accident" ? "#FFFFFF" : "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>
                    Accident Report
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Vehicle collision or property damage
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportType("injury")}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: reportType === "injury" ? "2px solid #2563EB" : "1px solid #E2E8F0",
                  backgroundColor: reportType === "injury" ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    backgroundColor: reportType === "injury" ? "#2563EB" : "#F1F5F9",
                    color: reportType === "injury" ? "#FFFFFF" : "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Send size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>
                    Injury Report
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Physical harm or medical incident
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Notification Channels */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              2. Distribution Channels
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {[
                { key: "sms", label: "SMS Text", icon: <Smartphone size={14} /> },
                { key: "inapp", label: "In-App Chat", icon: <MessageSquare size={14} /> },
                { key: "email", label: "Email", icon: <Mail size={14} /> },
              ].map((ch) => {
                const active = channels.includes(ch.key);
                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => toggleChannel(ch.key)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "8px",
                      border: active ? "1px solid #2563EB" : "1px solid #E2E8F0",
                      backgroundColor: active ? "#EFF6FF" : "#FFFFFF",
                      color: active ? "#2563EB" : "#64748B",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    {ch.icon}
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Driver Selection */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                3. Select Driver(s) ({selectedDriverIds.length} selected)
              </label>
              {filteredDrivers.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563EB",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {selectedDriverIds.length === filteredDrivers.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {/* Driver search */}
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search drivers by name or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 1rem 0 2.2rem",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  fontSize: "0.8125rem",
                  backgroundColor: "#FFFFFF",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Drivers List */}
            <div
              className="scrollable"
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                maxHeight: "220px",
                overflowY: "auto",
                backgroundColor: "#FAFAFA",
              }}
            >
              {loadingDrivers ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px", gap: "0.5rem" }}>
                  <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite", color: "#2563EB" }} />
                  <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>Loading fleet drivers…</span>
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#94A3B8", fontSize: "0.8125rem" }}>
                  No active drivers found.
                </div>
              ) : (
                filteredDrivers.map((driver) => {
                  const isChecked = selectedDriverIds.includes(driver.id);
                  return (
                    <div
                      key={driver.id}
                      onClick={() => toggleDriver(driver.id)}
                      style={{
                        padding: "0.55rem 0.9rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid #F1F5F9",
                        backgroundColor: isChecked ? "#EFF6FF" : "#FFFFFF",
                        cursor: "pointer",
                        transition: "background 0.12s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ color: isChecked ? "#2563EB" : "#CBD5E1" }}>
                          {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 650, color: "#0F172A" }}>
                            {driver.name}
                          </div>
                          {driver.phone && (
                            <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                              {driver.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          padding: "0.1rem 0.45rem",
                          borderRadius: "9999px",
                          backgroundColor: "#F1F5F9",
                          color: "#64748B",
                        }}
                      >
                        ID #{driver.id}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Generated Links Display */}
          {generatedLinks.length > 0 && (
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                borderRadius: "10px",
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.65rem" }}>
                <Check size={16} color="#16A34A" />
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#166534" }}>
                  Generated Submission Links ({generatedLinks.length})
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {generatedLinks.map((item) => (
                  <div
                    key={item.token}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      border: "1px solid #DCFCE7",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>
                        {item.driver_name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#64748B",
                          fontFamily: "monospace",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.link}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.link, item.token)}
                      style={{
                        padding: "0.35rem 0.65rem",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: copiedToken === item.token ? "#DCFCE7" : "#FFFFFF",
                        color: copiedToken === item.token ? "#166534" : "#2563EB",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        flexShrink: 0,
                      }}
                    >
                      {copiedToken === item.token ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedToken === item.token ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.65rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {generatedLinks.length > 0 ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleGenerateAndSend}
            disabled={isSending || selectedDriverIds.length === 0}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: selectedDriverIds.length === 0 ? "#94A3B8" : "#2563EB",
              color: "#FFFFFF",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: selectedDriverIds.length === 0 || isSending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
            }}
          >
            {isSending ? (
              <>
                <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                <span>Generating…</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Generate & Send ({selectedDriverIds.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendReportLinkModal;
