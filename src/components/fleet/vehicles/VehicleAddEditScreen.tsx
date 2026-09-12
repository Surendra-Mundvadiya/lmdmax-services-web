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
          paddingBottom: "var(--ads-s3)",
          borderBottom: "1px solid var(--ads-hairline)",
          marginBottom: "var(--ads-s5)",
          background: "transparent",
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
            style={{ width: "1px", height: "20px", backgroundColor: "var(--ads-hairline-strong)" }}
          />
          <h2
            className="screen-heading"
            style={{ margin: 0, fontSize: "1.15rem", fontWeight: 650, letterSpacing: "-0.019em", color: "var(--ads-ink)" }}
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
            gap: "var(--ads-s3)",
          }}
        >
          <button
            type="button"
            className="btn-outline-cancel"
            onClick={onBack}
            disabled={isSubmitting}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid var(--ads-hairline)",
              backgroundColor: "var(--ads-material-thick)",
              boxShadow: "var(--ads-bevel)",
              color: "var(--ads-ink)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.4 : 1,
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
              gap: "var(--ads-s2)",
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              backgroundColor: "var(--ads-blue)",
              border: "1px solid transparent",
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.4 : 1,
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
            gap: "var(--ads-s3)",
            backgroundColor: "var(--ads-red-tint)",
            border: "1px solid var(--ads-hairline)",
            color: "var(--ads-red)",
            padding: "var(--ads-s3) var(--ads-s4)",
            borderRadius: "var(--ads-r-sm)",
            marginBottom: "var(--ads-s5)",
            fontSize: "0.875rem",
          }}
        >
          <AlertCircle size={18} color="var(--ads-red)" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Solid Form Card */}
      <form id="vehicle-form" onSubmit={handleSubmit}>
        <div
          className="add-driver-card"
          style={{
            backgroundColor: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-md)",
            WebkitBackdropFilter: "var(--ads-blur-md)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-md)",
            padding: "var(--ads-s6)",
            boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ads-s8)",
          }}
        >
          {/* Section 1: Basic Identification */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                paddingBottom: "var(--ads-s2)",
                borderBottom: "1px solid var(--ads-hairline)",
                marginBottom: "var(--ads-s5)",
              }}
            >
              <Truck size={18} color="var(--ads-blue)" />
              <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                Basic Vehicle Identification
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "var(--ads-s5)",
              }}
            >
              {/* Unit Number */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Van / Unit Number <span style={{ color: "var(--ads-red)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. VAN-101"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: errors.name ? "1px solid var(--ads-red)" : "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    outline: "none",
                  }}
                />
                {errors.name && <span style={{ color: "var(--ads-red)", fontSize: "0.75rem", marginTop: "var(--ads-s1)", display: "block" }}>{errors.name}</span>}
              </div>

              {/* VIN */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  VIN (17 Characters) <span style={{ color: "var(--ads-red)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1FTBR1Y85NKA12345"
                  maxLength={17}
                  value={formData.vin}
                  onChange={(e) => handleChange("vin", e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: errors.vin ? "1px solid var(--ads-red)" : "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    outline: "none",
                  }}
                />
                {errors.vin && <span style={{ color: "var(--ads-red)", fontSize: "0.75rem", marginTop: "var(--ads-s1)", display: "block" }}>{errors.vin}</span>}
              </div>

              {/* License Plate */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  License Plate <span style={{ color: "var(--ads-red)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7XYZ123"
                  value={formData.plate}
                  onChange={(e) => handleChange("plate", e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: errors.plate ? "1px solid var(--ads-red)" : "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    textTransform: "uppercase",
                    outline: "none",
                  }}
                />
                {errors.plate && <span style={{ color: "var(--ads-red)", fontSize: "0.75rem", marginTop: "var(--ads-s1)", display: "block" }}>{errors.plate}</span>}
              </div>

              {/* State */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Registered State <span style={{ color: "var(--ads-red)" }}>*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Make <span style={{ color: "var(--ads-red)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ford, Ram, Mercedes"
                  value={formData.make}
                  onChange={(e) => handleChange("make", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: errors.make ? "1px solid var(--ads-red)" : "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    outline: "none",
                  }}
                />
                {errors.make && <span style={{ color: "var(--ads-red)", fontSize: "0.75rem", marginTop: "var(--ads-s1)", display: "block" }}>{errors.make}</span>}
              </div>

              {/* Model */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Model <span style={{ color: "var(--ads-red)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transit 250, ProMaster"
                  value={formData.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: errors.model ? "1px solid var(--ads-red)" : "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    outline: "none",
                  }}
                />
                {errors.model && <span style={{ color: "var(--ads-red)", fontSize: "0.75rem", marginTop: "var(--ads-s1)", display: "block" }}>{errors.model}</span>}
              </div>

              {/* Year */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
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
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    outline: "none",
                  }}
                />
              </div>

              {/* Trim */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Trim / Body Style
                </label>
                <input
                  type="text"
                  placeholder="e.g. High Roof 148, Standard"
                  value={formData.trim}
                  onChange={(e) => handleChange("trim", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                gap: "var(--ads-s2)",
                paddingBottom: "var(--ads-s2)",
                borderBottom: "1px solid var(--ads-hairline)",
                marginBottom: "var(--ads-s5)",
              }}
            >
              <Building size={18} color="var(--ads-blue)" />
              <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                Fleet Classification & Station Assignment
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "var(--ads-s5)",
              }}
            >
              {/* Vehicle Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Vehicle Type
                </label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => handleChange("vehicle_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Van Sub-Type
                </label>
                <select
                  value={formData.vehicle_sub_type}
                  onChange={(e) => handleChange("vehicle_sub_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Ownership Type
                </label>
                <select
                  value={formData.ownership_type}
                  onChange={(e) => handleChange("ownership_type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Leasing / Fleet Vendor
                </label>
                <select
                  value={formData.vendor}
                  onChange={(e) => handleChange("vendor", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Operational Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value as VehicleStatus)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Assigned Delivery Station
                </label>
                <select
                  value={formData.station_code}
                  onChange={(e) => handleChange("station_code", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                gap: "var(--ads-s2)",
                paddingBottom: "var(--ads-s2)",
                borderBottom: "1px solid var(--ads-hairline)",
                marginBottom: "var(--ads-s5)",
              }}
            >
              <Calendar size={18} color="var(--ads-blue)" />
              <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                Compliance &amp; Key Dates
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "var(--ads-s5)",
              }}
            >
              {/* Received Date */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Date Received
                </label>
                <input
                  type="date"
                  value={formData.recieved}
                  onChange={(e) => handleChange("recieved", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    outline: "none",
                  }}
                />
              </div>

              {/* Insured Date */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Date Insured
                </label>
                <input
                  type="date"
                  value={formData.insured}
                  onChange={(e) => handleChange("insured", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    outline: "none",
                  }}
                />
              </div>

              {/* Insurance Expires */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Insurance Expiration
                </label>
                <input
                  type="date"
                  value={formData.insurance_expires}
                  onChange={(e) => handleChange("insurance_expires", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    outline: "none",
                  }}
                />
              </div>

              {/* State Inspection Renewal */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Inspection Renewal Date
                </label>
                <input
                  type="date"
                  value={formData.insp_renewal_date}
                  onChange={(e) => handleChange("insp_renewal_date", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
                gap: "var(--ads-s2)",
                paddingBottom: "var(--ads-s2)",
                borderBottom: "1px solid var(--ads-hairline)",
                marginBottom: "var(--ads-s5)",
              }}
            >
              <CreditCard size={18} color="var(--ads-blue)" />
              <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                Fuel Cards &amp; Toll Equipment
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "var(--ads-s5)",
              }}
            >
              {/* Gas Card */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  Gas / Fuel Card ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. WEX-4928"
                  value={formData.gas_card_id}
                  onChange={(e) => handleChange("gas_card_id", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                    outline: "none",
                  }}
                />
              </div>

              {/* EZ Pass */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink-secondary)", marginBottom: "var(--ads-s1)" }}>
                  EZ-Pass / Toll Transponder #
                </label>
                <input
                  type="text"
                  placeholder="e.g. 021-998822"
                  value={formData.ez_pass}
                  onChange={(e) => handleChange("ez_pass", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    backgroundColor: "var(--ads-material-thick)",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    color: "var(--ads-ink)",
                    transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
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
