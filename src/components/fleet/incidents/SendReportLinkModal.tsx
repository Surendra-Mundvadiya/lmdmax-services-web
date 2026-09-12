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
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ads-s4)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          borderRadius: "var(--ads-r-xl)",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          border: "1px solid var(--ads-hairline)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--ads-s5) var(--ads-s6)",
            background: "transparent",
            borderBottom: "1px solid var(--ads-hairline)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: "var(--ads-blue-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={18} color="var(--ads-blue)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                Send Incident Report Link
              </h3>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                Generate secure submission links and dispatch them directly to drivers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close send report link dialog"
            style={{
              background: "transparent",
              border: "1px solid var(--ads-hairline)",
              cursor: "pointer",
              color: "var(--ads-ink-tertiary)",
              padding: "6px",
              borderRadius: "var(--ads-r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="scrollable" style={{ flex: 1, overflowY: "auto", padding: "var(--ads-s6)" }}>
          {/* 1. Report Type Selector */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--ads-ink-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              1. Choose Report Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setReportType("accident")}
                style={{
                  padding: "var(--ads-s3) var(--ads-s4)",
                  borderRadius: "var(--ads-r-md)",
                  border:
                    reportType === "accident"
                      ? "1px solid var(--ads-blue)"
                      : "1px solid var(--ads-hairline)",
                  backgroundColor:
                    reportType === "accident"
                      ? "var(--ads-blue-tint)"
                      : "var(--ads-material-thick)",
                  boxShadow: "var(--ads-bevel)",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--ads-s3)",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--ads-r-xs)",
                    backgroundColor:
                      reportType === "accident" ? "var(--ads-blue)" : "rgba(0,0,0,0.04)",
                    color: reportType === "accident" ? "#FFFFFF" : "var(--ads-ink-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                    Accident Report
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                    Vehicle collision or property damage
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportType("injury")}
                style={{
                  padding: "var(--ads-s3) var(--ads-s4)",
                  borderRadius: "var(--ads-r-md)",
                  border:
                    reportType === "injury"
                      ? "1px solid var(--ads-blue)"
                      : "1px solid var(--ads-hairline)",
                  backgroundColor:
                    reportType === "injury"
                      ? "var(--ads-blue-tint)"
                      : "var(--ads-material-thick)",
                  boxShadow: "var(--ads-bevel)",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--ads-s3)",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--ads-r-xs)",
                    backgroundColor:
                      reportType === "injury" ? "var(--ads-blue)" : "rgba(0,0,0,0.04)",
                    color: reportType === "injury" ? "#FFFFFF" : "var(--ads-ink-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Send size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                    Injury Report
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                    Physical harm or medical incident
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Notification Channels */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--ads-ink-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
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
                      borderRadius: "var(--ads-r-pill)",
                      border: active
                        ? "1px solid var(--ads-blue)"
                        : "1px solid var(--ads-hairline)",
                      backgroundColor: active
                        ? "var(--ads-blue-tint)"
                        : "var(--ads-material-thick)",
                      color: active ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
              <label style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--ads-ink-secondary)", textTransform: "uppercase" }}>
                3. Select Driver(s) ({selectedDriverIds.length} selected)
              </label>
              {filteredDrivers.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  style={{
                    background: "transparent",
                    border: "1px solid transparent",
                    borderRadius: "var(--ads-r-pill)",
                    color: "var(--ads-blue)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
                  color: "var(--ads-ink-quaternary)",
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
                  borderRadius: "var(--ads-r-sm)",
                  border: "1px solid var(--ads-hairline)",
                  fontSize: "0.8125rem",
                  color: "var(--ads-ink)",
                  backgroundColor: "var(--ads-material-thick)",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              />
            </div>

            {/* Drivers List */}
            <div
              className="scrollable"
              style={{
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-md)",
                maxHeight: "220px",
                overflowY: "auto",
                backgroundColor: "var(--ads-canvas)",
              }}
            >
              {loadingDrivers ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px", gap: "0.5rem" }}>
                  <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite", color: "var(--ads-blue)" }} />
                  <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>Loading fleet drivers…</span>
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--ads-ink-quaternary)", fontSize: "0.8125rem" }}>
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
                        borderBottom: "1px solid var(--ads-hairline)",
                        backgroundColor: isChecked
                          ? "var(--ads-blue-tint)"
                          : "var(--ads-material-thick)",
                        cursor: "pointer",
                        transition: "all var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ color: isChecked ? "var(--ads-blue)" : "var(--ads-ink-quaternary)" }}>
                          {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 650, color: "var(--ads-ink)" }}>
                            {driver.name}
                          </div>
                          {driver.phone && (
                            <div style={{ fontSize: "0.72rem", color: "var(--ads-ink-tertiary)" }}>
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
                          borderRadius: "var(--ads-r-pill)",
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: "var(--ads-ink-tertiary)",
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
                padding: "var(--ads-s4)",
                borderRadius: "var(--ads-r-md)",
                backgroundColor: "var(--ads-green-tint)",
                border: "1px solid var(--ads-green-tint)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.65rem" }}>
                <Check size={16} color="var(--ads-green)" />
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-green)" }}>
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
                      backgroundColor: "var(--ads-material-thick)",
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline)",
                      gap: "var(--ads-s3)",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                        {item.driver_name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--ads-ink-tertiary)",
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
                        borderRadius: "var(--ads-r-pill)",
                        border: "1px solid var(--ads-hairline)",
                        backgroundColor:
                          copiedToken === item.token
                            ? "var(--ads-green-tint)"
                            : "var(--ads-material-thick)",
                        color:
                          copiedToken === item.token
                            ? "var(--ads-green)"
                            : "var(--ads-blue)",
                        boxShadow: "var(--ads-bevel)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        flexShrink: 0,
                        transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
            padding: "var(--ads-s4) var(--ads-s6)",
            borderTop: "1px solid var(--ads-hairline)",
            background: "transparent",
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
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid var(--ads-hairline)",
              backgroundColor: "var(--ads-material-thick)",
              color: "var(--ads-ink)",
              boxShadow: "var(--ads-bevel)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            {generatedLinks.length > 0 ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleGenerateAndSend}
            disabled={isSending || selectedDriverIds.length === 0}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid transparent",
              backgroundColor:
                selectedDriverIds.length === 0
                  ? "var(--ads-ink-quaternary)"
                  : "var(--ads-blue)",
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: selectedDriverIds.length === 0 || isSending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
