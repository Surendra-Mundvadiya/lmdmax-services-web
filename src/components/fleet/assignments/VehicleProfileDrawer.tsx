import React, { FC, useState, useEffect, useMemo } from "react";
import {
  X,
  Truck,
  UserCheck,
  UserX,
  Calendar,
  CreditCard,
  Tag,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  Trash2,
  Building2,
  KeyRound,
} from "lucide-react";
import { VehicleRecord, fleetApi } from "../../../api/fleetApi";
import { useDriverStore } from "../../../store/driverStore";

interface VehicleProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleRecord | null;
  onSaveSuccess: (updatedVehicle: VehicleRecord) => void;
  onDeleteSuccess?: (vehicleId: number | string) => void;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const VEHICLE_TYPES = [
  "Cargo Van",
  "Step Van",
  "Box Truck",
  "Custom Delivery Van (CDV)",
  "Electric Delivery Van (EDV)",
  "Rental Cargo Van",
];

const VAN_SUBTYPES = [
  "Standard Roof (Low)",
  "Medium Roof",
  "High Roof",
  "Extended Length",
  "P1000 Heavy Step Van",
  "P700 Medium Step Van",
  "Rivian EDV 700",
  "Rivian EDV 500",
];

const OWNERSHIP_TYPES = [
  "Amazon Leased",
  "DSP Owned",
  "Third-Party Lease (Element)",
  "Third-Party Lease (Merchants)",
  "Third-Party Rental (Enterprise)",
  "Third-Party Rental (Hertz/Penske)",
];

const STATUS_OPTIONS = [
  { value: "in_service", label: "In Service (Active)", color: "var(--ads-green)", bg: "var(--ads-green-tint)" },
  { value: "grounded", label: "Grounded (Out of Service)", color: "var(--ads-red)", bg: "var(--ads-red-tint)" },
  { value: "maintenance", label: "Maintenance / In Shop", color: "var(--ads-amber)", bg: "var(--ads-amber-tint)" },
  { value: "inactive", label: "Inactive / Decommissioned", color: "var(--ads-ink-tertiary)", bg: "rgba(0,0,0,0.04)" },
];

export const VehicleProfileDrawer: FC<VehicleProfileDrawerProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSaveSuccess,
  onDeleteSuccess,
}) => {
  const isEdit = Boolean(vehicle && vehicle.id);
  const drivers = useDriverStore((state) => state.drivers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);

  useEffect(() => {
    if (isOpen && drivers.length === 0) {
      fetchDrivers();
    }
  }, [isOpen, drivers.length, fetchDrivers]);

  // Form State
  const [formData, setFormData] = useState<Partial<VehicleRecord>>({
    unit_number: "",
    vin: "",
    license_plate: "",
    registered_state: "NY",
    make: "Ford",
    model: "Transit 250",
    year: 2024,
    trim: "Cargo Van High Roof",
    vehicle_type: "Cargo Van",
    van_subtype: "High Roof",
    status: "in_service",
    ownership_type: "Amazon Leased",
    vendor: "Element Fleet Management",
    gas_card_number: "",
    gas_card_id: "",
    ezpass_number: "",
    driver_side: "Left",
    timezone: "America/New_York",
    weight: "9070 lbs",
    date_received: "",
    date_insured: "",
    insurance_expiry: "",
    inspection_renewal: "",
    odometer: 15420,
    assigned_driver: null,
    assigned_driver_name: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize when vehicle opens
  useEffect(() => {
    if (vehicle) {
      setFormData({
        id: vehicle.id,
        unit_number: vehicle.unit_number || vehicle.name || "",
        vin: vehicle.vin || "",
        license_plate: vehicle.license_plate || "",
        registered_state: vehicle.registered_state || "NY",
        make: vehicle.make || "Ford",
        model: vehicle.model || "Transit 250",
        year: vehicle.year || 2024,
        trim: vehicle.trim || "High Roof",
        vehicle_type: vehicle.vehicle_type || "Cargo Van",
        van_subtype: vehicle.van_subtype || "High Roof",
        status: vehicle.status || "in_service",
        ownership_type: vehicle.ownership_type || "Amazon Leased",
        vendor: vehicle.vendor || "Element Fleet Management",
        gas_card_number: vehicle.gas_card_number || "",
        gas_card_id: vehicle.gas_card_id || "",
        ezpass_number: vehicle.ezpass_number || "",
        driver_side: vehicle.driver_side || "Left",
        timezone: vehicle.timezone || "America/New_York",
        weight: vehicle.weight || "9070 lbs",
        date_received: vehicle.date_received || "",
        date_insured: vehicle.date_insured || "",
        insurance_expiry: vehicle.insurance_expiry || "",
        inspection_renewal: vehicle.inspection_renewal || "",
        odometer: vehicle.odometer || 0,
        assigned_driver: vehicle.assigned_driver || null,
        assigned_driver_name: vehicle.assigned_driver_name || "",
      });
    } else {
      // New vehicle default
      setFormData({
        unit_number: "",
        vin: "",
        license_plate: "",
        registered_state: "NY",
        make: "Ford",
        model: "Transit 250",
        year: 2024,
        trim: "High Roof",
        vehicle_type: "Cargo Van",
        van_subtype: "High Roof",
        status: "in_service",
        ownership_type: "Amazon Leased",
        vendor: "Element Fleet Management",
        gas_card_number: "",
        gas_card_id: "",
        ezpass_number: "",
        driver_side: "Left",
        timezone: "America/New_York",
        weight: "9070 lbs",
        date_received: new Date().toISOString().split("T")[0],
        date_insured: new Date().toISOString().split("T")[0],
        insurance_expiry: "",
        inspection_renewal: "",
        odometer: 0,
        assigned_driver: null,
        assigned_driver_name: "",
      });
    }
    setErrorMsg(null);
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof VehicleRecord, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const driverId = e.target.value ? Number(e.target.value) : null;
    if (!driverId) {
      setFormData((prev) => ({
        ...prev,
        assigned_driver: null,
        assigned_driver_name: "",
      }));
    } else {
      const selected = drivers.find((d) => d.id === driverId);
      setFormData((prev) => ({
        ...prev,
        assigned_driver: driverId,
        assigned_driver_name: selected?.name || "",
      }));
    }
  };

  const handleUnassignDriver = () => {
    setFormData((prev) => ({
      ...prev,
      assigned_driver: null,
      assigned_driver_name: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_number?.trim()) {
      setErrorMsg("Unit Number is required.");
      return;
    }
    if (!formData.vin?.trim()) {
      setErrorMsg("VIN (Vehicle Identification Number) is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isEdit && vehicle?.id) {
        await fleetApi.updateVehicle(vehicle.id, formData);
        onSaveSuccess({ ...vehicle, ...formData } as VehicleRecord);
      } else {
        const created = await fleetApi.createVehicle(formData);
        onSaveSuccess({ ...formData, id: created?.id || Date.now() } as VehicleRecord);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to save vehicle details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          height: "100%",
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          border: "1px solid var(--ads-hairline)",
          borderRadius: "var(--ads-r-xl) 0 0 var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "var(--ads-s5) var(--ads-s6)",
            borderBottom: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--ads-r-sm)",
                background: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ads-ink)", margin: 0, letterSpacing: "-0.019em" }}>
                {isEdit ? `Vehicle Profile: ${formData.unit_number || "Unit"}` : "Add New Fleet Vehicle"}
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                {isEdit ? `VIN: ${formData.vin}` : "Enter full vehicle specifications & driver assignment"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close vehicle profile"
            style={{
              width: "32px",
              height: "32px",
              background: "transparent",
              border: "1px solid var(--ads-hairline)",
              color: "var(--ads-ink-tertiary)",
              cursor: "pointer",
              borderRadius: "var(--ads-r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "var(--ads-s6)" }}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: "var(--ads-red-tint)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-sm)",
                padding: "var(--ads-s3) var(--ads-s4)",
                color: "var(--ads-red)",
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Live Driver Assignment Card */}
          <div
            style={{
              background: "var(--ads-blue-tint)",
              border: "1px solid var(--ads-blue-tint-strong)",
              borderRadius: "var(--ads-r-md)",
              padding: "var(--ads-s4) var(--ads-s5)",
              marginBottom: "var(--ads-s6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UserCheck size={18} style={{ color: "var(--ads-blue)" }} />
                <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                  Vehicle Assignment Status
                </h4>
              </div>
              {formData.assigned_driver_name && (
                <button
                  type="button"
                  onClick={handleUnassignDriver}
                  style={{
                    background: "var(--ads-material-thick)",
                    border: "1px solid var(--ads-hairline)",
                    color: "var(--ads-ink)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "var(--ads-r-pill)",
                    boxShadow: "var(--ads-bevel)",
                    padding: "6px 13px",
                    cursor: "pointer",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <UserX size={13} />
                  <span>Unassign Driver</span>
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "center" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink)", marginBottom: "0.35rem" }}>
                  Assigned Driver
                </label>
                <select
                  value={formData.assigned_driver || ""}
                  onChange={handleDriverChange}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline-strong)",
                    background: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    color: "var(--ads-ink)",
                    fontWeight: 600,
                  }}
                >
                  <option value="">— Unassigned (Available in Pool) —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ alignSelf: "flex-end" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "var(--ads-r-pill)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: formData.assigned_driver_name ? "var(--ads-green-tint)" : "rgba(0,0,0,0.04)",
                    color: formData.assigned_driver_name ? "var(--ads-green)" : "var(--ads-ink-tertiary)",
                    border: formData.assigned_driver_name ? "1px solid var(--ads-hairline)" : "1px solid var(--ads-hairline)",
                  }}
                >
                  {formData.assigned_driver_name ? `Assigned to: ${formData.assigned_driver_name}` : "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Identification & Basic Specs */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h4
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--ads-ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: "1px solid var(--ads-hairline)",
              }}
            >
              1. Identification & Status
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Unit # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VAN-101"
                  value={formData.unit_number || ""}
                  onChange={(e) => handleChange("unit_number", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  VIN (17 chars) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={17}
                  placeholder="e.g. 1FTNE2..."
                  value={formData.vin || ""}
                  onChange={(e) => handleChange("vin", e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Vehicle Status
                </label>
                <select
                  value={formData.status || "in_service"}
                  onChange={(e) => handleChange("status", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  License Plate
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC1234"
                  value={formData.license_plate || ""}
                  onChange={(e) => handleChange("license_plate", e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Registered State
                </label>
                <select
                  value={formData.registered_state || "NY"}
                  onChange={(e) => handleChange("registered_state", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Current Odometer (Miles)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.odometer || ""}
                  onChange={(e) => handleChange("odometer", Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Make, Model & Classification */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h4
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--ads-ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: "1px solid var(--ads-hairline)",
              }}
            >
              2. Vehicle Make, Model & Type
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Make
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ford"
                  value={formData.make || ""}
                  onChange={(e) => handleChange("make", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transit 250"
                  value={formData.model || ""}
                  onChange={(e) => handleChange("model", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Model Year
                </label>
                <input
                  type="number"
                  placeholder="2024"
                  value={formData.year || ""}
                  onChange={(e) => handleChange("year", Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Trim / Wheelbase
                </label>
                <input
                  type="text"
                  placeholder="e.g. 148 WB High Roof"
                  value={formData.trim || ""}
                  onChange={(e) => handleChange("trim", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Vehicle Classification
                </label>
                <select
                  value={formData.vehicle_type || "Cargo Van"}
                  onChange={(e) => handleChange("vehicle_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Van Subtype
                </label>
                <select
                  value={formData.van_subtype || "High Roof"}
                  onChange={(e) => handleChange("van_subtype", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {VAN_SUBTYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Operations & Toll/Fuel Equipment */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h4
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--ads-ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: "1px solid var(--ads-hairline)",
              }}
            >
              3. Fleet Operations, Fuel & Toll Cards
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Ownership Structure
                </label>
                <select
                  value={formData.ownership_type || "Amazon Leased"}
                  onChange={(e) => handleChange("ownership_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {OWNERSHIP_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Vendor / Leasing Partner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Element Fleet Management"
                  value={formData.vendor || ""}
                  onChange={(e) => handleChange("vendor", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Gas Card # (WEX)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7088 1234 5678"
                  value={formData.gas_card_number || ""}
                  onChange={(e) => handleChange("gas_card_number", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Gas Card Vehicle ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. GC-VAN-101"
                  value={formData.gas_card_id || ""}
                  onChange={(e) => handleChange("gas_card_id", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  EZPass / Toll Tag #
                </label>
                <input
                  type="text"
                  placeholder="e.g. 00412345678"
                  value={formData.ezpass_number || ""}
                  onChange={(e) => handleChange("ezpass_number", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Driver Side
                </label>
                <select
                  value={formData.driver_side || "Left"}
                  onChange={(e) => handleChange("driver_side", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <option value="Left">Left Side (US Default)</option>
                  <option value="Right">Right Side (Postal/Specialty)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Operating Timezone
                </label>
                <select
                  value={formData.timezone || "America/New_York"}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <option value="America/New_York">Eastern (EDT/EST)</option>
                  <option value="America/Chicago">Central (CDT/CST)</option>
                  <option value="America/Denver">Mountain (MDT/MST)</option>
                  <option value="America/Los_Angeles">Pacific (PDT/PST)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  GVWR Weight Rating
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9070 lbs"
                  value={formData.weight || ""}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Dates, Inspections & Insurance Compliance */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h4
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--ads-ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: "1px solid var(--ads-hairline)",
              }}
            >
              4. Compliance, Registration & Renewals
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Date Received into Fleet
                </label>
                <input
                  type="date"
                  value={formData.date_received || ""}
                  onChange={(e) => handleChange("date_received", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Policy Effective Date
                </label>
                <input
                  type="date"
                  value={formData.date_insured || ""}
                  onChange={(e) => handleChange("date_insured", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  Insurance Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.insurance_expiry || ""}
                  onChange={(e) => handleChange("insurance_expiry", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.3rem" }}>
                  State Inspection Renewal Date
                </label>
                <input
                  type="date"
                  value={formData.inspection_renewal || ""}
                  onChange={(e) => handleChange("inspection_renewal", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <div
          style={{
            padding: "var(--ads-s4) var(--ads-s6)",
            borderTop: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
            background: "transparent",
          }}
        >
          {isEdit && onDeleteSuccess && vehicle?.id ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to remove vehicle ${formData.unit_number || formData.vin}?`)) {
                  onDeleteSuccess(vehicle.id);
                  onClose();
                }
              }}
              style={{
                background: "transparent",
                border: "1px solid var(--ads-hairline)",
                color: "var(--ads-red)",
                borderRadius: "var(--ads-r-pill)",
                padding: "9px 18px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                fontSize: "0.8125rem",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Trash2 size={15} />
              <span>Delete Vehicle</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", gap: "var(--ads-s3)" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-pill)",
                boxShadow: "var(--ads-bevel)",
                padding: "9px 18px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                fontSize: "0.8125rem",
                color: "var(--ads-ink)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-blue-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "9px 18px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                background: "var(--ads-blue)",
                border: "1px solid transparent",
                borderRadius: "var(--ads-r-pill)",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.4 : 1,
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
                color: "#FFFFFF",
              }}
            >
              <Save size={15} color="#FFFFFF" />
              <span style={{ color: "#FFFFFF" }}>{isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Vehicle"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleProfileDrawer;
