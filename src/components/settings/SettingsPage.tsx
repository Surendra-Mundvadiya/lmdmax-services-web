import React, { FC, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  UserPlus,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Users,
  Truck,
  BarChart3,
  MessageSquare,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Mail,
  Star,
  Gauge,
  Clock,
  CalendarCheck,
  ChevronRight,
  Smartphone,
  FilePen,
  BellRing,
  Wrench,
  Calendar,
  Layout,
} from "lucide-react";
import GlassAppLayout from "../layout/GlassAppLayout";
import "./settings-glass.css";
import AdminTable from "./admins/AdminTable";
import AddAdminScreen from "./admins/AddAdminScreen";
import AdminPermissionsScreen from "./admins/AdminPermissionsScreen";
import DeleteAdminModal from "./admins/DeleteAdminModal";

// Modular settings panels organized by Operations, Performance, Communications, Scheduler, Fleet, Preferences
import LmdDriveAccessPanel from "./panels/LmdDriveAccessPanel";
import RoleManagementPanel from "./panels/RoleManagementPanel";
import ChangePasswordPanel from "./panels/ChangePasswordPanel";
import PerformanceThresholdSettingsPanel from "./panels/PerformanceThresholdSettingsPanel";
import PerformanceEmailReportingPanel from "./panels/PerformanceEmailReportingPanel";
import DriverRatingSettingsPanel from "./panels/DriverRatingSettingsPanel";
import ESignatureSettingsPanel from "./panels/ESignatureSettingsPanel";
import InAppChatAccessPanel from "./panels/InAppChatAccessPanel";
import RemindersSettingsPanel from "./panels/RemindersSettingsPanel";
import ShiftRulesSettingsPanel from "./panels/ShiftRulesSettingsPanel";
import SchedulerFormatSettingsPanel from "./panels/SchedulerFormatSettingsPanel";
import VehicleManagementPanel from "./panels/VehicleManagementPanel";
import ServiceManagementPanel from "./panels/ServiceManagementPanel";
import AppLayoutSettingsPanel from "./panels/AppLayoutSettingsPanel";

import { useAdminStore } from "../../store/adminStore";
import { useAuthStore } from "../../store/authStore";
import type { AdminUser } from "../../types/admin";

export interface SettingNavSubItem {
  id: string;
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  keywords?: string[];
}

export interface SettingNavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  keywords: string[];
  subSections?: SettingNavSubItem[];
}

interface SettingNavGroup {
  groupTitle: string;
  items: SettingNavItem[];
}

const SETTING_GROUPS: SettingNavGroup[] = [
  {
    groupTitle: "Preferences",
    items: [
      {
        id: "app_layout",
        title: "App Layout",
        icon: Layout,
        keywords: [
          "app layout",
          "layout",
          "sidebar",
          "top nav",
          "header",
          "navigation",
          "mode",
          "view",
          "left sidebar",
        ],
      },
    ],
  },
  {
    groupTitle: "Operations",
    items: [
      {
        id: "admins",
        title: "Admins",
        icon: Users,
        keywords: [
          "admin",
          "admins",
          "admin management",
          "administrator",
          "dispatchers",
          "managers",
          "permissions",
          "roles",
          "users",
          "station admin",
        ],
      },
      {
        id: "lmd_drive_access",
        title: "LMD Drive APP Access",
        icon: Smartphone,
        keywords: [
          "lmd drive app access",
          "lmd drive",
          "drive",
          "app",
          "mobile",
          "signin",
          "sign-in",
          "dvic",
          "vin",
          "scan",
          "driver",
          "password",
          "station",
        ],
      },
      {
        id: "roles",
        title: "Role Management",
        icon: UserCheck,
        keywords: [
          "role management",
          "role",
          "permission",
          "manager",
          "lead",
          "dispatcher",
          "safety",
          "rbac",
          "responsibilities",
        ],
      },
      {
        id: "password",
        title: "Change Password",
        icon: KeyRound,
        keywords: ["change password", "password", "security", "credentials", "auth"],
      },
    ],
  },
  {
    groupTitle: "Performance",
    items: [
      {
        id: "thresholds",
        title: "Set Threshold",
        icon: BarChart3,
        keywords: [
          "set threshold",
          "threshold",
          "weekly metrics",
          "da weekly",
          "overview",
          "eoc",
          "dvic",
          "daily driver",
          "pps",
          "performance",
        ],
        subSections: [
          {
            id: "scorecard",
            title: "Weekly Metrics",
            icon: BarChart3,
            keywords: ["weekly metrics", "metrics", "dcr", "spr", "pod", "cdf"],
          },
          {
            id: "da_weekly_overview",
            title: "DA Weekly Overview",
            icon: FileSpreadsheet,
            keywords: ["da weekly", "overview", "weekly overview"],
          },
          {
            id: "eoc_report",
            title: "EOC",
            icon: Gauge,
            keywords: ["eoc", "engine off", "compliance"],
          },
          {
            id: "dvic_report",
            title: "DVIC",
            icon: Clock,
            keywords: ["dvic", "inspection", "seconds", "duration"],
          },
          {
            id: "daily_driver_scorecard",
            title: "Daily Driver",
            icon: CalendarCheck,
            keywords: ["daily", "daily driver", "coaching"],
          },
          {
            id: "pps_report",
            title: "PPS",
            icon: ShieldCheck,
            keywords: ["pps", "parking", "sequence", "seatbelt", "engine"],
          },
        ],
      },
      {
        id: "email_reporting",
        title: "Email Reporting",
        icon: Mail,
        keywords: [
          "email reporting",
          "email",
          "reporting",
          "netradyne",
          "performance",
          "recipients",
          "violations",
          "alerts",
        ],
        subSections: [
          {
            id: "netradyne_email",
            title: "Netradyne Reporting",
            icon: Mail,
            keywords: ["netradyne", "violations", "alerts", "camera", "reporting"],
          },
          {
            id: "scorecard_email",
            title: "Performance Reporting",
            icon: BarChart3,
            keywords: ["performance", "weekly", "bottom performers", "overall", "reporting"],
          },
        ],
      },
      {
        id: "driver_rating",
        title: "Driver Rating",
        icon: Star,
        keywords: [
          "driver rating",
          "rating",
          "weightage",
          "scale",
          "ranking",
          "callouts",
          "performance",
        ],
      },
      {
        id: "e_signature",
        title: "E-signature",
        icon: FilePen,
        keywords: [
          "e-signature",
          "esignature",
          "signature",
          "refusal",
          "writeup",
          "acknowledgement",
          "reminder",
        ],
      },
    ],
  },
  {
    groupTitle: "Communications",
    items: [
      {
        id: "in_app_chat",
        title: "In-App Chat Access",
        icon: MessageSquare,
        keywords: [
          "in-app chat access",
          "in-app chat",
          "chat",
          "message",
          "communication",
          "channel",
          "announcement",
          "photos",
          "receipts",
        ],
      },
      {
        id: "reminders",
        title: "Reminders",
        icon: BellRing,
        keywords: [
          "reminders",
          "reminder",
          "sms",
          "wave",
          "callout",
          "standby",
          "voice",
          "assistant",
          "alerts",
        ],
      },
    ],
  },
  {
    groupTitle: "Scheduler",
    items: [
      {
        id: "shift_rules",
        title: "Shift Rules",
        icon: Calendar,
        keywords: [
          "shift rules",
          "shift",
          "scheduling",
          "availability",
          "cutoff",
          "hours",
          "consecutive",
          "approval",
          "swap",
        ],
      },
      {
        id: "scheduler_format",
        title: "Dashboard & Format",
        icon: Sliders,
        keywords: [
          "dashboard & format",
          "scheduler dashboard format",
          "format",
          "week",
          "time",
          "date",
          "landing",
          "export",
        ],
      },
    ],
  },
  {
    groupTitle: "Fleet",
    items: [
      {
        id: "vehicle_mgmt",
        title: "Vehicle Management",
        icon: Truck,
        keywords: [
          "vehicle management",
          "vehicle",
          "fleet",
          "van",
          "types",
          "chassis",
          "capacity",
          "dvic",
          "inspection",
          "fuel",
        ],
      },
      {
        id: "service_mgmt",
        title: "Schedule Service Management",
        icon: Wrench,
        keywords: [
          "schedule service management",
          "service",
          "maintenance",
          "pm",
          "oil",
          "tire",
          "brake",
          "dot",
          "interval",
        ],
      },
    ],
  },
];

export const SettingsPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active query parameters
  const tabParam = searchParams.get("tab") || "admins";
  const reportParam = searchParams.get("report");
  const sectionParam = searchParams.get("section") || searchParams.get("category");

  const [activeTab, setActiveTab] = useState<string>(tabParam);
  const [navSearch, setNavSearch] = useState<string>("");

  const admins = useAdminStore((state) => state.admins);
  const adminSearchQuery = useAdminStore((state) => state.searchQuery);
  const setAdminSearchQuery = useAdminStore((state) => state.setSearchQuery);
  const fetchAdmins = useAdminStore((state) => state.fetchAdmins);
  const user = useAuthStore((state) => state.user);
  const stations = useAuthStore((state) => state.stations);

  // Active delivery station company_id
  const activeStationObj = stations.find((s) => s.current) || stations[0];
  const activeCompanyId = activeStationObj?.company_id || user?.company_id;

  useEffect(() => {
    fetchAdmins(activeCompanyId);
  }, [fetchAdmins, activeCompanyId]);

  // Sync tab with URL search parameter if present
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Active category resolution
  const activeGroup = useMemo(() => {
    if (sectionParam) {
      const match = SETTING_GROUPS.find(
        (g) => g.groupTitle.toLowerCase() === sectionParam.toLowerCase()
      );
      if (match) return match;
    }
    const match = SETTING_GROUPS.find((g) => g.items.some((i) => i.id === activeTab));
    return match || SETTING_GROUPS[1]; // default to Operations
  }, [activeTab, sectionParam]);

  // Active item resolution
  const activeItem = useMemo(() => {
    for (const g of SETTING_GROUPS) {
      const found = g.items.find((i) => i.id === activeTab);
      if (found) return found;
    }
    return activeGroup.items[0] || SETTING_GROUPS[1].items[0];
  }, [activeTab, activeGroup]);

  // Active sub-report parameter (for thresholds or email_reporting)
  const activeReport =
    reportParam ||
    (activeTab === "thresholds" ? "scorecard" : activeTab === "email_reporting" ? "netradyne_email" : "");

  // Switch category via "View by" capsule
  const handleGroupSwitch = (group: SettingNavGroup) => {
    const targetItem = group.items[0];
    if (targetItem) {
      handleTabChange(targetItem.id, undefined, group.groupTitle);
    }
  };

  // Switch tab / sub-report
  const handleTabChange = (tabId: string, subReportId?: string, groupName?: string) => {
    setActiveTab(tabId);
    const newParams: Record<string, string> = { tab: tabId };

    const targetGroup = groupName
      ? SETTING_GROUPS.find((g) => g.groupTitle.toLowerCase() === groupName.toLowerCase())
      : SETTING_GROUPS.find((g) => g.items.some((i) => i.id === tabId));

    if (targetGroup) {
      newParams.section = targetGroup.groupTitle.toLowerCase();
    }

    if (tabId === "thresholds") {
      newParams.report = subReportId || (activeTab === "thresholds" ? activeReport || "scorecard" : "scorecard");
    } else if (tabId === "email_reporting") {
      newParams.report = subReportId || (activeTab === "email_reporting" ? activeReport || "netradyne_email" : "netradyne_email");
    }

    setSearchParams(newParams);
    if (viewMode !== "list") {
      setViewMode("list");
      setEditingAdmin(null);
      setPermissionsAdmin(null);
    }
  };

  const handleSubSectionClick = (parentId: string, subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleTabChange(parentId, subId);
  };

  // Screen View Mode for Admins: "list" | "add" | "edit" | "permissions"
  const [viewMode, setViewMode] = useState<"list" | "add" | "edit" | "permissions">("list");

  // Modal States for Admins
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [permissionsAdmin, setPermissionsAdmin] = useState<AdminUser | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);

  // Feedback Notification Banner
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (msg: { text: string; type: "success" | "error" }) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev?.text === msg.text ? null : prev));
    }, 4500);
  };

  // Filtered admins matching search input in Admins tab
  const filteredAdmins = useMemo(() => {
    if (!adminSearchQuery.trim()) return admins;

    const q = adminSearchQuery.toLowerCase().trim();
    const queryDigits = q.replace(/\D/g, "");

    return admins.filter((admin) => {
      const name = (admin.name || "").toLowerCase();
      const email = (admin.email || "").toLowerCase();
      const phoneRaw = (admin.phone || "").toLowerCase();
      const adminDigits = phoneRaw.replace(/\D/g, "");

      const matchesName = name.includes(q);
      const matchesEmail = email.includes(q);
      const matchesPhone =
        phoneRaw.includes(q) ||
        (queryDigits.length > 0 && adminDigits.includes(queryDigits));

      return matchesName || matchesEmail || matchesPhone;
    });
  }, [admins, adminSearchQuery]);

  // Filter setting navigation items based on search query in the active category
  const visibleGroupItems = useMemo(() => {
    const items = activeGroup.items;
    if (!navSearch.trim()) return items;

    const q = navSearch.toLowerCase().trim();
    return items.filter((item) => {
      const matchesTitle = item.title.toLowerCase().includes(q);
      const matchesKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      const matchesSubs = item.subSections?.some(
        (s) => s.title.toLowerCase().includes(q) || (s.keywords || []).some((k) => k.toLowerCase().includes(q))
      );
      return matchesTitle || matchesKeywords || matchesSubs;
    });
  }, [activeGroup, navSearch]);

  return (
    <GlassAppLayout
      currentRoute="settings"
      activeBreadcrumb={{ section: "Account", page: "Settings" }}
    >
      {/* Feedback Notification Banner */}
      {notification && (
        <div className="notification-banner-wrapper">
          <div className={`notification-banner ${notification.type}`}>
            {notification.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span className="notification-message">{notification.text}</span>
            <button
              type="button"
              className="close-notif-btn"
              onClick={() => setNotification(null)}
              title="Dismiss"
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Screen View Routing for Add / Edit / Permissions Full-Screen Modes */}
      {activeTab === "admins" && viewMode === "add" ? (
        <div className="operations-main-content scrollable">
          <AddAdminScreen
            onBack={() => setViewMode("list")}
            onSuccess={() => {
              showNotification({
                text: "Administrator added successfully!",
                type: "success",
              });
              setViewMode("list");
            }}
          />
        </div>
      ) : activeTab === "admins" && viewMode === "edit" && editingAdmin ? (
        <div className="operations-main-content scrollable">
          <AddAdminScreen
            initialAdmin={editingAdmin}
            isEditMode={true}
            onBack={() => {
              setEditingAdmin(null);
              setViewMode("list");
            }}
            onSuccess={() => {
              showNotification({
                text: "Administrator details updated successfully!",
                type: "success",
              });
              setEditingAdmin(null);
              setViewMode("list");
            }}
          />
        </div>
      ) : activeTab === "admins" && viewMode === "permissions" && permissionsAdmin ? (
        <div
          className="operations-main-content scrollable"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem 1.5rem 2rem",
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          <AdminPermissionsScreen
            admin={permissionsAdmin}
            onBack={() => {
              setPermissionsAdmin(null);
              setViewMode("list");
            }}
            onSuccess={() => {
              showNotification({
                text: "Administrator permissions updated successfully!",
                type: "success",
              });
              setPermissionsAdmin(null);
              setViewMode("list");
            }}
          />
        </div>
      ) : (
        /* Unified Split-Catalog Layout Matching Upload Reports & See Reports Data */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            gap: "0.85rem",
          }}
        >
          {/* 1. Header Options on the Canvas (Identical to Upload Reports & See Reports Data) */}
          <div className="upload-filter-toolbar">
            {/* Left: Breadcrumbs */}
            <div className="upload-breadcrumb-wrap">
              <span
                className="upload-breadcrumb-root"
                onClick={() => handleTabChange("admins", undefined, "Operations")}
              >
                Settings
              </span>
              <ChevronRight size={14} style={{ color: "var(--ads-ink-tertiary)" }} />
              <span className="upload-breadcrumb-current">{activeGroup.groupTitle}</span>
              <ChevronRight size={14} style={{ color: "var(--ads-ink-tertiary)" }} />
              <span className="upload-breadcrumb-active-report">
                {activeItem.title}
                {activeItem.subSections && activeReport && (
                  <>
                    {" "}
                    <span style={{ color: "var(--ads-ink-quaternary)", fontWeight: 400 }}>•</span>{" "}
                    {activeItem.subSections.find((s) => s.id === activeReport)?.title || activeReport}
                  </>
                )}
              </span>
            </div>

            {/* Right: View by Segmented Capsule */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div className="upload-view-by-wrap">
                <span className="upload-view-by-label">View by</span>
                <div className="upload-segmented-capsule">
                  {SETTING_GROUPS.map((cat) => {
                    const isActive = activeGroup.groupTitle === cat.groupTitle;
                    return (
                      <button
                        key={cat.groupTitle}
                        type="button"
                        onClick={() => handleGroupSwitch(cat)}
                        className={`upload-segmented-btn ${isActive ? "active" : ""}`}
                      >
                        <span>{cat.groupTitle}</span>
                        <span className="upload-segmented-count">{cat.items.length}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Divided Screen: Left Catalog Sidebar + Right Workspace Container */}
          <div className="upload-split-layout">
            {/* Left: Settings Catalog Sidebar */}
            <aside className="upload-reports-sidebar">
              {/* Sidebar Header */}
              <div className="upload-sidebar-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span className="upload-sidebar-title">{activeGroup.groupTitle} Settings</span>
                </div>
                <span className="upload-sidebar-badge">
                  {visibleGroupItems.length} {visibleGroupItems.length === 1 ? "setting" : "settings"}
                </span>
              </div>

              {/* In-Sidebar Search Box */}
              <div
                style={{
                  padding: "var(--ads-s3) var(--ads-s4)",
                  borderBottom: "1px solid var(--ads-hairline)",
                  backgroundColor: "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ads-s2)",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    border: "1px solid var(--ads-hairline)",
                    borderRadius: "var(--ads-r-pill)",
                    padding: "6px var(--ads-s3)",
                  }}
                >
                  <Search size={14} style={{ color: "var(--ads-ink-quaternary)" }} />
                  <input
                    type="text"
                    placeholder={`Search ${activeGroup.groupTitle.toLowerCase()}...`}
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "0.78125rem",
                      color: "var(--ads-ink)",
                      width: "100%",
                      fontFamily: "inherit",
                    }}
                  />
                  {navSearch && (
                    <button
                      type="button"
                      onClick={() => setNavSearch("")}
                      aria-label="Clear settings search"
                      title="Clear search"
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

              {/* List of Setting Items */}
              <div className="upload-reports-list-scroll">
                {visibleGroupItems.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "var(--ads-ink-tertiary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <AlertCircle size={24} style={{ margin: "0 auto 0.5rem", color: "var(--ads-ink-quaternary)" }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No settings match "{navSearch}"</p>
                  </div>
                ) : (
                  visibleGroupItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const ItemIcon = item.icon;
                    const hasSubs = item.subSections && item.subSections.length > 0;
                    return (
                      <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <button
                          type="button"
                          onClick={() => handleTabChange(item.id)}
                          className={`upload-report-sidebar-item ${isActive ? "active" : ""}`}
                        >
                          {isActive && <span className="upload-item-indicator" />}
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "var(--ads-r-sm)",
                              backgroundColor: isActive ? "var(--ads-blue-tint)" : "rgba(0, 0, 0, 0.04)",
                              border: "1px solid var(--ads-hairline)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                            }}
                          >
                            <ItemIcon
                              size={16}
                              style={{ color: isActive ? "var(--ads-blue)" : "var(--ads-ink-tertiary)" }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.8125rem",
                                fontWeight: isActive ? 600 : 550,
                                letterSpacing: "-0.005em",
                                color: isActive ? "var(--ads-blue)" : "var(--ads-ink)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.title}
                            </div>
                          </div>

                          <ChevronRight
                            size={14}
                            style={{
                              color: isActive ? "var(--ads-blue)" : "var(--ads-ink-quaternary)",
                              flexShrink: 0,
                            }}
                          />
                        </button>

                        {/* Expand Sub-Sections if Active */}
                        {isActive && hasSubs && item.subSections && (
                          <div
                            style={{
                              paddingLeft: "2.25rem",
                              paddingRight: "0.4rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.2rem",
                              margin: "0.15rem 0 0.4rem",
                            }}
                          >
                            {item.subSections.map((sub) => {
                              const isSubActive = activeReport === sub.id;
                              const SubIcon = sub.icon;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={(e) => handleSubSectionClick(item.id, sub.id, e)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.38rem 0.65rem",
                                    borderRadius: "var(--ads-r-pill)",
                                    border: "1px solid transparent",
                                    backgroundColor: isSubActive ? "var(--ads-blue-tint)" : "transparent",
                                    color: isSubActive ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                                    fontSize: "0.75rem",
                                    fontWeight: isSubActive ? 600 : 500,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    width: "100%",
                                    transition:
                                      "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease)",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  {SubIcon && (
                                    <SubIcon
                                      size={12}
                                      style={{
                                        color: isSubActive ? "var(--ads-blue)" : "var(--ads-ink-quaternary)",
                                      }}
                                    />
                                  )}
                                  <span
                                    style={{
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
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
                  })
                )}
              </div>
            </aside>

            {/* Right: Workspace Container */}
            <section className="upload-workspace-container">
              {/* Unified Workspace Header */}
              <div
                style={{
                  padding: "var(--ads-s3) var(--ads-s5)",
                  borderBottom: "1px solid var(--ads-hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "var(--ads-s3)",
                  backgroundColor: "var(--ads-material-thin)",
                  backdropFilter: "var(--ads-blur-lg)",
                  WebkitBackdropFilter: "var(--ads-blur-lg)",
                  flexShrink: 0,
                }}
              >
                {/* Left: Active Item Identity & Category Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--ads-r-sm)",
                      backgroundColor: "var(--ads-blue-tint)",
                      border: "1px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--ads-blue)",
                      flexShrink: 0,
                    }}
                  >
                    <activeItem.icon size={18} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "1.0625rem",
                          fontWeight: 600,
                          color: "var(--ads-ink)",
                          letterSpacing: "-0.014em",
                        }}
                      >
                        {activeItem.title}
                      </h2>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          letterSpacing: "-0.005em",
                          color: "#0058B0",
                          backgroundColor: "var(--ads-blue-tint)",
                          border: "1px solid transparent",
                          padding: "3px 9px",
                          borderRadius: "var(--ads-r-pill)",
                        }}
                      >
                        {activeGroup.groupTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Contextual Controls (Sub-report pills or Admin Table actions) */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
                  {/* If item has subSections (Thresholds or Email Reporting) */}
                  {activeItem.subSections && activeItem.subSections.length > 0 && (
                    <div className="upload-segmented-capsule">
                      {activeItem.subSections.map((sub) => {
                        const isSubActive = activeReport === sub.id;
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={(e) => handleSubSectionClick(activeItem.id, sub.id, e)}
                            className={`upload-segmented-btn ${isSubActive ? "active" : ""}`}
                            style={{ padding: "0.28rem 0.75rem", fontSize: "0.75rem" }}
                          >
                            {SubIcon && <SubIcon size={12} />}
                            <span>{sub.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* If activeTab is admins: search box & Add admin button */}
                  {activeTab === "admins" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="standard-search-wrap" style={{ width: "220px" }}>
                        <Search size={14} className="standard-search-icon" />
                        <input
                          type="text"
                          className="standard-search-input"
                          placeholder="Search admins..."
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                        />
                        {adminSearchQuery && (
                          <button
                            type="button"
                            className="standard-search-clear"
                            onClick={() => setAdminSearchQuery("")}
                            aria-label="Clear admin search"
                            title="Clear search"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-blue-primary btn-sm"
                        onClick={() => setViewMode("add")}
                        style={{ color: "#FFFFFF" }}
                      >
                        <UserPlus size={14} style={{ color: "#FFFFFF" }} />
                        <span style={{ color: "#FFFFFF" }}>Add admin</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Workspace Body: Render active panel */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {activeTab === "admins" && (
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <AdminTable
                      admins={filteredAdmins}
                      onEditAdmin={(admin) => {
                        setEditingAdmin(admin);
                        setViewMode("edit");
                      }}
                      onManagePermissions={(admin) => {
                        setPermissionsAdmin(admin);
                        setViewMode("permissions");
                      }}
                      onDeleteAdmin={(admin) => setDeletingAdmin(admin)}
                      onNotification={showNotification}
                    />
                  </div>
                )}

                {/* Operations Panels */}
                {activeTab === "lmd_drive_access" && (
                  <LmdDriveAccessPanel onNotification={showNotification} />
                )}
                {activeTab === "roles" && (
                  <RoleManagementPanel onNotification={showNotification} />
                )}
                {activeTab === "password" && (
                  <ChangePasswordPanel onNotification={showNotification} />
                )}

                {/* Performance Panels */}
                {activeTab === "thresholds" && (
                  <PerformanceThresholdSettingsPanel onNotification={showNotification} />
                )}
                {activeTab === "email_reporting" && (
                  <PerformanceEmailReportingPanel onNotification={showNotification} />
                )}
                {activeTab === "driver_rating" && (
                  <DriverRatingSettingsPanel onNotification={showNotification} />
                )}
                {activeTab === "e_signature" && (
                  <ESignatureSettingsPanel onNotification={showNotification} />
                )}

                {/* Communications Panels */}
                {activeTab === "in_app_chat" && (
                  <InAppChatAccessPanel onNotification={showNotification} />
                )}
                {activeTab === "reminders" && (
                  <RemindersSettingsPanel onNotification={showNotification} />
                )}

                {/* Scheduler Panels */}
                {activeTab === "shift_rules" && (
                  <ShiftRulesSettingsPanel onNotification={showNotification} />
                )}
                {activeTab === "scheduler_format" && (
                  <SchedulerFormatSettingsPanel onNotification={showNotification} />
                )}

                {/* Fleet Panels */}
                {activeTab === "vehicle_mgmt" && (
                  <VehicleManagementPanel onNotification={showNotification} />
                )}
                {activeTab === "service_mgmt" && (
                  <ServiceManagementPanel onNotification={showNotification} />
                )}

                {/* Preferences Panels */}
                {activeTab === "app_layout" && (
                  <div
                    style={{
                      padding: "var(--ads-s5) var(--ads-s6) var(--ads-s8)",
                      height: "100%",
                      overflowY: "auto",
                    }}
                  >
                    <AppLayoutSettingsPanel />
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Delete Administrator Confirmation Modal */}
      <DeleteAdminModal
        admin={deletingAdmin}
        isOpen={Boolean(deletingAdmin)}
        onClose={() => setDeletingAdmin(null)}
        onSuccess={() =>
          showNotification({
            text: "Administrator deleted successfully!",
            type: "success",
          })
        }
      />
    </GlassAppLayout>
  );
};

export default SettingsPage;
