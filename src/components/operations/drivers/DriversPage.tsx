import React, { FC, useState, useEffect, useMemo } from "react";
import { useSearchParams, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Users,
} from "lucide-react";
import GlassAppLayout from "../../layout/GlassAppLayout";
import DriverTable from "./DriverTable";
import BulkActionBar from "./BulkActionBar";
import AddDriverScreen from "./AddDriverScreen";
import EditDriverScreen from "./EditDriverScreen";
import DriverProfileScreen from "./DriverProfileScreen";
import DriverStatusFilterComponent from "./DriverStatusFilter";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import useStationReadOnly from "../../../hooks/useStationReadOnly";
import type { Driver } from "../../../types/driver";
import CalloutManagementView from "../callout/CalloutManagementView";
import RescueManagementView from "../rescue/RescueManagementView";
import NotesManagementView from "../notes/NotesManagementView";
import TasksManagementView from "../tasks/TasksManagementView";

export const DriversPage: FC = () => {
  const [searchParams] = useSearchParams();
  if (searchParams.get("tab") === "vehicles") {
    return <Navigate to="/vehicles" replace />;
  }
  if (searchParams.get("tab") === "templates") {
    return <Navigate to="/templates" replace />;
  }
  if (searchParams.get("tab") === "curations") {
    return <Navigate to="/curations" replace />;
  }
  if (searchParams.get("tab") === "upload_roster") {
    return <Navigate to="/performance/upload?report=weekly_roster_report" replace />;
  }
  if (searchParams.get("tab") === "bulk_upload") {
    return <Navigate to="/performance/upload?report=drivers&category=bulk" replace />;
  }
  if (searchParams.get("tab") === "callout") {
    return (
      <GlassAppLayout currentRoute="callout" activeBreadcrumb={{ section: "Utilities", page: "Callouts" }}>
        <CalloutManagementView />
      </GlassAppLayout>
    );
  }
  if (searchParams.get("tab") === "rescue") {
    return (
      <GlassAppLayout currentRoute="rescue" activeBreadcrumb={{ section: "Utilities", page: "Rescue" }}>
        <RescueManagementView />
      </GlassAppLayout>
    );
  }
  if (searchParams.get("tab") === "notes") {
    return (
      <GlassAppLayout currentRoute="notes" activeBreadcrumb={{ section: "Utilities", page: "Writeup" }}>
        <NotesManagementView />
      </GlassAppLayout>
    );
  }
  if (searchParams.get("tab") === "tasks") {
    return (
      <GlassAppLayout currentRoute="tasks" activeBreadcrumb={{ section: "Operations", page: "Tasks" }}>
        <TasksManagementView />
      </GlassAppLayout>
    );
  }

  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  const { readOnly, reason } = useStationReadOnly();

  const drivers = useDriverStore((state) => state.drivers);
  const selectedStationFilter = useDriverStore((state) => state.selectedStationFilter);
  const setSelectedStationFilter = useDriverStore((state) => state.setSelectedStationFilter);
  const statusFilter = useDriverStore((state) => state.statusFilter);
  const setStatusFilter = useDriverStore((state) => state.setStatusFilter);
  const signinFilter = useDriverStore((state) => state.signinFilter);
  const searchQuery = useDriverStore((state) => state.searchQuery);
  const setSearchQuery = useDriverStore((state) => state.setSearchQuery);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
  const isLoading = useDriverStore((state) => state.isLoading);

  const stationDrivers = useMemo(() => {
    if (!activeStationCode) return drivers;
    const target = activeStationCode.trim().toUpperCase();
    return drivers.filter((driver) =>
      driver.stations.some((s) => s.station_code && s.station_code.trim().toUpperCase() === target)
    );
  }, [drivers, activeStationCode]);

  const totalActiveCount = useMemo(
    () => stationDrivers.filter((d) => d.status === "active").length,
    [stationDrivers]
  );
  const totalInactiveCount = useMemo(
    () => stationDrivers.filter((d) => d.status === "inactive").length,
    [stationDrivers]
  );

  // Sync selectedStationFilter with active delivery station if empty
  useEffect(() => {
    if (activeStationCode && !selectedStationFilter) {
      setSelectedStationFilter(activeStationCode);
    }
  }, [activeStationCode, selectedStationFilter, setSelectedStationFilter]);

  // Load dynamic drivers from microservice on mount
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const location = useLocation();
  const navigate = useNavigate();
  const locState = location.state as any;
  const fromSource = locState?.from;
  const returnUrl = locState?.returnUrl || (fromSource === "curations" ? "/curations" : null);

  const [viewMode, setViewMode] = useState<"list" | "add" | "edit" | "profile">("list");
  const [initialAddDriver, setInitialAddDriver] = useState<any>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);
  const [selectedDriverIds, setSelectedDriverIds] = useState<number[]>([]);

  // Automatically activate Add Driver screen if navigated from Curation or with mode=add
  useEffect(() => {
    if (searchParams.get("mode") === "add" || locState?.viewMode === "add") {
      setViewMode("add");
      if (locState?.initialDriver) {
        setInitialAddDriver(locState.initialDriver);
      }
    }
  }, [searchParams, location.state]);
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Notification helper
  const showNotification = (msg: { text: string; type: "success" | "error" }) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((current) => (current?.text === msg.text ? null : current));
    }, 4500);
  };

  // Filter and Search logic: Strictly scoped as per selected station from header
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      // 1. Station Filter: Show only original added drivers according to selected station from header
      if (activeStationCode) {
        const target = activeStationCode.trim().toUpperCase();
        const matchesStation = driver.stations.some(
          (s) => s.station_code && s.station_code.trim().toUpperCase() === target
        );
        if (!matchesStation) return false;
      }

      // 2. Status Filter: Only active or inactive drivers (never deleted)
      if (statusFilter !== "all" && driver.status !== statusFilter) {
        return false;
      }

      // 3. Sign-in Filter
      if (signinFilter === "signin_enabled" && !driver.allow_signin) {
        return false;
      }
      if (signinFilter === "signin_disabled" && driver.allow_signin) {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = driver.name.toLowerCase().includes(q);
        const matchesPhone = driver.phone.includes(q);
        const matchesEmail = driver.email.toLowerCase().includes(q);
        const matchesTransporter = driver.transporter_id.toLowerCase().includes(q);
        const matchesStation = driver.stations.some((s) =>
          s.station_code.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesTransporter && !matchesStation) {
          return false;
        }
      }

      return true;
    });
  }, [drivers, activeStationCode, statusFilter, signinFilter, searchQuery]);

  // Selection handlers
  const handleSelectDriver = (id: number) => {
    setSelectedDriverIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDriverIds.length === filteredDrivers.length) {
      setSelectedDriverIds([]);
    } else {
      setSelectedDriverIds(filteredDrivers.map((d) => d.id));
    }
  };

  const handleAddSuccess = (newDriver: Driver) => {
    showNotification({
      text: `Driver "${newDriver.name || "New Driver"}" added successfully!`,
      type: "success",
    });
    fetchDrivers();
    setViewMode("list");
  };

  const handleEditSuccess = () => {
    showNotification({
      text: `Driver details updated successfully!`,
      type: "success",
    });
    setEditingDriver(null);
    setViewMode("list");
  };

  return (
    <GlassAppLayout
      currentRoute="drivers"
      activeBreadcrumb={{ section: "Operations", page: "Delivery Associate" }}
    >

      {/* 2. Feedback Notification Banner (matching ProfilePage) */}
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
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Screen View Routing: Dedicated Add Driver, Edit Driver, Driver Profile, or Single Table View */}
      {viewMode === "add" ? (
        <div className="operations-main-content scrollable">
          <AddDriverScreen
            initialDriver={initialAddDriver}
            from={fromSource}
            returnUrl={returnUrl}
            onBack={() => {
              setInitialAddDriver(null);
              if (returnUrl) {
                navigate(returnUrl);
              } else {
                window.history.replaceState({}, document.title, window.location.pathname);
                setViewMode("list");
              }
            }}
            onSuccess={(driver) => {
              setInitialAddDriver(null);
              if (returnUrl) {
                navigate(returnUrl, {
                  state: {
                    notification: {
                      text: `Driver "${driver.name || "New Driver"}" added successfully and curation resolved!`,
                      type: "success",
                    },
                  },
                });
              } else {
                window.history.replaceState({}, document.title, window.location.pathname);
                handleAddSuccess(driver);
              }
            }}
          />
        </div>
      ) : viewMode === "edit" && editingDriver ? (
        <div className="operations-main-content scrollable">
          <AddDriverScreen
            initialDriver={editingDriver}
            isEditMode={true}
            onBack={() => {
              setEditingDriver(null);
              setViewMode("list");
            }}
            onSuccess={handleEditSuccess}
          />
        </div>
      ) : viewMode === "profile" && viewingDriver ? (
        <div className="operations-main-content scrollable">
          <DriverProfileScreen
            driver={viewingDriver}
            onBack={() => {
              setViewingDriver(null);
              setViewMode("list");
            }}
            onEdit={(d) => {
              setEditingDriver(d);
              setViewMode("edit");
            }}
            onNotification={showNotification}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            gap: "0.85rem",
          }}
        >
          {/* ── 1. Top Header Options on the Background Screen (No Second Header Card, No Top Search) ── */}
          <div className="upload-filter-toolbar">
            {/* Left: Breadcrumbs in the normal way on the background screen */}
            <div className="upload-breadcrumb-wrap">
              <span
                className="upload-breadcrumb-root"
                onClick={() => navigate("/dashboard")}
              >
                Operations
              </span>
              <ChevronRight size={14} style={{ color: "var(--ads-ink-tertiary)" }} />
              <span className="upload-breadcrumb-current">Delivery Associate</span>
              <ChevronRight size={14} style={{ color: "var(--ads-ink-tertiary)" }} />
              <span className="upload-breadcrumb-active-report">
                {activeStationCode} • {statusFilter === "all" ? "All Drivers" : statusFilter === "active" ? "Active Drivers" : "Inactive Drivers"}
              </span>
            </div>

            {/* Right: View by Capsule Pills + Add Driver Primary Action */}
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
                    <span className="upload-segmented-count">{stationDrivers.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`upload-segmented-btn ${statusFilter === "active" ? "active" : ""}`}
                    onClick={() => setStatusFilter("active")}
                  >
                    <span>Active</span>
                    <span className="upload-segmented-count">{totalActiveCount}</span>
                  </button>

                  <button
                    type="button"
                    className={`upload-segmented-btn ${statusFilter === "inactive" ? "active" : ""}`}
                    onClick={() => setStatusFilter("inactive")}
                  >
                    <span>Inactive</span>
                    <span className="upload-segmented-count">{totalInactiveCount}</span>
                  </button>
                </div>
              </div>

              {/* Add Driver Primary Action Button */}
              <button
                type="button"
                disabled={readOnly}
                className={`btn-blue-primary btn-sm ${readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                onClick={() => {
                  if (readOnly) return;
                  setViewMode("add");
                }}
                title={readOnly ? reason : "Add New Delivery Driver"}
              >
                <UserPlus size={15} />
                <span>Add Driver</span>
              </button>
            </div>
          </div>

          {/* ── 2. Clean Floating Workspace Container Card ── */}
          <div className="upload-workspace-container" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {/* In-Card Header */}
            <div
              style={{
                padding: "var(--ads-s4) var(--ads-s5)",
                borderBottom: "1px solid var(--ads-hairline)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "var(--ads-s3)",
                background: "var(--ads-material-thin)",
                backdropFilter: "var(--ads-blur-sm)",
                WebkitBackdropFilter: "var(--ads-blur-sm)",
                flexShrink: 0,
              }}
            >
              {/* Left: Squircle Icon + Title + Count Pill */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "var(--ads-r-sm)",
                    backgroundColor: "var(--ads-blue-tint)",
                    color: "var(--ads-blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid transparent",
                    flexShrink: 0,
                  }}
                >
                  <Users size={19} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.0625rem",
                        fontWeight: 600,
                        color: "var(--ads-ink)",
                        letterSpacing: "-0.014em",
                      }}
                    >
                      Delivery Associates
                    </h3>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        letterSpacing: "-0.005em",
                        lineHeight: 1.4,
                        padding: "3px 9px",
                        borderRadius: "var(--ads-r-pill)",
                        backgroundColor: "var(--ads-blue-tint)",
                        color: "#0058B0",
                        border: "1px solid transparent",
                      }}
                    >
                      {filteredDrivers.length} {filteredDrivers.length === 1 ? "driver" : "drivers"}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                    Roster of active and registered delivery associates for station {activeStationCode}
                  </p>
                </div>
              </div>

              {/* Right: In-Card Search Input & Status Dropdown Component */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
                <div className="standard-search-wrap">
                  <Search size={15} className="standard-search-icon" />
                  <input
                    type="text"
                    className="standard-search-input"
                    placeholder="Search Drivers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="standard-search-clear"
                      onClick={() => setSearchQuery("")}
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <DriverStatusFilterComponent />
              </div>
            </div>

            {/* Bulk Actions Banner: Only visible when rows are selected */}
            {selectedDriverIds.length > 0 && (
              <BulkActionBar
                selectedDriverIds={selectedDriverIds}
                totalCount={filteredDrivers.length}
                onClearSelection={() => setSelectedDriverIds([])}
                onNotification={showNotification}
              />
            )}

            {/* Driver Data Table */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <DriverTable
                drivers={filteredDrivers}
                selectedDriverIds={selectedDriverIds}
                onSelectDriver={handleSelectDriver}
                onSelectAll={handleSelectAll}
                onEditDriver={(driver) => {
                  setEditingDriver(driver);
                  setViewMode("edit");
                }}
                onViewProfile={(driver) => {
                  setViewingDriver(driver);
                  setViewMode("profile");
                }}
                onNotification={showNotification}
                readOnly={readOnly}
                readOnlyReason={reason}
              />
            </div>
          </div>
        </div>
      )}
    </GlassAppLayout>
  );
};

export default DriversPage;
