import React, { FC, useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Menu,
  Bell,
  HelpCircle,
  Building,
  ChevronDown,
  Check,
  Loader2,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useLayoutStore } from "../../store/layoutStore";

export interface SidebarTopHeaderProps {
  activeBreadcrumb?: {
    section?: string;
    page?: string;
    subPage?: string;
    detail?: string;
  };
}

export const SidebarTopHeader: FC<SidebarTopHeaderProps> = ({ activeBreadcrumb }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const user = useAuthStore((state) => state.user);
  const stations = useAuthStore((state) => state.stations);
  const allStations = useAuthStore((state) => state.allStations);
  const switchStation = useAuthStore((state) => state.switchStation);
  const switchingStationId = useAuthStore((state) => state.switchingStationId);

  const setMobileSidebarOpen = useLayoutStore((state) => state.setMobileSidebarOpen);

  // Dropdown states
  const [stationPopoverOpen, setStationPopoverOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [stationSearchQuery, setStationSearchQuery] = useState("");

  // Refs for outside click
  const stationRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadNotifCount = useNotificationStore((state) => (state as any).unreadCount ?? 0);

  // Auto-close on click outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (stationRef.current && !stationRef.current.contains(target)) {
        setStationPopoverOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  const activeStationObj = stations?.find((s) => s.current) || stations?.[0];
  const activeStation =
    activeStationObj?.station_code ||
    user?.station_code ||
    user?.company?.station_code ||
    "QUE4";

  const isStationInactive =
    (activeStationObj as any)?.status !== undefined &&
    (activeStationObj as any)?.status !== null &&
    !Boolean((activeStationObj as any).status);

  // Combine stations
  const availableStations = useMemo(() => {
    const map = new Map<string, any>();
    (stations || []).forEach((st) => {
      if (st.station_code) map.set(st.station_code, { ...st });
    });
    (allStations || []).forEach((st) => {
      if (st.station_code && !map.has(st.station_code)) {
        map.set(st.station_code, { ...st });
      }
    });
    return Array.from(map.values());
  }, [stations, allStations]);

  // Filter stations based on search query in popover
  const filteredStations = useMemo(() => {
    if (!stationSearchQuery.trim()) return availableStations;
    const q = stationSearchQuery.toLowerCase().trim();
    return availableStations.filter(
      (st) =>
        (st.station_code || "").toLowerCase().includes(q) ||
        (st.company_name || "").toLowerCase().includes(q) ||
        (st.name || "").toLowerCase().includes(q)
    );
  }, [availableStations, stationSearchQuery]);

  // Dynamic Breadcrumb Calculation
  const breadcrumb = useMemo(() => {
    const p = location.pathname.toLowerCase();
    const search = location.search.toLowerCase();
    const tab = searchParams.get("tab") || "";
    const report = searchParams.get("report") || "";
    const category = searchParams.get("category") || searchParams.get("section") || "";
    const channel = searchParams.get("channel") || "sms";

    // Guaranteed dynamic routing for Accident and Injury Reports
    if (p.includes("/accident_injury") || p.includes("/fleet/incidents")) {
      return {
        section: "Utilities",
        page: tab === "injury" ? "Injury Reports" : "Accident Reports",
      };
    }

    // If activeBreadcrumb prop passed from GlassAppLayout, use it as baseline
    if (activeBreadcrumb && (activeBreadcrumb.section || activeBreadcrumb.page)) {
      return {
        section: activeBreadcrumb.section || "Main Dashboard",
        page: activeBreadcrumb.page || "Overview",
        subPage: activeBreadcrumb.subPage,
        detail: activeBreadcrumb.detail,
      };
    }

    if (p === "/dashboard" || p === "/") {
      return { section: "Main Dashboard", page: "Dashboard" };
    }
    if (p.includes("/vehicles/add")) {
      return { section: "Main Dashboard", page: "Vehicles", subPage: "Add Vehicle" };
    }
    if (p.includes("/vehicles/edit")) {
      return { section: "Main Dashboard", page: "Vehicles", subPage: "Edit Vehicle" };
    }
    if (p.includes("/vehicles")) {
      return { section: "Main Dashboard", page: "Vehicles" };
    }
    if (p.includes("/drivers") || (p.includes("/operations") && !search.includes("tab="))) {
      return { section: "Main Dashboard", page: "Drivers" };
    }
    if (p.includes("/chats")) {
      const channelLabel =
        channel === "payroll"
          ? "Payroll Chat"
          : channel === "dsp"
          ? "DSP Chat"
          : channel === "direct"
          ? "Direct Chat"
          : channel === "secondary_sms"
          ? "Secondary SMS"
          : "SMS Chat";
      return { section: "Communications", page: "Chats", subPage: channelLabel };
    }
    if (p.includes("/curations")) {
      return { section: "Communications", page: "Calls" };
    }
    if (p.includes("/fleet/driver-inspection") || p.includes("/fleet/assignments")) {
      return { section: "Inspections", page: "Driver Inspection" };
    }
    if (p.includes("/fleet/vehicle-inspection")) {
      return { section: "Inspections", page: "Vehicle Inspection" };
    }
    if (p.includes("/fleet/caution")) {
      return { section: "Inspections", page: "Caution Form" };
    }
    if (p.includes("/fleet/reports")) {
      return { section: "Inspections", page: "Inspection Reports" };
    }
    if (p.includes("/performance/upload")) {
      const catLabel =
        category === "weekly"
          ? "Weekly Reports"
          : category === "roster" || category === "weekly_roster"
          ? "Weekly Roster"
          : category === "bulk"
          ? "Bulk Uploads"
          : "Daily Reports";
      return { section: "Reports", page: "Upload Reports", subPage: catLabel };
    }
    if (p.includes("/performance/reports") || p === "/performance") {
      return { section: "Reports", page: "See Reports Data" };
    }
    if (p.includes("/performance/e-signature")) {
      return { section: "Utilities", page: "E-signature" };
    }
    if (p.includes("/scheduler")) {
      return { section: "Schedule", page: "Schedule" };
    }
    if (p.includes("/callout") || (p.includes("/operations") && search.includes("tab=callout"))) {
      return { section: "Utilities", page: "Callouts" };
    }
    if (p.includes("/rescue") || (p.includes("/operations") && search.includes("tab=rescue"))) {
      return { section: "Utilities", page: "Rescue" };
    }
    if (p.includes("/cloud")) {
      return { section: "Utilities", page: "LMD Cloud" };
    }
    if (p.includes("/inventory")) {
      return { section: "Utilities", page: "Inventory" };
    }
    if (p.includes("/notes") || (p.includes("/operations") && search.includes("tab=notes"))) {
      return { section: "Utilities", page: "Driver Notes" };
    }
    if (p.includes("/tasks") || (p.includes("/operations") && search.includes("tab=tasks"))) {
      return { section: "Utilities", page: "Tasks" };
    }
    if (p.includes("/profile")) {
      return { section: "Account", page: "Profile & Company" };
    }
    if (p.includes("/settings")) {
      let cat = "Operations";
      let pageTitle = "Admins";

      if (tab === "app_layout") {
        cat = "Preferences";
        pageTitle = "App Layout";
      } else if (tab === "lmd_drive_access") {
        cat = "Operations";
        pageTitle = "LMD Drive APP Access";
      } else if (tab === "roles") {
        cat = "Operations";
        pageTitle = "Role Management";
      } else if (tab === "password") {
        cat = "Operations";
        pageTitle = "Change Password";
      } else if (tab === "thresholds") {
        cat = "Performance";
        pageTitle = report ? `Set Threshold • ${report.replace(/_/g, " ")}` : "Set Threshold";
      } else if (tab === "email_reporting") {
        cat = "Performance";
        pageTitle = report === "scorecard_email" ? "Email Reporting • Performance" : "Email Reporting • Netradyne";
      } else if (tab === "driver_rating") {
        cat = "Performance";
        pageTitle = "Driver Rating";
      } else if (tab === "e_signature") {
        cat = "Performance";
        pageTitle = "E-signature";
      } else if (tab === "in_app_chat") {
        cat = "Communications";
        pageTitle = "In-App Chat Access";
      } else if (tab === "reminders") {
        cat = "Communications";
        pageTitle = "Reminders";
      } else if (tab === "shift_rules") {
        cat = "Scheduler";
        pageTitle = "Shift Rules";
      } else if (tab === "scheduler_format") {
        cat = "Scheduler";
        pageTitle = "Dashboard & Format";
      } else if (tab === "vehicle_mgmt") {
        cat = "Fleet";
        pageTitle = "Vehicle Management";
      } else if (tab === "service_mgmt") {
        cat = "Fleet";
        pageTitle = "Schedule Service Management";
      }

      return { section: "Settings", page: cat, subPage: pageTitle };
    }
    if (p.includes("/notifications")) {
      return { section: "System", page: "Notification Center" };
    }
    if (p.includes("/help-and-support") || p.includes("/helpandsupport")) {
      return { section: "Help Center", page: "Support & Documentation" };
    }

    return { section: "Network Overview", page: "Operations Portal" };
  }, [location.pathname, location.search, activeBreadcrumb, searchParams]);

  const handleStationSwitch = async (station: any) => {
    if (station.station_code === activeStation) {
      setStationPopoverOpen(false);
      return;
    }
    const targetId = station.company_id || station.id || station.station_id;
    if (!targetId) return;

    try {
      await switchStation(targetId);
      setStationPopoverOpen(false);
      window.location.reload();
    } catch {
      // Handled in store
    }
  };

  return (
    <header className="sidebar-top-header-floating-card">
      {/* Left Side: Mobile Menu + Screen Heading / Breadcrumbs in Top Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
        {/* Mobile hamburger button */}
        <button
          type="button"
          className="sidebar-mobile-hamburger-btn"
          onClick={() => setMobileSidebarOpen(true)}
          title="Open navigation menu"
          aria-label="Open navigation menu"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--ads-ink-secondary)",
            cursor: "pointer",
            padding: "0.4rem",
            borderRadius: "var(--ads-r-sm)",
            display: "none", // Visible on mobile via CSS
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={20} />
        </button>

        {/* Dynamic Screen Heading / Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            fontSize: "0.86rem",
            fontFamily: "var(--font-sans)",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span style={{ color: "var(--ads-ink-tertiary)", fontWeight: 550, whiteSpace: "nowrap" }}>
            {breadcrumb.section}
          </span>
          {breadcrumb.page && (
            <>
              <ChevronRight size={13} style={{ color: "var(--ads-ink-quaternary)", flexShrink: 0 }} />
              <span
                style={{
                  color: breadcrumb.subPage ? "var(--ads-ink-tertiary)" : "var(--ads-ink)",
                  fontWeight: breadcrumb.subPage ? 550 : 750,
                  whiteSpace: "nowrap",
                }}
              >
                {breadcrumb.page}
              </span>
            </>
          )}
          {breadcrumb.subPage && (
            <>
              <ChevronRight size={13} style={{ color: "var(--ads-ink-quaternary)", flexShrink: 0 }} />
              <span
                style={{
                  color: breadcrumb.detail ? "var(--ads-ink-tertiary)" : "var(--ads-ink)",
                  fontWeight: breadcrumb.detail ? 550 : 750,
                  whiteSpace: "nowrap",
                }}
              >
                {breadcrumb.subPage}
              </span>
            </>
          )}
          {breadcrumb.detail && (
            <>
              <ChevronRight size={13} style={{ color: "var(--ads-ink-quaternary)", flexShrink: 0 }} />
              <span
                style={{
                  color: "var(--ads-blue)",
                  fontWeight: 750,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {breadcrumb.detail}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right Side: Station Switcher + Notifications + Help (No Search, No Profile Avatar) */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        {/* 1. Redesigned Premium Station Switcher */}
        <div style={{ position: "relative" }} ref={stationRef}>
          <button
            type="button"
            onClick={() => {
              setStationPopoverOpen(!stationPopoverOpen);
              setNotifDropdownOpen(false);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              padding: "0.38rem 0.85rem",
              borderRadius: "var(--ads-r-sm)",
              background: stationPopoverOpen ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
              backdropFilter: "var(--ads-blur-sm)",
              WebkitBackdropFilter: "var(--ads-blur-sm)",
              border: stationPopoverOpen ? "1px solid var(--ads-blue-tint-strong)" : "1px solid var(--ads-hairline)",
              color: "var(--ads-ink)",
              cursor: "pointer",
              transition:
                "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
              boxShadow: "var(--ads-bevel)",
            }}
            title={`Active Delivery Station: ${activeStation}`}
            aria-label={`Switch delivery station, currently ${activeStation}`}
            aria-expanded={stationPopoverOpen}
            aria-haspopup="menu"
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "var(--ads-r-xs)",
                backgroundColor: "var(--ads-blue-tint)",
                border: "1px solid var(--ads-blue-tint-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ads-blue)",
                flexShrink: 0,
              }}
            >
              <Building size={13} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "var(--ads-ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Station
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 750, color: "var(--ads-ink)" }}>
                {activeStation}
              </span>
            </div>
            <span
              style={{
                width: "6.5px",
                height: "6.5px",
                borderRadius: "50%",
                backgroundColor: isStationInactive ? "var(--ads-red)" : "var(--ads-green)",
                flexShrink: 0,
                marginLeft: "2px",
              }}
            />
            <ChevronDown
              size={13}
              style={{
                color: "var(--ads-ink-tertiary)",
                transform: stationPopoverOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.18s ease",
              }}
            />
          </button>

          {/* Station Dropdown Popover */}
          {stationPopoverOpen && (
            <div
              role="menu"
              aria-label="Delivery stations"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                background: "var(--ads-material-thick)",
                backdropFilter: "var(--ads-blur-lg)",
                WebkitBackdropFilter: "var(--ads-blur-lg)",
                borderRadius: "var(--ads-r-xl)",
                boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
                border: "1px solid var(--ads-hairline)",
                width: "280px",
                maxWidth: "calc(100vw - 32px)",
                zIndex: 10060,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: "ads-sheet-in var(--ads-dur) var(--ads-ease)",
              }}
            >
              {/* Popover Header */}
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                }}
              >
                <span style={{ fontSize: "0.8125rem", fontWeight: 750, color: "var(--ads-ink)" }}>
                  Delivery Stations
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 650,
                    color: "var(--ads-blue)",
                    backgroundColor: "var(--ads-blue-tint)",
                    border: "1px solid var(--ads-blue-tint-strong)",
                    padding: "0.12rem 0.5rem",
                    borderRadius: "var(--ads-r-pill)",
                  }}
                >
                  {availableStations.length} available
                </span>
              </div>

              {/* Popover Search Box */}
              {availableStations.length > 2 && (
                <div style={{ padding: "0.55rem 0.85rem", borderBottom: "1px solid rgba(0, 0, 0, 0.05)" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                      border: "1px solid var(--ads-hairline)",
                      borderRadius: "var(--ads-r-sm)",
                      padding: "0.3rem 0.6rem",
                    }}
                  >
                    <Search size={13} style={{ color: "var(--ads-ink-quaternary)" }} />
                    <input
                      type="text"
                      placeholder="Search station..."
                      value={stationSearchQuery}
                      onChange={(e) => setStationSearchQuery(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: "0.78rem",
                        color: "var(--ads-ink)",
                        width: "100%",
                        fontFamily: "inherit",
                      }}
                    />
                    {stationSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStationSearchQuery("")}
                        title="Clear station search"
                        aria-label="Clear station search"
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          color: "var(--ads-ink-quaternary)",
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Station List */}
              <div style={{ maxHeight: "230px", overflowY: "auto", padding: "0.35rem 0.45rem" }}>
                {filteredStations.length === 0 ? (
                  <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--ads-ink-tertiary)", fontSize: "0.8rem" }}>
                    No stations match "{stationSearchQuery}"
                  </div>
                ) : (
                  filteredStations.map((st) => {
                    const isSelected = st.station_code === activeStation;
                    const isCurrentLoading = switchingStationId === (st.company_id || st.id || st.station_id);

                    return (
                      <button
                        key={st.station_code}
                        type="button"
                        onClick={() => handleStationSwitch(st)}
                        role="menuitemradio"
                        aria-checked={isSelected}
                        aria-label={`Switch to station ${st.station_code}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "0.5rem 0.65rem",
                          borderRadius: "var(--ads-r-sm)",
                          border: isSelected ? "1px solid var(--ads-blue-tint-strong)" : "1px solid transparent",
                          backgroundColor: isSelected ? "var(--ads-blue-tint)" : "transparent",
                          color: isSelected ? "var(--ads-blue)" : "var(--ads-ink-secondary)",
                          cursor: "pointer",
                          transition:
                            "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "var(--ads-r-xs)",
                              backgroundColor: isSelected ? "var(--ads-blue-tint-strong)" : "rgba(0, 0, 0, 0.05)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isSelected ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                            }}
                          >
                            <Building size={14} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: isSelected ? 750 : 600 }}>
                              {st.station_code}
                            </span>
                            <span style={{ fontSize: "0.68rem", color: "var(--ads-ink-tertiary)" }}>
                              {st.company_name || st.name || (isSelected ? "Current station" : "Delivery station")}
                            </span>
                          </div>
                        </div>

                        {isCurrentLoading ? (
                          <Loader2 size={14} className="spin-animation" style={{ color: "var(--ads-blue)" }} />
                        ) : isSelected ? (
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              backgroundColor: "var(--ads-blue)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FFFFFF",
                            }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Popover Footer */}
              <div
                style={{
                  padding: "0.5rem 1rem",
                  borderTop: "1px solid rgba(0, 0, 0, 0.05)",
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.72rem",
                  color: "var(--ads-ink-tertiary)",
                }}
              >
                <span>
                  Active: <strong>{activeStation}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--ads-green)", fontWeight: 650 }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--ads-green)" }} />
                  Connected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Notifications Bell */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setStationPopoverOpen(false);
            }}
            className="sidebar-icon-btn"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--ads-r-pill)",
              backgroundColor: notifDropdownOpen ? "var(--ads-blue-tint)" : "rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--ads-hairline)",
              color: notifDropdownOpen ? "var(--ads-blue)" : "var(--ads-ink-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
            title="Notifications"
            aria-label={
              unreadNotifCount > 0
                ? `Notifications, ${unreadNotifCount} unread`
                : "Notifications"
            }
            aria-expanded={notifDropdownOpen}
            aria-haspopup="menu"
            onMouseEnter={(e) => {
              if (!notifDropdownOpen) e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
            }}
            onMouseLeave={(e) => {
              if (!notifDropdownOpen) e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
            }}
          >
            <Bell size={16} />
            {unreadNotifCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  backgroundColor: "var(--ads-red)",
                  color: "#FFFFFF",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  borderRadius: "var(--ads-r-pill)",
                  padding: "0.08rem 0.32rem",
                  border: "2px solid #FFFFFF",
                }}
              >
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Notification Popover */}
          {notifDropdownOpen && (
            <div
              role="menu"
              aria-label="Notifications"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                background: "var(--ads-material-thick)",
                backdropFilter: "var(--ads-blur-lg)",
                WebkitBackdropFilter: "var(--ads-blur-lg)",
                borderRadius: "var(--ads-r-xl)",
                boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
                border: "1px solid var(--ads-hairline)",
                width: "320px",
                maxWidth: "calc(100vw - 32px)",
                zIndex: 10060,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "var(--font-sans)",
                animation: "ads-sheet-in var(--ads-dur) var(--ads-ease)",
              }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                  Notifications
                </span>
                {unreadNotifCount > 0 && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--ads-blue)",
                      backgroundColor: "var(--ads-blue-tint)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "var(--ads-r-pill)",
                      fontWeight: 600,
                    }}
                  >
                    {unreadNotifCount} new
                  </span>
                )}
              </div>

              <div style={{ maxHeight: "280px", overflowY: "auto", padding: "0.35rem 0" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                    <Bell size={24} style={{ margin: "0 auto 0.5rem", color: "var(--ads-hairline-strong)" }} />
                    <p style={{ margin: 0, fontSize: "0.82rem" }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: "0.6rem 1rem",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                        fontSize: "0.8rem",
                        color: "var(--ads-ink-secondary)",
                      }}
                    >
                      <p style={{ margin: "0 0 0.2rem", fontWeight: 550 }}>
                        {notif.message || notif.title || "Notification"}
                      </p>
                      <span style={{ fontSize: "0.72rem", color: "var(--ads-ink-quaternary)" }}>
                        {notif.timestamp || "Recent"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: "0.5rem 1rem",
                  borderTop: "1px solid rgba(0, 0, 0, 0.05)",
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  textAlign: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setNotifDropdownOpen(false);
                    navigate("/notifications");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--ads-blue)",
                    fontSize: "0.78rem",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  See all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Help & Support Button */}
        <button
          type="button"
          onClick={() => navigate("/help-and-support")}
          className="sidebar-icon-btn"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--ads-r-pill)",
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            border: "1px solid var(--ads-hairline)",
            color: "var(--ads-ink-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Help and Support"
          aria-label="Help and support"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)";
            e.currentTarget.style.color = "var(--ads-blue)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
            e.currentTarget.style.color = "var(--ads-ink-secondary)";
          }}
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};

export default SidebarTopHeader;
