import React, { FC, useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  User,
  AlertCircle,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Driver } from "../../../types/driver";
import { useDriverStore } from "../../../store/driverStore";
import DriverExpandedRow from "./DriverExpandedRow";
import DeleteDriverModal from "./DeleteDriverModal";
import { formatDriverPhone } from "../../../utils/driverValidators";
import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";

type SortField = "name" | "phone" | "email" | "transporter_id" | "status";

interface DriverTableProps {
  drivers: Driver[];
  selectedDriverIds: number[];
  onSelectDriver: (id: number) => void;
  onSelectAll: () => void;
  onEditDriver: (driver: Driver) => void;
  onViewProfile?: (driver: Driver) => void;
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
  readOnly?: boolean;
  readOnlyReason?: string;
}

export const DriverTable: FC<DriverTableProps> = ({
  drivers,
  selectedDriverIds,
  onSelectDriver,
  onSelectAll,
  onEditDriver,
  onViewProfile,
  onNotification,
  readOnly = false,
  readOnlyReason = "Station is marked inactive. No actions are available for this station.",
}) => {
  const [expandedDriverIds, setExpandedDriverIds] = useState<number[]>([]);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeDropdown, setActiveDropdown] = useState<{
    driver: Driver;
    top: number;
    right: number;
  } | null>(null);
  const [deleteModalDriver, setDeleteModalDriver] = useState<Driver | null>(null);

  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const toggleDriverStatus = useDriverStore((state) => state.toggleDriverStatus);

  const toggleExpand = (id: number) => {
    setExpandedDriverIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown
          size={12}
          className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
        />
      );
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-blue-600 font-bold flex-shrink-0" />
    ) : (
      <ArrowDown size={12} className="text-blue-600 font-bold flex-shrink-0" />
    );
  };

  // Sort drivers by the selected column
  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case "name":
          comp = (a.name || "").localeCompare(b.name || "");
          break;
        case "phone":
          comp = (a.phone || "").localeCompare(b.phone || "");
          break;
        case "email":
          comp = (a.email || "").localeCompare(b.email || "");
          break;
        case "transporter_id":
          comp = (a.transporter_id || "").localeCompare(b.transporter_id || "");
          break;
        case "status":
          comp = (a.status || "").localeCompare(b.status || "");
          break;
        default:
          comp = 0;
      }
      return sortOrder === "asc" ? comp : -comp;
    });
  }, [drivers, sortField, sortOrder]);

  // Close dropdown on outside click, window resize, scroll, or Escape key
  useEffect(() => {
    if (!activeDropdown) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownMenuRef.current && !dropdownMenuRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveDropdown(null);
    };

    const handleScrollOrResize = () => {
      setActiveDropdown(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeDropdown]);

  const handleDropdownToggle = (driver: Driver, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (activeDropdown?.driver.id === driver.id) {
      setActiveDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const right = Math.max(12, window.innerWidth - rect.right);
      let top = rect.bottom + 6;
      // Flip dropdown upward if too close to viewport bottom
      if (top + 170 > window.innerHeight) {
        top = Math.max(8, rect.top - 140);
      }
      setActiveDropdown({
        driver,
        top,
        right,
      });
    }
  };

  const isAllSelected = sortedDrivers.length > 0 && selectedDriverIds.length === sortedDrivers.length;


  if (drivers.length === 0) {
    return (
      <div className="driver-table-empty-state">
        <div className="empty-state-icon-box">
          <AlertCircle size={28} className="text-blue-500" />
        </div>
        <h4 className="empty-state-heading">No Drivers Found</h4>
        <p className="empty-state-desc">
          Try adjusting your search query, status filters, or selected delivery station.
        </p>
      </div>
    );
  }

  return (
    <div className="driver-table-wrapper">
      <table className="driver-data-table">
        <thead>
          <tr className="driver-table-head-row">
            <th className="table-col-checkbox">
              <input
                type="checkbox"
                className="custom-table-checkbox"
                checked={isAllSelected}
                onChange={onSelectAll}
                title="Select all visible drivers"
              />
            </th>
            <th className="table-col-expand" />
            <th
              className="table-col-name cursor-pointer select-none group"
              onClick={() => handleSort("name")}
              title={
                sortField === "name"
                  ? `Sorted by name (${sortOrder === "asc" ? "A-Z" : "Z-A"}) - click to reverse`
                  : "Click to sort by Driver Name"
              }
            >
              <div className="flex items-center gap-1.5">
                <span>Driver Name</span>
                {renderSortIcon("name")}
              </div>
            </th>
            <th
              className="table-col-phone cursor-pointer select-none group"
              onClick={() => handleSort("phone")}
              title={
                sortField === "phone"
                  ? `Sorted by phone (${sortOrder === "asc" ? "ascending" : "descending"}) - click to reverse`
                  : "Click to sort by Phone Number"
              }
            >
              <div className="flex items-center gap-1.5">
                <span>Phone Number</span>
                {renderSortIcon("phone")}
              </div>
            </th>
            <th
              className="table-col-email cursor-pointer select-none group"
              onClick={() => handleSort("email")}
              title={
                sortField === "email"
                  ? `Sorted by email (${sortOrder === "asc" ? "ascending" : "descending"}) - click to reverse`
                  : "Click to sort by Email Address"
              }
            >
              <div className="flex items-center gap-1.5">
                <span>Email Address</span>
                {renderSortIcon("email")}
              </div>
            </th>
            <th
              className="table-col-transporter cursor-pointer select-none group"
              onClick={() => handleSort("transporter_id")}
              title={
                sortField === "transporter_id"
                  ? `Sorted by transporter ID (${sortOrder === "asc" ? "ascending" : "descending"}) - click to reverse`
                  : "Click to sort by Transporter ID"
              }
            >
              <div className="flex items-center gap-1.5">
                <span>Transporter ID</span>
                {renderSortIcon("transporter_id")}
              </div>
            </th>
            <th
              className="table-col-status text-center cursor-pointer select-none group"
              onClick={() => handleSort("status")}
              title={
                sortField === "status"
                  ? `Sorted by status (${sortOrder === "asc" ? "Active first" : "Inactive first"}) - click to reverse`
                  : "Click to sort by Status"
              }
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>Status</span>
                {renderSortIcon("status")}
              </div>
            </th>
            <th className="table-col-actions text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedDrivers.map((driver) => {
            const isSelected = selectedDriverIds.includes(driver.id);
            const isExpanded = expandedDriverIds.includes(driver.id);
            const isMenuOpen = activeDropdown?.driver.id === driver.id;

            return (
              <React.Fragment key={driver.id}>
                <tr
                  className={`driver-table-row ${isSelected ? "row-selected" : ""} ${
                    driver.status === "inactive" ? "row-inactive" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="table-col-checkbox">
                    <input
                      type="checkbox"
                      className="custom-table-checkbox"
                      checked={isSelected}
                      onChange={() => onSelectDriver(driver.id)}
                    />
                  </td>

                  {/* Expand Chevron */}
                  <td className="table-col-expand">
                    <button
                      type="button"
                      className="table-expand-btn"
                      onClick={() => toggleExpand(driver.id)}
                      title={isExpanded ? "Collapse details" : "Expand driver details"}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>

                  {/* Driver Name (clean driver name without labels beneath) */}
                  <td
                    className="table-col-name cursor-pointer"
                    onClick={() => (onViewProfile ? onViewProfile(driver) : toggleExpand(driver.id))}
                    title={`Click to view ${driver.name}'s profile`}
                  >
                    <div className="driver-name-cell">
                      <div
                        className="unified-avatar-circle sm"
                        style={{ background: getAvatarColor(driver.name, "driver") }}
                      >
                        <span>{getInitials(driver.name)}</span>
                      </div>
                      <div className="driver-name-info">
                        <span className="driver-fullname-text hover:text-blue-600 transition-colors">
                          {driver.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Phone Number (unbroken single line) */}
                  <td className="table-col-phone">
                    <span className="phone-cell-text">{formatDriverPhone(driver.phone)}</span>
                  </td>

                  {/* Email Address */}
                  <td className="table-col-email">
                    <span className="email-cell-text" title={driver.email ? driver.email.replace(/^#+/, "") : ""}>
                      {driver.email ? driver.email.replace(/^#+/, "") : "—"}
                    </span>
                  </td>

                  {/* Transporter ID (clean, no # prefix or icon) */}
                  <td className="table-col-transporter">
                    <span className="transporter-badge">
                      {driver.transporter_id ? driver.transporter_id.replace(/^#+/, "") : "—"}
                    </span>
                  </td>

                  {/* Status Toggle Switch alone (no text label next to switch) */}
                  <td className="table-col-status text-center">
                    <div className="status-toggle-cell justify-center">
                      <label className={`custom-blue-switch ${readOnly ? "opacity-50 cursor-not-allowed" : ""}`} title={readOnly ? readOnlyReason : (driver.status === "active" ? "Active" : "Inactive")}>
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={driver.status === "active"}
                          onChange={() => {
                            if (readOnly) return;
                            toggleDriverStatus(driver.id);
                            onNotification({
                              text: "Driver status updated successfully!",
                              type: "success",
                            });
                          }}
                        />
                        <span className="switch-slider" />
                      </label>
                    </div>
                  </td>

                  {/* Actions Column: Single Vertical Three-Dot Kebab Menu Button */}
                  <td className="table-col-actions text-center">
                    <div className="driver-kebab-container" style={{ position: "relative" }}>
                      <button
                        type="button"
                        className={`driver-kebab-btn ${activeDropdown?.driver.id === driver.id ? "active" : ""}`}
                        onClick={(e) => handleDropdownToggle(driver, e)}
                        title={`Actions for ${driver.name}`}
                        aria-label={`Actions for ${driver.name}`}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Simplified Expanded Row */}
                {isExpanded && (
                  <tr className="driver-expanded-container-row">
                    <td colSpan={6} className="driver-expanded-td">
                      <DriverExpandedRow
                        driver={driver}
                        onViewProfile={onViewProfile}
                        onNotification={onNotification}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Floating Kebab Popover Menu Portaled to Document Body */}
      {activeDropdown &&
        createPortal(
          <div
            ref={dropdownMenuRef}
            className="driver-kebab-dropdown"
            style={{
              position: "fixed",
              top: `${activeDropdown.top}px`,
              right: `${activeDropdown.right}px`,
              zIndex: 99999,
            }}
          >
            <button
              type="button"
              className="driver-kebab-item"
              onClick={() => {
                const d = activeDropdown.driver;
                setActiveDropdown(null);
                if (onViewProfile) onViewProfile(d);
              }}
            >
              <User size={15} className="driver-kebab-icon text-blue-600" />
              <span>Driver Details</span>
            </button>

            <button
              type="button"
              disabled={readOnly}
              className={`driver-kebab-item ${readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
              title={readOnly ? readOnlyReason : undefined}
              onClick={() => {
                if (readOnly) return;
                const d = activeDropdown.driver;
                setActiveDropdown(null);
                onEditDriver(d);
              }}
            >
              <Edit2 size={15} className="driver-kebab-icon text-slate-600" />
              <span>Edit Driver</span>
            </button>

            <div className="driver-kebab-divider" />

            <button
              type="button"
              disabled={readOnly}
              className={`driver-kebab-item delete-item ${readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
              title={readOnly ? readOnlyReason : undefined}
              onClick={() => {
                if (readOnly) return;
                const d = activeDropdown.driver;
                setActiveDropdown(null);
                setDeleteModalDriver(d);
              }}
            >
              <Trash2 size={15} className="driver-kebab-icon text-red-600" />
              <span className="font-semibold text-red-600">Delete Driver</span>
            </button>
          </div>,
          document.body
        )}

      {/* Deletion Confirmation Modal */}
      <DeleteDriverModal
        driver={deleteModalDriver}
        isOpen={Boolean(deleteModalDriver)}
        onClose={() => setDeleteModalDriver(null)}
        onSuccess={() => {
          onNotification({
            text: "Driver deleted successfully!",
            type: "success",
          });
        }}
      />
    </div>
  );
};

export default DriverTable;
