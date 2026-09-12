import React, { FC, useState, useEffect, useMemo } from "react";
import {
  X,
  Truck,
  User,
  ArrowLeftRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Link,
  Unlink,
  Check,
  Loader2,
  Building,
} from "lucide-react";
import { VehicleRecord } from "../../../api/fleetApi";
import type { Driver } from "../../../types/driver";

interface VehicleDriverAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleRecord[];
  drivers: Driver[];
  initialVehicleId?: number | string;
  initialDriverId?: number | string;
  onAssign: (
    vehicleId: number | string,
    driverId: number | null,
    driverName: string
  ) => Promise<void>;
}

const stepLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ads-ink-tertiary)",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 13px 9px 34px",
  fontFamily: "inherit",
  fontSize: "0.8125rem",
  color: "var(--ads-ink)",
  background: "var(--ads-material-thick)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-sm)",
  outline: "none",
  transition: "all var(--ads-dur-fast) var(--ads-ease)",
};

const listWrapStyle: React.CSSProperties = {
  maxHeight: "14rem",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "6px",
  background: "var(--ads-canvas)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-md)",
};

const listItemStyle = (selected: boolean): React.CSSProperties => ({
  padding: "10px",
  borderRadius: "var(--ads-r-sm)",
  background: selected ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
  border: `1px solid ${selected ? "var(--ads-blue)" : "var(--ads-hairline)"}`,
  boxShadow: selected ? "var(--ads-shadow-xs)" : "none",
  cursor: "pointer",
  transition: "all var(--ads-dur-fast) var(--ads-ease)",
});

const miniBadgeStyle = (bg: string, fg: string): React.CSSProperties => ({
  fontSize: "0.625rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
  padding: "2px 8px",
  borderRadius: "var(--ads-r-pill)",
  textTransform: "uppercase",
  background: bg,
  color: fg,
  flexShrink: 0,
});

const emptyListStyle: React.CSSProperties = {
  padding: "var(--ads-s3)",
  textAlign: "center",
  fontSize: "0.75rem",
  color: "var(--ads-ink-quaternary)",
};

export const VehicleDriverAssignmentModal: FC<VehicleDriverAssignmentModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  drivers,
  initialVehicleId,
  initialDriverId,
  onAssign,
}) => {
  // Mode: "vehicle-to-driver" | "driver-to-vehicle"
  const [mode, setMode] = useState<"vehicle-to-driver" | "driver-to-vehicle">("vehicle-to-driver");

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | string>(
    initialVehicleId || (vehicles[0]?.id ?? "")
  );
  const [selectedDriverId, setSelectedDriverId] = useState<number | string>(
    initialDriverId || (drivers[0]?.id ?? "")
  );

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial selections if opened with specific vehicle or driver
  useEffect(() => {
    if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
      setMode("vehicle-to-driver");
    } else if (initialDriverId) {
      setSelectedDriverId(initialDriverId);
      setMode("driver-to-vehicle");
    }
  }, [initialVehicleId, initialDriverId, isOpen]);

  if (!isOpen) return null;

  // Currently selected vehicle object
  const currentVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId));
  // Currently selected driver object
  const currentDriver = drivers.find((d) => String(d.id) === String(selectedDriverId));

  // Filtered vehicles list
  const filteredVehicles = vehicles.filter((v) => {
    if (!vehicleSearch) return true;
    const q = vehicleSearch.toLowerCase();
    return (
      v.unit_number?.toLowerCase().includes(q) ||
      v.vin?.toLowerCase().includes(q) ||
      v.license_plate?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.assigned_driver_name?.toLowerCase().includes(q)
    );
  });

  // Filtered drivers list
  const filteredDrivers = drivers.filter((d) => {
    if (!driverSearch) return true;
    const q = driverSearch.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.transporter_id?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.phone?.toLowerCase().includes(q)
    );
  });

  const handleConfirmAssignment = async () => {
    if (!selectedVehicleId) {
      setErrorMsg("Please select a vehicle to assign.");
      return;
    }
    if (!selectedDriverId) {
      setErrorMsg("Please select a driver to assign.");
      return;
    }

    const driverObj = drivers.find((d) => String(d.id) === String(selectedDriverId));
    const driverName = driverObj?.name || `Driver #${selectedDriverId}`;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAssign(selectedVehicleId, Number(selectedDriverId) || 0, driverName);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update vehicle assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    if (!selectedVehicleId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAssign(selectedVehicleId, null, "");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to remove assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const segmentStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "-0.005em",
    borderRadius: "var(--ads-r-pill)",
    border: "1px solid transparent",
    background: active ? "var(--ads-blue)" : "transparent",
    color: active ? "#FFFFFF" : "var(--ads-ink-secondary)",
    boxShadow: active ? "0 1px 4px rgba(0,113,227,0.30)" : "none",
    cursor: "pointer",
    transition: "all var(--ads-dur-fast) var(--ads-ease)",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ads-s4)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {/* Backdrop */}
        <div
          style={{ position: "fixed", inset: 0, background: "transparent" }}
          onClick={onClose}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "42rem",
            maxHeight: "calc(100vh - var(--ads-s8))",
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-xl)",
            boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "var(--ads-s5) var(--ads-s6)",
              background: "transparent",
              borderBottom: "1px solid var(--ads-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--ads-s3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  flexShrink: 0,
                  borderRadius: "var(--ads-r-md)",
                  background: "var(--ads-blue-tint)",
                  border: "1px solid var(--ads-blue-tint-strong)",
                  color: "var(--ads-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.0625rem",
                    fontWeight: 600,
                    letterSpacing: "-0.014em",
                    color: "var(--ads-ink)",
                  }}
                >
                  Vehicle-Driver Two-Way Assignment
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                  Link or reassign active fleet vehicles and drivers with real-time sync
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close assignment dialog"
              style={{
                width: "32px",
                height: "32px",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid var(--ads-hairline)",
                background: "transparent",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              padding: "var(--ads-s3) var(--ads-s6)",
              borderBottom: "1px solid var(--ads-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--ads-s3)",
              background: "transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s1)",
                padding: "4px",
                background: "rgba(0,0,0,0.04)",
                borderRadius: "var(--ads-r-pill)",
              }}
            >
              <button
                type="button"
                onClick={() => setMode("vehicle-to-driver")}
                style={segmentStyle(mode === "vehicle-to-driver")}
              >
                <Truck
                  size={14}
                  style={{ color: mode === "vehicle-to-driver" ? "#FFFFFF" : "var(--ads-ink-tertiary)" }}
                />
                <span style={{ color: mode === "vehicle-to-driver" ? "#FFFFFF" : undefined }}>
                  Vehicle → Driver
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("driver-to-vehicle")}
                style={segmentStyle(mode === "driver-to-vehicle")}
              >
                <User
                  size={14}
                  style={{ color: mode === "driver-to-vehicle" ? "#FFFFFF" : "var(--ads-ink-tertiary)" }}
                />
                <span style={{ color: mode === "driver-to-vehicle" ? "#FFFFFF" : undefined }}>
                  Driver → Vehicle
                </span>
              </button>
            </div>

            <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
              Two-Way Binding Active
            </div>
          </div>

          {/* Error Banner if any */}
          {errorMsg && (
            <div
              style={{
                margin: "var(--ads-s4) var(--ads-s6) 0 var(--ads-s6)",
                padding: "var(--ads-s3)",
                background: "var(--ads-red-tint)",
                border: "1px solid var(--ads-red)",
                borderRadius: "var(--ads-r-sm)",
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--ads-red)",
              }}
            >
              <AlertCircle size={16} style={{ color: "var(--ads-red)", flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Body */}
          <div
            style={{
              padding: "var(--ads-s6)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--ads-s4)",
              overflowY: "auto",
            }}
          >
            {mode === "vehicle-to-driver" ? (
              /* Vehicle -> Driver Workflow */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "var(--ads-s4)",
                }}
              >
                {/* Step 1: Select Vehicle */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s2)" }}>
                  <label style={stepLabelStyle}>
                    <Truck size={13} style={{ color: "var(--ads-blue)" }} />
                    1. Select Vehicle
                  </label>
                  <div style={{ position: "relative" }}>
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
                      placeholder="Search Vehicle Unit #, Make, Model..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      style={searchInputStyle}
                    />
                  </div>

                  <div style={listWrapStyle}>
                    {filteredVehicles.length === 0 ? (
                      <div style={emptyListStyle}>
                        No vehicles matching filter.
                      </div>
                    ) : (
                      filteredVehicles.map((v) => {
                        const isSelected = String(v.id) === String(selectedVehicleId);
                        return (
                          <div
                            key={v.id}
                            onClick={() => setSelectedVehicleId(v.id)}
                            style={listItemStyle(isSelected)}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--ads-s2)" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                                {v.unit_number || `VAN-${v.id}`}
                              </span>
                              <span
                                style={
                                  v.status === "grounded"
                                    ? miniBadgeStyle("var(--ads-red-tint)", "var(--ads-red)")
                                    : miniBadgeStyle("var(--ads-green-tint)", "var(--ads-green)")
                                }
                              >
                                {v.status || "in_service"}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: "0.6875rem",
                                color: "var(--ads-ink-tertiary)",
                                marginTop: "var(--ads-s1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "var(--ads-s2)",
                              }}
                            >
                              <span style={{ color: "var(--ads-ink-tertiary)" }}>{v.make || v.model || "Fleet Vehicle"}</span>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: "var(--ads-ink-secondary)",
                                  maxWidth: "120px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {v.assigned_driver_name ? `👤 ${v.assigned_driver_name}` : "⚪ Unassigned"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Step 2: Choose Available Driver */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s2)" }}>
                  <label style={stepLabelStyle}>
                    <User size={13} style={{ color: "var(--ads-blue)" }} />
                    2. Choose Driver to Assign
                  </label>
                  <div style={{ position: "relative" }}>
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
                      placeholder="Search Driver Name..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      style={searchInputStyle}
                    />
                  </div>

                  <div style={listWrapStyle}>
                    {filteredDrivers.length === 0 ? (
                      <div style={emptyListStyle}>
                        No drivers matching filter.
                      </div>
                    ) : (
                      filteredDrivers.map((d) => {
                        const isSelected = String(d.id) === String(selectedDriverId);
                        return (
                          <div
                            key={d.id}
                            onClick={() => setSelectedDriverId(d.id)}
                            style={listItemStyle(isSelected)}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--ads-s2)" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                                {d.name}
                              </span>
                              <span
                                style={
                                  d.status === "active"
                                    ? miniBadgeStyle("var(--ads-green-tint)", "var(--ads-green)")
                                    : miniBadgeStyle("rgba(0,0,0,0.05)", "var(--ads-ink-secondary)")
                                }
                              >
                                {d.status?.toUpperCase() || "ACTIVE"}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: "0.6875rem",
                                color: "var(--ads-ink-tertiary)",
                                marginTop: "2px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Station: {d.stations?.[0]?.station_code || "Primary"}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Driver -> Vehicle Workflow */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "var(--ads-s4)",
                }}
              >
                {/* Step 1: Select Driver */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s2)" }}>
                  <label style={stepLabelStyle}>
                    <User size={13} style={{ color: "var(--ads-blue)" }} />
                    1. Select Driver
                  </label>
                  <div style={{ position: "relative" }}>
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
                      placeholder="Search Driver Name..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      style={searchInputStyle}
                    />
                  </div>

                  <div style={listWrapStyle}>
                    {filteredDrivers.map((d) => {
                      const isSelected = String(d.id) === String(selectedDriverId);
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDriverId(d.id)}
                          style={listItemStyle(isSelected)}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--ads-s2)" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                              {d.name}
                            </span>
                            <span style={miniBadgeStyle("var(--ads-blue-tint)", "var(--ads-blue)")}>
                              Driver
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Choose Vehicle to Assign */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s2)" }}>
                  <label style={stepLabelStyle}>
                    <Truck size={13} style={{ color: "var(--ads-blue)" }} />
                    2. Choose Vehicle to Assign
                  </label>
                  <div style={{ position: "relative" }}>
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
                      placeholder="Search Vehicle Unit #, Make, Model..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      style={searchInputStyle}
                    />
                  </div>

                  <div style={listWrapStyle}>
                    {filteredVehicles.map((v) => {
                      const isSelected = String(v.id) === String(selectedVehicleId);
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          style={listItemStyle(isSelected)}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--ads-s2)" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                              {v.unit_number || `VAN-${v.id}`}
                            </span>
                            <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
                              {v.make || v.model || "Fleet"}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: "0.6875rem",
                              color: "var(--ads-ink-tertiary)",
                              marginTop: "var(--ads-s1)",
                              fontWeight: 500,
                            }}
                          >
                            {v.assigned_driver_name ? `Assigned to: ${v.assigned_driver_name}` : "Available for assignment"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Live Binding Preview Card */}
            <div
              style={{
                padding: "var(--ads-s3)",
                background: "var(--ads-blue-tint)",
                border: "1px solid var(--ads-blue-tint-strong)",
                borderRadius: "var(--ads-r-md)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--ads-s2)",
                  marginBottom: "var(--ads-s2)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "var(--ads-blue)",
                  }}
                >
                  Pending Assignment Preview
                </span>
                <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "var(--ads-blue)" }}>
                  Two-Way Live Sync
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--ads-s3)",
                  padding: "var(--ads-s3)",
                  background: "var(--ads-material-thick)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)", minWidth: 0 }}>
                  <Truck size={16} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--ads-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentVehicle?.unit_number || `Vehicle #${selectedVehicleId}`}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.625rem",
                        color: "var(--ads-ink-tertiary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentVehicle?.make || currentVehicle?.model || "Active Fleet"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--ads-blue)",
                    fontWeight: 600,
                  }}
                >
                  <ArrowLeftRight size={14} style={{ color: "var(--ads-blue)" }} />
                  <span style={{ fontSize: "0.6875rem" }}>LINKED</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)", minWidth: 0, textAlign: "right" }}>
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--ads-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentDriver?.name || `Driver #${selectedDriverId}`}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.625rem",
                        color: "var(--ads-ink-tertiary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentDriver?.status || "Active Driver"}
                    </span>
                  </div>
                  <User size={16} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
                </div>
              </div>

              {currentVehicle?.assigned_driver_name && (
                <div
                  style={{
                    marginTop: "var(--ads-s2)",
                    fontSize: "0.6875rem",
                    color: "var(--ads-amber)",
                    background: "var(--ads-amber-tint)",
                    padding: "var(--ads-s2)",
                    borderRadius: "var(--ads-r-xs)",
                    border: "1px solid var(--ads-amber)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--ads-s2)",
                  }}
                >
                  <span>
                    Currently assigned to: <strong>{currentVehicle.assigned_driver_name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleUnassign}
                    disabled={isSubmitting}
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--ads-red)",
                      background: "transparent",
                      border: "none",
                      textDecoration: "underline",
                      marginLeft: "var(--ads-s2)",
                      cursor: "pointer",
                      transition: "all var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    Unassign Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "var(--ads-s4) var(--ads-s6)",
              background: "transparent",
              borderTop: "1px solid var(--ads-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--ads-s3)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "9px 18px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--ads-ink)",
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-pill)",
                boxShadow: "var(--ads-bevel)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              Cancel
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
              {currentVehicle?.assigned_driver_name && (
                <button
                  type="button"
                  onClick={handleUnassign}
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "var(--ads-red)",
                    background: "var(--ads-red-tint)",
                    border: "1px solid transparent",
                    borderRadius: "var(--ads-r-pill)",
                    cursor: "pointer",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  <Unlink size={14} style={{ color: "var(--ads-red)" }} />
                  <span>Unassign Driver</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={isSubmitting}
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
                  opacity: isSubmitting ? 0.5 : 1,
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" style={{ color: "#FFFFFF" }} />
                    <span style={{ color: "#FFFFFF" }}>Syncing Assignment...</span>
                  </>
                ) : (
                  <>
                    <Link size={14} style={{ color: "#FFFFFF" }} />
                    <span style={{ color: "#FFFFFF" }}>Confirm Two-Way Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDriverAssignmentModal;
