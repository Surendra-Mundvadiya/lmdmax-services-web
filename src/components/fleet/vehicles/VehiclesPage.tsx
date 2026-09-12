import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Truck,
  Search,
  Plus,
  LayoutGrid,
  List,
  AlertTriangle,
  Wrench,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  ShieldAlert,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import GlassAppLayout from "../../layout/GlassAppLayout";
import VehicleAddEditScreen from "./VehicleAddEditScreen";
import VehicleDetailDrawer from "./VehicleDetailDrawer";
import { VehicleDamageModal } from "./modals/VehicleDamageModal";
import { VehiclePreventiveModal } from "./modals/VehiclePreventiveModal";
import { VehicleTimelineModal } from "./modals/VehicleTimelineModal";
import type { Vehicle } from "../../../types/vehicle";
import { vehicleApi } from "../../../api/vehicleApi";
import LoadingSpinner from "../../common/LoadingSpinner";

interface VehiclesPageProps {
  mode?: "list" | "add" | "edit";
}

interface VehicleActionMenuProps {
  vehicle: Vehicle;
  isOpen: boolean;
  placement: "below" | "above";
  onToggle: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onBodyDamage: () => void;
  onMechanicalIssues: () => void;
  onPreventive: () => void;
  onTimeline: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const actionMenuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--ads-s3)",
  width: "100%",
  padding: "8px 12px",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-sm)",
  background: "transparent",
  color: "var(--ads-ink-secondary)",
  fontSize: "0.8125rem",
  fontWeight: 550,
  letterSpacing: "-0.005em",
  textAlign: "left",
  cursor: "pointer",
  transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease)",
};

const actionMenuDivider = (
  <div
    style={{
      height: "1px",
      backgroundColor: "var(--ads-hairline)",
      margin: "var(--ads-s1) 6px",
    }}
  />
);

const VehicleActionMenu: FC<VehicleActionMenuProps> = ({
  vehicle,
  isOpen,
  placement,
  onToggle,
  onViewDetails,
  onEdit,
  onBodyDamage,
  onMechanicalIssues,
  onPreventive,
  onTimeline,
  onDelete,
}) => {
  const items: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    danger?: boolean;
    dividerBefore?: boolean;
    onSelect: (e: React.MouseEvent) => void;
  }> = [
    { key: "view", label: "View Details", icon: <Eye size={15} color="var(--ads-blue)" />, onSelect: onViewDetails },
    { key: "edit", label: "Edit Vehicle", icon: <Edit2 size={15} color="var(--ads-green)" />, onSelect: onEdit },
    { key: "body", label: "Body Damage", icon: <ShieldAlert size={15} color="var(--ads-red)" />, dividerBefore: true, onSelect: onBodyDamage },
    { key: "mechanical", label: "Mechanical Issues", icon: <AlertTriangle size={15} color="var(--ads-amber)" />, onSelect: onMechanicalIssues },
    { key: "preventive", label: "Preventive Maintenance", icon: <Wrench size={15} color="var(--ads-blue)" />, onSelect: onPreventive },
    { key: "timeline", label: "Vehicle Timeline", icon: <Clock size={15} color="var(--ads-purple)" />, onSelect: onTimeline },
    { key: "delete", label: "Delete Vehicle", icon: <Trash2 size={15} color="var(--ads-red)" />, danger: true, dividerBefore: true, onSelect: onDelete },
  ];

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Actions for ${vehicle.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--ads-s2)",
          padding: "6px 13px",
          borderRadius: "var(--ads-r-pill)",
          border: "1px solid " + (isOpen ? "transparent" : "var(--ads-hairline)"),
          background: isOpen ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
          color: isOpen ? "var(--ads-blue)" : "var(--ads-ink-secondary)",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          cursor: "pointer",
          boxShadow: isOpen ? "none" : "var(--ads-bevel)",
          transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span>Actions</span>
        <MoreVertical size={14} />
      </button>

      {isOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            ...(placement === "above"
              ? { bottom: "calc(100% + var(--ads-s2))" }
              : { top: "calc(100% + var(--ads-s2))" }),
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            borderRadius: "var(--ads-r-md)",
            boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
            border: "1px solid var(--ads-hairline)",
            padding: "var(--ads-s1)",
            zIndex: 9999,
            minWidth: "220px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            animation: "ads-sheet-in var(--ads-dur-fast) var(--ads-ease)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => (
            <React.Fragment key={item.key}>
              {item.dividerBefore && actionMenuDivider}
              <button
                type="button"
                role="menuitem"
                onClick={item.onSelect}
                style={{
                  ...actionMenuItemStyle,
                  color: item.danger ? "var(--ads-red)" : "var(--ads-ink-secondary)",
                  fontWeight: item.danger ? 600 : 550,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.danger
                    ? "var(--ads-red-tint)"
                    : "rgba(0, 0, 0, 0.05)";
                  if (!item.danger) e.currentTarget.style.color = "var(--ads-ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  if (!item.danger) e.currentTarget.style.color = "var(--ads-ink-secondary)";
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export const VehiclesPage: FC<VehiclesPageProps> = ({ mode = "list" }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Screen Mode
  const [screenMode, setScreenMode] = useState<"list" | "add" | "edit">(mode);
  const [selectedVehicleForDrawer, setSelectedVehicleForDrawer] = useState<Vehicle | null>(null);
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<Vehicle | null>(null);

  // Modal States for Body Damage, Mechanical Issues, PM & Timeline
  const [damageModalConfig, setDamageModalConfig] = useState<{
    isOpen: boolean;
    vehicle: Vehicle | null;
    type: "body" | "mechanical";
  }>({ isOpen: false, vehicle: null, type: "body" });

  const [preventiveModalConfig, setPreventiveModalConfig] = useState<{
    isOpen: boolean;
    vehicle: Vehicle | null;
  }>({ isOpen: false, vehicle: null });

  const [timelineModalConfig, setTimelineModalConfig] = useState<{
    isOpen: boolean;
    vehicle: Vehicle | null;
  }>({ isOpen: false, vehicle: null });

  // Row Action Dropdown Popover
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);

  // Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Close Action Popover on document click
  useEffect(() => {
    const handleWindowClick = () => setActiveActionMenuId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  // Load Vehicles from Real Fleet Microservice API
  const fetchVehiclesData = useCallback(async () => {
    setError(null);
    try {
      const data = await vehicleApi.getVehicles({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load vehicles from fleet microservice.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchVehiclesData();
  }, [fetchVehiclesData]);

  // Handle URL query parameters for view or add
  useEffect(() => {
    const urlMode = searchParams.get("action");
    const vehicleId = searchParams.get("id");
    if (urlMode === "add") {
      setScreenMode("add");
    } else if (vehicleId && vehicles.length > 0) {
      const found = vehicles.find((v) => String(v.id) === String(vehicleId));
      if (found) {
        setSelectedVehicleForDrawer(found);
      }
    }
  }, [searchParams, vehicles]);

  // Filter counts for status capsule pills
  const counts = useMemo(() => {
    return {
      all: vehicles.length,
      active: vehicles.filter((v) => v.status === "active").length,
      grounded: vehicles.filter((v) => v.status === "grounded").length,
      maintenance: vehicles.filter((v) => v.status === "maintenance").length,
      inactive: vehicles.filter((v) => v.status === "inactive").length,
    };
  }, [vehicles]);

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((veh) => {
      // Status match
      if (statusFilter !== "all" && veh.status !== statusFilter) {
        return false;
      }

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = veh.name?.toLowerCase().includes(q);
        const matchVin = veh.vin?.toLowerCase().includes(q);
        const matchPlate = veh.plate?.toLowerCase().includes(q);
        const matchMake = veh.make?.toLowerCase().includes(q);
        const matchModel = veh.model?.toLowerCase().includes(q);
        return Boolean(matchName || matchVin || matchPlate || matchMake || matchModel);
      }

      return true;
    });
  }, [vehicles, statusFilter, searchQuery]);

  // Delete Action Handler
  const handleDeleteVehicle = async (veh: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete vehicle ${veh.name} (VIN: ${veh.vin}) from the fleet?`
    );
    if (!confirmed) return;

    try {
      const res = await vehicleApi.deleteVehicle(veh.id, "Deleted via Unified Vehicles Portal");
      if (res.success) {
        setVehicles((prev) => prev.filter((v) => v.id !== veh.id));
        if (selectedVehicleForDrawer?.id === veh.id) {
          setSelectedVehicleForDrawer(null);
        }
      } else {
        alert(res.message || "Failed to delete vehicle.");
      }
    } catch {
      alert("Error deleting vehicle. Please verify network connection.");
    }
  };

  // Add / Edit Success Callbacks
  const handleSaveSuccess = (saved: Vehicle) => {
    setVehicles((prev) => {
      const index = prev.findIndex((v) => v.id === saved.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setScreenMode("list");
    setSelectedVehicleForEdit(null);
  };

  return (
    <GlassAppLayout
      currentRoute="vehicles"
      activeBreadcrumb={{ section: "Global Utilities", page: "Vehicles" }}
    >
      <div
        className="operations-main-content scrollable"
        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: "var(--ads-s3)" }}
      >
        {/* ADD VEHICLE SCREEN */}
        {screenMode === "add" && (
          <VehicleAddEditScreen
            onBack={() => setScreenMode("list")}
            onSuccess={handleSaveSuccess}
          />
        )}

        {/* EDIT VEHICLE SCREEN */}
        {screenMode === "edit" && selectedVehicleForEdit && (
          <VehicleAddEditScreen
            initialVehicle={selectedVehicleForEdit}
            isEditMode
            onBack={() => {
              setScreenMode("list");
              setSelectedVehicleForEdit(null);
            }}
            onSuccess={handleSaveSuccess}
          />
        )}

        {/* MAIN VEHICLES DIRECTORY */}
        {screenMode === "list" && (
          <>
            {/* ── 1. Top Header Options on the Blue Background Screen ── */}
            <div className="upload-filter-toolbar">
              {/* Left: Breadcrumbs */}
              <div className="upload-breadcrumb-wrap">
                <span
                  className="upload-breadcrumb-root"
                  onClick={() => navigate("/dashboard")}
                >
                  Global Utilities
                </span>
                <ChevronRight size={14} style={{ color: "var(--ads-ink-tertiary)" }} />
                <span className="upload-breadcrumb-current">Vehicles</span>
                <ChevronRight size={14} style={{ color: "var(--ads-ink-tertiary)" }} />
                <span className="upload-breadcrumb-active-report">
                  {statusFilter === "all"
                    ? "All Vehicles"
                    : statusFilter === "active"
                      ? "In Service"
                      : statusFilter === "grounded"
                        ? "Grounded"
                        : statusFilter === "maintenance"
                          ? "Maintenance"
                          : "Inactive"}
                </span>
              </div>

              {/* Right: View by Capsule Pills + Add Vehicle Primary Action */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)", flexWrap: "wrap" }}>
                <div className="upload-view-by-wrap">
                  <span className="upload-view-by-label">View by</span>
                  <div className="upload-segmented-capsule">
                    <button
                      type="button"
                      className={`upload-segmented-btn ${statusFilter === "all" ? "active" : ""}`}
                      onClick={() => setStatusFilter("all")}
                    >
                      <span>All</span>
                      <span className="upload-segmented-count">{counts.all}</span>
                    </button>

                    <button
                      type="button"
                      className={`upload-segmented-btn ${statusFilter === "active" ? "active" : ""}`}
                      onClick={() => setStatusFilter("active")}
                    >
                      <span>Active</span>
                      <span className="upload-segmented-count">{counts.active}</span>
                    </button>

                    <button
                      type="button"
                      className={`upload-segmented-btn ${statusFilter === "grounded" ? "active" : ""}`}
                      onClick={() => setStatusFilter("grounded")}
                    >
                      <span>Grounded</span>
                      <span className="upload-segmented-count">{counts.grounded}</span>
                    </button>

                    <button
                      type="button"
                      className={`upload-segmented-btn ${statusFilter === "maintenance" ? "active" : ""}`}
                      onClick={() => setStatusFilter("maintenance")}
                    >
                      <span>Maintenance</span>
                      <span className="upload-segmented-count">{counts.maintenance}</span>
                    </button>

                    <button
                      type="button"
                      className={`upload-segmented-btn ${statusFilter === "inactive" ? "active" : ""}`}
                      onClick={() => setStatusFilter("inactive")}
                    >
                      <span>Inactive</span>
                      <span className="upload-segmented-count">{counts.inactive}</span>
                    </button>
                  </div>
                </div>

                {/* Primary Add Vehicle Button */}
                <button
                  type="button"
                  onClick={() => setScreenMode("add")}
                  className="btn-blue-primary btn-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    fontWeight: 600,
                  }}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <span style={{ color: "#FFFFFF" }}>Add Vehicle</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--ads-s3)",
                  backgroundColor: "var(--ads-red-tint)",
                  border: "1px solid transparent",
                  color: "var(--ads-red)",
                  padding: "var(--ads-s3) var(--ads-s5)",
                  borderRadius: "var(--ads-r-md)",
                  fontSize: "0.8125rem",
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={fetchVehiclesData}
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    color: "var(--ads-blue)",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* ── 2. White Card Container with In-Card Search & Table/Grid ── */}
            <div
              style={{
                background: "var(--ads-material-thick)",
                backdropFilter: "var(--ads-blur-md)",
                WebkitBackdropFilter: "var(--ads-blur-md)",
                borderRadius: "var(--ads-r-lg)",
                border: "1px solid var(--ads-hairline)",
                boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
                padding: "var(--ads-s4) var(--ads-s5)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--ads-s4)",
              }}
            >
              {/* In-Card Search Toolbar & View Toggles */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                {/* Search Bar */}
                <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "420px" }}>
                  <Search
                    size={16}
                    color="var(--ads-ink-quaternary)"
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search Van #, VIN, Plate, Make..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search vehicles"
                    className="ads-input"
                    style={{
                      width: "100%",
                      padding: "9px 13px 9px 34px",
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline)",
                      background: "var(--ads-material-thick)",
                      fontSize: "0.8125rem",
                      color: "var(--ads-ink)",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  />
                </div>

                {/* View Mode Toggle: Table / Grid */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    backgroundColor: "rgba(0,0,0,0.04)",
                    border: "1px solid var(--ads-hairline)",
                    padding: "3px",
                    borderRadius: "var(--ads-r-pill)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    title="Table View"
                    aria-label="Switch to table view"
                    aria-pressed={viewMode === "table"}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid " + (viewMode === "table" ? "var(--ads-hairline)" : "transparent"),
                      borderRadius: "var(--ads-r-pill)",
                      background: viewMode === "table" ? "var(--ads-material-thick)" : "transparent",
                      color: viewMode === "table" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                      boxShadow: viewMode === "table" ? "var(--ads-shadow-xs), var(--ads-bevel)" : "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="Card Grid View"
                    aria-label="Switch to card grid view"
                    aria-pressed={viewMode === "grid"}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid " + (viewMode === "grid" ? "var(--ads-hairline)" : "transparent"),
                      borderRadius: "var(--ads-r-pill)",
                      background: viewMode === "grid" ? "var(--ads-material-thick)" : "transparent",
                      color: viewMode === "grid" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                      boxShadow: viewMode === "grid" ? "var(--ads-shadow-xs), var(--ads-bevel)" : "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>

              {/* Vehicle List: Loading / Empty / Table / Grid */}
              {isLoading ? (
                <div
                  style={{
                    padding: "4rem 2rem",
                    textAlign: "center",
                  }}
                >
                  <LoadingSpinner size="lg" color="var(--ads-blue)" />
                  <p style={{ marginTop: "var(--ads-s4)", color: "var(--ads-ink-tertiary)", fontSize: "0.8125rem" }}>
                    Loading fleet vehicles from microservice...
                  </p>
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div
                  style={{
                    padding: "4rem 2rem",
                    textAlign: "center",
                  }}
                >
                  <Truck size={48} color="var(--ads-hairline-strong)" style={{ margin: "0 auto 1rem" }} />
                  <h3 style={{ margin: "0 0 var(--ads-s2)", fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                    No Vehicles Found
                  </h3>
                  <p style={{ margin: "0 0 var(--ads-s5)", color: "var(--ads-ink-tertiary)", fontSize: "0.8125rem" }}>
                    {searchQuery
                      ? `No vehicles matched "${searchQuery}".`
                      : "No fleet vehicles registered for the selected filter."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setScreenMode("add")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--ads-s2)",
                      padding: "9px 18px",
                      borderRadius: "var(--ads-r-pill)",
                      backgroundColor: "var(--ads-blue)",
                      border: "1px solid transparent",
                      color: "#FFFFFF",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <span style={{ color: "#FFFFFF" }}>Add Vehicle</span>
                  </button>
                </div>
              ) : viewMode === "table" ? (
                /* TABLE VIEW (Assigned Driver column removed, Station filter removed) */
                <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "62vh" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "0.8125rem" }}>
                    <thead>
                      <tr>
                        {[
                          { label: "Van / Unit #", pad: "var(--ads-s3) var(--ads-s5)", align: "left" as const },
                          { label: "VIN & Plate", pad: "var(--ads-s3) var(--ads-s4)", align: "left" as const },
                          { label: "Make / Model", pad: "var(--ads-s3) var(--ads-s4)", align: "left" as const },
                          { label: "Classification", pad: "var(--ads-s3) var(--ads-s4)", align: "left" as const },
                          { label: "Status", pad: "var(--ads-s3) var(--ads-s4)", align: "left" as const },
                          { label: "Actions", pad: "var(--ads-s3) var(--ads-s5)", align: "right" as const },
                        ].map((col) => (
                          <th
                            key={col.label}
                            style={{
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                              padding: col.pad,
                              textAlign: col.align,
                              background: "rgba(255, 255, 255, 0.80)",
                              backdropFilter: "var(--ads-blur-sm)",
                              WebkitBackdropFilter: "var(--ads-blur-sm)",
                              color: "var(--ads-ink-tertiary)",
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid var(--ads-hairline)",
                            }}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((veh) => {
                        const statusPill = {
                          active: { label: "In Service", bg: "var(--ads-green-tint)", text: "var(--ads-green)", border: "var(--ads-green-tint)" },
                          grounded: { label: "Grounded", bg: "var(--ads-red-tint)", text: "var(--ads-red)", border: "var(--ads-red-tint)" },
                          maintenance: { label: "Maintenance", bg: "var(--ads-amber-tint)", text: "var(--ads-amber)", border: "var(--ads-amber-tint)" },
                          inactive: { label: "Inactive", bg: "rgba(0,0,0,0.04)", text: "var(--ads-ink-secondary)", border: "var(--ads-hairline-strong)" },
                        }[veh.status] || { label: veh.status, bg: "rgba(0,0,0,0.04)", text: "var(--ads-ink-secondary)", border: "var(--ads-hairline-strong)" };

                        return (
                          <tr
                            key={veh.id}
                            onClick={() => setSelectedVehicleForDrawer(veh)}
                            style={{
                              cursor: "pointer",
                              transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(0, 113, 227, 0.045)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            {/* Van Name & Icon */}
                            <td style={{ padding: "var(--ads-s3) var(--ads-s5)", borderBottom: "1px solid var(--ads-hairline)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
                                <div
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "var(--ads-r-sm)",
                                    backgroundColor: "var(--ads-blue-tint)",
                                    border: "1px solid var(--ads-blue-tint-strong)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--ads-blue)",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Truck size={18} />
                                </div>
                                <div>
                                  <span style={{ fontWeight: 650, letterSpacing: "-0.01em", color: "var(--ads-ink)", display: "block" }}>
                                    {veh.name}
                                  </span>
                                  {veh.vendor && (
                                    <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                                      {veh.vendor}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* VIN & Plate */}
                            <td style={{ padding: "var(--ads-s3) var(--ads-s4)", borderBottom: "1px solid var(--ads-hairline)" }}>
                              <span style={{ fontWeight: 600, color: "var(--ads-ink)", display: "block", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                                {veh.vin}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                                {veh.plate} ({veh.state || "US"})
                              </span>
                            </td>

                            {/* Make / Model / Year */}
                            <td style={{ padding: "var(--ads-s3) var(--ads-s4)", borderBottom: "1px solid var(--ads-hairline)" }}>
                              <span style={{ fontWeight: 600, color: "var(--ads-ink)", display: "block" }}>
                                {veh.make} {veh.model}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                                {veh.year || "2024"} {veh.trim ? `• ${veh.trim}` : ""}
                              </span>
                            </td>

                            {/* Classification */}
                            <td style={{ padding: "var(--ads-s3) var(--ads-s4)", borderBottom: "1px solid var(--ads-hairline)" }}>
                              <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-secondary)", display: "block" }}>
                                {String(veh.vehicle_type || "Cargo Van")}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                                {String(veh.vehicle_sub_type || "Prime")}
                              </span>
                            </td>

                            {/* Status Pill */}
                            <td style={{ padding: "var(--ads-s3) var(--ads-s4)", borderBottom: "1px solid var(--ads-hairline)" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "3px 9px",
                                  borderRadius: "var(--ads-r-pill)",
                                  fontSize: "0.6875rem",
                                  fontWeight: 600,
                                  letterSpacing: "-0.005em",
                                  backgroundColor: statusPill.bg,
                                  color: statusPill.text,
                                  border: `1px solid ${statusPill.border}`,
                                }}
                              >
                                {statusPill.label}
                              </span>
                            </td>

                            {/* Actions Dropdown Button */}
                            <td style={{ padding: "var(--ads-s3) var(--ads-s5)", textAlign: "right", borderBottom: "1px solid var(--ads-hairline)" }}>
                              <VehicleActionMenu
                                vehicle={veh}
                                isOpen={activeActionMenuId === veh.id}
                                placement="below"
                                onToggle={() =>
                                  setActiveActionMenuId((prev) => (prev === veh.id ? null : veh.id))
                                }
                                onViewDetails={() => {
                                  setSelectedVehicleForDrawer(veh);
                                  setActiveActionMenuId(null);
                                }}
                                onEdit={() => {
                                  setSelectedVehicleForEdit(veh);
                                  setScreenMode("edit");
                                  setActiveActionMenuId(null);
                                }}
                                onBodyDamage={() => {
                                  setDamageModalConfig({ isOpen: true, vehicle: veh, type: "body" });
                                  setActiveActionMenuId(null);
                                }}
                                onMechanicalIssues={() => {
                                  setDamageModalConfig({ isOpen: true, vehicle: veh, type: "mechanical" });
                                  setActiveActionMenuId(null);
                                }}
                                onPreventive={() => {
                                  setPreventiveModalConfig({ isOpen: true, vehicle: veh });
                                  setActiveActionMenuId(null);
                                }}
                                onTimeline={() => {
                                  setTimelineModalConfig({ isOpen: true, vehicle: veh });
                                  setActiveActionMenuId(null);
                                }}
                                onDelete={(e) => {
                                  setActiveActionMenuId(null);
                                  handleDeleteVehicle(veh, e);
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* CARD GRID VIEW */
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "var(--ads-s5)",
                  }}
                >
                  {filteredVehicles.map((veh) => {
                    const statusPill = {
                      active: { label: "In Service", bg: "var(--ads-green-tint)", text: "var(--ads-green)", border: "var(--ads-green-tint)" },
                      grounded: { label: "Grounded", bg: "var(--ads-red-tint)", text: "var(--ads-red)", border: "var(--ads-red-tint)" },
                      maintenance: { label: "Maintenance", bg: "var(--ads-amber-tint)", text: "var(--ads-amber)", border: "var(--ads-amber-tint)" },
                      inactive: { label: "Inactive", bg: "rgba(0,0,0,0.04)", text: "var(--ads-ink-secondary)", border: "var(--ads-hairline-strong)" },
                    }[veh.status] || { label: veh.status, bg: "rgba(0,0,0,0.04)", text: "var(--ads-ink-secondary)", border: "var(--ads-hairline-strong)" };

                    return (
                      <div
                        key={veh.id}
                        onClick={() => setSelectedVehicleForDrawer(veh)}
                        style={{
                          background: "var(--ads-material-thick)",
                          backdropFilter: "var(--ads-blur-md)",
                          WebkitBackdropFilter: "var(--ads-blur-md)",
                          border: "1px solid var(--ads-hairline)",
                          borderRadius: "var(--ads-r-lg)",
                          padding: "var(--ads-s5)",
                          boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--ads-s4)",
                          transition: "transform var(--ads-dur) var(--ads-ease), box-shadow var(--ads-dur) var(--ads-ease), border-color var(--ads-dur) var(--ads-ease)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
                          e.currentTarget.style.borderColor = "var(--ads-hairline-strong)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "var(--ads-shadow-sm), var(--ads-bevel)";
                          e.currentTarget.style.borderColor = "var(--ads-hairline)";
                        }}
                      >
                        {/* Top Row: Icon, Title & Status */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "var(--ads-r-sm)",
                                backgroundColor: "var(--ads-blue-tint)",
                                border: "1px solid var(--ads-blue-tint-strong)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--ads-blue)",
                              }}
                            >
                              <Truck size={20} />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                                {veh.name}
                              </h4>
                              <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                                {veh.make} {veh.model}
                              </span>
                            </div>
                          </div>

                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 9px",
                              borderRadius: "var(--ads-r-pill)",
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              letterSpacing: "-0.005em",
                              backgroundColor: statusPill.bg,
                              color: statusPill.text,
                              border: `1px solid ${statusPill.border}`,
                            }}
                          >
                            {statusPill.label}
                          </span>
                        </div>

                        {/* Specs */}
                        <div
                          style={{
                            background: "rgba(0, 0, 0, 0.03)",
                            border: "1px solid var(--ads-hairline)",
                            borderRadius: "var(--ads-r-md)",
                            padding: "var(--ads-s3)",
                            fontSize: "0.8125rem",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "var(--ads-s2)",
                          }}
                        >
                          <div>
                            <span style={{ color: "var(--ads-ink-tertiary)", fontSize: "0.75rem", display: "block" }}>Plate</span>
                            <strong style={{ color: "var(--ads-ink)" }}>{veh.plate} ({veh.state || "US"})</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--ads-ink-tertiary)", fontSize: "0.75rem", display: "block" }}>Type</span>
                            <strong style={{ color: "var(--ads-ink)" }}>{String(veh.vehicle_type || "Cargo Van")}</strong>
                          </div>
                          <div style={{ gridColumn: "span 2" }}>
                            <span style={{ color: "var(--ads-ink-tertiary)", fontSize: "0.75rem", display: "block" }}>VIN</span>
                            <code style={{ color: "var(--ads-ink-secondary)", fontWeight: 600, fontSize: "0.75rem" }}>{veh.vin}</code>
                          </div>
                        </div>

                        {/* Card Footer: Action Dropdown */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            paddingTop: "var(--ads-s2)",
                            borderTop: "1px solid var(--ads-hairline)",
                          }}
                        >
                          <VehicleActionMenu
                            vehicle={veh}
                            isOpen={activeActionMenuId === veh.id}
                            placement="above"
                            onToggle={() =>
                              setActiveActionMenuId((prev) => (prev === veh.id ? null : veh.id))
                            }
                            onViewDetails={() => {
                              setSelectedVehicleForDrawer(veh);
                              setActiveActionMenuId(null);
                            }}
                            onEdit={() => {
                              setSelectedVehicleForEdit(veh);
                              setScreenMode("edit");
                              setActiveActionMenuId(null);
                            }}
                            onBodyDamage={() => {
                              setDamageModalConfig({ isOpen: true, vehicle: veh, type: "body" });
                              setActiveActionMenuId(null);
                            }}
                            onMechanicalIssues={() => {
                              setDamageModalConfig({ isOpen: true, vehicle: veh, type: "mechanical" });
                              setActiveActionMenuId(null);
                            }}
                            onPreventive={() => {
                              setPreventiveModalConfig({ isOpen: true, vehicle: veh });
                              setActiveActionMenuId(null);
                            }}
                            onTimeline={() => {
                              setTimelineModalConfig({ isOpen: true, vehicle: veh });
                              setActiveActionMenuId(null);
                            }}
                            onDelete={(e) => {
                              setActiveActionMenuId(null);
                              handleDeleteVehicle(veh, e);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Vehicle Detail Drawer */}
        <VehicleDetailDrawer
          vehicle={selectedVehicleForDrawer}
          isOpen={Boolean(selectedVehicleForDrawer)}
          onClose={() => setSelectedVehicleForDrawer(null)}
          onEdit={(veh) => {
            setSelectedVehicleForDrawer(null);
            setSelectedVehicleForEdit(veh);
            setScreenMode("edit");
          }}
        />

        {/* Body Damage / Mechanical Issue Modal */}
        {damageModalConfig.isOpen && damageModalConfig.vehicle && (
          <VehicleDamageModal
            vehicle={damageModalConfig.vehicle}
            type={damageModalConfig.type}
            isOpen={damageModalConfig.isOpen}
            onClose={() => setDamageModalConfig({ isOpen: false, vehicle: null, type: "body" })}
          />
        )}

        {/* Preventive Maintenance Modal */}
        {preventiveModalConfig.isOpen && preventiveModalConfig.vehicle && (
          <VehiclePreventiveModal
            vehicle={preventiveModalConfig.vehicle}
            isOpen={preventiveModalConfig.isOpen}
            onClose={() => setPreventiveModalConfig({ isOpen: false, vehicle: null })}
          />
        )}

        {/* Vehicle Timeline Modal */}
        {timelineModalConfig.isOpen && timelineModalConfig.vehicle && (
          <VehicleTimelineModal
            vehicle={timelineModalConfig.vehicle}
            isOpen={timelineModalConfig.isOpen}
            onClose={() => setTimelineModalConfig({ isOpen: false, vehicle: null })}
          />
        )}
      </div>
    </GlassAppLayout>
  );
};

export default VehiclesPage;
