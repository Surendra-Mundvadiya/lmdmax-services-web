import React, { FC, useState, useEffect } from "react";
import { X, ShieldCheck, Check, RotateCcw } from "lucide-react";
import type { AdminUser, AdminPermissions, ModulePermission } from "../../../types/admin";
import { useAdminStore, DEFAULT_PERMISSIONS, OWNER_PERMISSIONS } from "../../../store/adminStore";

interface AdminPermissionsModalProps {
  admin: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminName: string) => void;
}

interface ModuleMeta {
  key: keyof AdminPermissions;
  label: string;
  desc: string;
}

const MODULES: ModuleMeta[] = [
  {
    key: "rts_checkout",
    label: "RTS Check-in & Checkout",
    desc: "Evening checkout, pouch collection, returned packages & route audits",
  },
  {
    key: "drivers",
    label: "Drivers & Roster",
    desc: "Transporter IDs, driver onboarding, mobile access & profile management",
  },
  {
    key: "fleet",
    label: "Fleet & Vehicles",
    desc: "Van assignments, vehicle tracking, maintenance & damage audits",
  },
  {
    key: "inspections",
    label: "Inspections & DVIC",
    desc: "Mandatory pre/post vehicle condition checks, defects & photos",
  },
  {
    key: "dispatch",
    label: "Dispatch & Scheduling",
    desc: "Shift rosters, route coverage, live delivery status & rescue calls",
  },
  {
    key: "reports",
    label: "Reports & Performance",
    desc: "Daily/weekly scorecard exports, safety metrics & payroll reports",
  },
];

export const AdminPermissionsModal: FC<AdminPermissionsModalProps> = ({
  admin,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const updateAdminPermissions = useAdminStore((state) => state.updateAdminPermissions);

  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    if (admin) {
      setPermissions(admin.permissions || DEFAULT_PERMISSIONS);
    }
  }, [admin]);

  if (!isOpen || !admin) return null;

  const isOwner = admin.role === "owner";

  const handleToggleModule = (modKey: keyof AdminPermissions) => {
    if (isOwner) return;
    setPermissions((prev) => ({
      ...prev,
      [modKey]: {
        ...prev[modKey],
        enabled: !prev[modKey].enabled,
      },
    }));
  };

  const handleTogglePermission = (
    modKey: keyof AdminPermissions,
    action: keyof Omit<ModulePermission, "enabled">
  ) => {
    if (isOwner) return;
    setPermissions((prev) => ({
      ...prev,
      [modKey]: {
        ...prev[modKey],
        [action]: !prev[modKey][action],
      },
    }));
  };

  const handleResetDefaults = () => {
    if (isOwner) {
      setPermissions(OWNER_PERMISSIONS);
    } else {
      setPermissions(DEFAULT_PERMISSIONS);
    }
  };

  const handleSave = () => {
    updateAdminPermissions(admin.id, permissions);
    onSuccess(admin.name);
    onClose();
  };

  return (
    <div className="custom-modal-overlay ads-admin-modal-overlay">
      <div className="custom-modal-dialog max-w-3xl ads-admin-modal">
        {/* Modal Header */}
        <div className="custom-modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="custom-modal-title">Module Permissions & Access Control</h3>
              <p className="text-xs text-slate-500">
                Configuring permissions for{" "}
                <strong className="text-slate-800">{admin.name}</strong> ({admin.role.replace("_", " ")})
              </p>
            </div>
          </div>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="custom-modal-body">
          {isOwner && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-3 flex items-center gap-2">
              <span>Account Owner has full administrative permissions across all modules by default.</span>
            </div>
          )}

          <div className="permissions-matrix-table-wrap">
            <table className="permissions-matrix-table">
              <thead>
                <tr>
                  <th className="perm-col-module">Feature Module</th>
                  <th className="perm-col-enable text-center">Active</th>
                  <th className="perm-col-check text-center">View</th>
                  <th className="perm-col-check text-center">Add</th>
                  <th className="perm-col-check text-center">Edit</th>
                  <th className="perm-col-check text-center">Download</th>
                  <th className="perm-col-check text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod) => {
                  const p = permissions[mod.key] || {
                    enabled: true,
                    view: true,
                    add: false,
                    edit: false,
                    download: false,
                    delete: false,
                  };

                  return (
                    <tr
                      key={mod.key}
                      className={`perm-matrix-row ${!p.enabled ? "perm-row-disabled" : ""}`}
                    >
                      {/* Feature Name & description */}
                      <td className="perm-col-module">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-xs">{mod.label}</span>
                          <span className="text-[11px] text-slate-400">{mod.desc}</span>
                        </div>
                      </td>

                      {/* Enable Switch */}
                      <td className="perm-col-enable text-center">
                        <label className="custom-blue-switch">
                          <input
                            type="checkbox"
                            checked={p.enabled}
                            disabled={isOwner}
                            onChange={() => handleToggleModule(mod.key)}
                          />
                          <span className="switch-slider" />
                        </label>
                      </td>

                      {/* View Checkbox */}
                      <td className="perm-col-check text-center">
                        <input
                          type="checkbox"
                          className="custom-table-checkbox"
                          checked={p.view}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleTogglePermission(mod.key, "view")}
                        />
                      </td>

                      {/* Add Checkbox */}
                      <td className="perm-col-check text-center">
                        <input
                          type="checkbox"
                          className="custom-table-checkbox"
                          checked={p.add}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleTogglePermission(mod.key, "add")}
                        />
                      </td>

                      {/* Edit Checkbox */}
                      <td className="perm-col-check text-center">
                        <input
                          type="checkbox"
                          className="custom-table-checkbox"
                          checked={p.edit}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleTogglePermission(mod.key, "edit")}
                        />
                      </td>

                      {/* Download Checkbox */}
                      <td className="perm-col-check text-center">
                        <input
                          type="checkbox"
                          className="custom-table-checkbox"
                          checked={p.download}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleTogglePermission(mod.key, "download")}
                        />
                      </td>

                      {/* Delete Checkbox */}
                      <td className="perm-col-check text-center">
                        <input
                          type="checkbox"
                          className="custom-table-checkbox"
                          checked={p.delete}
                          disabled={isOwner || !p.enabled}
                          onChange={() => handleTogglePermission(mod.key, "delete")}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal Footer with strict 0.85rem button gap */}
          <div
            className="modal-footer"
            style={{
              display: "flex",
              gap: "0.85rem",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.25rem",
            }}
          >
            <button
              type="button"
              className="btn-outline-cancel text-xs flex items-center gap-1"
              disabled={isOwner}
              onClick={handleResetDefaults}
            >
              <RotateCcw size={13} />
              <span>Reset to Defaults</span>
            </button>

            <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
              <button
                type="button"
                className="btn-outline-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-blue-primary"
                onClick={handleSave}
                style={{ color: "#FFFFFF" }}
              >
                <span style={{ color: "#FFFFFF" }}>Save Permissions</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPermissionsModal;
