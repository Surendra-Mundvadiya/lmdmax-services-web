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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Vehicle Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Truck size={13} className="text-blue-600" />
          Select Fleet Vehicle
        </label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          required
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
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
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <User size={13} className="text-blue-600" />
          Assigning Driver
        </label>
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          required
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
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
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Inspection Type
        </label>
        <div className="grid grid-cols-3 gap-2">
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
              className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                inspectionType === t.id
                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Result Status */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Inspection Checklist Result
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setStatus("passed")}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
              status === "passed"
                ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 size={13} className="text-emerald-600" />
            PASS
          </button>

          <button
            type="button"
            onClick={() => setStatus("caution")}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
              status === "caution"
                ? "bg-amber-50 border-amber-500 text-amber-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle size={13} className="text-amber-600" />
            CAUTION
          </button>

          <button
            type="button"
            onClick={() => setStatus("failed")}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
              status === "failed"
                ? "bg-rose-50 border-rose-500 text-rose-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <XCircle size={13} className="text-rose-600" />
            FAIL
          </button>
        </div>
      </div>

      {/* Odometer & Fuel */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Gauge size={12} className="text-blue-600" />
            Odometer (Miles)
          </label>
          <input
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Fuel size={12} className="text-blue-600" />
            Fuel / Battery Level
          </label>
          <select
            value={fuelLevel}
            onChange={(e) => setFuelLevel(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
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
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Inspection Notes / Failure Reason
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Itemized observations, defect notes, or tire/body conditions..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 resize-none"
        />
      </div>

      {/* Footer Buttons */}
      <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="btn-outline-secondary btn-sm"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-blue-primary btn-sm flex items-center gap-1.5"
          style={{ color: "#FFFFFF" }}
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
              className="btn-outline-secondary btn-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-blue-primary btn-sm flex items-center gap-1.5"
              style={{ color: "#FFFFFF" }}
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
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "1.75rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-5 border-b-2 border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <ClipboardCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Log Inspection Form
                </h3>
                <p className="text-xs text-slate-500">
                  Record real-time Pre-Trip or RTS Return Inspection checklist
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5">
            {formContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInspectionModal;
