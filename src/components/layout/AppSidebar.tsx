import React, { FC, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Truck,
  MessageSquare,
  PhoneCall,
  ClipboardList,
  BarChart3,
  CalendarDays,
  Sliders,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  FileSpreadsheet,
  FileCheck,
  LifeBuoy,
  ShieldAlert,
  FilePen,
  Cloud,
  Package,
  FileText,
  CheckSquare,
  X,
  MoreVertical,
  User,
  Settings,
  Layout,
  LogOut,
} from "lucide-react";
import Logo from "../../assets/Logo";
import { useLayoutStore } from "../../store/layoutStore";
import { useAuthStore } from "../../store/authStore";
import { getAvatarColor, getInitials } from "../../utils/avatarUtils";
import { LayoutSwitcherModal } from "./LayoutSwitcherModal";

interface NavSubItem {
  id: string;
  title: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

interface NavGroupItem {
  id: string;
  category?: string;
  title: string;
  path?: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  subItems?: NavSubItem[];
}

export const AppSidebar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const stations = useAuthStore((state) => state.stations);
  const logout = useAuthStore((state) => state.logout);

  const isCollapsed = useLayoutStore((state) => state.isSidebarCollapsed);
  const toggleCollapse = useLayoutStore((state) => state.toggleSidebarCollapse);
  const isMobileOpen = useLayoutStore((state) => state.isMobileSidebarOpen);
  const setMobileOpen = useLayoutStore((state) => state.setMobileSidebarOpen);

  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);

  // Submenu open states (expanded by default or when child is active)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    inspection: false,
    reports: false,
    utilities: false,
  });

  const activeStationObj = stations?.find((s) => s.current) || stations?.[0];
  const activeStation =
    activeStationObj?.station_code ||
    user?.station_code ||
    user?.company?.station_code ||
    "QUE4";

  const userName = user?.name || (user as any)?.username || "Admin User";
  const userRole = user?.role || "Operations Admin";

  // Navigation schema organized with clean category headers
  const navSections: { category: string; items: NavGroupItem[] }[] = [
    {
      category: "MAIN DASHBOARD",
      items: [
        {
          id: "dashboard",
          title: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          id: "drivers",
          title: "Drivers",
          path: "/drivers",
          icon: Users,
        },
        {
          id: "vehicles",
          title: "Vehicles",
          path: "/vehicles",
          icon: Truck,
        },
      ],
    },
    {
      category: "COMMUNICATIONS",
      items: [
        {
          id: "chats",
          title: "Chats",
          path: "/chats",
          icon: MessageSquare,
        },
        {
          id: "calls",
          title: "Calls",
          path: "/curations",
          icon: PhoneCall,
        },
      ],
    },
    {
      category: "INSPECTIONS",
      items: [
        {
          id: "inspection",
          title: "Inspection",
          icon: ClipboardList,
          subItems: [
            {
              id: "driver_inspection",
              title: "Driver Inspection",
              path: "/fleet/driver-inspection",
              icon: FileCheck,
            },
            {
              id: "vehicle_inspection",
              title: "Vehicle Inspection",
              path: "/fleet/vehicle-inspection",
              icon: Truck,
            },
          ],
        },
      ],
    },
    {
      category: "REPORTS",
      items: [
        {
          id: "reports",
          title: "Reports",
          icon: BarChart3,
          subItems: [
            {
              id: "upload_reports",
              title: "Upload Reports",
              path: "/performance/upload",
              icon: UploadCloud,
            },
            {
              id: "see_reports_data",
              title: "See Reports Data",
              path: "/performance/reports",
              icon: FileSpreadsheet,
            },
          ],
        },
      ],
    },
    {
      category: "SCHEDULE",
      items: [
        {
          id: "schedule",
          title: "Schedule",
          path: "/scheduler",
          icon: CalendarDays,
        },
      ],
    },
    {
      category: "UTILITIES",
      items: [
        {
          id: "utilities",
          title: "Utilities",
          icon: Sliders,
          subItems: [
            {
              id: "callouts",
              title: "Callouts",
              path: "/callout",
              icon: PhoneCall,
            },
            {
              id: "rescue",
              title: "Rescue",
              path: "/rescue",
              icon: LifeBuoy,
            },
            {
              id: "accident_injury",
              title: "Accident and Injury Reports",
              path: "/accident_injury",
              icon: ShieldAlert,
            },
            {
              id: "e_signature",
              title: "E-signature",
              path: "/performance/e-signature",
              icon: FilePen,
            },
            {
              id: "cloud",
              title: "LMD Cloud",
              path: "/cloud",
              icon: Cloud,
            },
            {
              id: "inventory",
              title: "Inventory",
              path: "/inventory",
              icon: Package,
            },
            {
              id: "notes",
              title: "Notes",
              path: "/notes",
              icon: FileText,
            },
            {
              id: "tasks",
              title: "Tasks",
              path: "/tasks",
              icon: CheckSquare,
            },
          ],
        },
      ],
    },
  ];

  // Auto-expand group if current URL matches any of its sub-items
  useEffect(() => {
    const currentPath = location.pathname.toLowerCase();
    const currentSearch = location.search.toLowerCase();
    const fullUrl = currentPath + currentSearch;

    navSections.forEach((section) => {
      section.items.forEach((group) => {
        if (group.subItems) {
          const isChildActive = group.subItems.some((sub) => {
            const subPath = sub.path.toLowerCase();
            if (subPath.includes("?")) {
              return fullUrl.includes(subPath);
            }
            return currentPath === subPath || currentPath.startsWith(subPath + "/");
          });
          if (isChildActive) {
            setOpenSubmenus((prev) => ({ ...prev, [group.id]: true }));
          }
        }
      });
    });
  }, [location.pathname, location.search]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileCardRef.current && !profileCardRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSubmenu = (groupId: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobileOpen) {
      setMobileOpen(false);
    }
  };

  const isRouteActive = (path?: string) => {
    if (!path) return false;
    const currentPath = location.pathname.toLowerCase();
    const currentSearch = location.search.toLowerCase();
    const fullUrl = currentPath + currentSearch;
    const target = path.toLowerCase();

    if (target.includes("?")) {
      return fullUrl.includes(target);
    }

    if (target === "/dashboard") {
      return currentPath === "/dashboard" || currentPath === "/";
    }

    // Accidents and Incidents match
    if (target === "/accident_injury") {
      return currentPath === "/accident_injury" || currentPath.includes("/fleet/incidents");
    }

    // Callouts & Rescue tab routing
    if (target === "/callout") {
      return currentPath === "/callout" || (currentPath === "/operations" && currentSearch.includes("tab=callout"));
    }
    if (target === "/rescue") {
      return currentPath === "/rescue" || (currentPath === "/operations" && currentSearch.includes("tab=rescue"));
    }
    if (target === "/notes") {
      return currentPath === "/notes" || (currentPath === "/operations" && currentSearch.includes("tab=notes"));
    }
    if (target === "/tasks") {
      return currentPath === "/tasks" || (currentPath === "/operations" && currentSearch.includes("tab=tasks"));
    }

    return currentPath === target || currentPath.startsWith(target + "/");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="app-sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 10045,
          }}
        />
      )}

      {/* 3-Card Floating Column */}
      <aside
        className={`app-sidebar-floating-stack ${isCollapsed ? "collapsed" : ""} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* ── CARD 1: Top Brand Header Card ── */}
        <div className="app-sidebar-brand-card">
          {!isCollapsed ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                cursor: "pointer",
                userSelect: "none",
                minWidth: 0,
              }}
              onClick={() => handleNavigate("/dashboard")}
              title="LMDmax Home"
            >
              {/* Brand Emblem Icon (no duplicate text) */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.12)",
                  flexShrink: 0,
                }}
              >
                <Logo variant="iconOnly" width={24} height={16} />
              </div>

              {/* Brand Title */}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#0F172A",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  LMD<span style={{ color: "#2563EB" }}>max</span>
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              onClick={() => handleNavigate("/dashboard")}
              title="LMDmax Home"
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.12)",
                }}
              >
                <Logo variant="iconOnly" width={22} height={15} />
              </div>
            </div>
          )}

          {/* Collapse / Expand Toggle Button (< or >) */}
          <button
            type="button"
            className="sidebar-collapse-toggle-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F1F5F9";
              e.currentTarget.style.color = "#1E293B";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              type="button"
              className="sidebar-mobile-close-btn"
              onClick={() => setMobileOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748B",
                cursor: "pointer",
                padding: "0.35rem",
                borderRadius: "6px",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── CARD 2: Main Navigation Scrollable Card ── */}
        <div className="app-sidebar-nav-card scrollable">
          {navSections.map((sec, secIdx) => (
            <div key={sec.category} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {/* Category Header Label */}
              {!isCollapsed ? (
                <div
                  className="app-sidebar-category-header"
                  style={{ marginTop: secIdx === 0 ? "0" : "8px" }}
                >
                  {sec.category}
                </div>
              ) : secIdx > 0 ? (
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "#F1F5F9",
                    margin: "6px 8px",
                  }}
                />
              ) : null}

              {/* Items in Category */}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const hasSub = Boolean(item.subItems && item.subItems.length > 0);
                const isSubOpen = Boolean(openSubmenus[item.id]);

                // Active determination
                const isGroupActive = hasSub
                  ? item.subItems?.some((sub) => isRouteActive(sub.path))
                  : isRouteActive(item.path);

                if (!hasSub) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.path!)}
                      title={isCollapsed ? item.title : undefined}
                      className={`app-sidebar-nav-item-btn ${isGroupActive ? "active" : ""}`}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.7rem",
                          minWidth: 0,
                          width: "100%",
                          justifyContent: isCollapsed ? "center" : "flex-start",
                        }}
                      >
                        <Icon
                          size={17}
                          style={{
                            color: isGroupActive ? "#FFFFFF" : "#64748B",
                            flexShrink: 0,
                            transition: "color 0.15s ease",
                          }}
                        />
                        {!isCollapsed && (
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "0.84rem",
                            }}
                          >
                            {item.title}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                }

                // Collapsible Group
                return (
                  <div key={item.id} style={{ display: "flex", flexDirection: "column" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isCollapsed) {
                          toggleCollapse();
                        }
                        toggleSubmenu(item.id);
                      }}
                      title={isCollapsed ? item.title : undefined}
                      className={`app-sidebar-nav-item-btn ${
                        isGroupActive && !isSubOpen ? "active" : ""
                      }`}
                      style={{
                        justifyContent: isCollapsed ? "center" : "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.7rem",
                          minWidth: 0,
                        }}
                      >
                        <Icon
                          size={17}
                          style={{
                            color: isGroupActive && !isSubOpen ? "#FFFFFF" : "#64748B",
                            flexShrink: 0,
                          }}
                        />
                        {!isCollapsed && (
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "0.84rem",
                            }}
                          >
                            {item.title}
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div
                          style={{
                            color: isGroupActive && !isSubOpen ? "#FFFFFF" : "#94A3B8",
                            display: "flex",
                            alignItems: "center",
                            transition: "transform 0.2s ease",
                          }}
                        >
                          {isSubOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      )}
                    </button>

                    {/* Submenu Pills */}
                    {isSubOpen && !isCollapsed && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          paddingLeft: "1.1rem",
                          borderLeft: "2px solid #E2E8F0",
                          marginLeft: "1.1rem",
                          marginTop: "2px",
                          marginBottom: "4px",
                          gap: "2px",
                        }}
                      >
                        {item.subItems?.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = isRouteActive(sub.path);

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleNavigate(sub.path)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.55rem",
                                width: "100%",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: isSubActive ? "#EFF6FF" : "transparent",
                                color: isSubActive ? "#2563EB" : "#475569",
                                fontWeight: isSubActive ? 700 : 500,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.15s ease",
                                fontFamily: "var(--font-sans)",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSubActive) {
                                  e.currentTarget.style.backgroundColor = "#F8FAFC";
                                  e.currentTarget.style.color = "#0F172A";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSubActive) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = "#475569";
                                }
                              }}
                            >
                              <SubIcon
                                size={14}
                                style={{
                                  color: isSubActive ? "#2563EB" : "#94A3B8",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {sub.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── CARD 3: Bottom Profile Card ── */}
        <div
          className="app-sidebar-user-card"
          ref={profileCardRef}
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          title={`Signed in as ${userName}`}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              minWidth: 0,
            }}
          >
            {/* Avatar Circle */}
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: getAvatarColor(userName, "admin"),
                color: "#FFFFFF",
                fontSize: "0.78rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
                flexShrink: 0,
              }}
            >
              {getInitials(userName)}
            </div>

            {!isCollapsed && (
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                  }}
                >
                  {userName}
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 550,
                    color: "#64748B",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                    marginTop: "1px",
                  }}
                >
                  {userRole}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div style={{ color: "#94A3B8" }}>
              <MoreVertical size={16} />
            </div>
          )}

          {/* Profile Dropdown Popover */}
          {profileMenuOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: isCollapsed ? "0" : "0",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                boxShadow: "0 14px 35px -5px rgba(0, 0, 0, 0.18), 0 8px 16px -6px rgba(0, 0, 0, 0.1)",
                border: "1px solid #CBD5E1",
                width: "240px",
                zIndex: 10060,
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                fontFamily: "var(--font-sans)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#0F172A" }}>
                  {userName}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                  {activeStation} Delivery Station
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate("/profile");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#FFFFFF",
                  color: "#334155",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                <User size={15} color="#2563EB" />
                <span>My Profile &amp; Company</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate("/settings");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#FFFFFF",
                  color: "#334155",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                <Settings size={15} color="#64748B" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setIsLayoutModalOpen(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#EFF6FF",
                  color: "#2563EB",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#DBEAFE")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#EFF6FF")}
              >
                <Layout size={15} color="#2563EB" />
                <span>Choose App Layout</span>
              </button>

              <div style={{ height: "1px", backgroundColor: "#F1F5F9", margin: "4px 0" }} />

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#FFFFFF",
                  color: "#DC2626",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                <LogOut size={15} color="#DC2626" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* App Layout Switcher Modal */}
      <LayoutSwitcherModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
      />
    </>
  );
};

export default AppSidebar;
