import React, { FC, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Truck,
  CalendarDays,
  Users,
  ShieldAlert,
  Package,
  Cloud,
  LogOut,
  Building,
  ChevronDown,
  Check,
  User,
  Bell,
  Settings,
  MoreHorizontal,
  PhoneCall,
  LifeBuoy,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  UploadCloud,
  LayoutTemplate,
  Sliders,
  Loader2,
  Clock,
  AlertCircle,
  HelpCircle,
  ClipboardList,
  FileCheck,
  Menu,
  X,
  Layout,
} from "lucide-react";
import { LayoutSwitcherModal } from "./LayoutSwitcherModal";
import Logo from "../../assets/Logo";
import { NavDropdown } from "./NavDropdown";
import { useAuthStore } from "../../store/authStore";
import { useDriverStore } from "../../store/driverStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useCurationStore } from "../../store/curationStore";
import AuthAPI from "../../api/auth";
import { getAvatarColor, getInitials } from "../../utils/avatarUtils";
import "./glass-layout.css";

export type NavRouteType =
  | "dashboard"
  | "chats"
  | "performance"
  | "reports"
  | "fleet"
  | "scheduler"
  | "operations"
  | "drivers"
  | "vehicles"
  | "admins"
  | "inventory"
  | "cloud"
  | "callout"
  | "rescue"
  | "curations"
  | "templates"
  | "upload_roster"
  | "notes"
  | "tasks"
  | "bulk_upload"
  | "accident_injury"
  | "profile"
  | "settings"
  | "help_and_support"
  | "notifications"
  | "e_signature";

interface AppNavbarProps {
  currentRoute?: NavRouteType;
  onNavigate?: (route: NavRouteType) => void;
  onLogout?: () => void;
}

export const AppNavbar: FC<AppNavbarProps> = ({
  currentRoute: propCurrentRoute,
  onNavigate,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const stations = useAuthStore((state) => state.stations);
  const allStations = useAuthStore((state) => state.allStations);
  const switchStation = useAuthStore((state) => state.switchStation);
  const switchingStationId = useAuthStore((state) => state.switchingStationId);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const logout = useAuthStore((state) => state.logout);

  // Auto-fetch profile once if stations are not yet loaded
  useEffect(() => {
    if ((stations || []).length === 0) {
      fetchProfile();
    }
  }, [stations, fetchProfile]);

  // Combine stations and allStations into a complete list of delivery stations
  const availableStations = React.useMemo(() => {
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

  // Multi-station state from driver store
  const selectedStationFilter = useDriverStore((state) => state.selectedStationFilter);
  const setSelectedStationFilter = useDriverStore((state) => state.setSelectedStationFilter);
  const drivers = useDriverStore((state) => state.drivers);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Dropdown states
  const [stationMenuOpen, setStationMenuOpen] = useState(false);
  const [seeMoreOpen, setSeeMoreOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState<string | null>(null);

  // Curation counts from curation store
  const curationCounts = useCurationStore((state) => state.counts);
  const fetchCurationCount = useCurationStore((state) => state.fetchCurationCount);

  // Refs for outside click handling
  const stationRef = useRef<HTMLDivElement>(null);
  const seeMoreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (stationRef.current && !stationRef.current.contains(target)) {
        setStationMenuOpen(false);
      }
      if (seeMoreRef.current && !seeMoreRef.current.contains(target)) {
        setSeeMoreOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine active route (handling query tabs for operations)
  const queryParams = new URLSearchParams(location.search);
  const activeTabParam = queryParams.get("tab") as NavRouteType | null;

  const currentRoute: NavRouteType =
    propCurrentRoute ||
    (location.pathname.includes("/fleet/incidents") || (location.pathname.startsWith("/fleet") && location.pathname.includes("incidents")) ? "accident_injury" : null) ||
    (location.pathname === "/callout" || location.pathname === "/operations/callout" ? "callout" : null) ||
    (location.pathname === "/rescue" || location.pathname === "/operations/rescue" ? "rescue" : null) ||
    (location.pathname === "/notes" || location.pathname === "/operations/notes" ? "notes" : null) ||
    (location.pathname === "/tasks" || location.pathname === "/operations/tasks" ? "tasks" : null) ||
    (location.pathname.includes("/performance/upload") && queryParams.get("report") === "weekly_roster_report" ? "upload_roster" : null) ||
    (location.pathname.includes("/performance/upload") && (queryParams.get("category") === "bulk" || ["drivers", "vehicles", "admins"].includes(queryParams.get("report") || "")) ? "bulk_upload" : null) ||
    (location.pathname.startsWith("/performance/e-signature") ? "e_signature" : null) ||
    (location.pathname.startsWith("/operations") && activeTabParam ? activeTabParam : null) ||
    (location.pathname.startsWith("/settings") && (!activeTabParam || activeTabParam === "admins") ? "admins" : null) ||
    (location.pathname.includes("help")
      ? "help_and_support"
      : location.pathname.includes("profile")
      ? "profile"
      : location.pathname.includes("settings")
      ? "settings"
      : location.pathname.includes("notifications")
      ? "notifications"
      : location.pathname.includes("chats")
      ? "chats"
      : location.pathname.includes("templates")
      ? "templates"
      : location.pathname.includes("curations")
      ? "curations"
      : location.pathname.includes("performance")
      ? "reports"
      : location.pathname.includes("fleet")
      ? "fleet"
      : location.pathname.includes("scheduler")
      ? "scheduler"
      : location.pathname.includes("dashboard")
      ? "dashboard"
      : location.pathname.includes("operations") || location.pathname.includes("drivers")
      ? "operations"
      : "dashboard");

  const handleNavigate = (route: NavRouteType) => {
    setSeeMoreOpen(false);
    setProfileMenuOpen(false);
    setStationMenuOpen(false);
    setActiveNavDropdown(null);

    if (onNavigate) {
      onNavigate(route);
      return;
    }

    switch (route) {
      case "dashboard":
        navigate("/dashboard");
        break;
      case "chats":
        navigate("/chats");
        break;
      case "reports":
      case "performance":
        navigate("/performance/reports");
        break;
      case "accident_injury":
        navigate("/fleet/incidents");
        break;
      case "fleet":
        navigate("/fleet");
        break;
      case "scheduler":
        navigate("/scheduler/shifts");
        break;
      case "operations":
      case "drivers":
        navigate("/operations");
        break;
      case "vehicles":
        navigate("/vehicles");
        break;
      case "admins":
        navigate("/settings?tab=admins");
        break;
      case "inventory":
        navigate("/operations?tab=inventory");
        break;
      case "callout":
        navigate("/operations?tab=callout");
        break;
      case "rescue":
        navigate("/operations?tab=rescue");
        break;
      case "tasks":
        navigate("/operations?tab=tasks");
        break;
      case "notes":
        navigate("/operations?tab=notes");
        break;
      case "upload_roster":
        navigate("/performance/upload?report=weekly_roster_report");
        break;
      case "bulk_upload":
        navigate("/performance/upload?report=drivers&category=bulk");
        break;
      case "templates":
        navigate("/templates");
        break;
      case "curations":
        navigate("/curations");
        break;
      case "cloud":
        navigate("/operations?tab=cloud");
        break;
      case "e_signature":
        navigate("/performance/e-signature");
        break;
      case "profile":
        navigate("/profile");
        break;
      case "settings":
        navigate("/settings");
        break;
      case "help_and_support":
        navigate("/helpandsupport");
        break;
      case "notifications":
        navigate("/notifications");
        break;
      default:
        navigate("/dashboard");
    }
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await AuthAPI.logOut();
    } catch {
      // ignore network errors on sign out
    } finally {
      logout();
      navigate("/", { replace: true });
    }
  };

  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const rawRole = user?.role || "owner";
  const role = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();


  // Real active station resolved from authStore
  const activeStationObj =
    availableStations.find((s) => s.current) ||
    stations.find((s) => s.current) ||
    availableStations[0] ||
    stations[0];
  const activeStation =
    activeStationObj?.station_code ||
    user?.station_code ||
    user?.company?.station_code ||
    "QUE2";

  // Check if current route operates at company ownership level (chats & templates)
  // On ownership-level pages, station switching is not required and is disabled.
  const isOnChatPage =
    currentRoute === "chats" ||
    location.pathname === "/chats" ||
    location.pathname.startsWith("/chats") ||
    location.pathname === "/chat" ||
    location.pathname.startsWith("/chat/");

  const isOnTemplatesPage =
    currentRoute === "templates" ||
    location.pathname === "/templates" ||
    location.pathname.startsWith("/templates");

  const isOnHelpPage =
    currentRoute === "help_and_support" ||
    location.pathname.startsWith("/help");

  const isOwnershipLevelRoute = isOnChatPage || isOnTemplatesPage || isOnHelpPage;

  // Check if the currently active station is marked inactive
  const isStationInactive = activeStationObj ? activeStationObj.active === false : false;

  // Fetch curation counts on mount and active station change
  useEffect(() => {
    fetchCurationCount(true);
  }, [fetchCurationCount]);

  // See More sub-sections categorized logically
  interface SeeMoreItem {
    id: NavRouteType;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
    badgeType?: "blue" | "emerald" | "amber" | "purple";
    color: string;
    bgColor: string;
    isCurrent: boolean;
  }

  interface SeeMoreSection {
    title: string;
    items: SeeMoreItem[];
  }

  interface SeeMoreColumn {
    id: string;
    sections: SeeMoreSection[];
  }

  const seeMoreColumns: SeeMoreColumn[] = [
    {
      id: "safety_operations",
      sections: [
        {
          title: "Safety & Incidents",
          items: [
            {
              id: "accident_injury",
              title: "Accident & Injury Report",
              subtitle: "Incident claims, accident logs & injury reporting",
              icon: ShieldAlert,
              color: "#DC2626",
              bgColor: "#FEF2F2",
              isCurrent: currentRoute === "accident_injury",
            },
          ],
        },
        {
          title: "Operations & Assets",
          items: [
            {
              id: "drivers",
              title: "Drivers",
              subtitle: "Roster, transporter IDs & onboarding",
              icon: Users,
              badge: "Active",
              badgeType: "emerald",
              color: "#059669",
              bgColor: "#ECFDF5",
              isCurrent: currentRoute === "operations" || currentRoute === "drivers",
            },
            {
              id: "vehicles",
              title: "Vehicles",
              subtitle: "Fleet vans, telematics & DVIC checks",
              icon: Truck,
              color: "#2563EB",
              bgColor: "#EFF6FF",
              isCurrent: currentRoute === "vehicles",
            },
            {
              id: "inventory",
              title: "Inventory",
              subtitle: "Delivery devices, fuel cards & gear",
              icon: Package,
              color: "#D97706",
              bgColor: "#FFFBEB",
              isCurrent: currentRoute === "inventory",
            },
          ],
        },
      ],
    },
    {
      id: "dispatch_productivity",
      sections: [
        {
          title: "Dispatch & Road",
          items: [
            {
              id: "callout",
              title: "Callout",
              subtitle: "Driver callouts & shift replacement",
              icon: PhoneCall,
              color: "#DC2626",
              bgColor: "#FEF2F2",
              isCurrent: currentRoute === "callout",
            },
            {
              id: "rescue",
              title: "Rescue",
              subtitle: "Live delivery rescues & package sweeps",
              icon: LifeBuoy,
              color: "#059669",
              bgColor: "#ECFDF5",
              isCurrent: currentRoute === "rescue",
            },
          ],
        },
        {
          title: "Productivity & Logs",
          items: [
            {
              id: "tasks",
              title: "Tasks",
              subtitle: "Station duties & daily checklist",
              icon: CheckSquare,
              color: "#2563EB",
              bgColor: "#EFF6FF",
              isCurrent: currentRoute === "tasks",
            },
            {
              id: "notes",
              title: "Notes",
              subtitle: "Dispatcher shift logs & handovers",
              icon: FileText,
              color: "#475569",
              bgColor: "#F1F5F9",
              isCurrent: currentRoute === "notes",
            },
            {
              id: "upload_roster",
              title: "Upload Roster Report",
              subtitle: "Amazon roster report & route file import",
              icon: FileSpreadsheet,
              color: "#0891B2",
              bgColor: "#ECFEFF",
              isCurrent: currentRoute === "upload_roster",
            },
            {
              id: "bulk_upload",
              title: "Bulk Upload",
              subtitle: "Batch import driver and fleet data",
              icon: UploadCloud,
              color: "#6366F1",
              bgColor: "#EEF2FF",
              isCurrent: currentRoute === "bulk_upload",
            },
          ],
        },
      ],
    },
    {
      id: "curations_cloud",
      sections: [
        {
          title: "Curations & Cloud",
          items: [
            {
              id: "templates",
              title: "Templates",
              subtitle: "Message templates & shift formats",
              icon: LayoutTemplate,
              color: "#7C3AED",
              bgColor: "#F5F3FF",
              isCurrent: currentRoute === "templates",
            },
            {
              id: "curations",
              title: "Curations",
              subtitle: "Driver data & transporter curations",
              icon: Sliders,
              badge: curationCounts.total > 0 ? `${curationCounts.total}` : undefined,
              badgeType: "amber",
              color: "#D97706",
              bgColor: "#FFFBEB",
              isCurrent: currentRoute === "curations",
            },
            {
              id: "cloud",
              title: "LMD Cloud",
              subtitle: "Multi-station cloud synchronization",
              icon: Cloud,
              badge: "Shared",
              badgeType: "blue",
              color: "#0284C7",
              bgColor: "#F0F9FF",
              isCurrent: currentRoute === "cloud",
            },
            {
              id: "e_signature",
              title: "E-Signature",
              subtitle: "Digital sign-off & acknowledgements",
              icon: FileCheck,
              color: "#2563EB",
              bgColor: "#EFF6FF",
              isCurrent: currentRoute === "e_signature",
            },
          ],
        },
      ],
    },
  ];

  const isSeeMoreActive =
    currentRoute === "operations" ||
    currentRoute === "drivers" ||
    currentRoute === "vehicles" ||
    currentRoute === "admins" ||
    currentRoute === "inventory" ||
    currentRoute === "cloud" ||
    currentRoute === "callout" ||
    currentRoute === "rescue" ||
    currentRoute === "tasks" ||
    currentRoute === "notes" ||
    currentRoute === "upload_roster" ||
    currentRoute === "bulk_upload" ||
    currentRoute === "templates" ||
    currentRoute === "curations" ||
    currentRoute === "e_signature" ||
    currentRoute === "accident_injury";

  return (
    <>
      <nav className="app-top-navbar">
        {/* 1. LEFT: Company Logo & Station Switcher (Remove all stations) */}
      <div className="navbar-left">
        <button
          type="button"
          onClick={() => handleNavigate("dashboard")}
          className="navbar-brand-btn"
          title="LMDmax Home"
        >
          <Logo variant="horizontal" width={135} height={34} />
        </button>

        {/* Station Switcher with real delivery stations from Queen account */}
        <div className="navbar-station-dropdown-container" ref={stationRef}>
          <button
            type="button"
            disabled={isOwnershipLevelRoute || switchingStationId !== null}
            className={`navbar-station-badge interactive ${
              isOwnershipLevelRoute ? "disabled" : ""
            }`}
            onClick={() => {
              if (isOwnershipLevelRoute) return;
              setStationMenuOpen(!stationMenuOpen);
            }}
            title={
              isOnChatPage
                ? "Station switching is not required on the Chat page. Chats operate at the company ownership level."
                : isOnTemplatesPage
                ? "Station switching is not required on the Templates page. Templates operate at the company ownership level."
                : `Active Station: ${activeStation} (${activeStationObj?.active ? "active" : "inactive"}) - Click to switch`
            }
          >
            <Building size={14} className="text-blue-600" />
            <span className="station-code-text">{activeStation}</span>
            {isStationInactive && (
              <span className="px-1 py-0.2 text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded leading-tight">
                Inactive
              </span>
            )}
            {switchingStationId ? (
              <Loader2 size={12} className="animate-spin text-blue-600" />
            ) : (
              <ChevronDown size={12} className="opacity-70" />
            )}
          </button>

          {!isOwnershipLevelRoute && stationMenuOpen && (
            <div className="navbar-station-popover">
              <div className="popover-header">
                <span>Switch Station</span>
                <span style={{ fontSize: "0.6875rem", color: "#2563EB", background: "#EFF6FF", padding: "0.1rem 0.45rem", borderRadius: "9999px" }}>
                  {availableStations.length} Stations
                </span>
              </div>
              {availableStations.length === 0 && (
                <div className="p-3 text-xs text-slate-500 text-center">
                  Loading stations...
                </div>
              )}
              {availableStations.map((st) => {
                const isSelected = st.current || activeStation === st.station_code;
                const companyId = st.company_id || (st as any).station_id || st.id;
                const isSwitchingThis = switchingStationId === companyId;

                return (
                  <button
                    key={companyId || st.station_code}
                    type="button"
                    disabled={switchingStationId !== null}
                    className={`popover-station-item ${isSelected ? "active" : ""}`}
                    onClick={async () => {
                      if (isSelected) {
                        setStationMenuOpen(false);
                        return;
                      }
                      if (companyId) {
                        await switchStation(companyId);
                      }
                      setStationMenuOpen(false);
                    }}
                  >
                    <div className="station-label-wrap">
                      <span className="station-code-title">{st.station_code}</span>
                      <span
                        className={`station-status-label ${
                          st.active !== false ? "active" : "inactive"
                        }`}
                      >
                        ({st.active !== false ? "active" : "inactive"})
                      </span>
                    </div>
                    <div className="flex items-center pl-2">
                      {isSwitchingThis ? (
                        <Loader2 size={16} className="animate-spin text-blue-600" />
                      ) : isSelected ? (
                        <div style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "#2563EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF"
                        }}>
                          <Check size={11} strokeWidth={3} />
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. CENTER: Dashboard, Chats, Performance, Fleet, Scheduler, See more (Dropdown) */}
      <div className="navbar-center">
        {/* Dashboard */}
        <button
          type="button"
          className={`navbar-tab-btn ${currentRoute === "dashboard" ? "active" : ""}`}
          onClick={() => handleNavigate("dashboard")}
          title="Unified Fleet & Operations Dashboard"
        >
          <LayoutDashboard size={14} />
          <span>Dashboard</span>
        </button>

        {/* Chats */}
        <button
          type="button"
          className={`navbar-tab-btn ${currentRoute === "chats" ? "active" : ""}`}
          onClick={() => handleNavigate("chats")}
          title="Twilio Two-Way Communications & Alerts"
        >
          <MessageSquare size={14} />
          <span>Chats</span>
        </button>

        {/* Reports Dropdown */}
        <NavDropdown
          label="Reports"
          icon={FileSpreadsheet}
          basePath="/performance"
          title="Upload Operational Reports & View Analytics Data"
          isOpen={activeNavDropdown === "reports" || activeNavDropdown === "performance"}
          onToggle={(open) => {
            setActiveNavDropdown(open ? "reports" : null);
            if (open) setSeeMoreOpen(false);
          }}
          items={[
            {
              label: "Upload Reports",
              path: "/performance/upload",
              icon: UploadCloud,
              color: "#2563EB",
              bgColor: "#EFF6FF",
            },
            {
              label: "See Reports Data",
              path: "/performance/reports",
              icon: BarChart3,
              color: "#059669",
              bgColor: "#ECFDF5",
            },
          ]}
        />

        {/* Fleet Dropdown */}
        <NavDropdown
          label="Fleet"
          icon={Truck}
          basePath="/fleet"
          title="Vehicle Assignments, Inspections & Fleet Reports"
          isOpen={activeNavDropdown === "fleet"}
          onToggle={(open) => {
            setActiveNavDropdown(open ? "fleet" : null);
            if (open) setSeeMoreOpen(false);
          }}
          items={[
            {
              label: "Driver Inspection",
              path: "/fleet/driver-inspection",
              icon: Truck,
              color: "#2563EB",
              bgColor: "#EFF6FF",
            },
            {
              label: "Inspection Question Form",
              path: "/fleet/caution",
              icon: ClipboardList,
              color: "#7C3AED",
              bgColor: "#F5F3FF",
            },
            {
              label: "Vehicle Inspection",
              path: "/fleet/vehicle-inspection",
              icon: FileText,
              color: "#0891B2",
              bgColor: "#ECFEFF",
            },
            {
              label: "Inspection Reports",
              path: "/fleet/reports",
              icon: FileSpreadsheet,
              color: "#059669",
              bgColor: "#ECFDF5",
            },
          ]}
        />

        {/* Schedule Nav Button (Shift Creation Workspace) */}
        <button
          type="button"
          className={`navbar-tab-btn ${currentRoute === "scheduler" ? "active" : ""}`}
          onClick={() => handleNavigate("scheduler")}
          title="Shift Creation & Weekly Schedule Workspace"
        >
          <CalendarDays size={14} />
          <span>Schedule</span>
        </button>

        {/* Global Utilities Dropdown */}
        <div className="navbar-ops-dropdown-wrap" ref={seeMoreRef}>
          <button
            type="button"
            className={`navbar-tab-btn ops-trigger-btn ${isSeeMoreActive ? "active" : ""}`}
            onClick={() => {
              setSeeMoreOpen(!seeMoreOpen);
              setActiveNavDropdown(null);
            }}
            title="Global Utilities – operational features & tools"
          >
            <MoreHorizontal size={14} />
            <span>Global Utilities</span>
            {curationCounts.total > 0 && (
              <span
                className="navbar-curation-pill"
                title={`${curationCounts.total} pending curation${curationCounts.total !== 1 ? "s" : ""}`}
              >
                {curationCounts.total}
              </span>
            )}
            <ChevronDown
              size={12}
              className={`transition-transform duration-150 ${seeMoreOpen ? "rotate-180" : ""}`}
            />
          </button>

          {seeMoreOpen && (
            <div className="navbar-see-more-mega-card">
              {/* Apple-grade Glass Header */}
              <div className="see-more-card-header">
                <div className="see-more-title-row">
                  <span className="see-more-card-heading">Global Utilities</span>
                  <span className="see-more-card-tag">Platform Hub</span>
                </div>
                <p className="see-more-card-subheading">
                  Quick access to operational management tools, fleet controls &amp; system curations
                </p>
              </div>

              {/* Categorized 3-Column Glassy Grid */}
              <div className="see-more-sections-grid">
                {seeMoreColumns.map((col) => (
                  <div key={col.id} className="see-more-column">
                    {col.sections.map((sec) => (
                      <div key={sec.title} className="see-more-sub-section">
                        <div className="see-more-section-header">
                          <span className="see-more-section-title">{sec.title}</span>
                        </div>
                        <div className="see-more-section-items">
                          {sec.items.map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                className={`see-more-item-btn ${opt.isCurrent ? "current" : ""}`}
                                onClick={() => handleNavigate(opt.id)}
                                style={{
                                  position: "relative",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.65rem",
                                  padding: "0.48rem 0.65rem",
                                  paddingLeft: opt.isCurrent ? "0.95rem" : "0.65rem",
                                  borderRadius: "9px",
                                  transition: "all 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
                                  width: "100%",
                                  textAlign: "left",
                                  backgroundColor: opt.isCurrent ? "#EFF6FF" : "transparent",
                                  border: opt.isCurrent ? "1px solid #BFDBFE" : "1px solid transparent",
                                  boxShadow: opt.isCurrent ? "0 2px 6px -1px rgba(37, 99, 235, 0.12)" : "none",
                                  cursor: "pointer",
                                }}
                              >
                                {/* Active Left Indicator Bar */}
                                {opt.isCurrent && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      left: "3px",
                                      top: "22%",
                                      bottom: "22%",
                                      width: "3px",
                                      borderRadius: "4px",
                                      backgroundColor: "#2563EB",
                                    }}
                                  />
                                )}

                                {/* Icon Box */}
                                <div
                                  className="see-more-icon-box"
                                  style={{
                                    color: opt.isCurrent ? "#2563EB" : opt.color,
                                    backgroundColor: opt.isCurrent ? "#DBEAFE" : opt.bgColor,
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    transition: "all 0.16s ease",
                                    border: opt.isCurrent ? "1px solid rgba(37, 99, 235, 0.25)" : "1px solid transparent",
                                    boxShadow: opt.isCurrent ? "0 2px 4px rgba(37, 99, 235, 0.18)" : "none",
                                  }}
                                >
                                  <Icon size={15} />
                                </div>

                                {/* Text & Badges */}
                                <div className="see-more-item-text">
                                  <div className="see-more-item-name-row">
                                    <span
                                      className="see-more-item-name"
                                      style={{
                                        fontSize: "0.82rem",
                                        fontWeight: opt.isCurrent ? 650 : 500,
                                        color: opt.isCurrent ? "#1D4ED8" : "#1E293B",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        letterSpacing: "-0.01em",
                                      }}
                                    >
                                      {opt.title}
                                    </span>
                                    {opt.badge && (
                                      <span className={`ops-item-badge ${opt.badgeType || "blue"}`}>
                                        {opt.badge}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Prominent Active Select State Checkmark Badge */}
                                {opt.isCurrent && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "50%",
                                      backgroundColor: "#2563EB",
                                      color: "#FFFFFF",
                                      flexShrink: 0,
                                      boxShadow: "0 2px 5px rgba(37, 99, 235, 0.35)",
                                      marginLeft: "auto",
                                    }}
                                    title="Currently active"
                                  >
                                    <Check size={11} strokeWidth={3} style={{ color: "#FFFFFF" }} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT: Notification Bell + Avatar profile button */}
      <div className="navbar-right">
        {/* Notification Bell */}
        <div className="navbar-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className={`navbar-notif-btn ${notifDropdownOpen ? "open" : ""}`}
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setProfileMenuOpen(false);
            }}
            title={unreadNotifCount > 0 ? `${unreadNotifCount} unread notifications` : "Notifications"}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadNotifCount > 0 && (
              <span className="navbar-notif-badge">
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {notifDropdownOpen && (
            <div className="navbar-notif-dropdown">
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title">Notifications</span>
                {unreadNotifCount > 0 && (
                  <span className="notif-dropdown-badge">{unreadNotifCount} new</span>
                )}
              </div>
              <div className="notif-dropdown-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty-state">
                    <Bell size={28} className="notif-empty-icon" />
                    <p>No notifications yet</p>
                    <span>You're all caught up!</span>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`notif-item ${!notif.read ? "unread" : ""}`}
                    >
                      <div className="notif-item-dot" />
                      <div className="notif-item-content">
                        <p className="notif-item-msg">{notif.message || notif.title || "New notification"}</p>
                        <span className="notif-item-time">
                          {notif.timestamp && notif.timestamp !== "Just now"
                            ? (isNaN(Date.parse(notif.timestamp)) ? notif.timestamp : new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
                            : notif.timestamp || ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="notif-dropdown-footer">
                <button
                  type="button"
                  className="notif-see-all-btn"
                  onClick={() => {
                    setNotifDropdownOpen(false);
                    handleNavigate("notifications");
                  }}
                >
                  See all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Profile Button (no name/role text) */}
        <div className="navbar-avatar-wrap" ref={profileRef}>
          <button
            type="button"
            className={`navbar-avatar-only-btn ${profileMenuOpen ? "open" : ""}`}
            onClick={() => {
              setProfileMenuOpen(!profileMenuOpen);
              setNotifDropdownOpen(false);
            }}
            title={`Signed in as ${userName} (${role})`}
            aria-expanded={profileMenuOpen}
            aria-label="Profile menu"
          >
            <div
              className="profile-avatar-gradient"
              style={{ background: getAvatarColor(userName, "admin") }}
            >
              <span>{getInitials(userName)}</span>
              <span className="avatar-online-dot" />
            </div>
            <ChevronDown size={11} className={`profile-chevron-sm transition-transform duration-150 ${profileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="navbar-profile-dropdown-menu">
              {/* User Info Card */}
              <div className="profile-dropdown-header">
                <div
                  className="header-avatar-circle"
                  style={{ background: getAvatarColor(userName, "admin") }}
                >
                  <span>{getInitials(userName)}</span>
                </div>
                <div className="header-text-block">
                  <h4 className="header-user-name">{userName}</h4>
                  <span className="header-user-email">{userEmail}</span>
                  <div className="header-badge-row">
                    <span className="header-role-pill">{role}</span>
                    <span className="header-station-pill">
                      <Building size={10} /> {activeStation}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              {/* Menu Options */}
              <div className="profile-dropdown-body">
                {/* 1. My Profile */}
                <button
                  type="button"
                  className={`profile-dropdown-item ${currentRoute === "profile" ? "active" : ""}`}
                  onClick={() => handleNavigate("profile")}
                >
                  <div className="profile-item-icon-wrap">
                    <User size={15} />
                  </div>
                  <div className="profile-item-text">
                    <span className="profile-item-title">My Profile</span>
                    <span className="profile-item-desc">Company details & security settings</span>
                  </div>
                </button>

                {/* 2. Settings */}
                <button
                  type="button"
                  className={`profile-dropdown-item ${currentRoute === "settings" ? "active" : ""}`}
                  onClick={() => handleNavigate("settings")}
                >
                  <div className="profile-item-icon-wrap text-slate-700 bg-slate-100">
                    <Settings size={15} />
                  </div>
                  <div className="profile-item-text">
                    <span className="profile-item-title">Settings</span>
                    <span className="profile-item-desc">Admin permissions & station roles</span>
                  </div>
                </button>

                {/* 3. App Layout */}
                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setIsLayoutModalOpen(true);
                  }}
                >
                  <div className="profile-item-icon-wrap text-blue-600 bg-blue-50">
                    <Layout size={15} />
                  </div>
                  <div className="profile-item-text">
                    <span className="profile-item-title">App Layout</span>
                    <span className="profile-item-desc">Top header vs. Left sidebar</span>
                  </div>
                </button>

                {/* 4. Help and Support */}
                <button
                  type="button"
                  className={`profile-dropdown-item ${currentRoute === "help_and_support" ? "active" : ""}`}
                  onClick={() => handleNavigate("help_and_support")}
                >
                  <div className="profile-item-icon-wrap text-emerald-600 bg-emerald-50">
                    <HelpCircle size={15} />
                  </div>
                  <div className="profile-item-text">
                    <span className="profile-item-title">Help & Support</span>
                    <span className="profile-item-desc">FAQs, queries & ticket status</span>
                  </div>
                </button>
              </div>

              <div className="profile-dropdown-divider" />

              {/* Logout Option */}
              <div className="profile-dropdown-footer">
                <button
                  type="button"
                  className="profile-dropdown-logout-btn"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
    {isStationInactive && !isOwnershipLevelRoute && (
      <div className="station-readonly-banner">
        <AlertCircle size={14} className="shrink-0 text-amber-700" />
        <span>
          Station <strong>{activeStation}</strong> is marked inactive. The application is in read-only mode (all write actions are disabled).
        </span>
      </div>
    )}
    <LayoutSwitcherModal
      isOpen={isLayoutModalOpen}
      onClose={() => setIsLayoutModalOpen(false)}
    />
  </>
  );
};

export default AppNavbar;
