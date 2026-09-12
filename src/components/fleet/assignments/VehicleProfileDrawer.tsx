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
  { value: "in_service", label: "In Service (Active)", color: "#059669", bg: "#ECFDF5" },
  { value: "grounded", label: "Grounded (Out of Service)", color: "#DC2626", bg: "#FEF2F2" },
  { value: "maintenance", label: "Maintenance / In Shop", color: "#D97706", bg: "#FFFBEB" },
  { value: "inactive", label: "Inactive / Decommissioned", color: "#64748B", bg: "#F1F5F9" },
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
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(3px)",
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
          backgroundColor: "#FFFFFF",
          boxShadow: "-8px 0 25px rgba(15, 23, 42, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                background: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                {isEdit ? `Vehicle Profile: ${formData.unit_number || "Unit"}` : "Add New Fleet Vehicle"}
              </h2>
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                {isEdit ? `VIN: ${formData.vin}` : "Enter full vehicle specifications & driver assignment"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                color: "#B91C1C",
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
              background: "#F0F9FF",
              border: "1px solid #BAE6FD",
              borderRadius: "10px",
              padding: "1.1rem 1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UserCheck size={18} style={{ color: "#0284C7" }} />
                <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#0369A1" }}>
                  Vehicle Assignment Status
                </h4>
              </div>
              {formData.assigned_driver_name && (
                <button
                  type="button"
                  onClick={handleUnassignDriver}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #BAE6FD",
                    color: "#0369A1",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "6px",
                    padding: "0.25rem 0.5rem",
                    cursor: "pointer",
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
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#0F172A", marginBottom: "0.35rem" }}>
                  Assigned Driver
                </label>
                <select
                  value={formData.assigned_driver || ""}
                  onChange={handleDriverChange}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #94A3B8",
                    background: "#FFFFFF",
                    fontSize: "0.8125rem",
                    color: "#0F172A",
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
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: formData.assigned_driver_name ? "#ECFDF5" : "#F1F5F9",
                    color: formData.assigned_driver_name ? "#059669" : "#64748B",
                    border: formData.assigned_driver_name ? "1px solid #A7F3D0" : "1px solid #CBD5E1",
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
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#1E293B",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              1. Identification & Status
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
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
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
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
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Vehicle Status
                </label>
                <select
                  value={formData.status || "in_service"}
                  onChange={(e) => handleChange("status", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  License Plate
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC1234"
                  value={formData.license_plate || ""}
                  onChange={(e) => handleChange("license_plate", e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Registered State
                </label>
                <select
                  value={formData.registered_state || "NY"}
                  onChange={(e) => handleChange("registered_state", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Current Odometer (Miles)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.odometer || ""}
                  onChange={(e) => handleChange("odometer", Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#1E293B",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              2. Vehicle Make, Model & Type
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Make
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ford"
                  value={formData.make || ""}
                  onChange={(e) => handleChange("make", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transit 250"
                  value={formData.model || ""}
                  onChange={(e) => handleChange("model", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Model Year
                </label>
                <input
                  type="number"
                  placeholder="2024"
                  value={formData.year || ""}
                  onChange={(e) => handleChange("year", Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Trim / Wheelbase
                </label>
                <input
                  type="text"
                  placeholder="e.g. 148 WB High Roof"
                  value={formData.trim || ""}
                  onChange={(e) => handleChange("trim", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Vehicle Classification
                </label>
                <select
                  value={formData.vehicle_type || "Cargo Van"}
                  onChange={(e) => handleChange("vehicle_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Van Subtype
                </label>
                <select
                  value={formData.van_subtype || "High Roof"}
                  onChange={(e) => handleChange("van_subtype", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#1E293B",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              3. Fleet Operations, Fuel & Toll Cards
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Ownership Structure
                </label>
                <select
                  value={formData.ownership_type || "Amazon Leased"}
                  onChange={(e) => handleChange("ownership_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Vendor / Leasing Partner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Element Fleet Management"
                  value={formData.vendor || ""}
                  onChange={(e) => handleChange("vendor", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Gas Card # (WEX)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7088 1234 5678"
                  value={formData.gas_card_number || ""}
                  onChange={(e) => handleChange("gas_card_number", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Gas Card Vehicle ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. GC-VAN-101"
                  value={formData.gas_card_id || ""}
                  onChange={(e) => handleChange("gas_card_id", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  EZPass / Toll Tag #
                </label>
                <input
                  type="text"
                  placeholder="e.g. 00412345678"
                  value={formData.ezpass_number || ""}
                  onChange={(e) => handleChange("ezpass_number", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Driver Side
                </label>
                <select
                  value={formData.driver_side || "Left"}
                  onChange={(e) => handleChange("driver_side", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                >
                  <option value="Left">Left Side (US Default)</option>
                  <option value="Right">Right Side (Postal/Specialty)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Operating Timezone
                </label>
                <select
                  value={formData.timezone || "America/New_York"}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  GVWR Weight Rating
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9070 lbs"
                  value={formData.weight || ""}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#1E293B",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              4. Compliance, Registration & Renewals
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Date Received into Fleet
                </label>
                <input
                  type="date"
                  value={formData.date_received || ""}
                  onChange={(e) => handleChange("date_received", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Policy Effective Date
                </label>
                <input
                  type="date"
                  value={formData.date_insured || ""}
                  onChange={(e) => handleChange("date_insured", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  Insurance Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.insurance_expiry || ""}
                  onChange={(e) => handleChange("insurance_expiry", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  State Inspection Renewal Date
                </label>
                <input
                  type="date"
                  value={formData.inspection_renewal || ""}
                  onChange={(e) => handleChange("inspection_renewal", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
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
            padding: "1rem 1.5rem",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F8FAFC",
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
                border: "1px solid #FCA5A5",
                color: "#DC2626",
                borderRadius: "6px",
                padding: "0.55rem 1rem",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
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

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "0.55rem 1.25rem",
                fontWeight: 600,
                fontSize: "0.8125rem",
                color: "#475569",
                cursor: "pointer",
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
                padding: "0.55rem 1.25rem",
                fontSize: "0.8125rem",
                color: "#FFFFFF",
              }}
            >
              <Save size={15} />
              <span>{isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Vehicle"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleProfileDrawer;
