import React, { FC, useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Truck,
  FileText,
  Calendar,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { Vehicle, VehicleFormData, VehicleStatus } from "../../../types/vehicle";
import { vehicleApi } from "../../../api/vehicleApi";
import { useAuthStore } from "../../../store/authStore";
import LoadingSpinner from "../../common/LoadingSpinner";

interface VehicleAddEditScreenProps {
  onBack: () => void;
  onSuccess: (vehicle: Vehicle) => void;
  initialVehicle?: Vehicle | null;
  isEditMode?: boolean;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

const VEHICLE_TYPES = [
  "Cargo Van",
  "Step Van",
  "Custom Step Van",
  "EV Delivery Van",
  "Box Truck",
  "Rental Van",
  "CDV (Custom Delivery Van)",
];

const VAN_SUB_TYPES = [
  "Prime Van",
  "Custom Van",
  "Standard Cargo",
  "High Roof",
  "Extended",
  "Unbranded",
];

const OWNERSHIP_TYPES = [
  "Leased (Amazon)",
  "DSP Leased",
  "Owned",
  "Third Party Rental",
];

const VENDORS = [
  "Element Fleet",
  "Enterprise Fleet Management",
  "Penske",
  "Merchants Fleet",
  "Ryder",
  "Amazon Prime Fleet",
  "Hertz",
  "Other",
];

export const VehicleAddEditScreen: FC<VehicleAddEditScreenProps> = ({
  onBack,
  onSuccess,
  initialVehicle,
  isEditMode = false,
}) => {
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const defaultStation = activeStationObj?.station_code || "QUE4";

  // Form State
  const [formData, setFormData] = useState<VehicleFormData>({
    name: initialVehicle?.name || "",
    vin: initialVehicle?.vin || "",
    plate: initialVehicle?.plate || "",
    state: initialVehicle?.state || "CA",
    make: initialVehicle?.make || "Ford",
    model: initialVehicle?.model || "Transit 250",
    year: initialVehicle?.year ? String(initialVehicle.year) : "2024",
    trim: initialVehicle?.trim || "",
    vehicle_type: String(initialVehicle?.vehicle_type || "Cargo Van"),
    vehicle_sub_type: String(initialVehicle?.vehicle_sub_type || "Prime Van"),
    ownership_type: String(initialVehicle?.ownership_type || "Leased (Amazon)"),
    vendor: initialVehicle?.vendor || "Element Fleet",
    status: initialVehicle?.status || "active",
    station_code: initialVehicle?.station_code || defaultStation,
    recieved: initialVehicle?.recieved || initialVehicle?.date_received || "",
    insured: initialVehicle?.insured || initialVehicle?.date_insured || "",
    insurance_expires: initialVehicle?.insurance_expires || initialVehicle?.insurance_expiry || "",
    insp_renewal_date: initialVehicle?.insp_renewal_date || initialVehicle?.inspection_renewal || "",
    gas_card_id: initialVehicle?.gas_card_id || initialVehicle?.gas_card || "",
    ez_pass: initialVehicle?.ez_pass || initialVehicle?.ezpass_number || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Available station options
  const stationOptions = useMemo(() => {
    return authStations.map((st) => ({
      code: st.station_code,
      name: st.name || st.station_code,
    }));
  }, [authStations]);

  const handleChange = (field: keyof VehicleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = "Van / Unit number is required (e.g. VAN-101)";
    }
    if (!formData.vin.trim()) {
      errs.vin = "VIN is required";
    } else if (formData.vin.trim().length !== 17) {
      errs.vin = "VIN must be exactly 17 characters";
    }
    if (!formData.plate.trim()) {
      errs.plate = "License plate number is required";
    }
    if (!formData.state.trim()) {
      errs.state = "Registration state is required";
    }
    if (!formData.make.trim()) {
      errs.make = "Vehicle make is required";
    }
    if (!formData.model.trim()) {
      errs.model = "Vehicle model is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      name: formData.name.trim().toUpperCase(),
      vin: formData.vin.trim().toUpperCase(),
      plate: formData.plate.trim().toUpperCase(),
      state: formData.state.trim().toUpperCase(),
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: formData.year ? parseInt(formData.year, 10) || formData.year : undefined,
      trim: formData.trim.trim() || undefined,
      vehicle_type: formData.vehicle_type,
      vehicle_sub_type: formData.vehicle_sub_type,
      ownership_type: formData.ownership_type,
      vendor: formData.vendor,
      status: formData.status,
      station_code: formData.station_code,
      stations: [{ station_code: formData.station_code }],
      recieved: formData.recieved || undefined,
      insured: formData.insured || undefined,
      insurance_expires: formData.insurance_expires || undefined,
      insp_renewal_date: formData.insp_renewal_date || undefined,
      gas_card_id: formData.gas_card_id.trim() || undefined,
      ez_pass: formData.ez_pass.trim() || undefined,
    };

    try {
      if (isEditMode && initialVehicle?.id) {
        const res = await vehicleApi.updateVehicle(initialVehicle.id, payload);
        if (res.success) {
          onSuccess({ ...initialVehicle, ...payload } as Vehicle);
        } else {
          setSubmitError(res.message || "Failed to update vehicle.");
        }
      } else {
        const res = await vehicleApi.createVehicle(payload);
        if (res.success) {
          const createdVehicle = res.data || { id: Date.now(), ...payload };
          onSuccess(createdVehicle as Vehicle);
        } else {
          setSubmitError(res.message || "Failed to create vehicle.");
        }
      }
    } catch (err: any) {
      setSubmitError(err?.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-driver-screen-container">
      {/* Header: Back + Title on Left, Cancel & Save on Right */}
      <div
        className="add-driver-header"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          paddingBottom: "0.85rem",
          borderBottom: "1px solid #E2E8F0",
          marginBottom: "1.25rem",
        }}
      >
        <div
          className="add-driver-header-left"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <button
            type="button"
            className="back-btn"
            onClick={onBack}
            disabled={isSubmitting}
            title="Back to Vehicles"
          >
            <ArrowLeft size={16} />
            <span>Back to Vehicles</span>
          </button>
          <div
            className="screen-title-divider"
            style={{ width: "1px", height: "20px", backgroundColor: "#CBD5E1" }}
          />
          <h2
            className="screen-heading"
            style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0F172A" }}
          >
            {isEditMode ? `Edit Vehicle: ${initialVehicle?.name || ""}` : "Add New Vehicle"}
          </h2>
        </div>

        <div
          className="add-driver-header-right"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            className="btn-outline-cancel"
            onClick={onBack}
            disabled={isSubmitting}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="vehicle-form"
            className="btn-blue-primary"
            disabled={isSubmitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "#2563EB",
              border: "none",
              color: "#FFFFFF",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="#FFFFFF" />
                <span style={{ color: "#FFFFFF" }}>Saving...</span>
              </>
            ) : (
              <>
                <Save size={15} color="#FFFFFF" />
                <span style={{ color: "#FFFFFF" }}>Save Vehicle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {submitError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            fontSize: "0.875rem",
          }}
        >
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {/* Solid Form Card */}
      <form id="vehicle-form" onSubmit={handleSubmit}>
        <div
          className="add-driver-card"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "1.75rem",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* Section 1: Basic Identification */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                paddingBottom: "0.6rem",
                borderBottom: "1px solid #F1F5F9",
                marginBottom: "1.25rem",
              }}
            >
              <Truck size={18} color="#2563EB" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1E293B" }}>
                Basic Vehicle Identification
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {/* Unit Number */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Van / Unit Number <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. VAN-101"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: errors.name ? "1px solid #EF4444" : "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
                {errors.name && <span style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>{errors.name}</span>}
              </div>

              {/* VIN */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  VIN (17 Characters) <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1FTBR1Y85NKA12345"
                  maxLength={17}
                  value={formData.vin}
                  onChange={(e) => handleChange("vin", e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: errors.vin ? "1px solid #EF4444" : "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    outline: "none",
                  }}
                />
                {errors.vin && <span style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>{errors.vin}</span>}
              </div>

              {/* License Plate */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  License Plate <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7XYZ123"
                  value={formData.plate}
                  onChange={(e) => handleChange("plate", e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: errors.plate ? "1px solid #EF4444" : "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    textTransform: "uppercase",
                    outline: "none",
                  }}
                />
                {errors.plate && <span style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>{errors.plate}</span>}
              </div>

              {/* State */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Registered State <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Make */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Make <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ford, Ram, Mercedes"
                  value={formData.make}
                  onChange={(e) => handleChange("make", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: errors.make ? "1px solid #EF4444" : "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
                {errors.make && <span style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>{errors.make}</span>}
              </div>

              {/* Model */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Model <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transit 250, ProMaster"
                  value={formData.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: errors.model ? "1px solid #EF4444" : "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
                {errors.model && <span style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>{errors.model}</span>}
              </div>

              {/* Year */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Year
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2030"
                  placeholder="2024"
                  value={formData.year}
                  onChange={(e) => handleChange("year", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              {/* Trim */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Trim / Body Style
                </label>
                <input
                  type="text"
                  placeholder="e.g. High Roof 148, Standard"
                  value={formData.trim}
                  onChange={(e) => handleChange("trim", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fleet Classification & Ownership */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                paddingBottom: "0.6rem",
                borderBottom: "1px solid #F1F5F9",
                marginBottom: "1.25rem",
              }}
            >
              <Building size={18} color="#2563EB" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1E293B" }}>
                Fleet Classification & Station Assignment
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {/* Vehicle Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Vehicle Type
                </label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => handleChange("vehicle_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Van Sub-Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Van Sub-Type
                </label>
                <select
                  value={formData.vehicle_sub_type}
                  onChange={(e) => handleChange("vehicle_sub_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {VAN_SUB_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ownership Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Ownership Type
                </label>
                <select
                  value={formData.ownership_type}
                  onChange={(e) => handleChange("ownership_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {OWNERSHIP_TYPES.map((ot) => (
                    <option key={ot} value={ot}>
                      {ot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leasing Vendor */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Leasing / Fleet Vendor
                </label>
                <select
                  value={formData.vendor}
                  onChange={(e) => handleChange("vendor", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {VENDORS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operational Status */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Operational Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value as VehicleStatus)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  <option value="active">Active (In Service)</option>
                  <option value="grounded">Grounded (Out of Service)</option>
                  <option value="maintenance">In Maintenance / Repair</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Station Code */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Assigned Delivery Station
                </label>
                <select
                  value={formData.station_code}
                  onChange={(e) => handleChange("station_code", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {stationOptions.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.code} {st.name && st.name !== st.code ? `(${st.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Compliance & Key Dates */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                paddingBottom: "0.6rem",
                borderBottom: "1px solid #F1F5F9",
                marginBottom: "1.25rem",
              }}
            >
              <Calendar size={18} color="#2563EB" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1E293B" }}>
                Compliance &amp; Key Dates
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {/* Received Date */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Date Received
                </label>
                <input
                  type="date"
                  value={formData.recieved}
                  onChange={(e) => handleChange("recieved", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              {/* Insured Date */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Date Insured
                </label>
                <input
                  type="date"
                  value={formData.insured}
                  onChange={(e) => handleChange("insured", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              {/* Insurance Expires */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Insurance Expiration
                </label>
                <input
                  type="date"
                  value={formData.insurance_expires}
                  onChange={(e) => handleChange("insurance_expires", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              {/* State Inspection Renewal */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Inspection Renewal Date
                </label>
                <input
                  type="date"
                  value={formData.insp_renewal_date}
                  onChange={(e) => handleChange("insp_renewal_date", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Cards & Passes */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                paddingBottom: "0.6rem",
                borderBottom: "1px solid #F1F5F9",
                marginBottom: "1.25rem",
              }}
            >
              <CreditCard size={18} color="#2563EB" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1E293B" }}>
                Fuel Cards &amp; Toll Equipment
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {/* Gas Card */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Gas / Fuel Card ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. WEX-4928"
                  value={formData.gas_card_id}
                  onChange={(e) => handleChange("gas_card_id", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              {/* EZ Pass */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  EZ-Pass / Toll Transponder #
                </label>
                <input
                  type="text"
                  placeholder="e.g. 021-998822"
                  value={formData.ez_pass}
                  onChange={(e) => handleChange("ez_pass", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleAddEditScreen;
