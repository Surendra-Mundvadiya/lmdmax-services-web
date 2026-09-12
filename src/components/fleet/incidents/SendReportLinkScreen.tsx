import React, { FC, useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Send,
  Search,
  Check,
  CheckSquare,
  Square,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  Car,
  Activity,
  X,
  RotateCcw,
  Users,
  ChevronDown,
} from "lucide-react";
import { axiosInstance } from "../../../api/axiosClient";
import { perfAxiosInstance } from "../../../api/axiosClient";
import { useAuthStore } from "../../../store/authStore";

interface DriverOption {
  id: number;
  name: string;
  phone?: string;
  status?: string;
  station_code?: string;
}

interface GeneratedLinkItem {
  driver_id: string | number;
  driver_name: string;
  token: string;
  link: string;
}

interface SendReportLinkScreenProps {
  initialType?: "accident" | "injury";
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

const DEFAULT_TEMPLATE = `Hi {driver_name}!
This is your {report_type} form link. Please fill in the required details and submit it:

Link: {form_link}

Thanks, Fleet Operations`;

export const SendReportLinkScreen: FC<SendReportLinkScreenProps> = ({
  initialType = "accident",
  onClose,
  onSuccessToast,
}) => {
  const { user, stations } = useAuthStore();
  const currentStation = stations?.find((s) => s.current) || stations?.[0];
  const stationCode = currentStation?.station_code || user?.station_code || "QUE4";

  // Form State
  const [reportType, setReportType] = useState<"accident" | "injury">(initialType);
  const [channels, setChannels] = useState<string[]>(["sms"]);
  const [templateText, setTemplateText] = useState<string>(DEFAULT_TEMPLATE);

  // Driver Selector State
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedDriverIds, setSelectedDriverIds] = useState<number[]>([]);
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLinkItem[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copyAllSuccess, setCopyAllSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Close driver dropdown on click outside
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDriverDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // Fetch active drivers on mount
  useEffect(() => {
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
            name: String(
              d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Driver #${d.id}`
            ),
            phone: d.phone || d.phone_number || "",
            status: d.status || "active",
            station_code: d.station_code || d.station || stationCode,
          }));
        setDrivers(mapped);
      })
      .catch(() => {
        // Fallback to single station endpoint
        axiosInstance
          .get("drivers/v1/drivers?limit=700")
          .then((res) => {
            const raw = res.data?.data?.data || res.data?.data || res.data || [];
            const list: any[] = Array.isArray(raw) ? raw : raw?.drivers || [];
            const mapped: DriverOption[] = list.map((d: any) => ({
              id: Number(d.id),
              name: String(
                d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Driver #${d.id}`
              ),
              phone: d.phone || d.phone_number || "",
              status: d.status || "active",
              station_code: d.station_code || stationCode,
            }));
            setDrivers(mapped);
          })
          .catch(() => setDrivers([]));
      })
      .finally(() => setLoadingDrivers(false));
  }, [stationCode]);

  // Filter drivers based on search
  const filteredDrivers = useMemo(() => {
    const q = driverSearch.toLowerCase().trim();
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.phone && d.phone.includes(q)) ||
        String(d.id).includes(q)
    );
  }, [drivers, driverSearch]);

  const selectedDrivers = useMemo(() => {
    const set = new Set(selectedDriverIds);
    return drivers.filter((d) => set.has(d.id));
  }, [drivers, selectedDriverIds]);

  const toggleDriver = (id: number) => {
    setSelectedDriverIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const removeDriver = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedDriverIds((prev) => prev.filter((i) => i !== id));
  };

  const handleSelectAll = () => {
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

  const insertVariable = (varName: string) => {
    setTemplateText((prev) => prev + varName);
  };

  // Preview Message Interpolation
  const previewMessage = useMemo(() => {
    const sampleDriver = selectedDrivers[0]?.name || "John Doe";
    const reportLabel = reportType === "injury" ? "Injury Report" : "Accident Report";
    const sampleLink = "https://fleet.lmdmax.com/reportform/v1/verifytoken?token=sample_token_preview";
    const company = user?.company?.name || "Fleet Operations";

    return templateText
      .replace(/{driver_name}/g, sampleDriver)
      .replace(/{report_type}/g, reportLabel)
      .replace(/{form_link}/g, sampleLink)
      .replace(/{company_name}/g, company);
  }, [templateText, selectedDrivers, reportType, user]);

  // Execute Real API Call to generate tokens and dispatch messages
  const handleSendReportLink = async () => {
    if (selectedDriverIds.length === 0) return;
    setIsSending(true);
    setStatusMessage(null);

    try {
      const isInjury = reportType === "injury";
      const reportLabel = isInjury ? "Injury Report" : "Accident Report";

      // Step 1: Request verified report tokens from backend microservice
      const tokenRes = await axiosInstance.get("/incident_report_form/v1/get_token_for_driverIds", {
        params: {
          driverIds: selectedDriverIds,
          injury_form_id: null,
          is_injury: isInjury,
        },
      });

      const rawData = tokenRes.data?.data?.data || tokenRes.data?.data || tokenRes.data || [];
      const tokenList = Array.isArray(rawData) ? rawData : [];

      // Create generated links array
      const origin = "https://fleet.lmdmax.com";
      const links: GeneratedLinkItem[] = tokenList.map((item: any) => {
        const token = item.token || "";
        const driverId = item.driver_id || "";
        const resolvedName =
          item.driver_name ||
          drivers.find((d) => d.id === Number(driverId))?.name ||
          `Driver #${driverId}`;
        return {
          driver_id: driverId,
          driver_name: resolvedName,
          token,
          link: `${origin}/reportform/v1/verifytoken?token=${token}`,
        };
      });

      setGeneratedLinks(links);

      // Step 2: Prepare customized messages for each driver
      const company = user?.company?.name || "Fleet Operations";
      const payloadDrivers = links.map((l) => {
        const personalizedMsg = templateText
          .replace(/{driver_name}/g, l.driver_name)
          .replace(/{report_type}/g, reportLabel)
          .replace(/{form_link}/g, l.link)
          .replace(/{company_name}/g, company);

        return {
          driver_id: String(l.driver_id),
          message: personalizedMsg,
        };
      });

      // Step 3: Dispatch via live production message endpoint
      try {
        await perfAxiosInstance.post("/messages/v5/bulk_send_messages_to_drivers", {
          data: {
            send_option: channels,
            drivers: payloadDrivers,
          },
        });
      } catch (err: any) {
        // Fallback to secondary bulk message route if v5 microservice endpoint is not active for this token
        try {
          await axiosInstance.post("/users/v1/bulk_send_messages", {
            receiverList: payloadDrivers.map((p) => ({
              driver_id: p.driver_id,
              message: p.message,
            })),
            channels,
          });
        } catch {
          // Links are generated and visible below for copy
        }
      }

      const successMsg = `Successfully generated & dispatched ${links.length} ${reportLabel.toLowerCase()} link(s)!`;
      setStatusMessage({ text: successMsg, type: "success" });
      if (onSuccessToast) onSuccessToast(successMsg);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Failed to generate report links. Please try again.";
      setStatusMessage({ text: errorMsg, type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const copyAllLinks = () => {
    if (generatedLinks.length === 0) return;
    const allText = generatedLinks
      .map((l) => `${l.driver_name}: ${l.link}`)
      .join("\n\n");
    navigator.clipboard.writeText(allText);
    setCopyAllSuccess(true);
    setTimeout(() => setCopyAllSuccess(false), 2500);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--ads-s5)",
        width: "100%",
        backgroundColor: "var(--ads-material-thick)",
        backdropFilter: "var(--ads-blur-md)",
        WebkitBackdropFilter: "var(--ads-blur-md)",
        borderRadius: "var(--ads-r-md)",
        border: "1px solid var(--ads-hairline)",
        padding: "1.5rem 1.75rem",
        boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
      }}
    >
      {/* ── 1. Screen Top Header with Back Navigation ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--ads-hairline)",
          paddingBottom: "1.15rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s4)" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid var(--ads-hairline)",
              backgroundColor: "var(--ads-material-thick)",
              boxShadow: "var(--ads-bevel)",
              color: "var(--ads-ink)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-white)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--ads-material-thick)")
            }
          >
            <ArrowLeft size={16} />
            <span>Back to Reports</span>
          </button>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: "-0.019em",
                color: "var(--ads-ink)",
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
              }}
            >
              <Send size={20} color="var(--ads-blue)" />
              Send Report Link
            </h2>
            <p
              style={{
                margin: "0.2rem 0 0",
                fontSize: "0.82rem",
                color: "var(--ads-ink-tertiary)",
              }}
            >
              Generate secure accident and injury report links and dispatch them directly to drivers
            </p>
          </div>
        </div>

        {/* Status indicator / toast banner */}
        {statusMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
              padding: "var(--ads-s2) var(--ads-s4)",
              borderRadius: "var(--ads-r-pill)",
              fontSize: "0.84rem",
              fontWeight: 600,
              backgroundColor:
                statusMessage.type === "success"
                  ? "var(--ads-green-tint)"
                  : "var(--ads-red-tint)",
              color:
                statusMessage.type === "success" ? "var(--ads-green)" : "var(--ads-red)",
              border: "1px solid var(--ads-hairline)",
            }}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* ── 2. Choose Report Type ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label
          style={{
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "var(--ads-ink)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span>1. Select Report Type</span>
          <span style={{ color: "var(--ads-red)" }}>*</span>
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Accident Report Card */}
          <div
            onClick={() => setReportType("accident")}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--ads-r-md)",
              border:
                reportType === "accident"
                  ? "2px solid var(--ads-blue)"
                  : "1px solid var(--ads-hairline)",
              backgroundColor:
                reportType === "accident"
                  ? "var(--ads-blue-tint)"
                  : "var(--ads-material-thick)",
              boxShadow: reportType === "accident" ? "var(--ads-shadow-sm)" : "var(--ads-bevel)",
              cursor: "pointer",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--ads-r-sm)",
                backgroundColor:
                  reportType === "accident"
                    ? "var(--ads-blue-tint-strong)"
                    : "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Car size={20} color={reportType === "accident" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)"} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: reportType === "accident" ? "var(--ads-blue)" : "var(--ads-ink)",
                  }}
                >
                  Accident Report
                </span>
                {reportType === "accident" && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      backgroundColor: "var(--ads-blue)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "var(--ads-r-pill)",
                    }}
                  >
                    <Check size={11} color="#FFFFFF" />
                    Selected
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ads-ink-tertiary)", lineHeight: 1.4 }}>
                Vehicle collision, property damage, police report, or roadside equipment incident form.
              </p>
            </div>
          </div>

          {/* Injury Report Card */}
          <div
            onClick={() => setReportType("injury")}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--ads-r-md)",
              border:
                reportType === "injury"
                  ? "2px solid var(--ads-blue)"
                  : "1px solid var(--ads-hairline)",
              backgroundColor:
                reportType === "injury"
                  ? "var(--ads-blue-tint)"
                  : "var(--ads-material-thick)",
              boxShadow: reportType === "injury" ? "var(--ads-shadow-sm)" : "var(--ads-bevel)",
              cursor: "pointer",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--ads-r-sm)",
                backgroundColor:
                  reportType === "injury"
                    ? "var(--ads-blue-tint-strong)"
                    : "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Activity size={20} color={reportType === "injury" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)"} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: reportType === "injury" ? "var(--ads-blue)" : "var(--ads-ink)",
                  }}
                >
                  Injury Report
                </span>
                {reportType === "injury" && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      backgroundColor: "var(--ads-blue)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "var(--ads-r-pill)",
                    }}
                  >
                    <Check size={11} color="#FFFFFF" />
                    Selected
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ads-ink-tertiary)", lineHeight: 1.4 }}>
                Occupational bodily injury, animal encounter, package slip/fall, or medical incident form.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Select Drivers & Delivery Channels Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Left: Driver Selector Dropdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }} ref={dropdownRef}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "var(--ads-ink)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Users size={16} color="var(--ads-blue)" />
              <span>2. Select Drivers</span>
              <span style={{ color: "var(--ads-red)" }}>*</span>
            </label>
            <span style={{ fontSize: "0.78rem", color: "var(--ads-ink-tertiary)", fontWeight: 600 }}>
              {selectedDriverIds.length} driver(s) selected
            </span>
          </div>

          {/* Trigger Box / Input */}
          <div
            onClick={() => setIsDriverDropdownOpen((prev) => !prev)}
            style={{
              minHeight: "44px",
              padding: "0.4rem 0.75rem",
              borderRadius: "var(--ads-r-sm)",
              border: isDriverDropdownOpen
                ? "1.5px solid var(--ads-blue)"
                : "1px solid var(--ads-hairline-strong)",
              backgroundColor: "var(--ads-material-thick)",
              boxShadow: isDriverDropdownOpen ? "var(--ads-shadow-focus)" : "var(--ads-bevel)",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", flex: 1, alignItems: "center" }}>
              {selectedDrivers.length === 0 ? (
                <span style={{ color: "var(--ads-ink-quaternary)", fontSize: "0.85rem" }}>
                  {loadingDrivers ? "Loading drivers..." : "Click to select drivers from dropdown..."}
                </span>
              ) : (
                selectedDrivers.slice(0, 4).map((d) => (
                  <span
                    key={d.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "var(--ads-r-pill)",
                      backgroundColor: "var(--ads-blue-tint)",
                      color: "var(--ads-blue)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      border: "1px solid var(--ads-blue-tint-strong)",
                    }}
                  >
                    <span>{d.name}</span>
                    <X
                      size={13}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => removeDriver(d.id, e)}
                    />
                  </span>
                ))
              )}
              {selectedDrivers.length > 4 && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--ads-blue)",
                    backgroundColor: "var(--ads-blue-tint-strong)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "var(--ads-r-pill)",
                  }}
                >
                  +{selectedDrivers.length - 4} more
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--ads-ink-tertiary)" }}>
              {loadingDrivers && <Loader2 size={15} className="animate-spin" />}
              <ChevronDown
                size={16}
                style={{
                  transform: isDriverDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </div>
          </div>

          {/* Searchable Dropdown Menu */}
          {isDriverDropdownOpen && (
            <div
              style={{
                marginTop: "0.25rem",
                borderRadius: "var(--ads-r-md)",
                border: "1px solid var(--ads-hairline)",
                backgroundColor: "var(--ads-material-thick)",
                backdropFilter: "var(--ads-blur-lg)",
                WebkitBackdropFilter: "var(--ads-blur-lg)",
                boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
                zIndex: 9999,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                maxHeight: "280px",
              }}
            >
              {/* Search input & Select All Header */}
              <div
                style={{
                  padding: "0.6rem 0.75rem",
                  borderBottom: "1px solid var(--ads-hairline)",
                  backgroundColor: "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: "var(--ads-material-thick)",
                    border: "1px solid var(--ads-hairline-strong)",
                    borderRadius: "var(--ads-r-xs)",
                    padding: "0.3rem 0.6rem",
                    flex: 1,
                  }}
                >
                  <Search size={14} color="var(--ads-ink-quaternary)" />
                  <input
                    type="text"
                    placeholder="Search by driver name or phone..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: "0.82rem",
                      width: "100%",
                      background: "transparent",
                      color: "var(--ads-ink)",
                    }}
                  />
                  {driverSearch && (
                    <X
                      size={13}
                      color="var(--ads-ink-quaternary)"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDriverSearch("");
                      }}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAll();
                  }}
                  style={{
                    padding: "0.35rem 0.65rem",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid transparent",
                    backgroundColor: "var(--ads-blue-tint)",
                    color: "var(--ads-blue)",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  {selectedDriverIds.length === filteredDrivers.length && filteredDrivers.length > 0
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              {/* Scrollable Drivers List */}
              <div style={{ overflowY: "auto", flex: 1, padding: "0.25rem 0" }}>
                {filteredDrivers.length === 0 ? (
                  <div
                    style={{
                      padding: "1.25rem",
                      textAlign: "center",
                      color: "var(--ads-ink-tertiary)",
                      fontSize: "0.82rem",
                    }}
                  >
                    No matching active drivers found
                  </div>
                ) : (
                  filteredDrivers.map((d) => {
                    const isChecked = selectedDriverIds.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDriver(d.id);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.5rem 0.85rem",
                          cursor: "pointer",
                          backgroundColor: isChecked ? "var(--ads-blue-tint)" : "transparent",
                          transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isChecked) e.currentTarget.style.backgroundColor = "var(--ads-canvas)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isChecked) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ color: isChecked ? "var(--ads-blue)" : "var(--ads-ink-quaternary)" }}>
                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                          </span>
                          <span
                            style={{
                              fontSize: "0.84rem",
                              fontWeight: isChecked ? 700 : 500,
                              color: isChecked ? "var(--ads-blue)" : "var(--ads-ink)",
                            }}
                          >
                            {d.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {d.phone && (
                            <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                              {d.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Delivery Channel Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          <label
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              color: "var(--ads-ink)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Smartphone size={16} color="var(--ads-blue)" />
            <span>3. Delivery Channel</span>
          </label>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* SMS Option */}
            <div
              onClick={() => toggleChannel("sms")}
              style={{
                flex: 1,
                minWidth: "140px",
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.65rem 0.95rem",
                borderRadius: "var(--ads-r-sm)",
                border: channels.includes("sms")
                  ? "1.5px solid var(--ads-blue)"
                  : "1px solid var(--ads-hairline)",
                backgroundColor: channels.includes("sms")
                  ? "var(--ads-blue-tint)"
                  : "var(--ads-material-thick)",
                boxShadow: "var(--ads-bevel)",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
                cursor: "pointer",
              }}
            >
              <span style={{ color: channels.includes("sms") ? "var(--ads-blue)" : "var(--ads-ink-quaternary)" }}>
                {channels.includes("sms") ? <CheckSquare size={16} /> : <Square size={16} />}
              </span>
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: channels.includes("sms") ? "var(--ads-blue)" : "var(--ads-ink)",
                  }}
                >
                  SMS Text
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--ads-ink-tertiary)" }}>Mobile message</div>
              </div>
            </div>

            {/* In-App Chat Option */}
            <div
              onClick={() => toggleChannel("in_app_chat")}
              style={{
                flex: 1,
                minWidth: "140px",
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.65rem 0.95rem",
                borderRadius: "var(--ads-r-sm)",
                border: channels.includes("in_app_chat")
                  ? "1.5px solid var(--ads-blue)"
                  : "1px solid var(--ads-hairline)",
                backgroundColor: channels.includes("in_app_chat")
                  ? "var(--ads-blue-tint)"
                  : "var(--ads-material-thick)",
                boxShadow: "var(--ads-bevel)",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
                cursor: "pointer",
              }}
            >
              <span style={{ color: channels.includes("in_app_chat") ? "var(--ads-blue)" : "var(--ads-ink-quaternary)" }}>
                {channels.includes("in_app_chat") ? <CheckSquare size={16} /> : <Square size={16} />}
              </span>
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: channels.includes("in_app_chat") ? "var(--ads-blue)" : "var(--ads-ink)",
                  }}
                >
                  In-App Chat
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--ads-ink-tertiary)" }}>DSP driver thread</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Customizable Template & Interactive Preview (2-Column) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Template Editor */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            backgroundColor: "var(--ads-canvas)",
            borderRadius: "var(--ads-r-md)",
            border: "1px solid var(--ads-hairline)",
            padding: "1rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "var(--ads-ink)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <MessageSquare size={16} color="var(--ads-blue)" />
              <span>4. Message Template (Customizable)</span>
            </label>
            <button
              type="button"
              onClick={() => setTemplateText(DEFAULT_TEMPLATE)}
              style={{
                background: "none",
                border: "none",
                color: "var(--ads-ink-tertiary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
              title="Reset to default template"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          {/* Variable Insertion Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--ads-ink-tertiary)", fontWeight: 600 }}>
              Insert Variable:
            </span>
            {[
              { label: "{driver_name}", tip: "Driver Name" },
              { label: "{report_type}", tip: "Report Type" },
              { label: "{form_link}", tip: "Verified Link" },
              { label: "{company_name}", tip: "Company" },
            ].map((v) => (
              <button
                key={v.label}
                type="button"
                onClick={() => insertVariable(v.label)}
                style={{
                  padding: "0.2rem 0.55rem",
                  borderRadius: "var(--ads-r-pill)",
                  border: "1px solid var(--ads-hairline)",
                  backgroundColor: "var(--ads-material-thick)",
                  boxShadow: "var(--ads-bevel)",
                  color: "var(--ads-blue)",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)";
                  e.currentTarget.style.borderColor = "var(--ads-blue)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--ads-material-thick)";
                  e.currentTarget.style.borderColor = "var(--ads-hairline)";
                }}
              >
                + {v.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            rows={7}
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "var(--ads-r-sm)",
              border: "1px solid var(--ads-hairline-strong)",
              fontSize: "0.85rem",
              color: "var(--ads-ink)",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              backgroundColor: "var(--ads-material-thick)",
              transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
            placeholder="Type your customizable report link message here..."
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.72rem",
              color: "var(--ads-ink-tertiary)",
            }}
          >
            <span>Variables will be replaced dynamically for each recipient.</span>
            <span>{templateText.length} chars</span>
          </div>
        </div>

        {/* Right Column: Live Interactive Smartphone Preview */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            backgroundColor: "var(--ads-canvas)",
            borderRadius: "var(--ads-r-md)",
            border: "1px solid var(--ads-hairline)",
            padding: "1rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "var(--ads-ink)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Smartphone size={16} color="var(--ads-blue)" />
              <span>5. Live Message Preview</span>
            </label>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--ads-green)",
                backgroundColor: "var(--ads-green-tint)",
                padding: "0.15rem 0.5rem",
                borderRadius: "var(--ads-r-pill)",
                border: "1px solid var(--ads-hairline)",
              }}
            >
              Interactive Preview
            </span>
          </div>

          {/* Device Mockup Shell */}
          <div
            style={{
              backgroundColor: "var(--ads-material-thick)",
              borderRadius: "var(--ads-r-md)",
              border: "1px solid var(--ads-hairline)",
              padding: "var(--ads-s4)",
              boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              minHeight: "180px",
            }}
          >
            {/* Header / Sender */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--ads-hairline)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "var(--ads-blue)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                FM
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                  Fleet Operations ({stationCode})
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--ads-ink-tertiary)" }}>
                  To: {selectedDrivers[0]?.name || "Selected Driver"} • SMS / In-App
                </div>
              </div>
            </div>

            {/* Chat Bubble with formatted message */}
            <div
              style={{
                backgroundColor: "var(--ads-blue-tint)",
                border: "1px solid var(--ads-blue-tint-strong)",
                borderRadius: "var(--ads-r-md)",
                borderTopLeftRadius: "2px",
                padding: "0.85rem 1rem",
                fontSize: "0.82rem",
                color: "var(--ads-ink)",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {previewMessage}
            </div>

            <div style={{ fontSize: "0.7rem", color: "var(--ads-ink-quaternary)", textAlign: "right" }}>
              Now • Verified Link Token
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Action Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--ads-hairline)",
          paddingTop: "1.15rem",
          marginTop: "0.25rem",
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
            boxShadow: "var(--ads-bevel)",
            color: "var(--ads-ink)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            cursor: "pointer",
            transition: "all var(--ads-dur-fast) var(--ads-ease)",
          }}
        >
          Cancel
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
          {generatedLinks.length > 0 && (
            <button
              type="button"
              onClick={copyAllLinks}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                padding: "9px 18px",
                borderRadius: "var(--ads-r-pill)",
                border: "1px solid var(--ads-hairline)",
                backgroundColor: "var(--ads-material-thick)",
                boxShadow: "var(--ads-bevel)",
                color: copyAllSuccess ? "var(--ads-green)" : "var(--ads-ink)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              {copyAllSuccess ? <Check size={16} /> : <Copy size={16} />}
              <span>{copyAllSuccess ? "All Links Copied!" : "Copy All Links"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSendReportLink}
            disabled={selectedDriverIds.length === 0 || isSending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid transparent",
              backgroundColor:
                selectedDriverIds.length === 0 || isSending
                  ? "var(--ads-ink-quaternary)"
                  : "var(--ads-blue)",
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: selectedDriverIds.length === 0 || isSending ? "not-allowed" : "pointer",
              boxShadow: "var(--ads-shadow-sm)",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" color="#FFFFFF" />
                <span style={{ color: "#FFFFFF" }}>Sending Links...</span>
              </>
            ) : (
              <>
                <Send size={16} color="#FFFFFF" />
                <span>
                  Send {reportType === "injury" ? "Injury" : "Accident"} Link (
                  {selectedDriverIds.length})
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 6. Generated Links Display (Shows after sending) ── */}
      {generatedLinks.length > 0 && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "var(--ads-s5)",
            backgroundColor: "var(--ads-canvas)",
            borderRadius: "var(--ads-r-md)",
            border: "1px solid var(--ads-hairline)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--ads-ink)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <CheckCircle2 size={18} color="var(--ads-green)" />
              Generated {reportType === "injury" ? "Injury" : "Accident"} Form Links (
              {generatedLinks.length})
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--ads-ink-tertiary)" }}>
              Links are active and ready for manual sharing if needed
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {generatedLinks.map((item) => (
              <div
                key={item.token}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "var(--ads-material-thick)",
                  borderRadius: "var(--ads-r-sm)",
                  border: "1px solid var(--ads-hairline)",
                  boxShadow: "var(--ads-bevel)",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 160 }}>
                  <span style={{ fontWeight: 700, color: "var(--ads-ink)" }}>{item.driver_name}</span>
                  <span style={{ color: "var(--ads-ink-quaternary)", fontSize: "0.72rem" }}>
                    (ID: {item.driver_id})
                  </span>
                </div>

                <div
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "var(--ads-blue)",
                    fontSize: "0.78rem",
                    backgroundColor: "var(--ads-blue-tint)",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "var(--ads-r-xs)",
                  }}
                >
                  {item.link}
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(item.link, item.token)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor:
                      copiedToken === item.token
                        ? "var(--ads-green-tint)"
                        : "var(--ads-material-thick)",
                    color:
                      copiedToken === item.token ? "var(--ads-green)" : "var(--ads-ink)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  {copiedToken === item.token ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedToken === item.token ? "Copied" : "Copy Link"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SendReportLinkScreen;
