import React, { FC, useState, useEffect, useCallback } from "react";
import {
  X,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Filter,
  Save,
  Wrench,
  ShieldAlert,
} from "lucide-react";
import type { Vehicle, DamageRecord, DamageFlagColor } from "../../../../types/vehicle";
import { vehicleApi } from "../../../../api/vehicleApi";
import LoadingSpinner from "../../../common/LoadingSpinner";

interface VehicleDamageModalProps {
  vehicle: Vehicle;
  type: "body" | "mechanical";
  isOpen: boolean;
  onClose: () => void;
}

const BODY_LOCATIONS = [
  "Front Bumper",
  "Rear Bumper",
  "Hood",
  "Driver Side Door",
  "Passenger Side Door",
  "Driver Side Quarter Panel",
  "Passenger Side Quarter Panel",
  "Roof",
  "Windshield",
  "Rear Cargo Doors",
  "Driver Mirror",
  "Passenger Mirror",
  "Other Exterior Area",
];

const MECHANICAL_CATEGORIES = [
  "Brakes & Calipers",
  "Engine & Powertrain",
  "Transmission & Drivetrain",
  "Suspension & Shocks",
  "Electrical & Battery",
  "Steering & Alignment",
  "HVAC (Heating & A/C)",
  "Exhaust & Emissions",
  "Tires & Wheels",
  "Warning Lights & Sensors",
  "Other Mechanical Issue",
];

export const VehicleDamageModal: FC<VehicleDamageModalProps> = ({
  vehicle,
  type,
  isOpen,
  onClose,
}) => {
  const isBody = type === "body";
  const title = isBody ? "Body Damage Records" : "Mechanical Issues";

  const [records, setRecords] = useState<DamageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("all");

  // Add / Edit form toggle
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DamageRecord | null>(null);

  // Form fields
  const [flag, setFlag] = useState<DamageFlagColor>("yellow");
  const [locationCategory, setLocationCategory] = useState(
    isBody ? BODY_LOCATIONS[0] : MECHANICAL_CATEGORIES[0]
  );
  const [detail, setDetail] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [estimatedCost, setEstimatedCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleApi.getVehicleDamages(vehicle.id, type);
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [vehicle.id, type]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setShowForm(false);
      setEditingRecord(null);
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFlag("yellow");
    setLocationCategory(isBody ? BODY_LOCATIONS[0] : MECHANICAL_CATEGORIES[0]);
    setDetail("");
    setDate(new Date().toISOString().split("T")[0]);
    setEstimatedCost("");
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleOpenEdit = (rec: DamageRecord) => {
    setEditingRecord(rec);
    setFlag(rec.flag || "yellow");
    setLocationCategory(isBody ? (rec.location || BODY_LOCATIONS[0]) : (rec.category || MECHANICAL_CATEGORIES[0]));
    setDetail(rec.detail || rec.description || "");
    setDate(rec.damage_date?.slice(0, 10) || rec.created_at?.slice(0, 10) || new Date().toISOString().split("T")[0]);
    setEstimatedCost(rec.estimated_cost ? String(rec.estimated_cost) : "");
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${isBody ? "body damage" : "mechanical issue"} record?`);
    if (!confirmDelete) return;

    const res = await vehicleApi.deleteVehicleDamage(id, vehicle.id, type);
    if (res.success) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(res.message || "Failed to delete.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      vehicle_id: vehicle.id,
      flag,
      detail: detail.trim(),
      created_at: date,
      damage_date: date,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) || 0 : undefined,
      ...(isBody ? { location: locationCategory } : { category: locationCategory }),
    };

    try {
      if (editingRecord) {
        const res = await vehicleApi.updateVehicleDamage(editingRecord.id, payload, type);
        if (res.success) {
          await loadData();
          setShowForm(false);
          setEditingRecord(null);
        } else {
          setErrorMsg(res.message || "Failed to update record.");
        }
      } else {
        const res = await vehicleApi.addVehicleDamage(payload, type);
        if (res.success) {
          await loadData();
          setShowForm(false);
        } else {
          setErrorMsg(res.message || "Failed to create record.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (filter === "resolved") return r.partially_resolved === true || r.status === "resolved";
    if (filter === "unresolved") return r.partially_resolved !== true && r.status !== "resolved";
    return true;
  });

  const getFlagStyle = (f: DamageFlagColor) => {
    switch (f) {
      case "green":
        return { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0", label: "Minor / Low" };
      case "yellow":
        return { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", label: "Moderate" };
      case "red":
        return { bg: "#FEF2F2", text: "#991B1B", border: "#FCA5A5", label: "Severe (Ground)" };
      case "black":
        return { bg: "#1E293B", text: "#FFFFFF", border: "#0F172A", label: "Critical Hazard" };
      default:
        return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", label: f };
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            backgroundColor: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: isBody ? "#EFF6FF" : "#FFFBEB",
                color: isBody ? "#2563EB" : "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isBody ? <ShieldAlert size={22} /> : <Wrench size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 750, color: "#0F172A" }}>
                {title} • {vehicle.name}
              </h3>
              <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
                VIN: <code style={{ fontWeight: 600 }}>{vehicle.vin}</code> • Plate: {vehicle.plate}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={showForm ? () => setShowForm(false) : handleOpenAdd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.95rem",
                borderRadius: "8px",
                backgroundColor: showForm ? "#F1F5F9" : "#2563EB",
                border: showForm ? "1px solid #CBD5E1" : "none",
                color: showForm ? "#475569" : "#FFFFFF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {showForm ? "Cancel" : <><Plus size={15} color="#FFFFFF" /><span style={{ color: "#FFFFFF" }}>{isBody ? "Report Damage" : "Report Issue"}</span></>}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.4rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "transparent",
                color: "#64748B",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Bar (when form is closed) */}
        {!showForm && (
          <div
            style={{
              padding: "0.75rem 1.5rem",
              borderBottom: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#F1F5F9",
                padding: "3px",
                borderRadius: "8px",
                gap: "2px",
              }}
            >
              {[
                { key: "all", label: `All (${records.length})` },
                { key: "unresolved", label: "Open / Unresolved" },
                { key: "resolved", label: "Resolved" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key as any)}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: filter === tab.key ? "#FFFFFF" : "transparent",
                    color: filter === tab.key ? "#2563EB" : "#64748B",
                    fontSize: "0.8125rem",
                    fontWeight: filter === tab.key ? 700 : 500,
                    cursor: "pointer",
                    boxShadow: filter === tab.key ? "0 1px 3px rgba(0, 0, 0, 0.06)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
              Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {showForm ? (
            /* ADD / EDIT FORM */
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#EFF6FF",
                  borderRadius: "8px",
                  border: "1px solid #BFDBFE",
                  fontSize: "0.875rem",
                  color: "#1E40AF",
                  fontWeight: 600,
                }}
              >
                {editingRecord ? `Editing ${isBody ? "Damage" : "Issue"} #${editingRecord.id}` : `New ${isBody ? "Body Damage" : "Mechanical Issue"} for ${vehicle.name}`}
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: "0.65rem 0.85rem",
                    backgroundColor: "#FEF2F2",
                    borderRadius: "8px",
                    border: "1px solid #FCA5A5",
                    fontSize: "0.8125rem",
                    color: "#991B1B",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Form Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Severity Flag */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                    Severity Level <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    value={flag}
                    onChange={(e) => setFlag(e.target.value as DamageFlagColor)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      color: "#0F172A",
                    }}
                  >
                    <option value="green">Green (Minor / Cosmetic)</option>
                    <option value="yellow">Yellow (Moderate)</option>
                    <option value="red">Red (Severe - Needs Grounding)</option>
                    <option value="black">Black (Critical Safety Hazard)</option>
                  </select>
                </div>

                {/* Location or Category */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                    {isBody ? "Damage Location" : "System / Issue Category"} <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    value={locationCategory}
                    onChange={(e) => setLocationCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      color: "#0F172A",
                    }}
                  >
                    {(isBody ? BODY_LOCATIONS : MECHANICAL_CATEGORIES).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                    Date Recorded <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      color: "#0F172A",
                    }}
                  />
                </div>

                {/* Estimated Cost */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                    Estimated Repair Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      color: "#0F172A",
                    }}
                  />
                </div>

                {/* Detail Description */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                    Description &amp; Observations <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={`Describe the ${isBody ? "dent, scratch, or impact location" : "mechanical malfunction, warning sound, or symptom"}...`}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      color: "#0F172A",
                      resize: "none",
                    }}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !detail.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "8px",
                    backgroundColor: "#2563EB",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: isSubmitting || !detail.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? <LoadingSpinner size="sm" color="#FFFFFF" /> : <Save size={15} color="#FFFFFF" />}
                  <span style={{ color: "#FFFFFF" }}>{editingRecord ? "Update Record" : "Save Record"}</span>
                </button>
              </div>
            </form>
          ) : loading ? (
            /* LOADING SKELETON */
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <LoadingSpinner size="lg" color="#2563EB" />
              <p style={{ marginTop: "1rem", color: "#64748B", fontSize: "0.875rem" }}>
                Loading {title.toLowerCase()} from microservice...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            /* EMPTY STATE */
            <div style={{ padding: "3.5rem 1rem", textAlign: "center" }}>
              <CheckCircle2 size={42} color="#10B981" style={{ margin: "0 auto 0.75rem" }} />
              <h4 style={{ margin: "0 0 0.25rem", color: "#0F172A", fontSize: "1rem", fontWeight: 700 }}>
                No {title} Found
              </h4>
              <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
                There are no {filter !== "all" ? filter : ""} records on file for vehicle {vehicle.name}.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "#2563EB",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={15} color="#FFFFFF" />
                <span style={{ color: "#FFFFFF" }}>{isBody ? "Report New Damage" : "Report New Issue"}</span>
              </button>
            </div>
          ) : (
            /* RECORDS LIST */
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {filteredRecords.map((rec) => {
                const flagStyle = getFlagStyle(rec.flag);
                const itemLocation = isBody ? rec.location : rec.category;

                return (
                  <div
                    key={rec.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "1rem 1.25rem",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {/* Top Row: Location + Severity Flag + Actions */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 750, color: "#0F172A" }}>
                          {itemLocation || (isBody ? "Body Area" : "Mechanical Component")}
                        </span>
                        <span
                          style={{
                            padding: "0.15rem 0.55rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: flagStyle.bg,
                            color: flagStyle.text,
                            border: `1px solid ${flagStyle.border}`,
                          }}
                        >
                          {flagStyle.label}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          title="Edit"
                          style={{
                            padding: "0.35rem",
                            borderRadius: "6px",
                            border: "1px solid #E2E8F0",
                            backgroundColor: "#FFFFFF",
                            color: "#2563EB",
                            cursor: "pointer",
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rec.id)}
                          title="Delete"
                          style={{
                            padding: "0.35rem",
                            borderRadius: "6px",
                            border: "1px solid #E2E8F0",
                            backgroundColor: "#FFFFFF",
                            color: "#DC2626",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Detail Description */}
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#334155", lineHeight: 1.5 }}>
                      {rec.detail || rec.description}
                    </p>

                    {/* Metadata Footer */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                        paddingTop: "0.4rem",
                        borderTop: "1px solid #F8FAFC",
                        fontSize: "0.75rem",
                        color: "#64748B",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Calendar size={13} />
                        <span>{rec.damage_date || rec.created_at?.slice(0, 10) || "N/A"}</span>
                      </div>
                      {rec.estimated_cost ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "#059669", fontWeight: 600 }}>
                          <DollarSign size={13} />
                          <span>Est. ${Number(rec.estimated_cost).toFixed(2)}</span>
                        </div>
                      ) : null}
                      {rec.driver_name && (
                        <span>Reported by: <strong>{rec.driver_name}</strong></span>
                      )}
                      <span
                        style={{
                          marginLeft: "auto",
                          fontWeight: 650,
                          color: rec.partially_resolved ? "#059669" : "#D97706",
                        }}
                      >
                        {rec.partially_resolved ? "✓ Resolved" : "● Open Defect"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDamageModal;
