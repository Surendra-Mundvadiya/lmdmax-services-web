import React, { FC, useState, useRef, useEffect } from "react";
import {
  Edit2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from "lucide-react";
import type { AdminUser, AdminRole } from "../../../types/admin";
import { useAdminStore } from "../../../store/adminStore";
import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";

interface AdminTableProps {
  admins: AdminUser[];
  onEditAdmin: (admin: AdminUser) => void;
  onManagePermissions: (admin: AdminUser) => void;
  onDeleteAdmin: (admin: AdminUser) => void;
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

type SortField = "name" | "phone" | "email" | "allow_login";

export const AdminTable: FC<AdminTableProps> = ({
  admins,
  onEditAdmin,
  onManagePermissions,
  onDeleteAdmin,
  onNotification,
}) => {
  const toggleAdminLogin = useAdminStore((state) => state.toggleAdminLogin);

  const [sortKey, setSortKey] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close actions dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenActionId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSort = (key: SortField) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedAdmins = [...admins].sort((a, b) => {
    // Owner is always prioritized at the top
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (b.role === "owner" && a.role !== "owner") return 1;

    if (sortKey === "allow_login") {
      const numA = a.allow_login ? 1 : 0;
      const numB = b.allow_login ? 1 : 0;
      return sortDir === "asc" ? numA - numB : numB - numA;
    }

    const valA = a[sortKey] ?? "";
    const valB = b[sortKey] ?? "";
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });


  const formatPhone = (phoneStr: string) => {
    if (!phoneStr || phoneStr === "—" || phoneStr === "*****") return phoneStr || "—";
    const clean = phoneStr.replace(/\D/g, "");
    if (clean.length === 10) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return phoneStr;
  };

  const handleDelete = (admin: AdminUser) => {
    if (admin.role === "owner" || admin.type === "1") {
      onNotification({
        text: "The primary account owner cannot be removed.",
        type: "error",
      });
      return;
    }

    onDeleteAdmin(admin);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortKey !== field) {
      return <ArrowUpDown size={12} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="text-blue-600 font-bold" />
    ) : (
      <ArrowDown size={12} className="text-blue-600 font-bold" />
    );
  };

  if (admins.length === 0) {
    return (
      <div className="driver-table-empty-state">
        <div className="empty-state-icon-box">
          <AlertCircle size={28} className="text-blue-500" />
        </div>
        <h4 className="empty-state-heading">No administrators found</h4>
        <p className="empty-state-desc">
          No administrators found for the selected delivery station or search filter.
        </p>
      </div>
    );
  }

  return (
    <div className="driver-table-wrapper">
      <table className="driver-data-table">
        <thead>
          <tr className="driver-table-head-row">
            {/* 1. Allow Access (Performance App 1st column) */}
            <th
              className="table-col-status text-center cursor-pointer select-none group"
              onClick={() => handleSort("allow_login")}
              title={
                sortKey === "allow_login"
                  ? `Sorted by login access (${sortDir === "asc" ? "enabled first" : "revoked first"}) - click to reverse`
                  : "Click to sort by Allow Access"
              }
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>Allow access</span>
                {renderSortIcon("allow_login")}
              </div>
            </th>

            {/* 2. Name */}
            <th
              className="table-col-name cursor-pointer select-none group"
              onClick={() => handleSort("name")}
              title={
                sortKey === "name"
                  ? `Sorted by name (${sortDir === "asc" ? "ascending" : "descending"}) - click to reverse`
                  : "Click to sort by Name"
              }
            >
              <div className="flex items-center gap-1.5">
                <span>Name</span>
                {renderSortIcon("name")}
              </div>
            </th>

            {/* 3. Email ID (Performance App column name) */}
            <th
              className="table-col-email cursor-pointer select-none group"
              onClick={() => handleSort("email")}
              title={
                sortKey === "email"
                  ? `Sorted by email (${sortDir === "asc" ? "ascending" : "descending"}) - click to reverse`
                  : "Click to sort by Email ID"
              }
            >
              <div className="flex items-center gap-1.5">
                <span>Email ID</span>
                {renderSortIcon("email")}
              </div>
            </th>

            {/* 4. Phone Number */}
            <th
              className="table-col-phone cursor-pointer select-none group"
              onClick={() => handleSort("phone")}
              title={
                sortKey === "phone"
                  ? `Sorted by phone number (${sortDir === "asc" ? "ascending" : "descending"}) - click to reverse`
                  : "Click to sort by Phone Number"
              }
            >
              <div className="flex items-center gap-1.5">
                <span>Phone number</span>
                {renderSortIcon("phone")}
              </div>
            </th>

            {/* 5. Actions */}
            <th className="table-col-actions text-center">
              <span>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedAdmins.map((admin) => (
            <tr
              key={admin.id}
              className={`driver-table-row ${!admin.allow_login ? "row-inactive" : ""}`}
            >
              {/* 1. Allow Access Cell */}
              <td className="table-col-status text-center">
                {admin.role === "owner" || admin.type === "1" ? (
                  <div className="flex items-center justify-center" title="Primary owner access cannot be revoked">
                    <span className="text-xs text-slate-400 font-medium select-none">—</span>
                  </div>
                ) : (
                  <div className="status-toggle-cell justify-center">
                    <label
                      className="custom-blue-switch"
                      title={admin.allow_login ? "Active" : "Inactive"}
                    >
                      <input
                        type="checkbox"
                        checked={admin.allow_login}
                        onChange={() => {
                          toggleAdminLogin(admin.id);
                          onNotification({
                            text: "Administrator access updated successfully!",
                            type: "success",
                          });
                        }}
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>
                )}
              </td>

              {/* 2. Name Cell with avatar */}
              <td className="table-col-name">
                <div className="driver-name-cell">
                  <div
                    className="unified-avatar-circle sm"
                    style={{ background: getAvatarColor(admin.name, "admin") }}
                    title={admin.name}
                  >
                    <span>{getInitials(admin.name)}</span>
                  </div>
                  <div className="driver-name-info">
                    <span className="driver-fullname-text" title={admin.name}>
                      {admin.name}
                    </span>
                  </div>
                </div>
              </td>

              {/* 3. Email ID Cell (Clean single cell, no duplication) */}
              <td className="table-col-email">
                <span className="email-cell-text truncate" title={`Email ID: ${admin.email}`}>
                  {admin.email}
                </span>
              </td>

              {/* 4. Phone Number Cell */}
              <td className="table-col-phone">
                <span className="phone-cell-text" title={`Phone Number: ${formatPhone(admin.phone)}`}>
                  {formatPhone(admin.phone)}
                </span>
              </td>

              {/* 5. Actions Cell (Direct action icon buttons matching Performance App) */}
              <td className="table-col-actions text-center">
                {admin.role === "owner" || admin.type === "1" ? (
                  <span className="text-xs text-slate-400 font-medium select-none">—</span>
                ) : (
                  <div className="admin-action-btn-group">
                    {/* Edit Admin */}
                    <button
                      type="button"
                      className="admin-action-icon-btn btn-edit"
                      onClick={() => onEditAdmin(admin)}
                      title={`Edit details for ${admin.name}`}
                      aria-label="Edit"
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Set Permissions */}
                    <button
                      type="button"
                      className="admin-action-icon-btn btn-perm"
                      onClick={() => onManagePermissions(admin)}
                      title={`Set permissions for ${admin.name}`}
                      aria-label="Set Permissions"
                    >
                      <ShieldCheck size={16} />
                    </button>


                    {/* Delete Admin */}
                    <button
                      type="button"
                      className="admin-action-icon-btn btn-delete"
                      onClick={() => handleDelete(admin)}
                      title={`Remove administrator ${admin.name}`}
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
