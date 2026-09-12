import React, { FC, useState, useEffect, useMemo } from "react";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  RefreshCw,
  Link,
  Filter,
  ShieldCheck,
  ChevronRight,
  User,
  Gauge,
  Fuel,
  Building,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import {
  fleetApi,
  VehicleRecord,
  InspectionRecord,
  normalizeInspectionRecord,
} from "../../../api/fleetApi";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import InspectionReportDrawer from "./InspectionReportDrawer";
import EmbeddedInspectionReportView from "./EmbeddedInspectionReportView";
import VehicleDriverAssignmentModal from "./VehicleDriverAssignmentModal";
import NewInspectionModal from "./NewInspectionModal";

const panelStyle: React.CSSProperties = {
  background: "var(--ads-material-thick)",
  backdropFilter: "var(--ads-blur-md)",
  WebkitBackdropFilter: "var(--ads-blur-md)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-lg)",
  boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
};

const thStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "var(--ads-blur-sm)",
  WebkitBackdropFilter: "var(--ads-blur-sm)",
  color: "var(--ads-ink-tertiary)",
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--ads-hairline)",
  padding: "var(--ads-s3) var(--ads-s4)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--ads-s3) var(--ads-s4)",
  verticalAlign: "top",
};

const rowPillStyle = (tint: string, fg: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "3px 10px",
  borderRadius: "var(--ads-r-pill)",
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "-0.005em",
  background: tint,
  color: fg,
  border: "1px solid transparent",
  whiteSpace: "nowrap",
});

const kpiCardStyle: React.CSSProperties = {
  ...panelStyle,
  padding: "var(--ads-s4)",
  transition: "transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
};

const kpiHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--ads-s2)",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--ads-ink-tertiary)",
  marginBottom: "var(--ads-s1)",
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: 700,
  letterSpacing: "-0.022em",
  color: "var(--ads-ink)",
};

const kpiMetaStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: "var(--ads-ink-tertiary)",
  marginTop: "var(--ads-s1)",
};

export const VehicleInspectionView: FC = () => {
  // Global Store State
  const drivers = useDriverStore((state) => state.drivers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
  const stations = useAuthStore((state) => state.stations);
  const user = useAuthStore((state) => state.user);

  // Active Station Code
  const activeStation =
    user?.station_code ||
    user?.company?.station_code ||
    (stations[0]?.station_code ?? "QUE2");

  // Local State
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "pre" | "post" | "default">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_service" | "needs_inspection" | "grounded" | "defects">("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  // Modals & Slide-over Drawer
  const [drawerInspection, setDrawerInspection] = useState<InspectionRecord | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState<boolean>(false);
  const [assignmentVehicleId, setAssignmentVehicleId] = useState<number | string | undefined>(undefined);
  const [isNewInspectionModalOpen, setIsNewInspectionModalOpen] = useState<boolean>(false);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load Vehicles, Drivers & Inspections
  const loadData = async (dateToFetch: string = selectedDate) => {
    try {
      setIsLoading(true);
      const [vList, inspList] = await Promise.all([
        fleetApi.getVehicles(),
        fleetApi.getInspectionsByDate(dateToFetch),
        drivers.length === 0 ? fetchDrivers() : Promise.resolve(),
      ]);

      setVehicles(vList);
      setInspections(inspList);
    } catch {
      // API call handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(selectedDate);
  };

  // Two-Way Assignment Handler with Optimistic UI Update
  const handleAssignment = async (
    vehicleId: number | string,
    driverId: number | null,
    driverName: string
  ) => {
    // 1. Snapshot previous state for rollback
    const prevVehicles = [...vehicles];
    const prevInspections = [...inspections];

    // 2. Real-time Optimistic Update
    setVehicles((prev) =>
      prev.map((v) => {
        if (String(v.id) === String(vehicleId)) {
          return {
            ...v,
            assigned_driver: driverId,
            assigned_driver_name: driverName || "",
          };
        }
        return v;
      })
    );

    setInspections((prev) =>
      prev.map((insp) => {
        if (String(insp.vehicle_id) === String(vehicleId)) {
          return {
            ...insp,
            driver_id: driverId || undefined,
            driver_name: driverName || "Unassigned",
          };
        }
        return insp;
      })
    );

    showToast(
      driverId
        ? `Optimistically assigned ${driverName} to vehicle #${vehicleId}.`
        : `Vehicle #${vehicleId} has been unassigned.`,
      "success"
    );

    // 3. Background Sync to Backend
    try {
      await fleetApi.assignVehicleDriver(vehicleId, driverId, driverName);
    } catch (err: any) {
      // Rollback on failure
      setVehicles(prevVehicles);
      setInspections(prevInspections);
      showToast(err?.message || "Failed to persist assignment to server. Reverted.", "error");
    }
  };

  // New Inspection Submission Handler
  const handleCreateInspection = async (data: Partial<InspectionRecord>) => {
    // 1. Optimistic Add to Table
    const normalized = normalizeInspectionRecord(data, "driver", inspections.length);
    setInspections((prev) => [normalized, ...prev]);

    // Also update vehicle odometer/status if provided
    if (data.vehicle_id && data.odometer) {
      setVehicles((prev) =>
        prev.map((v) =>
          String(v.id) === String(data.vehicle_id)
            ? {
                ...v,
                odometer: data.odometer,
                status: data.status === "failed" ? "grounded" : v.status,
              }
            : v
        )
      );
    }

    showToast(`Inspection #${normalized.id} recorded successfully.`, "success");

    // 2. Backend Submission
    try {
      await fleetApi.createInspection(data);
    } catch {
      // Offline fallback already reflected
    }
  };

  // KPIs & Metrics
  const totalInspected = inspections.length;
  const passedCount = inspections.filter((i) => i.status === "passed").length;
  const passRate = totalInspected > 0 ? Math.round((passedCount / totalInspected) * 100) : 100;
  const defectCount = inspections.filter((i) => i.status === "failed" || i.status === "caution").length;
  const assignedVehiclesCount = vehicles.filter((v) => Boolean(v.assigned_driver_name)).length;

  // Filter & Search Logic
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      // 1. Tab filter (All | Pre | Post | Default)
      if (activeTab !== "all" && insp.inspection_type !== activeTab) {
        return false;
      }

      // 2. Status pill filter
      if (statusFilter === "in_service" && insp.status !== "passed") {
        return false;
      }
      if (statusFilter === "needs_inspection" && insp.status !== "pending") {
        return false;
      }
      if (statusFilter === "grounded" && insp.status !== "failed") {
        return false;
      }
      if (statusFilter === "defects" && insp.status !== "failed" && insp.status !== "caution") {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUnit = insp.vehicle_unit?.toLowerCase().includes(q);
        const matchesVin = insp.vin?.toLowerCase().includes(q);
        const matchesPlate = insp.license_plate?.toLowerCase().includes(q);
        const matchesDriver = insp.driver_name?.toLowerCase().includes(q);
        const matchesShift = insp.shift_type?.toLowerCase().includes(q);
        if (!matchesUnit && !matchesVin && !matchesPlate && !matchesDriver && !matchesShift) {
          return false;
        }
      }

      return true;
    });
  }, [inspections, activeTab, statusFilter, searchQuery]);

  const renderToast = () =>
    toastMsg && (
      <div
        style={{
          position: "fixed",
          bottom: "var(--ads-s5)",
          right: "var(--ads-s5)",
          zIndex: 50,
          padding: "var(--ads-s3) var(--ads-s4)",
          borderRadius: "var(--ads-r-md)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          fontSize: "0.75rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "var(--ads-s2)",
          background:
            toastMsg.type === "success" ? "var(--ads-green-tint)" : "var(--ads-red-tint)",
          color: toastMsg.type === "success" ? "var(--ads-green)" : "var(--ads-red)",
          border: `1px solid ${
            toastMsg.type === "success" ? "var(--ads-green)" : "var(--ads-red)"
          }`,
        }}
      >
        {toastMsg.type === "success" ? (
          <CheckCircle2 size={16} style={{ color: "var(--ads-green)" }} />
        ) : (
          <AlertTriangle size={16} style={{ color: "var(--ads-red)" }} />
        )}
        <span>{toastMsg.text}</span>
      </div>
    );

  // If viewing full report, render the embedded inspection report in the background complete screen
  if (drawerInspection) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s5)" }}>
        {renderToast()}

        <EmbeddedInspectionReportView
          inspection={drawerInspection}
          onBack={() => setDrawerInspection(null)}
          onReassignVehicle={(insp) => {
            setAssignmentVehicleId(insp.vehicle_id);
            setIsAssignmentModalOpen(true);
          }}
        />

        {/* Two-Way Vehicle-Driver Assignment Modal if triggered */}
        <VehicleDriverAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          vehicles={vehicles}
          drivers={drivers}
          initialVehicleId={assignmentVehicleId}
          onAssign={handleAssignment}
        />
      </div>
    );
  }

  // Render New Inspection Form embedded directly in background complete screen
  if (isNewInspectionModalOpen) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s4)", width: "100%" }}>
        {renderToast()}

        <NewInspectionModal
          isOpen={true}
          embedded={true}
          onClose={() => setIsNewInspectionModalOpen(false)}
          vehicles={vehicles}
          drivers={drivers}
          onSubmit={async (data) => {
            await handleCreateInspection(data);
            setIsNewInspectionModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s5)" }}>
      {/* Toast Notification */}
      {renderToast()}

      {/* Header Breadcrumb & Actions Bar */}
      <div
        style={{
          ...panelStyle,
          padding: "var(--ads-s5)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--ads-s4)",
        }}
      >
        {/* Left: Breadcrumb & Title */}
        <div>
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--ads-ink-tertiary)",
              marginBottom: "var(--ads-s1)",
            }}
          >
            <span style={{ cursor: "pointer" }}>Fleet</span>
            <ChevronRight size={12} style={{ color: "var(--ads-ink-quaternary)" }} />
            <span style={{ color: "var(--ads-blue)" }}>Vehicle Inspections</span>
            <span style={{ color: "var(--ads-ink-quaternary)" }}>|</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--ads-ink-secondary)",
                background: "rgba(0,0,0,0.04)",
                padding: "2px 8px",
                borderRadius: "var(--ads-r-pill)",
              }}
            >
              <Building size={11} style={{ color: "var(--ads-blue)" }} />
              Station: {activeStation}
            </span>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                fontSize: "1.75rem",
                fontWeight: 700,
                letterSpacing: "-0.022em",
                color: "var(--ads-ink)",
              }}
            >
              <ShieldCheck size={24} style={{ color: "var(--ads-blue)" }} />
              Inspection & Assignment View
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 10px",
                borderRadius: "var(--ads-r-pill)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                background: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                border: "1px solid transparent",
              }}
            >
              Live Fleet Tracking
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)", flexWrap: "wrap" }}>
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh inspections and vehicles"
            title="Refresh Inspections & Vehicles"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              background: "var(--ads-material-thick)",
              color: "var(--ads-ink)",
              border: "1px solid var(--ads-hairline)",
              borderRadius: "var(--ads-r-pill)",
              boxShadow: "var(--ads-bevel)",
              cursor: "pointer",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
              style={{ color: isRefreshing ? "var(--ads-blue)" : "var(--ads-ink-tertiary)" }}
            />
            <span>Sync</span>
          </button>

          {/* Date Picker */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Calendar
              size={14}
              style={{
                position: "absolute",
                left: "12px",
                color: "var(--ads-ink-quaternary)",
                pointerEvents: "none",
              }}
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Inspection date"
              style={{
                padding: "9px 13px 9px 34px",
                fontFamily: "inherit",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--ads-ink)",
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-sm)",
                outline: "none",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            />
          </div>

          {/* Primary Action Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            <button
              type="button"
              onClick={() => {
                setAssignmentVehicleId(undefined);
                setIsAssignmentModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#FFFFFF",
                background: "var(--ads-blue)",
                border: "1px solid transparent",
                borderRadius: "var(--ads-r-pill)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <Link size={14} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Assign Vehicle</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewInspectionModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#FFFFFF",
                background: "var(--ads-blue)",
                border: "1px solid transparent",
                borderRadius: "var(--ads-r-pill)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <Plus size={14} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>+ Log Inspection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fleet KPI Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--ads-s3)",
        }}
      >
        <div
          style={kpiCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-sm), var(--ads-bevel)";
          }}
        >
          <div style={kpiHeadStyle}>
            <span>Inspected Today</span>
            <FileText size={15} style={{ color: "var(--ads-blue)" }} />
          </div>
          <div style={kpiValueStyle}>
            {totalInspected}{" "}
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ads-ink-tertiary)" }}>
              records
            </span>
          </div>
          <div style={kpiMetaStyle}>
            <span>Total fleet vans: {vehicles.length}</span>
          </div>
        </div>

        <div
          style={kpiCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-sm), var(--ads-bevel)";
          }}
        >
          <div style={kpiHeadStyle}>
            <span>Pass Rate</span>
            <CheckCircle2 size={15} style={{ color: "var(--ads-green)" }} />
          </div>
          <div style={{ ...kpiValueStyle, color: "var(--ads-green)" }}>
            {passRate}%
          </div>
          <div style={kpiMetaStyle}>
            {passedCount} passed without open safety flags
          </div>
        </div>

        <div
          style={kpiCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-sm), var(--ads-bevel)";
          }}
        >
          <div style={kpiHeadStyle}>
            <span>Defects / Caution Flags</span>
            <AlertTriangle size={15} style={{ color: "var(--ads-amber)" }} />
          </div>
          <div style={{ ...kpiValueStyle, color: defectCount > 0 ? "var(--ads-amber)" : "var(--ads-ink)" }}>
            {defectCount}
          </div>
          <div style={kpiMetaStyle}>
            {defectCount === 0 ? "Zero flagged defects" : "Needs maintenance dispatch check"}
          </div>
        </div>

        <div
          style={kpiCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-sm), var(--ads-bevel)";
          }}
        >
          <div style={kpiHeadStyle}>
            <span>Assigned Fleet</span>
            <Truck size={15} style={{ color: "var(--ads-blue)" }} />
          </div>
          <div style={kpiValueStyle}>
            {assignedVehiclesCount} / {vehicles.length}
          </div>
          <div style={{ ...kpiMetaStyle, color: "var(--ads-blue)", fontWeight: 600 }}>
            {vehicles.length > 0 ? `${Math.round((assignedVehiclesCount / vehicles.length) * 100)}% active allocation` : "—"}
          </div>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div style={{ ...panelStyle, overflow: "hidden" }}>
        {/* Toolbar: Search, Filter Pills & Tabs */}
        <div
          style={{
            padding: "var(--ads-s4)",
            borderBottom: "1px solid var(--ads-hairline)",
            background: "transparent",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
          }}
        >
          {/* Multi-Tab Filter Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s1)",
              padding: "4px",
              background: "rgba(0,0,0,0.04)",
              borderRadius: "var(--ads-r-pill)",
              overflowX: "auto",
            }}
          >
            {[
              { id: "all", label: "All Inspections", count: inspections.length },
              { id: "pre", label: "Pre-Inspection", count: inspections.filter((i) => i.inspection_type === "pre").length },
              { id: "post", label: "Post-Inspection (Return)", count: inspections.filter((i) => i.inspection_type === "post").length },
              { id: "default", label: "Default / Daily DVIC", count: inspections.filter((i) => i.inspection_type === "default").length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 15px",
                    borderRadius: "var(--ads-r-pill)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                    whiteSpace: "nowrap",
                    border: "1px solid transparent",
                    background: isActive ? "var(--ads-blue)" : "transparent",
                    color: isActive ? "#FFFFFF" : "var(--ads-ink-secondary)",
                    boxShadow: isActive ? "0 1px 4px rgba(0,113,227,0.30)" : "none",
                    cursor: "pointer",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  <span style={{ color: isActive ? "#FFFFFF" : undefined }}>{tab.label}</span>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      padding: "1px 7px",
                      borderRadius: "var(--ads-r-pill)",
                      background: isActive ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.06)",
                      color: isActive ? "#FFFFFF" : "var(--ads-ink-secondary)",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search & Status Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "220px" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--ads-ink-quaternary)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Unit #, VIN, Driver..."
                aria-label="Search inspections"
                style={{
                  width: "100%",
                  padding: "8px 13px 8px 34px",
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--ads-ink)",
                  background: "var(--ads-material-thick)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-sm)",
                  outline: "none",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              />
            </div>

            {/* Status Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s1)", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Status" },
                { id: "in_service", label: "Passed" },
                { id: "defects", label: "Defects / Flagged" },
                { id: "grounded", label: "Grounded" },
              ].map((pill) => {
                const isActive = statusFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id as any)}
                    style={{
                      padding: "6px 13px",
                      borderRadius: "var(--ads-r-pill)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: isActive ? "var(--ads-ink)" : "var(--ads-material-thick)",
                      color: isActive ? "#FFFFFF" : "var(--ads-ink-secondary)",
                      border: `1px solid ${isActive ? "transparent" : "var(--ads-hairline)"}`,
                      boxShadow: isActive ? "var(--ads-shadow-xs)" : "var(--ads-bevel)",
                      cursor: "pointer",
                      transition: "all var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              textAlign: "left",
              fontSize: "0.75rem",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Vehicle Info</th>
                <th style={thStyle}>Driver Name</th>
                <th style={thStyle}>Inspection Type</th>
                <th style={thStyle}>Checklist Status</th>
                <th style={thStyle}>Date &amp; Time</th>
                <th style={thStyle}>Submission Details</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontWeight: 500, color: "var(--ads-ink-secondary)" }}>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: "var(--ads-s10) var(--ads-s4)", textAlign: "center", color: "var(--ads-ink-tertiary)" }}
                  >
                    <RefreshCw
                      size={24}
                      className="animate-spin"
                      style={{ color: "var(--ads-blue)", display: "block", margin: "0 auto var(--ads-s2)" }}
                    />
                    <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)" }}>
                      Syncing live inspection records and fleet vehicles...
                    </p>
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: "var(--ads-s10) var(--ads-s4)", textAlign: "center", color: "var(--ads-ink-tertiary)" }}
                  >
                    <FileText
                      size={32}
                      style={{ display: "block", margin: "0 auto var(--ads-s2)", color: "var(--ads-ink-quaternary)" }}
                    />
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                      No inspection logs found for {selectedDate}
                    </p>
                    <p
                      style={{
                        margin: "var(--ads-s1) auto 0",
                        fontSize: "0.75rem",
                        color: "var(--ads-ink-tertiary)",
                        maxWidth: "24rem",
                      }}
                    >
                      No records match the selected filter. You can log an inspection or switch the date above.
                    </p>
                    <div style={{ marginTop: "var(--ads-s3)" }}>
                      <button
                        type="button"
                        onClick={() => setIsNewInspectionModalOpen(true)}
                        style={{
                          padding: "9px 18px",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                          color: "#FFFFFF",
                          background: "var(--ads-blue)",
                          border: "1px solid transparent",
                          borderRadius: "var(--ads-r-pill)",
                          cursor: "pointer",
                          transition: "all var(--ads-dur-fast) var(--ads-ease)",
                        }}
                      >
                        + Log New Inspection Form
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInspections.map((insp) => {
                  const isPassed = insp.status === "passed";
                  const isCaution = insp.status === "caution";
                  const isFailed = insp.status === "failed";

                  return (
                    <tr
                      key={insp.id}
                      style={{ transition: "background-color var(--ads-dur-fast) var(--ads-ease)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,113,227,0.045)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* 1. Vehicle Info */}
                      <td style={{ ...tdStyle, borderBottom: "1px solid var(--ads-hairline)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              flexShrink: 0,
                              marginTop: "2px",
                              borderRadius: "var(--ads-r-sm)",
                              background: "var(--ads-blue-tint)",
                              border: "1px solid var(--ads-hairline)",
                              color: "var(--ads-blue)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Truck size={15} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--ads-ink)",
                                fontSize: "0.75rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {insp.vehicle_unit || "Fleet Van"}
                            </div>
                            <div
                              style={{
                                fontSize: "0.6875rem",
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                color: "var(--ads-ink-tertiary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {insp.vin || "VIN —"}
                            </div>
                            <div style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
                              Plate: <span style={{ color: "var(--ads-ink-secondary)" }}>{insp.license_plate || "—"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Driver Name */}
                      <td style={{ ...tdStyle, borderBottom: "1px solid var(--ads-hairline)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              flexShrink: 0,
                              borderRadius: "50%",
                              background: "var(--ads-blue-tint)",
                              color: "var(--ads-blue)",
                              fontWeight: 600,
                              fontSize: "0.625rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {insp.driver_name?.charAt(0) || "D"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--ads-ink)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {insp.driver_name || "Unassigned"}
                            </div>
                            <div
                              style={{
                                fontSize: "0.625rem",
                                color: "var(--ads-ink-quaternary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {insp.driver_id ? `ID: #${insp.driver_id}` : "Assigned driver"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Inspection Type */}
                      <td style={{ ...tdStyle, borderBottom: "1px solid var(--ads-hairline)", whiteSpace: "nowrap" }}>
                        <span
                          style={
                            insp.inspection_type === "post"
                              ? rowPillStyle("var(--ads-purple-tint)", "var(--ads-purple)")
                              : insp.inspection_type === "default"
                              ? rowPillStyle("rgba(0,0,0,0.05)", "var(--ads-ink-secondary)")
                              : rowPillStyle("var(--ads-blue-tint)", "var(--ads-blue)")
                          }
                        >
                          {insp.inspection_type === "post"
                            ? "Post-Trip (Return)"
                            : insp.inspection_type === "default"
                            ? "Daily DVIC"
                            : "Pre-Trip DVIC"}
                        </span>
                        <div style={{ fontSize: "0.625rem", color: "var(--ads-ink-quaternary)", marginTop: "3px" }}>
                          {insp.shift_type || "Daily Inspection"}
                        </div>
                      </td>

                      {/* 4. Checklist Status (Pass / Caution / Fail) */}
                      <td style={{ ...tdStyle, borderBottom: "1px solid var(--ads-hairline)", whiteSpace: "nowrap" }}>
                        {isPassed && (
                          <span style={rowPillStyle("var(--ads-green-tint)", "var(--ads-green)")}>
                            <CheckCircle2 size={12} style={{ color: "var(--ads-green)" }} />
                            PASS (Satisfactory)
                          </span>
                        )}
                        {isCaution && (
                          <span style={rowPillStyle("var(--ads-amber-tint)", "var(--ads-amber)")}>
                            <AlertTriangle size={12} style={{ color: "var(--ads-amber)" }} />
                            CAUTION ({insp.defects_found || 1} defect)
                          </span>
                        )}
                        {isFailed && (
                          <span style={rowPillStyle("var(--ads-red-tint)", "var(--ads-red)")}>
                            <XCircle size={12} style={{ color: "var(--ads-red)" }} />
                            FAIL / GROUNDED
                          </span>
                        )}
                      </td>

                      {/* 5. Date & Time */}
                      <td style={{ ...tdStyle, borderBottom: "1px solid var(--ads-hairline)", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, color: "var(--ads-ink)" }}>{insp.date}</div>
                        <div style={{ fontSize: "0.625rem", color: "var(--ads-ink-quaternary)" }}>
                          {insp.verified_on
                            ? new Date(insp.verified_on).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Submitted"}
                        </div>
                      </td>

                      {/* 6. Submission Details */}
                      <td style={{ ...tdStyle, borderBottom: "1px solid var(--ads-hairline)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.6875rem",
                              color: "var(--ads-ink-secondary)",
                            }}
                          >
                            <Gauge size={11} style={{ color: "var(--ads-ink-quaternary)" }} />
                            <span>{insp.odometer ? `${insp.odometer.toLocaleString()} mi` : "—"}</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.625rem",
                              color: "var(--ads-ink-tertiary)",
                            }}
                          >
                            <Fuel size={11} style={{ color: "var(--ads-ink-quaternary)" }} />
                            <span>{insp.fuel_level || "Standard"}</span>
                          </div>
                        </div>
                      </td>

                      {/* 7. Row Actions */}
                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: "1px solid var(--ads-hairline)",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setDrawerInspection(insp)}
                            aria-label={`Open full report for ${insp.vehicle_unit || "vehicle"}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 13px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "var(--ads-blue)",
                              background: "var(--ads-blue-tint)",
                              border: "1px solid transparent",
                              borderRadius: "var(--ads-r-pill)",
                              cursor: "pointer",
                              transition: "all var(--ads-dur-fast) var(--ads-ease)",
                            }}
                          >
                            <FileText size={12} style={{ color: "var(--ads-blue)" }} />
                            <span>Full Report</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAssignmentVehicleId(insp.vehicle_id);
                              setIsAssignmentModalOpen(true);
                            }}
                            aria-label={`Reassign driver for ${insp.vehicle_unit || "vehicle"}`}
                            title="Reassign or update driver for this vehicle"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 13px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "var(--ads-ink-secondary)",
                              background: "var(--ads-material-thick)",
                              border: "1px solid var(--ads-hairline)",
                              borderRadius: "var(--ads-r-pill)",
                              boxShadow: "var(--ads-bevel)",
                              cursor: "pointer",
                              transition: "all var(--ads-dur-fast) var(--ads-ease)",
                            }}
                          >
                            <Link size={12} />
                            <span>Assign</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div
          style={{
            padding: "var(--ads-s3) var(--ads-s4)",
            background: "transparent",
            borderTop: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
            fontSize: "0.75rem",
            color: "var(--ads-ink-tertiary)",
          }}
        >
          <span>
            Showing <strong style={{ color: "var(--ads-ink)" }}>{filteredInspections.length}</strong> of{" "}
            <strong style={{ color: "var(--ads-ink)" }}>{inspections.length}</strong> inspection records
          </span>
          <span style={{ fontWeight: 600, color: "var(--ads-ink-secondary)" }}>
            Real-Time DVIC Fleet Operations
          </span>
        </div>
      </div>

      {/* Two-Way Vehicle-Driver Assignment Modal */}
      <VehicleDriverAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        vehicles={vehicles}
        drivers={drivers}
        initialVehicleId={assignmentVehicleId}
        onAssign={handleAssignment}
      />
    </div>
  );
};

export default VehicleInspectionView;
