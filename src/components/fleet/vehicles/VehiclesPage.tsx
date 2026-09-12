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
        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: "0.85rem" }}
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
                <ChevronRight size={14} style={{ color: "#64748B" }} />
                <span className="upload-breadcrumb-current">Vehicles</span>
                <ChevronRight size={14} style={{ color: "#64748B" }} />
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
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
                    backgroundColor: "#2563EB",
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
                  gap: "0.75rem",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: "#991B1B",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "10px",
                  fontSize: "0.875rem",
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
                    color: "#2563EB",
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
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
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
                    color="#94A3B8"
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search Van #, VIN, Plate, Make..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem 0.55rem 2.25rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* View Mode Toggle: Table / Grid */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#F1F5F9",
                    padding: "3px",
                    borderRadius: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    title="Table View"
                    style={{
                      padding: "0.35rem 0.6rem",
                      border: "none",
                      borderRadius: "6px",
                      backgroundColor: viewMode === "table" ? "#FFFFFF" : "transparent",
                      color: viewMode === "table" ? "#2563EB" : "#64748B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="Card Grid View"
                    style={{
                      padding: "0.35rem 0.6rem",
                      border: "none",
                      borderRadius: "6px",
                      backgroundColor: viewMode === "grid" ? "#FFFFFF" : "transparent",
                      color: viewMode === "grid" ? "#2563EB" : "#64748B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
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
                  <LoadingSpinner size="lg" color="#2563EB" />
                  <p style={{ marginTop: "1rem", color: "#64748B", fontSize: "0.875rem" }}>
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
                  <Truck size={48} color="#CBD5E1" style={{ margin: "0 auto 1rem" }} />
                  <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 700, color: "#1E293B" }}>
                    No Vehicles Found
                  </h3>
                  <p style={{ margin: "0 0 1.5rem", color: "#64748B", fontSize: "0.875rem" }}>
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
                      gap: "0.45rem",
                      padding: "0.55rem 1.25rem",
                      borderRadius: "8px",
                      backgroundColor: "#2563EB",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <span style={{ color: "#FFFFFF" }}>Add Vehicle</span>
                  </button>
                </div>
              ) : viewMode === "table" ? (
                /* TABLE VIEW (Assigned Driver column removed, Station filter removed) */
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                        <th style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: "#475569" }}>Van / Unit #</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#475569" }}>VIN &amp; Plate</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#475569" }}>Make / Model</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#475569" }}>Classification</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#475569" }}>Status</th>
                        <th style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: "#475569", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((veh) => {
                        const statusPill = {
                          active: { label: "In Service", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
                          grounded: { label: "Grounded", bg: "#FEF2F2", text: "#991B1B", border: "#FCA5A5" },
                          maintenance: { label: "Maintenance", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
                          inactive: { label: "Inactive", bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
                        }[veh.status] || { label: veh.status, bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };

                        return (
                          <tr
                            key={veh.id}
                            onClick={() => setSelectedVehicleForDrawer(veh)}
                            style={{
                              borderBottom: "1px solid #F1F5F9",
                              cursor: "pointer",
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F8FAFC";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            {/* Van Name & Icon */}
                            <td style={{ padding: "0.85rem 1.25rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    backgroundColor: "#EFF6FF",
                                    border: "1px solid #BFDBFE",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#2563EB",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Truck size={18} />
                                </div>
                                <div>
                                  <span style={{ fontWeight: 750, color: "#0F172A", display: "block" }}>
                                    {veh.name}
                                  </span>
                                  {veh.vendor && (
                                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                      {veh.vendor}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* VIN & Plate */}
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ fontWeight: 600, color: "#1E293B", display: "block", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                                {veh.vin}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                {veh.plate} ({veh.state || "US"})
                              </span>
                            </td>

                            {/* Make / Model / Year */}
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ fontWeight: 600, color: "#1E293B", display: "block" }}>
                                {veh.make} {veh.model}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                {veh.year || "2024"} {veh.trim ? `• ${veh.trim}` : ""}
                              </span>
                            </td>

                            {/* Classification */}
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ fontSize: "0.8125rem", color: "#334155", display: "block" }}>
                                {String(veh.vehicle_type || "Cargo Van")}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                {String(veh.vehicle_sub_type || "Prime")}
                              </span>
                            </td>

                            {/* Status Pill */}
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  backgroundColor: statusPill.bg,
                                  color: statusPill.text,
                                  border: `1px solid ${statusPill.border}`,
                                }}
                              >
                                {statusPill.label}
                              </span>
                            </td>

                            {/* Actions Dropdown Button */}
                            <td style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>
                              <div
                                style={{ position: "relative", display: "inline-block" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId((prev) => (prev === veh.id ? null : veh.id));
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                    padding: "0.4rem 0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: activeActionMenuId === veh.id ? "#EFF6FF" : "#FFFFFF",
                                    color: activeActionMenuId === veh.id ? "#2563EB" : "#475569",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                  }}
                                >
                                  <span>Actions</span>
                                  <MoreVertical size={14} />
                                </button>

                                {/* Solid Dropdown Popover */}
                                {activeActionMenuId === veh.id && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      right: 0,
                                      top: "calc(100% + 4px)",
                                      backgroundColor: "#FFFFFF",
                                      borderRadius: "0.75rem",
                                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                                      border: "1px solid #CBD5E1",
                                      padding: "0.35rem",
                                      zIndex: 9999,
                                      minWidth: "215px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "0.15rem",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* View Details */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedVehicleForDrawer(veh);
                                        setActiveActionMenuId(null);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        border: "none",
                                        borderRadius: "0.375rem",
                                        backgroundColor: "#FFFFFF",
                                        color: "#334155",
                                        fontSize: "0.82rem",
                                        fontWeight: 500,
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                    >
                                      <Eye size={15} color="#2563EB" />
                                      <span>View Details</span>
                                    </button>

                                    {/* Edit Vehicle */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedVehicleForEdit(veh);
                                        setScreenMode("edit");
                                        setActiveActionMenuId(null);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        border: "none",
                                        borderRadius: "0.375rem",
                                        backgroundColor: "#FFFFFF",
                                        color: "#334155",
                                        fontSize: "0.82rem",
                                        fontWeight: 500,
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                    >
                                      <Edit2 size={15} color="#059669" />
                                      <span>Edit Vehicle</span>
                                    </button>

                                    <div style={{ height: "1px", backgroundColor: "#F1F5F9", margin: "0.2rem 0" }} />

                                    {/* Body Damage */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDamageModalConfig({ isOpen: true, vehicle: veh, type: "body" });
                                        setActiveActionMenuId(null);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        border: "none",
                                        borderRadius: "0.375rem",
                                        backgroundColor: "#FFFFFF",
                                        color: "#334155",
                                        fontSize: "0.82rem",
                                        fontWeight: 500,
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                    >
                                      <ShieldAlert size={15} color="#DC2626" />
                                      <span>Body Damage</span>
                                    </button>

                                    {/* Mechanical Issues */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDamageModalConfig({ isOpen: true, vehicle: veh, type: "mechanical" });
                                        setActiveActionMenuId(null);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        border: "none",
                                        borderRadius: "0.375rem",
                                        backgroundColor: "#FFFFFF",
                                        color: "#334155",
                                        fontSize: "0.82rem",
                                        fontWeight: 500,
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                    >
                                      <AlertTriangle size={15} color="#D97706" />
                                      <span>Mechanical Issues</span>
                                    </button>

                                    {/* Preventive Maintenance */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreventiveModalConfig({ isOpen: true, vehicle: veh });
                                        setActiveActionMenuId(null);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        border: "none",
                                        borderRadius: "0.375rem",
                                        backgroundColor: "#FFFFFF",
                                        color: "#334155",
                                        fontSize: "0.82rem",
                                        fontWeight: 500,
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                    >
                                      <Wrench size={15} color="#2563EB" />
                                      <span>Preventive Maintenance</span>
                                    </button>

                                    {/* Vehicle Timeline */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTimelineModalConfig({ isOpen: true, vehicle: veh });
                                        setActiveActionMenuId(null);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        border: "none",
                                        borderRadius: "0.375rem",
                                        backgroundColor: "#FFFFFF",
                                        color: "#334155",
                                        fontSize: "0.82rem",
                                        fontWeight: 500,
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                    >
                                      <Clock size={15} color="#7C3AED" />
                                      <span>Vehicle Timeline</span>
                                    </button>

                                    <div style={{ height: "1px", backgroundColor: "#F1F5F9", margin: "0.2rem 0" }} />

                                    {/* Delete Vehicle */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        setActiveActionMenuId(null);
                                        handleDeleteVehicle(veh, e);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        border: "none",
                                        borderRadius: "0.375rem",
                                        backgroundColor: "#FFFFFF",
                                        color: "#DC2626",
                                        fontSize: "0.82rem",
                                        fontWeight: 600,
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                    >
                                      <Trash2 size={15} color="#DC2626" />
                                      <span>Delete Vehicle</span>
                                    </button>
                                  </div>
                                )}
                              </div>
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
                    gap: "1.25rem",
                  }}
                >
                  {filteredVehicles.map((veh) => {
                    const statusPill = {
                      active: { label: "In Service", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
                      grounded: { label: "Grounded", bg: "#FEF2F2", text: "#991B1B", border: "#FCA5A5" },
                      maintenance: { label: "Maintenance", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
                      inactive: { label: "Inactive", bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
                    }[veh.status] || { label: veh.status, bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };

                    return (
                      <div
                        key={veh.id}
                        onClick={() => setSelectedVehicleForDrawer(veh)}
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "14px",
                          padding: "1.25rem",
                          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 18px rgba(15, 23, 42, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "0 2px 6px rgba(15, 23, 42, 0.04)";
                        }}
                      >
                        {/* Top Row: Icon, Title & Status */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                backgroundColor: "#EFF6FF",
                                border: "1px solid #BFDBFE",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#2563EB",
                              }}
                            >
                              <Truck size={20} />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 750, color: "#0F172A" }}>
                                {veh.name}
                              </h4>
                              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                {veh.make} {veh.model}
                              </span>
                            </div>
                          </div>

                          <span
                            style={{
                              padding: "0.15rem 0.55rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
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
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #F1F5F9",
                            borderRadius: "8px",
                            padding: "0.75rem",
                            fontSize: "0.8125rem",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.5rem",
                          }}
                        >
                          <div>
                            <span style={{ color: "#64748B", fontSize: "0.75rem", display: "block" }}>Plate</span>
                            <strong style={{ color: "#1E293B" }}>{veh.plate} ({veh.state || "US"})</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748B", fontSize: "0.75rem", display: "block" }}>Type</span>
                            <strong style={{ color: "#1E293B" }}>{String(veh.vehicle_type || "Cargo Van")}</strong>
                          </div>
                          <div style={{ gridColumn: "span 2" }}>
                            <span style={{ color: "#64748B", fontSize: "0.75rem", display: "block" }}>VIN</span>
                            <code style={{ color: "#334155", fontWeight: 600, fontSize: "0.75rem" }}>{veh.vin}</code>
                          </div>
                        </div>

                        {/* Card Footer: Action Dropdown */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            paddingTop: "0.5rem",
                            borderTop: "1px solid #F1F5F9",
                          }}
                        >
                          <div
                            style={{ position: "relative", display: "inline-block" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId((prev) => (prev === veh.id ? null : veh.id));
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                padding: "0.35rem 0.75rem",
                                borderRadius: "0.5rem",
                                border: "1px solid #E2E8F0",
                                backgroundColor: activeActionMenuId === veh.id ? "#EFF6FF" : "#FFFFFF",
                                color: activeActionMenuId === veh.id ? "#2563EB" : "#475569",
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <span>Actions</span>
                              <MoreVertical size={14} />
                            </button>

                            {/* Dropdown Menu in Grid Card */}
                            {activeActionMenuId === veh.id && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  bottom: "calc(100% + 4px)",
                                  backgroundColor: "#FFFFFF",
                                  borderRadius: "0.75rem",
                                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                                  border: "1px solid #CBD5E1",
                                  padding: "0.35rem",
                                  zIndex: 9999,
                                  minWidth: "215px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.15rem",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedVehicleForDrawer(veh);
                                    setActiveActionMenuId(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    backgroundColor: "#FFFFFF",
                                    color: "#334155",
                                    fontSize: "0.82rem",
                                    fontWeight: 500,
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                >
                                  <Eye size={15} color="#2563EB" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedVehicleForEdit(veh);
                                    setScreenMode("edit");
                                    setActiveActionMenuId(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    backgroundColor: "#FFFFFF",
                                    color: "#334155",
                                    fontSize: "0.82rem",
                                    fontWeight: 500,
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                >
                                  <Edit2 size={15} color="#059669" />
                                  <span>Edit Vehicle</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDamageModalConfig({ isOpen: true, vehicle: veh, type: "body" });
                                    setActiveActionMenuId(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    backgroundColor: "#FFFFFF",
                                    color: "#334155",
                                    fontSize: "0.82rem",
                                    fontWeight: 500,
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                >
                                  <ShieldAlert size={15} color="#DC2626" />
                                  <span>Body Damage</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDamageModalConfig({ isOpen: true, vehicle: veh, type: "mechanical" });
                                    setActiveActionMenuId(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    backgroundColor: "#FFFFFF",
                                    color: "#334155",
                                    fontSize: "0.82rem",
                                    fontWeight: 500,
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                >
                                  <AlertTriangle size={15} color="#D97706" />
                                  <span>Mechanical Issues</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreventiveModalConfig({ isOpen: true, vehicle: veh });
                                    setActiveActionMenuId(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    backgroundColor: "#FFFFFF",
                                    color: "#334155",
                                    fontSize: "0.82rem",
                                    fontWeight: 500,
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                >
                                  <Wrench size={15} color="#2563EB" />
                                  <span>Preventive Maintenance</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setTimelineModalConfig({ isOpen: true, vehicle: veh });
                                    setActiveActionMenuId(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    backgroundColor: "#FFFFFF",
                                    color: "#334155",
                                    fontSize: "0.82rem",
                                    fontWeight: 500,
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                >
                                  <Clock size={15} color="#7C3AED" />
                                  <span>Vehicle Timeline</span>
                                </button>

                                <div style={{ height: "1px", backgroundColor: "#F1F5F9", margin: "0.2rem 0" }} />

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setActiveActionMenuId(null);
                                    handleDeleteVehicle(veh, e);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    backgroundColor: "#FFFFFF",
                                    color: "#DC2626",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                                >
                                  <Trash2 size={15} color="#DC2626" />
                                  <span>Delete Vehicle</span>
                                </button>
                              </div>
                            )}
                          </div>
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
