import React, { FC, useState } from "react";
import {
  ArrowLeft,
  X,
  ClipboardCheck,
  Truck,
  User,
  Calendar,
  Gauge,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { InspectionRecord, VehicleRecord } from "../../../api/fleetApi";
import type { Driver } from "../../../types/driver";

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleRecord[];
  drivers: Driver[];
  onSubmit: (inspectionData: Partial<InspectionRecord>) => Promise<void>;
  embedded?: boolean;
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ads-ink-tertiary)",
  marginBottom: "var(--ads-s1)",
};

const controlStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 13px",
  fontFamily: "inherit",
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "var(--ads-ink)",
  background: "var(--ads-material-thick)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-sm)",
  outline: "none",
  transition: "all var(--ads-dur-fast) var(--ads-ease)",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--ads-s2)",
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
};

const choiceStyle = (
  active: boolean,
  tint: string,
  accent: string
): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "9px 10px",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "-0.005em",
  textAlign: "center",
  color: active ? accent : "var(--ads-ink-secondary)",
  background: active ? tint : "rgba(0,0,0,0.04)",
  border: `1px solid ${active ? accent : "var(--ads-hairline)"}`,
  borderRadius: "var(--ads-r-sm)",
  boxShadow: active ? "var(--ads-shadow-xs)" : "none",
  cursor: "pointer",
  transition: "all var(--ads-dur-fast) var(--ads-ease)",
});

export const NewInspectionModal: FC<NewInspectionModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  drivers,
  onSubmit,
  embedded = false,
}) => {
  const [vehicleId, setVehicleId] = useState<string>(String(vehicles[0]?.id || ""));
  const [driverId, setDriverId] = useState<string>(String(drivers[0]?.id || ""));
  const [inspectionType, setInspectionType] = useState<"pre" | "post" | "default">("pre");
  const [status, setStatus] = useState<"passed" | "caution" | "failed">("passed");
  const [odometer, setOdometer] = useState<string>("43250");
  const [fuelLevel, setFuelLevel] = useState<string>("85% (3/4 Tank)");
  const [shiftType, setShiftType] = useState<string>("Morning Pre-Trip");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selVehicle = vehicles.find((v) => String(v.id) === String(vehicleId));
    const selDriver = drivers.find((d) => String(d.id) === String(driverId));

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const newRecord: Partial<InspectionRecord> = {
        vehicle_id: vehicleId,
        vehicle_unit: selVehicle?.unit_number || `VAN-${vehicleId}`,
        vin: selVehicle?.vin || "1FTNE3Y89PK1029",
        license_plate: selVehicle?.license_plate || "FLT-900",
        driver_id: driverId,
        driver_name: selDriver?.name || "Assigned Driver",
        inspection_type: inspectionType,
        status,
        date: today,
        shift_type: shiftType,
        odometer: Number(odometer) || 45000,
        fuel_level: fuelLevel,
        defects_found: status === "failed" ? 2 : status === "caution" ? 1 : 0,
        notes: notes.trim() || (status === "passed" ? "Routine safety inspection passed." : "Flagged defect during check."),
        submission_source: "Dispatcher RTS",
        verified_by: "Safety Dispatcher",
        created_at: new Date().toISOString(),
      };

      await onSubmit(newRecord);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s4)" }}
    >
      {/* Vehicle Selection */}
      <div>
        <label style={labelStyle}>
          <Truck size={13} style={{ color: "var(--ads-blue)" }} />
          Select Fleet Vehicle
        </label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          required
          style={controlStyle}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.unit_number || `VAN-${v.id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Driver Selection */}
      <div>
        <label style={labelStyle}>
          <User size={13} style={{ color: "var(--ads-blue)" }} />
          Assigning Driver
        </label>
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          required
          style={controlStyle}
        >
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Inspection Type Buttons */}
      <div>
        <label style={{ ...labelStyle, marginBottom: "var(--ads-s2)" }}>
          Inspection Type
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--ads-s2)" }}>
          {[
            { id: "pre", label: "Pre-Trip DVIC" },
            { id: "post", label: "Post-Trip (Return)" },
            { id: "default", label: "Default Settings" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setInspectionType(t.id as any);
                setShiftType(t.id === "post" ? "Evening RTS" : "Morning Pre-Trip");
              }}
              style={choiceStyle(
                inspectionType === t.id,
                "var(--ads-blue-tint)",
                "var(--ads-blue)"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Result Status */}
      <div>
        <label style={{ ...labelStyle, marginBottom: "var(--ads-s2)" }}>
          Inspection Checklist Result
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--ads-s2)" }}>
          <button
            type="button"
            onClick={() => setStatus("passed")}
            style={choiceStyle(
              status === "passed",
              "var(--ads-green-tint)",
              "var(--ads-green)"
            )}
          >
            <CheckCircle2 size={13} style={{ color: "var(--ads-green)" }} />
            PASS
          </button>

          <button
            type="button"
            onClick={() => setStatus("caution")}
            style={choiceStyle(
              status === "caution",
              "var(--ads-amber-tint)",
              "var(--ads-amber)"
            )}
          >
            <AlertTriangle size={13} style={{ color: "var(--ads-amber)" }} />
            CAUTION
          </button>

          <button
            type="button"
            onClick={() => setStatus("failed")}
            style={choiceStyle(
              status === "failed",
              "var(--ads-red-tint)",
              "var(--ads-red)"
            )}
          >
            <XCircle size={13} style={{ color: "var(--ads-red)" }} />
            FAIL
          </button>
        </div>
      </div>

      {/* Odometer & Fuel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--ads-s3)" }}>
        <div>
          <label style={labelStyle}>
            <Gauge size={12} style={{ color: "var(--ads-blue)" }} />
            Odometer (Miles)
          </label>
          <input
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            required
            style={{ ...controlStyle, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
        </div>

        <div>
          <label style={labelStyle}>
            <Fuel size={12} style={{ color: "var(--ads-blue)" }} />
            Fuel / Battery Level
          </label>
          <select
            value={fuelLevel}
            onChange={(e) => setFuelLevel(e.target.value)}
            style={controlStyle}
          >
            <option value="100% Full">100% Full</option>
            <option value="85% (3/4 Tank)">85% (3/4 Tank)</option>
            <option value="50% (Half Tank)">50% (Half Tank)</option>
            <option value="25% (Quarter Tank)">25% (Quarter Tank)</option>
          </select>
        </div>
      </div>

      {/* Notes / Failure Comments */}
      <div>
        <label style={labelStyle}>
          Inspection Notes / Failure Reason
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Itemized observations, defect notes, or tire/body conditions..."
          style={{ ...controlStyle, fontWeight: 500, resize: "none" }}
        />
      </div>

      {/* Footer Buttons */}
      <div
        style={{
          paddingTop: "var(--ads-s4)",
          borderTop: "1px solid var(--ads-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "var(--ads-s3)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          style={secondaryButtonStyle}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-blue-primary btn-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--ads-s2)",
            color: "#FFFFFF",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Submitting Inspection...</span>
            </>
          ) : (
            <>
              <ClipboardCheck size={14} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Submit Inspection Form</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  if (embedded) {
    return (
      <div className="add-driver-screen-container">
        {/* Screen Nav Header */}
        <div className="screen-nav-header">
          <div className="screen-nav-left">
            <button
              type="button"
              className="back-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              <span>Back to Inspections</span>
            </button>
            <div className="screen-title-divider" />
            <h2 className="screen-heading">Log New Inspection</h2>
          </div>
          <div className="screen-nav-right">
            <button
              type="button"
              className="btn-sm"
              onClick={onClose}
              disabled={isSubmitting}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-blue-primary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                color: "#FFFFFF",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Submitting...</span>
                </>
              ) : (
                <>
                  <ClipboardCheck size={14} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Submit Inspection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card Form Container */}
        <div
          style={{
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-md)",
            WebkitBackdropFilter: "var(--ads-blur-md)",
            borderRadius: "var(--ads-r-lg)",
            border: "1px solid var(--ads-hairline)",
            padding: "var(--ads-s6)",
            boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
          }}
        >
          {formContent}
        </div>
      </div>
    );
  }

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
        <div
          style={{ position: "fixed", inset: 0, background: "transparent" }}
          onClick={onClose}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "32rem",
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
                <ClipboardCheck size={20} />
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
                  Log Inspection Form
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                  Record real-time Pre-Trip or RTS Return Inspection checklist
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspection form"
              style={{
                width: "32px",
                height: "32px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
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

          <div style={{ padding: "var(--ads-s6)" }}>
            {formContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInspectionModal;
