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
          style={{
            background: "transparent",
            border: "none",
            color: "#475569",
            cursor: "pointer",
            padding: "0.4rem",
            borderRadius: "8px",
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
          <span style={{ color: "#64748B", fontWeight: 550, whiteSpace: "nowrap" }}>
            {breadcrumb.section}
          </span>
          {breadcrumb.page && (
            <>
              <ChevronRight size={13} style={{ color: "#94A3B8", flexShrink: 0 }} />
              <span
                style={{
                  color: breadcrumb.subPage ? "#64748B" : "#0F172A",
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
              <ChevronRight size={13} style={{ color: "#94A3B8", flexShrink: 0 }} />
              <span
                style={{
                  color: breadcrumb.detail ? "#64748B" : "#0F172A",
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
              <ChevronRight size={13} style={{ color: "#94A3B8", flexShrink: 0 }} />
              <span
                style={{
                  color: "#2563EB",
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
              borderRadius: "10px",
              backgroundColor: stationPopoverOpen ? "#EFF6FF" : "#FFFFFF",
              border: stationPopoverOpen ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
              color: "#0F172A",
              cursor: "pointer",
              transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
            }}
            title={`Active Delivery Station: ${activeStation}`}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                backgroundColor: "#EFF6FF",
                border: "1px solid #DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
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
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Station
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 750, color: "#0F172A" }}>
                {activeStation}
              </span>
            </div>
            <span
              style={{
                width: "6.5px",
                height: "6.5px",
                borderRadius: "50%",
                backgroundColor: isStationInactive ? "#EF4444" : "#10B981",
                flexShrink: 0,
                marginLeft: "2px",
              }}
            />
            <ChevronDown
              size={13}
              style={{
                color: "#64748B",
                transform: stationPopoverOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.18s ease",
              }}
            />
          </button>

          {/* Station Dropdown Popover */}
          {stationPopoverOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                boxShadow: "0 16px 40px -6px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.06)",
                border: "1px solid #E2E8F0",
                width: "280px",
                zIndex: 10060,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: "appleMenuScale 0.18s cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              {/* Popover Header */}
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FAFAFA",
                }}
              >
                <span style={{ fontSize: "0.8125rem", fontWeight: 750, color: "#0F172A" }}>
                  Delivery Stations
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 650,
                    color: "#2563EB",
                    backgroundColor: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    padding: "0.12rem 0.5rem",
                    borderRadius: "9999px",
                  }}
                >
                  {availableStations.length} available
                </span>
              </div>

              {/* Popover Search Box */}
              {availableStations.length > 2 && (
                <div style={{ padding: "0.55rem 0.85rem", borderBottom: "1px solid #F1F5F9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "0.3rem 0.6rem",
                    }}
                  >
                    <Search size={13} style={{ color: "#94A3B8" }} />
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
                        color: "#0F172A",
                        width: "100%",
                        fontFamily: "inherit",
                      }}
                    />
                    {stationSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStationSearchQuery("")}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          color: "#94A3B8",
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
                  <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: "#64748B", fontSize: "0.8rem" }}>
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "0.5rem 0.65rem",
                          borderRadius: "10px",
                          border: isSelected ? "1px solid #BFDBFE" : "1px solid transparent",
                          backgroundColor: isSelected ? "#EFF6FF" : "transparent",
                          color: isSelected ? "#1D4ED8" : "#334155",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "#F8FAFC";
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
                              borderRadius: "7px",
                              backgroundColor: isSelected ? "#DBEAFE" : "#F1F5F9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isSelected ? "#2563EB" : "#64748B",
                            }}
                          >
                            <Building size={14} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: isSelected ? 750 : 600 }}>
                              {st.station_code}
                            </span>
                            <span style={{ fontSize: "0.68rem", color: "#64748B" }}>
                              {st.company_name || st.name || (isSelected ? "Current station" : "Delivery station")}
                            </span>
                          </div>
                        </div>

                        {isCurrentLoading ? (
                          <Loader2 size={14} className="spin-animation" style={{ color: "#2563EB" }} />
                        ) : isSelected ? (
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              backgroundColor: "#2563EB",
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
                  borderTop: "1px solid #F1F5F9",
                  backgroundColor: "#FAFAFA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.72rem",
                  color: "#64748B",
                }}
              >
                <span>
                  Active: <strong>{activeStation}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#059669", fontWeight: 650 }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#10B981" }} />
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
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: notifDropdownOpen ? "#EFF6FF" : "#F8FAFC",
              border: "1px solid #E2E8F0",
              color: notifDropdownOpen ? "#2563EB" : "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "all 0.15s ease",
            }}
            title="Notifications"
            onMouseEnter={(e) => {
              if (!notifDropdownOpen) e.currentTarget.style.backgroundColor = "#F1F5F9";
            }}
            onMouseLeave={(e) => {
              if (!notifDropdownOpen) e.currentTarget.style.backgroundColor = "#F8FAFC";
            }}
          >
            <Bell size={16} />
            {unreadNotifCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  borderRadius: "9999px",
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
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                boxShadow: "0 14px 35px -5px rgba(0, 0, 0, 0.18), 0 8px 16px -6px rgba(0, 0, 0, 0.1)",
                border: "1px solid #CBD5E1",
                width: "320px",
                zIndex: 10060,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "var(--font-sans)",
              }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>
                  Notifications
                </span>
                {unreadNotifCount > 0 && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "#2563EB",
                      backgroundColor: "#EFF6FF",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "9999px",
                      fontWeight: 600,
                    }}
                  >
                    {unreadNotifCount} new
                  </span>
                )}
              </div>

              <div style={{ maxHeight: "280px", overflowY: "auto", padding: "0.35rem 0" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#64748B" }}>
                    <Bell size={24} style={{ margin: "0 auto 0.5rem", color: "#CBD5E1" }} />
                    <p style={{ margin: 0, fontSize: "0.82rem" }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: "0.6rem 1rem",
                        borderBottom: "1px solid #F8FAFC",
                        fontSize: "0.8rem",
                        color: "#334155",
                      }}
                    >
                      <p style={{ margin: "0 0 0.2rem", fontWeight: 550 }}>
                        {notif.message || notif.title || "Notification"}
                      </p>
                      <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                        {notif.timestamp || "Recent"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: "0.5rem 1rem",
                  borderTop: "1px solid #F1F5F9",
                  backgroundColor: "#F8FAFC",
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
                    color: "#2563EB",
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
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            color: "#475569",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          title="Help and Support"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#EFF6FF";
            e.currentTarget.style.color = "#2563EB";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#F8FAFC";
            e.currentTarget.style.color = "#475569";
          }}
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};

export default SidebarTopHeader;
