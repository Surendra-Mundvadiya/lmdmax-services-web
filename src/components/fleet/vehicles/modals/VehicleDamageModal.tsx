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
        return { bg: "var(--ads-green-tint)", text: "var(--ads-green)", border: "var(--ads-green-tint)", label: "Minor / Low" };
      case "yellow":
        return { bg: "var(--ads-amber-tint)", text: "var(--ads-amber)", border: "var(--ads-amber-tint)", label: "Moderate" };
      case "red":
        return { bg: "var(--ads-red-tint)", text: "var(--ads-red)", border: "var(--ads-red-tint)", label: "Severe (Ground)" };
      case "black":
        return { bg: "var(--ads-ink)", text: "#FFFFFF", border: "var(--ads-ink)", label: "Critical Hazard" };
      default:
        return { bg: "rgba(0,0,0,0.04)", text: "var(--ads-ink-secondary)", border: "var(--ads-hairline-strong)", label: f };
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
        backgroundColor: "rgba(0, 0, 0, 0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: "var(--ads-s4)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          borderRadius: "var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--ads-hairline)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: isBody ? "var(--ads-blue-tint)" : "var(--ads-amber-tint)",
                color: isBody ? "var(--ads-blue)" : "var(--ads-amber)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isBody ? <ShieldAlert size={22} /> : <Wrench size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                {title} • {vehicle.name}
              </h3>
              <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
                VIN: <code style={{ fontWeight: 600 }}>{vehicle.vin}</code> • Plate: {vehicle.plate}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            <button
              type="button"
              onClick={showForm ? () => setShowForm(false) : handleOpenAdd}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                padding: "9px 18px",
                borderRadius: "var(--ads-r-pill)",
                background: showForm ? "var(--ads-material-thick)" : "var(--ads-blue)",
                border: "1px solid " + (showForm ? "var(--ads-hairline)" : "transparent"),
                boxShadow: showForm ? "var(--ads-bevel)" : "none",
                color: showForm ? "var(--ads-ink)" : "#FFFFFF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {showForm ? "Cancel" : <><Plus size={15} color="#FFFFFF" /><span style={{ color: "#FFFFFF" }}>{isBody ? "Report Damage" : "Report Issue"}</span></>}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid var(--ads-hairline)",
                background: "transparent",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.05)";
                e.currentTarget.style.color = "var(--ads-ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ads-ink-tertiary)";
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar (when form is closed) */}
        {!showForm && (
          <div
            style={{
              padding: "var(--ads-s3) var(--ads-s6)",
              borderBottom: "1px solid var(--ads-hairline)",
              background: "rgba(0, 0, 0, 0.025)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--ads-s3)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.04)",
                border: "1px solid var(--ads-hairline)",
                padding: "3px",
                borderRadius: "var(--ads-r-pill)",
                gap: "3px",
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
                  aria-pressed={filter === tab.key}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid " + (filter === tab.key ? "var(--ads-hairline)" : "transparent"),
                    background: filter === tab.key ? "var(--ads-material-thick)" : "transparent",
                    color: filter === tab.key ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                    fontSize: "0.8125rem",
                    fontWeight: filter === tab.key ? 600 : 550,
                    letterSpacing: "-0.005em",
                    cursor: "pointer",
                    transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                    boxShadow: filter === tab.key ? "var(--ads-shadow-xs), var(--ads-bevel)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
              Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--ads-s6)" }}>
          {showForm ? (
            /* ADD / EDIT FORM */
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--ads-blue-tint)",
                  borderRadius: "var(--ads-r-sm)",
                  border: "1px solid var(--ads-blue-tint-strong)",
                  fontSize: "0.875rem",
                  color: "var(--ads-blue-active)",
                  fontWeight: 600,
                }}
              >
                {editingRecord ? `Editing ${isBody ? "Damage" : "Issue"} #${editingRecord.id}` : `New ${isBody ? "Body Damage" : "Mechanical Issue"} for ${vehicle.name}`}
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: "0.65rem 0.85rem",
                    backgroundColor: "var(--ads-red-tint)",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-red-tint)",
                    fontSize: "0.8125rem",
                    color: "var(--ads-red)",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Form Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Severity Flag */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.35rem" }}>
                    Severity Level <span style={{ color: "var(--ads-red)" }}>*</span>
                  </label>
                  <select
                    value={flag}
                    onChange={(e) => setFlag(e.target.value as DamageFlagColor)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline-strong)",
                      backgroundColor: "var(--ads-material-thick)",
                      fontSize: "0.875rem",
                      color: "var(--ads-ink)",
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
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.35rem" }}>
                    {isBody ? "Damage Location" : "System / Issue Category"} <span style={{ color: "var(--ads-red)" }}>*</span>
                  </label>
                  <select
                    value={locationCategory}
                    onChange={(e) => setLocationCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline-strong)",
                      backgroundColor: "var(--ads-material-thick)",
                      fontSize: "0.875rem",
                      color: "var(--ads-ink)",
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
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.35rem" }}>
                    Date Recorded <span style={{ color: "var(--ads-red)" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline-strong)",
                      backgroundColor: "var(--ads-material-thick)",
                      fontSize: "0.875rem",
                      color: "var(--ads-ink)",
                    }}
                  />
                </div>

                {/* Estimated Cost */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.35rem" }}>
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
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline-strong)",
                      backgroundColor: "var(--ads-material-thick)",
                      fontSize: "0.875rem",
                      color: "var(--ads-ink)",
                    }}
                  />
                </div>

                {/* Detail Description */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink-secondary)", marginBottom: "0.35rem" }}>
                    Description &amp; Observations <span style={{ color: "var(--ads-red)" }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={`Describe the ${isBody ? "dent, scratch, or impact location" : "mechanical malfunction, warning sound, or symptom"}...`}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline-strong)",
                      backgroundColor: "var(--ads-material-thick)",
                      fontSize: "0.875rem",
                      color: "var(--ads-ink)",
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
                    padding: "9px 18px",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    boxShadow: "var(--ads-bevel)",
                    color: "var(--ads-ink)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !detail.trim()}
                  style={{
                    display: "inline-flex",
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
                    opacity: isSubmitting || !detail.trim() ? 0.4 : 1,
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
              <LoadingSpinner size="lg" color="var(--ads-blue)" />
              <p style={{ marginTop: "1rem", color: "var(--ads-ink-tertiary)", fontSize: "0.875rem" }}>
                Loading {title.toLowerCase()} from microservice...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            /* EMPTY STATE */
            <div style={{ padding: "3.5rem 1rem", textAlign: "center" }}>
              <CheckCircle2 size={42} color="var(--ads-green)" style={{ margin: "0 auto 0.75rem" }} />
              <h4 style={{ margin: "0 0 0.25rem", color: "var(--ads-ink)", fontSize: "1rem", fontWeight: 700 }}>
                No {title} Found
              </h4>
              <p style={{ color: "var(--ads-ink-tertiary)", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
                There are no {filter !== "all" ? filter : ""} records on file for vehicle {vehicle.name}.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                style={{
                  display: "inline-flex",
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
                      background: "var(--ads-material-thick)",
                      border: "1px solid var(--ads-hairline)",
                      borderRadius: "var(--ads-r-md)",
                      padding: "var(--ads-s4) var(--ads-s5)",
                      boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--ads-s2)",
                      transition: "box-shadow var(--ads-dur) var(--ads-ease), transform var(--ads-dur) var(--ads-ease), border-color var(--ads-dur) var(--ads-ease)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
                      e.currentTarget.style.borderColor = "var(--ads-hairline-strong)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "var(--ads-shadow-xs), var(--ads-bevel)";
                      e.currentTarget.style.borderColor = "var(--ads-hairline)";
                    }}
                  >
                    {/* Top Row: Location + Severity Flag + Actions */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                          {itemLocation || (isBody ? "Body Area" : "Mechanical Component")}
                        </span>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: "var(--ads-r-pill)",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            letterSpacing: "-0.005em",
                            backgroundColor: flagStyle.bg,
                            color: flagStyle.text,
                            border: `1px solid ${flagStyle.border}`,
                          }}
                        >
                          {flagStyle.label}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s1)" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          title="Edit"
                          aria-label={`Edit ${isBody ? "damage" : "issue"} record`}
                          style={{
                            width: 30,
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "var(--ads-r-sm)",
                            border: "1px solid var(--ads-hairline)",
                            background: "transparent",
                            color: "var(--ads-blue)",
                            cursor: "pointer",
                            transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ads-blue-tint)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rec.id)}
                          title="Delete"
                          aria-label={`Delete ${isBody ? "damage" : "issue"} record`}
                          style={{
                            width: 30,
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "var(--ads-r-sm)",
                            border: "1px solid var(--ads-hairline)",
                            background: "transparent",
                            color: "var(--ads-red)",
                            cursor: "pointer",
                            transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ads-red-tint)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Detail Description */}
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ads-ink-secondary)", lineHeight: 1.5 }}>
                      {rec.detail || rec.description}
                    </p>

                    {/* Metadata Footer */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                        paddingTop: "var(--ads-s2)",
                        borderTop: "1px solid var(--ads-hairline)",
                        fontSize: "0.75rem",
                        color: "var(--ads-ink-tertiary)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Calendar size={13} />
                        <span>{rec.damage_date || rec.created_at?.slice(0, 10) || "N/A"}</span>
                      </div>
                      {rec.estimated_cost ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--ads-green)", fontWeight: 600 }}>
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
                          color: rec.partially_resolved ? "var(--ads-green)" : "var(--ads-amber)",
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
