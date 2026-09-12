import React, { FC, useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Calendar,
  Wrench,
  Gauge,
  Building,
  FileText,
  Save,
  AlertCircle,
} from "lucide-react";
import type { Vehicle, PreventiveRecord } from "../../../../types/vehicle";
import { vehicleApi } from "../../../../api/vehicleApi";
import LoadingSpinner from "../../../common/LoadingSpinner";

interface VehiclePreventiveModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_SERVICE_TYPES = [
  "Oil & Filter Change",
  "Tire Rotation & Balance",
  "Brake Inspection & Service",
  "Transmission Fluid Service",
  "Coolant Flush & Exchange",
  "Air & Cabin Filter Replacement",
  "Battery & Electrical Check",
  "Spark Plugs Replacement",
  "Differential Fluid Service",
  "Comprehensive Multi-Point Inspection",
  "Annual Safety Inspection",
  "General Preventive Service",
];

export const VehiclePreventiveModal: FC<VehiclePreventiveModalProps> = ({
  vehicle,
  isOpen,
  onClose,
}) => {
  const [records, setRecords] = useState<PreventiveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Form state
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PreventiveRecord | null>(null);

  // Form inputs
  const [serviceType, setServiceType] = useState(COMMON_SERVICE_TYPES[0]);
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [miles, setMiles] = useState((vehicle as any).odometer ? String((vehicle as any).odometer) : "");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleApi.getVehiclePreventive(vehicle.id);
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [vehicle.id]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setShowForm(false);
      setEditingRecord(null);
      setErrorMsg(null);
    }
  }, [isOpen, loadData]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setServiceType(COMMON_SERVICE_TYPES[0]);
    setVendor("");
    setDate(new Date().toISOString().split("T")[0]);
    setMiles((vehicle as any).odometer ? String((vehicle as any).odometer) : "");
    setNotes("");
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleOpenEdit = (rec: PreventiveRecord) => {
    setEditingRecord(rec);
    setServiceType(String(rec.service_type_name || rec.service_type || COMMON_SERVICE_TYPES[0]));
    setVendor(rec.vendor || "");
    setDate(rec.date ? rec.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setMiles(rec.miles !== undefined && rec.miles !== null ? String(rec.miles) : "");
    setNotes(rec.notes || "");
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vendor.trim()) {
      setErrorMsg("Vendor is required.");
      return;
    }

    if (!date) {
      setErrorMsg("Service date is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        vehicle: vehicle.id,
        vehicle_id: vehicle.id,
        vendor: vendor.trim(),
        service_type: serviceType,
        service_type_name: serviceType,
        date: date,
        notes: notes.trim(),
      };

      if (miles && !isNaN(Number(miles))) {
        payload.miles = Number(miles);
      }

      if (editingRecord) {
        const res = await vehicleApi.updateVehiclePreventive(editingRecord.id, payload);
        if (!res.success) {
          setErrorMsg(res.message || "Failed to update preventive log.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await vehicleApi.addVehiclePreventive(payload);
        if (!res.success) {
          setErrorMsg(res.message || "Failed to add preventive log.");
          setIsSubmitting(false);
          return;
        }
      }

      setShowForm(false);
      setEditingRecord(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recId: number) => {
    if (!window.confirm("Are you sure you want to delete this preventive maintenance record?")) {
      return;
    }

    try {
      const res = await vehicleApi.deleteVehiclePreventive(recId, vehicle.id);
      if (res.success) {
        setRecords((prev) => prev.filter((r) => r.id !== recId));
      } else {
        alert(res.message || "Failed to delete maintenance log.");
      }
    } catch {
      alert("Failed to delete maintenance log.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 10050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #E2E8F0",
          width: "100%",
          maxWidth: "850px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to right, #F8FAFC, #FFFFFF)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
              }}
            >
              <Wrench size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1E293B" }}>
                  Preventive Maintenance (PM)
                </h2>
                <span
                  style={{
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.6rem",
                    borderRadius: "9999px",
                    border: "1px solid #BFDBFE",
                  }}
                >
                  {records.length} Logs
                </span>
              </div>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#64748B" }}>
                Vehicle: <strong>{vehicle.vin || "Vehicle #" + vehicle.id}</strong>
                {(vehicle as any).license_plate ? ` (${(vehicle as any).license_plate})` : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {!showForm && (
              <button
                type="button"
                onClick={handleOpenAdd}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1D4ED8")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
              >
                <Plus size={16} />
                Add PM Log
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "0.4rem",
                borderRadius: "0.375rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1E293B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Drawer / Accordion */}
        {showForm && (
          <div
            style={{
              padding: "1.25rem 1.75rem",
              background: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1E293B" }}>
                {editingRecord ? "Edit Maintenance Log" : "Add Preventive Maintenance Log"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748B",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: "#DC2626",
                  padding: "0.6rem 0.9rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.82rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                {/* Service Type */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Service Type *
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#1E293B",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  >
                    {COMMON_SERVICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendor */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Service Vendor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Firestone, Jiffy Lube, In-House"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#1E293B",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Service Date */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Service Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#1E293B",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Mileage / Odometer */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Odometer / Miles
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45200"
                    value={miles}
                    onChange={(e) => setMiles(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#1E293B",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.35rem",
                  }}
                >
                  Notes & Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Parts replaced, fluid brands, recommendations, warranty notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#1E293B",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  <Save size={16} />
                  {isSubmitting ? "Saving..." : editingRecord ? "Update Log" : "Save PM Log"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: "1.25rem 1.75rem", flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem",
                color: "#64748B",
              }}
            >
              <LoadingSpinner size="lg" />
              <span style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                Fetching preventive maintenance logs...
              </span>
            </div>
          ) : records.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "#64748B",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#EFF6FF",
                  color: "#3B82F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Wrench size={28} />
              </div>
              <h4 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem", fontWeight: 700, color: "#1E293B" }}>
                No Preventive Maintenance Records
              </h4>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "#64748B" }}>
                No scheduled service or routine maintenance has been logged for this vehicle yet.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.55rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={16} />
                Add First PM Log
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {records.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "0.75rem",
                    padding: "1rem 1.25rem",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          flexWrap: "wrap",
                          marginBottom: "0.4rem",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: "#1E293B",
                          }}
                        >
                          {rec.service_type_name || rec.service_type || "Preventive Maintenance"}
                        </h4>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#059669",
                            backgroundColor: "#ECFDF5",
                            border: "1px solid #A7F3D0",
                            padding: "0.15rem 0.55rem",
                            borderRadius: "9999px",
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Completed
                        </span>
                      </div>

                      {/* Metadata Row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1.25rem",
                          flexWrap: "wrap",
                          fontSize: "0.82rem",
                          color: "#64748B",
                          marginBottom: rec.notes ? "0.6rem" : 0,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Calendar size={14} color="#94A3B8" />
                          <span>
                            Date: <strong>{rec.date ? rec.date.split("T")[0] : "N/A"}</strong>
                          </span>
                        </div>

                        {rec.vendor && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <Building size={14} color="#94A3B8" />
                            <span>
                              Vendor: <strong>{rec.vendor}</strong>
                            </span>
                          </div>
                        )}

                        {rec.miles !== undefined && rec.miles !== null && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <Gauge size={14} color="#94A3B8" />
                            <span>
                              Odometer: <strong>{Number(rec.miles).toLocaleString()} mi</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {rec.notes && (
                        <div
                          style={{
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #F1F5F9",
                            borderRadius: "0.5rem",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.82rem",
                            color: "#334155",
                            marginTop: "0.5rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                            <FileText size={14} color="#64748B" style={{ marginTop: "2px" }} />
                            <span>{rec.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rec)}
                        title="Edit Log"
                        style={{
                          background: "#F1F5F9",
                          border: "none",
                          borderRadius: "0.375rem",
                          padding: "0.45rem",
                          color: "#475569",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#E2E8F0";
                          e.currentTarget.style.color = "#1E293B";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#F1F5F9";
                          e.currentTarget.style.color = "#475569";
                        }}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id)}
                        title="Delete Log"
                        style={{
                          background: "#FEE2E2",
                          border: "none",
                          borderRadius: "0.375rem",
                          padding: "0.45rem",
                          color: "#DC2626",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FECACA";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#FEE2E2";
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0.875rem 1.75rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
            Showing live preventive maintenance logs from Fleet MS
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1.1rem",
              borderRadius: "0.5rem",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
