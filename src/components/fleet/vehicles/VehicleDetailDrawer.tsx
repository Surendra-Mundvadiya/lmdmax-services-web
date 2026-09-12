import React, { FC, useState, useEffect, useCallback } from "react";
import {
  X,
  Truck,
  Edit2,
  Calendar,
  CreditCard,
  Building,
  User,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type {
  Vehicle,
  VehicleNote,
  VehicleDefectItem,
  VehicleDocItem,
} from "../../../types/vehicle";
import { vehicleApi } from "../../../api/vehicleApi";
import LoadingSpinner from "../../common/LoadingSpinner";

interface VehicleDetailDrawerProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (vehicle: Vehicle) => void;
}

type TabType = "overview" | "notes" | "defects" | "docs";

export const VehicleDetailDrawer: FC<VehicleDetailDrawerProps> = ({
  vehicle,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Notes state
  const [notes, setNotes] = useState<VehicleNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Defects state
  const [defects, setDefects] = useState<VehicleDefectItem[]>([]);
  const [defectsLoading, setDefectsLoading] = useState(false);

  // Docs state
  const [docs, setDocs] = useState<VehicleDocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Fetch tab data on vehicle or tab change
  const loadNotes = useCallback(async (vId: number) => {
    setNotesLoading(true);
    try {
      const data = await vehicleApi.getVehicleNotes(vId);
      setNotes(data);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  const loadDefects = useCallback(async (vId: number) => {
    setDefectsLoading(true);
    try {
      const data = await vehicleApi.getVehicleDefects(vId);
      setDefects(data);
    } finally {
      setDefectsLoading(false);
    }
  }, []);

  const loadDocs = useCallback(async (vId: number) => {
    setDocsLoading(true);
    try {
      const data = await vehicleApi.getVehicleDocs(vId);
      setDocs(data);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!vehicle || !isOpen) return;
    if (activeTab === "notes") {
      loadNotes(vehicle.id);
    } else if (activeTab === "defects") {
      loadDefects(vehicle.id);
    } else if (activeTab === "docs") {
      loadDocs(vehicle.id);
    }
  }, [vehicle, isOpen, activeTab, loadNotes, loadDefects, loadDocs]);

  if (!isOpen || !vehicle) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || isAddingNote || !vehicle) return;

    setIsAddingNote(true);
    try {
      const res = await vehicleApi.addVehicleNote(vehicle.id, {
        note: newNoteText.trim(),
        title: "Vehicle Operational Note",
      });
      if (res.success) {
        setNewNoteText("");
        await loadNotes(vehicle.id);
      }
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!vehicle) return;
    const ok = window.confirm("Are you sure you want to delete this vehicle note?");
    if (!ok) return;

    const res = await vehicleApi.deleteVehicleNote(noteId, vehicle.id);
    if (res.success) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  };

  const statusConfig = {
    active: { label: "In Service", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
    grounded: { label: "Grounded", bg: "#FEF2F2", text: "#991B1B", border: "#FCA5A5" },
    maintenance: { label: "In Maintenance", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
    inactive: { label: "Inactive", bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  }[vehicle.status] || { label: vehicle.status, bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2500,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          height: "100%",
          backgroundColor: "#FFFFFF",
          boxShadow: "-8px 0 24px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          animation: "drawerSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 750, color: "#0F172A" }}>
                  {vehicle.name}
                </h2>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.15rem 0.55rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 650,
                    backgroundColor: statusConfig.bg,
                    color: statusConfig.text,
                    border: `1px solid ${statusConfig.border}`,
                  }}
                >
                  {statusConfig.label}
                </span>
              </div>
              <span style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "0.15rem", display: "block" }}>
                VIN: <code style={{ fontWeight: 600, color: "#334155" }}>{vehicle.vin}</code> • Plate: {vehicle.plate} ({vehicle.state})
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => onEdit(vehicle)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#1E293B",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.45rem",
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

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            gap: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              borderBottom: activeTab === "overview" ? "2px solid #2563EB" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "overview" ? "#2563EB" : "#64748B",
              fontSize: "0.875rem",
              fontWeight: activeTab === "overview" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              borderBottom: activeTab === "notes" ? "2px solid #2563EB" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "notes" ? "#2563EB" : "#64748B",
              fontSize: "0.875rem",
              fontWeight: activeTab === "notes" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            Notes {notes.length > 0 && `(${notes.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("defects")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              borderBottom: activeTab === "defects" ? "2px solid #2563EB" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "defects" ? "#2563EB" : "#64748B",
              fontSize: "0.875rem",
              fontWeight: activeTab === "defects" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            Defects &amp; Flags
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("docs")}
            style={{
              padding: "0.85rem 0",
              border: "none",
              borderBottom: activeTab === "docs" ? "2px solid #2563EB" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "docs" ? "#2563EB" : "#64748B",
              fontSize: "0.875rem",
              fontWeight: activeTab === "docs" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            Documents
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Specifications Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <h4 style={{ margin: "0 0 1rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>
                  Vehicle Specifications
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.85rem 1rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Make &amp; Model</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.make || "Ford"} {vehicle.model || "Transit 250"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Year / Trim</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.year || "2024"} {vehicle.trim ? `• ${vehicle.trim}` : ""}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Van Classification</span>
                    <strong style={{ color: "#1E293B" }}>
                      {String(vehicle.vehicle_type || "Cargo Van")}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Sub-Type</span>
                    <strong style={{ color: "#1E293B" }}>
                      {String(vehicle.vehicle_sub_type || "Prime Van")}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Ownership</span>
                    <strong style={{ color: "#1E293B" }}>
                      {String(vehicle.ownership_type || "Leased (Amazon)")}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Fleet Vendor</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.vendor || "Element Fleet"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Station & Driver Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <h4 style={{ margin: "0 0 1rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>
                  Station &amp; Driver Assignment
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.85rem 1rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Assigned Station</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem" }}>
                      <Building size={14} color="#2563EB" />
                      <strong style={{ color: "#1E293B" }}>
                        {vehicle.station_code || vehicle.stations?.[0]?.station_code || "QUE4"}
                      </strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Current Assigned Driver</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem" }}>
                      <User size={14} color={vehicle.assigned_driver_name ? "#059669" : "#94A3B8"} />
                      <strong style={{ color: vehicle.assigned_driver_name ? "#1E293B" : "#64748B" }}>
                        {vehicle.assigned_driver_name || "Unassigned"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Key Dates Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <h4 style={{ margin: "0 0 1rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>
                  Compliance &amp; Key Dates
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.85rem 1rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Date Received</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.recieved || vehicle.date_received || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Date Insured</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.insured || vehicle.date_insured || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Insurance Expiration</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.insurance_expires || vehicle.insurance_expiry || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Inspection Renewal</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.insp_renewal_date || vehicle.inspection_renewal || "N/A"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Passes & Equipment */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <h4 style={{ margin: "0 0 1rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>
                  Cards &amp; Toll Equipment
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.85rem 1rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Gas Card ID</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.gas_card_id || vehicle.gas_card || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>EZ Pass Transponder</span>
                    <strong style={{ color: "#1E293B" }}>
                      {vehicle.ez_pass || vehicle.ezpass_number || "N/A"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === "notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Add Note Form */}
              <form
                onSubmit={handleAddNote}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  padding: "1rem",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                }}
              >
                <textarea
                  rows={2}
                  placeholder="Type a new operational note for this vehicle..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                    resize: "none",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    disabled={!newNoteText.trim() || isAddingNote}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 0.95rem",
                      borderRadius: "8px",
                      backgroundColor: "#2563EB",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: !newNoteText.trim() || isAddingNote ? "not-allowed" : "pointer",
                      opacity: !newNoteText.trim() || isAddingNote ? 0.6 : 1,
                    }}
                  >
                    <Plus size={14} color="#FFFFFF" />
                    <span style={{ color: "#FFFFFF" }}>{isAddingNote ? "Adding..." : "Add Note"}</span>
                  </button>
                </div>
              </form>

              {notesLoading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <LoadingSpinner size="md" color="#2563EB" />
                </div>
              ) : notes.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94A3B8", fontSize: "0.875rem" }}>
                  No vehicle notes recorded yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: "0.85rem 1rem",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        {note.title && (
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", display: "block" }}>
                            {note.title}
                          </span>
                        )}
                        <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#334155" }}>
                          {note.note}
                        </p>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                          {note.created_at ? new Date(note.created_at).toLocaleString() : ""}
                          {note.user_name || note.created_by ? ` • By ${note.user_name || note.created_by}` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        title="Delete note"
                        style={{
                          padding: "0.35rem",
                          border: "none",
                          backgroundColor: "transparent",
                          color: "#94A3B8",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEFECTS */}
          {activeTab === "defects" && (
            <div>
              {defectsLoading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <LoadingSpinner size="md" color="#2563EB" />
                </div>
              ) : defects.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94A3B8", fontSize: "0.875rem" }}>
                  <CheckCircle2 size={32} color="#10B981" style={{ margin: "0 auto 0.5rem" }} />
                  <p style={{ margin: 0, fontWeight: 600, color: "#10B981" }}>Clean Inspection Record</p>
                  <span>No open defects or inspection flags reported for this vehicle.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {defects.map((def) => (
                    <div
                      key={def.id}
                      style={{
                        padding: "0.85rem 1rem",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>
                          {def.defect_title || def.defect_type || "Inspection Defect"}
                        </span>
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 650,
                            backgroundColor: def.severity === "critical" || def.severity === "high" ? "#FEF2F2" : "#FFFBEB",
                            color: def.severity === "critical" || def.severity === "high" ? "#991B1B" : "#92400E",
                            border: `1px solid ${def.severity === "critical" || def.severity === "high" ? "#FCA5A5" : "#FDE68A"}`,
                          }}
                        >
                          {def.severity?.toUpperCase() || "SEV"}
                        </span>
                      </div>
                      {def.description && (
                        <p style={{ margin: "0.4rem 0", fontSize: "0.8125rem", color: "#475569" }}>
                          {def.description}
                        </p>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                        Status: <strong>{def.status}</strong>
                        {def.driver_name ? ` • Reported by ${def.driver_name}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === "docs" && (
            <div>
              {docsLoading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <LoadingSpinner size="md" color="#2563EB" />
                </div>
              ) : docs.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94A3B8", fontSize: "0.875rem" }}>
                  <FileText size={32} color="#CBD5E1" style={{ margin: "0 auto 0.5rem" }} />
                  <p style={{ margin: 0 }}>No documents uploaded for this vehicle.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: "0.85rem 1rem",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <FileText size={18} color="#2563EB" />
                        <div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1E293B" }}>
                            {doc.doc_name}
                          </span>
                          {doc.created_at && (
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8", display: "block" }}>
                              {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {doc.doc_url && (
                        <a
                          href={doc.doc_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color: "#2563EB",
                            fontSize: "0.8125rem",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          <span>View</span>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailDrawer;
