import React, { FC, useState } from "react";
import { UserCheck, Shield, Check, Save, AlertCircle } from "lucide-react";

interface RoleManagementPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  userCount: number;
  permissions: {
    dispatch: boolean;
    reports: boolean;
    fleet: boolean;
    chat: boolean;
    drivers: boolean;
    settings: boolean;
  };
}

const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: "owner",
    name: "Account Owner",
    description: "Full root access to all modules, billing, user creation, and station management.",
    userCount: 1,
    permissions: {
      dispatch: true,
      reports: true,
      fleet: true,
      chat: true,
      drivers: true,
      settings: true,
    },
  },
  {
    id: "ops_manager",
    name: "Operations Manager",
    description: "Manages daily dispatch rosters, driver assignments, fleet maintenance, and reports.",
    userCount: 3,
    permissions: {
      dispatch: true,
      reports: true,
      fleet: true,
      chat: true,
      drivers: true,
      settings: false,
    },
  },
  {
    id: "dispatcher",
    name: "Dispatcher / Lead",
    description: "Real-time dispatch coordination, driver communications, and route coverage rescues.",
    userCount: 5,
    permissions: {
      dispatch: true,
      reports: false,
      fleet: true,
      chat: true,
      drivers: true,
      settings: false,
    },
  },
  {
    id: "safety_coordinator",
    name: "Safety Coordinator",
    description: "Monitors Netradyne safety scores, FICO violations, DVIC checklists, and accident logs.",
    userCount: 2,
    permissions: {
      dispatch: false,
      reports: true,
      fleet: true,
      chat: true,
      drivers: true,
      settings: false,
    },
  },
];

export const RoleManagementPanel: FC<RoleManagementPanelProps> = ({ onNotification }) => {
  const [roles, setRoles] = useState<RoleDefinition[]>(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("ops_manager");
  const [isSaving, setIsSaving] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const handleTogglePermission = (key: keyof RoleDefinition["permissions"]) => {
    if (selectedRole.id === "owner") return; // Owner permissions locked to full access

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRole.id) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [key]: !role.permissions[key],
            },
          };
        }
        return role;
      })
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "Role permissions updated successfully!",
        type: "success",
      });
    }, 400);
  };

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Configure system roles, operational responsibilities, and module permission levels
        </p>
      </div>

      <div className="settings-grid">
        {/* Roles List */}
        <div className="settings-card lg:col-span-1">
          <div className="settings-card-title-row">
            <h3 className="settings-card-title">
              <Shield size={16} />
              <span>Defined Roles</span>
            </h3>
            <span className="ads-caption">{roles.length} Roles</span>
          </div>

          <div className="settings-stack">
            {roles.map((role) => {
              const isActive = role.id === selectedRole.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--ads-s1)",
                    padding: "var(--ads-s3)",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    background: isActive ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
                    border: isActive
                      ? "1px solid var(--ads-blue)"
                      : "1px solid var(--ads-hairline)",
                    borderRadius: "var(--ads-r-sm)",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--ads-s2)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: isActive ? "var(--ads-blue)" : "var(--ads-ink)",
                      }}
                    >
                      {role.name}
                    </span>
                    <span className="ads-badge ads-badge--neutral">
                      {role.userCount} {role.userCount === 1 ? "user" : "users"}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      lineHeight: 1.45,
                      color: "var(--ads-ink-tertiary)",
                    }}
                  >
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Permissions Matrix */}
        <div className="settings-card lg:col-span-2">
          <div className="settings-card-title-row">
            <div>
              <h3 className="settings-card-title">
                <span>{selectedRole.name} Permissions</span>
              </h3>
              <p className="settings-card-desc">{selectedRole.description}</p>
            </div>
            {selectedRole.id === "owner" && (
              <span className="ads-badge ads-badge--amber">
                Root Account (Full Access)
              </span>
            )}
          </div>

          <div className="settings-stack">
            {[
              {
                key: "dispatch" as const,
                label: "Dispatch & Shift Scheduling",
                desc: "Roster upload, daily shift assignment, and real-time route rescues",
              },
              {
                key: "drivers" as const,
                label: "Driver Operations",
                desc: "Driver profile management, status toggles, and mobile app sign-in allowances",
              },
              {
                key: "fleet" as const,
                label: "Fleet & Vehicle Management",
                desc: "Vehicle assignment, VIN tracking, and preventive maintenance work orders",
              },
              {
                key: "reports" as const,
                label: "Reports & Performance Scorecards",
                desc: "Weekly scorecard metrics, DA performance digest, and safety exports",
              },
              {
                key: "chat" as const,
                label: "In-App Messaging & Broadcasts",
                desc: "Direct driver messaging, announcement broadcast channels, and alert dispatches",
              },
              {
                key: "settings" as const,
                label: "Administrator & System Settings",
                desc: "Station user addition, permissions modification, and security controls",
              },
            ].map((perm) => {
              const isEnabled = selectedRole.permissions[perm.key];
              const isLocked = selectedRole.id === "owner";

              return (
                <div key={perm.key} className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-title">{perm.label}</span>
                    <span className="settings-toggle-desc">{perm.desc}</span>
                  </div>

                  <label
                    className="custom-blue-switch"
                    title={isLocked ? "Root owner permission is permanently active" : "Toggle module permission"}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={isLocked}
                      onChange={() => handleTogglePermission(perm.key)}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              );
            })}
          </div>

          <div className="settings-footer-actions">
            <button
              type="button"
              className="btn-blue-primary"
              disabled={isSaving || selectedRole.id === "owner"}
              onClick={handleSave}
              style={{ color: "#FFFFFF" }}
            >
              <Save size={15} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Role Permissions"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementPanel;
