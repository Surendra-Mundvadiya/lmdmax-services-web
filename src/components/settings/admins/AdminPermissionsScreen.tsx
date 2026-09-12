import React, { FC, useState, useEffect } from "react";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  PackageCheck,
  Users,
  Truck,
  ClipboardCheck,
  Calendar,
  BarChart3,
  MessageSquare,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import type { AdminUser, AdminPermissions, ModulePermission } from "../../../types/admin";
import {
  useAdminStore,
  DEFAULT_PERMISSIONS,
  OWNER_PERMISSIONS,
} from "../../../store/adminStore";

interface AdminPermissionsScreenProps {
  admin: AdminUser;
  onBack: () => void;
  onSuccess: (adminName: string) => void;
}

interface ModuleDefinition {
  key: keyof AdminPermissions | string;
  rtsKey: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    key: "rts_checkout",
    rtsKey: "rts_mobile",
    label: "RTS Check-in & Checkout",
    category: "RTS Operations",
    icon: PackageCheck,
  },
  {
    key: "drivers",
    rtsKey: "drivers",
    label: "Drivers & Roster",
    category: "Workforce",
    icon: Users,
  },
  {
    key: "fleet",
    rtsKey: "vehicles",
    label: "Fleet & Vehicles",
    category: "Assets",
    icon: Truck,
  },
  {
    key: "inspections",
    rtsKey: "inspection_view",
    label: "Inspections & DVIC",
    category: "Safety",
    icon: ClipboardCheck,
  },
  {
    key: "dispatch",
    rtsKey: "dispatch",
    label: "Dispatch & Scheduling",
    category: "Dispatch",
    icon: Calendar,
  },
  {
    key: "reports",
    rtsKey: "reports",
    label: "Reports & Performance",
    category: "Analytics",
    icon: BarChart3,
  },
  {
    key: "chat",
    rtsKey: "chat",
    label: "In-App Messaging & Broadcasts",
    category: "Communications",
    icon: MessageSquare,
  },
  {
    key: "accident_reporting",
    rtsKey: "accident_reporting",
    label: "Accident & Claim Reporting",
    category: "Compliance",
    icon: AlertTriangle,
  },
  {
    key: "repair_management",
    rtsKey: "repair_management",
    label: "Repair & Maintenance Management",
    category: "Maintenance",
    icon: Wrench,
  },
];

export const AdminPermissionsScreen: FC<AdminPermissionsScreenProps> = ({
  admin,
  onBack,
}) => {
  const updateAdminPermissions = useAdminStore((state) => state.updateAdminPermissions);
  const fetchAdminPermissionsApi = useAdminStore((state) => state.fetchAdminPermissionsApi);
  const saveAdminPermissionsApi = useAdminStore((state) => state.saveAdminPermissionsApi);

  const isOwner = admin.role === "owner" || admin.type === "1";

  // Local state for module permissions
  const [permissions, setPermissions] = useState<Record<string, ModulePermission>>(() => {
    if (isOwner) return OWNER_PERMISSIONS as any;
    return {
      ...(DEFAULT_PERMISSIONS as any),
      ...(admin.permissions || {}),
      chat: { enabled: true, view: true, add: true, edit: true, download: false, delete: false },
      accident_reporting: { enabled: true, view: true, add: true, edit: true, download: true, delete: false },
      repair_management: { enabled: true, view: true, add: true, edit: true, download: true, delete: false },
    };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch real-time permissions from RTS Checkout endpoint
  useEffect(() => {
    let isMounted = true;
    const loadPermissions = async () => {
      setIsLoading(true);
      try {
        const res = await fetchAdminPermissionsApi(admin.id);
        if (isMounted && res.success && res.data) {
          const rawData = res.data;
          const userPerms = rawData.user_permissions || {};

          setPermissions((prev) => {
            const next = { ...prev };

            MODULE_DEFINITIONS.forEach((mod) => {
              const rtsPage = userPerms[mod.rtsKey] || userPerms[mod.key];
              if (rtsPage) {
                const isEnabled = rtsPage.enabled !== undefined ? Boolean(rtsPage.enabled) : true;
                const existing = next[mod.key] || {
                  enabled: true,
                  view: true,
                  add: false,
                  edit: false,
                  download: false,
                  delete: false,
                };

                let hasAdd = existing.add;
                let hasEdit = existing.edit;
                let hasDownload = existing.download;
                let hasDelete = existing.delete;

                const subKeys = Object.keys(userPerms).filter((k) =>
                  k.startsWith(`${mod.rtsKey}__`)
                );
                if (subKeys.length > 0) {
                  hasAdd = subKeys.some((k) => userPerms[k]?.permission?.includes("add"));
                  hasEdit = subKeys.some((k) => userPerms[k]?.permission?.includes("edit"));
                  hasDownload = subKeys.some((k) => userPerms[k]?.permission?.includes("download"));
                  hasDelete = subKeys.some((k) => userPerms[k]?.permission?.includes("delete"));
                }

                next[mod.key] = {
                  enabled: isEnabled,
                  view: isEnabled,
                  add: hasAdd,
                  edit: hasEdit,
                  download: hasDownload,
                  delete: hasDelete,
                };
              }
            });

            return next;
          });
        }
      } catch {
        // graceful fallback to current admin permissions
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, [admin.id, fetchAdminPermissionsApi]);

  // Build RTS Checkout permission_json payload
  const buildRtsPermissionJson = (perms: Record<string, ModulePermission>) => {
    const rtsPermissionJson: Record<string, any> = {};

    MODULE_DEFINITIONS.forEach((mod) => {
      const p = perms[mod.key] || {
        enabled: true,
        view: true,
        add: false,
        edit: false,
        download: false,
        delete: false,
      };

      rtsPermissionJson[mod.rtsKey] = {
        enabled: p.enabled,
      };

      const activeOps: string[] = [];
      if (p.enabled) activeOps.push("view");
      if (p.add) activeOps.push("add");
      if (p.edit) activeOps.push("edit");
      if (p.download) activeOps.push("download");
      if (p.delete) activeOps.push("delete");

      rtsPermissionJson[`${mod.rtsKey}__main`] = {
        enabled: p.enabled,
        permission: activeOps,
      };
    });

    return rtsPermissionJson;
  };

  // Real-time auto-persist on change
  const persistPermissions = async (nextPerms: Record<string, ModulePermission>) => {
    setPermissions(nextPerms);
    updateAdminPermissions(admin.id, nextPerms as unknown as AdminPermissions);
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = buildRtsPermissionJson(nextPerms);
      await saveAdminPermissionsApi(admin.id, payload);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active state for a module
  const handleToggleModule = (modKey: string) => {
    if (isOwner) return;
    const current = permissions[modKey] || {
      enabled: true,
      view: true,
      add: false,
      edit: false,
      download: false,
      delete: false,
    };
    const nextState = {
      ...permissions,
      [modKey]: {
        ...current,
        enabled: !current.enabled,
        view: !current.enabled,
      },
    };
    persistPermissions(nextState);
  };

  // Toggle specific action (add, edit, download, delete)
  const handleToggleAction = (
    modKey: string,
    action: "add" | "edit" | "download" | "delete"
  ) => {
    if (isOwner) return;
    const current = permissions[modKey] || {
      enabled: true,
      view: true,
      add: false,
      edit: false,
      download: false,
      delete: false,
    };
    const nextState = {
      ...permissions,
      [modKey]: {
        ...current,
        [action]: !current[action],
      },
    };
    persistPermissions(nextState);
  };

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      {/* 1. Only "Back to Admins" option at the top */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          title="Return to Administrators"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "6px",
            border: "1px solid #CBD5E1",
            backgroundColor: "#FFFFFF",
            color: "#2563EB",
            fontSize: "0.8125rem",
            fontWeight: 650,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EFF6FF")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
        >
          <ArrowLeft size={16} />
          <span>Back to Admins</span>
        </button>

        {isSaving && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              color: "#64748B",
              fontWeight: 500,
            }}
          >
            <Loader2 size={13} className="animate-spin text-blue-600" />
            <span>Saving changes...</span>
          </div>
        )}
      </div>

      {/* 2. Alert feedback if any save error */}
      {saveError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            fontSize: "0.8125rem",
            color: "#B91C1C",
            marginBottom: "1rem",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{saveError}</span>
        </div>
      )}

      {/* 3. Owner Notice */}
      {isOwner && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: "8px",
            fontSize: "0.8125rem",
            color: "#1E40AF",
            marginBottom: "1rem",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, color: "#2563EB" }} />
          <span>
            <strong>Account Owner</strong> has full administrative access and permissions across all modules by default.
          </span>
        </div>
      )}

      {/* 4. Clean Table Card (No View column, No subtitles) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 2rem",
              gap: "0.75rem",
            }}
          >
            <Loader2 size={30} className="animate-spin text-blue-600" />
            <span style={{ fontSize: "0.875rem", color: "#64748B", fontWeight: 500 }}>
              Loading permissions...
            </span>
          </div>
        ) : (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <th
                    style={{
                      padding: "0.85rem 1.25rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "capitalize",
                      letterSpacing: "0.02em",
                      width: "35%",
                    }}
                  >
                    Feature module
                  </th>
                  <th
                    style={{
                      padding: "0.85rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "capitalize",
                      letterSpacing: "0.02em",
                      textAlign: "center",
                      width: "13%",
                    }}
                  >
                    Active
                  </th>
                  <th
                    style={{
                      padding: "0.85rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "capitalize",
                      letterSpacing: "0.02em",
                      textAlign: "center",
                      width: "13%",
                    }}
                  >
                    Add
                  </th>
                  <th
                    style={{
                      padding: "0.85rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "capitalize",
                      letterSpacing: "0.02em",
                      textAlign: "center",
                      width: "13%",
                    }}
                  >
                    Edit
                  </th>
                  <th
                    style={{
                      padding: "0.85rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "capitalize",
                      letterSpacing: "0.02em",
                      textAlign: "center",
                      width: "13%",
                    }}
                  >
                    Download
                  </th>
                  <th
                    style={{
                      padding: "0.85rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "capitalize",
                      letterSpacing: "0.02em",
                      textAlign: "center",
                      width: "13%",
                    }}
                  >
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODULE_DEFINITIONS.map((mod, idx) => {
                  const p = permissions[mod.key] || {
                    enabled: true,
                    view: true,
                    add: false,
                    edit: false,
                    download: false,
                    delete: false,
                  };
                  const Icon = mod.icon;
                  const isLastRow = idx === MODULE_DEFINITIONS.length - 1;

                  return (
                    <tr
                      key={mod.key}
                      style={{
                        borderBottom: isLastRow ? "none" : "1px solid #F1F5F9",
                        backgroundColor: p.enabled ? "#FFFFFF" : "#FBFDFF",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = p.enabled ? "#FFFFFF" : "#FBFDFF")
                      }
                    >
                      {/* 1. Feature Module Name (Clean: No Subtitle/Descriptions) */}
                      <td style={{ padding: "0.75rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "7px",
                              backgroundColor: p.enabled ? "#EFF6FF" : "#F1F5F9",
                              color: p.enabled ? "#2563EB" : "#94A3B8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: p.enabled ? "#0F172A" : "#64748B",
                              lineHeight: "1.3",
                            }}
                          >
                            {mod.label}
                          </span>
                        </div>
                      </td>

                      {/* 2. Active Toggle Switch */}
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <label
                          className="driver-status-toggle"
                          style={{
                            margin: "0 auto",
                            display: "inline-block",
                            opacity: isOwner ? 0.75 : 1,
                            cursor: isOwner ? "not-allowed" : "pointer",
                          }}
                          title={p.enabled ? "Active" : "Inactive"}
                        >
                          <input
                            type="checkbox"
                            checked={p.enabled}
                            disabled={isOwner}
                            onChange={() => handleToggleModule(mod.key)}
                          />
                          <span className="driver-toggle-slider round" />
                        </label>
                      </td>

                      {/* 3. Add Checkbox */}
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={p.add}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleToggleAction(mod.key, "add")}
                          title={`Toggle Add for ${mod.label}`}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: isOwner || !p.enabled ? "not-allowed" : "pointer",
                            accentColor: "#2563EB",
                            borderRadius: "4px",
                            opacity: p.enabled ? 1 : 0.35,
                          }}
                        />
                      </td>

                      {/* 4. Edit Checkbox */}
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={p.edit}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleToggleAction(mod.key, "edit")}
                          title={`Toggle Edit for ${mod.label}`}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: isOwner || !p.enabled ? "not-allowed" : "pointer",
                            accentColor: "#2563EB",
                            borderRadius: "4px",
                            opacity: p.enabled ? 1 : 0.35,
                          }}
                        />
                      </td>

                      {/* 5. Download Checkbox */}
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={p.download}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleToggleAction(mod.key, "download")}
                          title={`Toggle Download for ${mod.label}`}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: isOwner || !p.enabled ? "not-allowed" : "pointer",
                            accentColor: "#2563EB",
                            borderRadius: "4px",
                            opacity: p.enabled ? 1 : 0.35,
                          }}
                        />
                      </td>

                      {/* 6. Delete Checkbox */}
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={p.delete}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleToggleAction(mod.key, "delete")}
                          title={`Toggle Delete for ${mod.label}`}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: isOwner || !p.enabled ? "not-allowed" : "pointer",
                            accentColor: "#2563EB",
                            borderRadius: "4px",
                            opacity: p.enabled ? 1 : 0.35,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPermissionsScreen;
