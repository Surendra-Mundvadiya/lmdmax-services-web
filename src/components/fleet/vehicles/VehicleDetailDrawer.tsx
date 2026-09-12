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
    active: {
      label: "In Service",
      bg: "var(--ads-green-tint)",
      text: "var(--ads-green)",
      border: "var(--ads-hairline)",
    },
    grounded: {
      label: "Grounded",
      bg: "var(--ads-red-tint)",
      text: "var(--ads-red)",
      border: "var(--ads-hairline)",
    },
    maintenance: {
      label: "In Maintenance",
      bg: "var(--ads-amber-tint)",
      text: "var(--ads-amber)",
      border: "var(--ads-hairline)",
    },
    inactive: {
      label: "Inactive",
      bg: "rgba(0,0,0,0.04)",
      text: "var(--ads-ink-secondary)",
      border: "var(--ads-hairline)",
    },
  }[vehicle.status] || {
    label: vehicle.status,
    bg: "rgba(0,0,0,0.04)",
    text: "var(--ads-ink-secondary)",
    border: "var(--ads-hairline)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2500,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          height: "100%",
          backgroundColor: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          border: "1px solid var(--ads-hairline)",
          borderRadius: "var(--ads-r-xl) 0 0 var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "drawerSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "var(--ads-s5) var(--ads-s6)",
            borderBottom: "1px solid var(--ads-hairline)",
            backgroundColor: "transparent",
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
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: "var(--ads-blue-tint)",
                border: "1px solid var(--ads-blue-tint-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ads-blue)",
                flexShrink: 0,
              }}
            >
              <Truck size={22} color="var(--ads-blue)" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 650, letterSpacing: "-0.019em", color: "var(--ads-ink)" }}>
                  {vehicle.name}
                </h2>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 9px",
                    borderRadius: "var(--ads-r-pill)",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                    backgroundColor: statusConfig.bg,
                    color: statusConfig.text,
                    border: `1px solid ${statusConfig.border}`,
                  }}
                >
                  {statusConfig.label}
                </span>
              </div>
              <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", marginTop: "0.15rem", display: "block" }}>
                VIN: <code style={{ fontWeight: 600, color: "var(--ads-ink-secondary)" }}>{vehicle.vin}</code> • Plate: {vehicle.plate} ({vehicle.state})
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            <button
              type="button"
              onClick={() => onEdit(vehicle)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                padding: "9px 18px",
                borderRadius: "var(--ads-r-pill)",
                border: "1px solid var(--ads-hairline)",
                backgroundColor: "var(--ads-material-thick)",
                boxShadow: "var(--ads-bevel)",
                color: "var(--ads-ink)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close vehicle details"
              title="Close"
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid var(--ads-hairline)",
                backgroundColor: "transparent",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 var(--ads-s6)",
            borderBottom: "1px solid var(--ads-hairline)",
            backgroundColor: "transparent",
            gap: "var(--ads-s6)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "var(--ads-s3) 0",
              border: "none",
              letterSpacing: "-0.01em",
              transition: "color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
              borderBottom: activeTab === "overview" ? "2px solid var(--ads-blue)" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "overview" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
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
              padding: "var(--ads-s3) 0",
              border: "none",
              letterSpacing: "-0.01em",
              transition: "color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
              borderBottom: activeTab === "notes" ? "2px solid var(--ads-blue)" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "notes" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
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
              padding: "var(--ads-s3) 0",
              border: "none",
              letterSpacing: "-0.01em",
              transition: "color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
              borderBottom: activeTab === "defects" ? "2px solid var(--ads-blue)" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "defects" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
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
              padding: "var(--ads-s3) 0",
              border: "none",
              letterSpacing: "-0.01em",
              transition: "color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
              borderBottom: activeTab === "docs" ? "2px solid var(--ads-blue)" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "docs" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
              fontSize: "0.875rem",
              fontWeight: activeTab === "docs" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            Documents
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--ads-s6)" }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s6)" }}>
              {/* Specifications Card */}
              <div
                style={{
                  backgroundColor: "var(--ads-canvas)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "var(--ads-s5)",
                  boxShadow: "var(--ads-shadow-xs)",
                }}
              >
                <h4 style={{ margin: "0 0 var(--ads-s4)", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                  Vehicle Specifications
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--ads-s3) var(--ads-s4)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Make &amp; Model</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.make || "Ford"} {vehicle.model || "Transit 250"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Year / Trim</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.year || "2024"} {vehicle.trim ? `• ${vehicle.trim}` : ""}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Van Classification</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {String(vehicle.vehicle_type || "Cargo Van")}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Sub-Type</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {String(vehicle.vehicle_sub_type || "Prime Van")}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Ownership</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {String(vehicle.ownership_type || "Leased (Amazon)")}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Fleet Vendor</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.vendor || "Element Fleet"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Station & Driver Card */}
              <div
                style={{
                  backgroundColor: "var(--ads-canvas)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "var(--ads-s5)",
                  boxShadow: "var(--ads-shadow-xs)",
                }}
              >
                <h4 style={{ margin: "0 0 var(--ads-s4)", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                  Station &amp; Driver Assignment
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--ads-s3) var(--ads-s4)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Assigned Station</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem" }}>
                      <Building size={14} color="var(--ads-blue)" />
                      <strong style={{ color: "var(--ads-ink)" }}>
                        {vehicle.station_code || vehicle.stations?.[0]?.station_code || "QUE4"}
                      </strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Current Assigned Driver</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem" }}>
                      <User size={14} color={vehicle.assigned_driver_name ? "var(--ads-green)" : "var(--ads-ink-quaternary)"} />
                      <strong style={{ color: vehicle.assigned_driver_name ? "var(--ads-ink)" : "var(--ads-ink-tertiary)" }}>
                        {vehicle.assigned_driver_name || "Unassigned"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Key Dates Card */}
              <div
                style={{
                  backgroundColor: "var(--ads-canvas)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "var(--ads-s5)",
                  boxShadow: "var(--ads-shadow-xs)",
                }}
              >
                <h4 style={{ margin: "0 0 var(--ads-s4)", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                  Compliance &amp; Key Dates
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--ads-s3) var(--ads-s4)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Date Received</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.recieved || vehicle.date_received || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Date Insured</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.insured || vehicle.date_insured || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Insurance Expiration</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.insurance_expires || vehicle.insurance_expiry || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Inspection Renewal</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.insp_renewal_date || vehicle.inspection_renewal || "N/A"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Passes & Equipment */}
              <div
                style={{
                  backgroundColor: "var(--ads-canvas)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "var(--ads-s5)",
                  boxShadow: "var(--ads-shadow-xs)",
                }}
              >
                <h4 style={{ margin: "0 0 var(--ads-s4)", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                  Cards &amp; Toll Equipment
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--ads-s3) var(--ads-s4)",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>Gas Card ID</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.gas_card_id || vehicle.gas_card || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ads-ink-tertiary)", display: "block" }}>EZ Pass Transponder</span>
                    <strong style={{ color: "var(--ads-ink)" }}>
                      {vehicle.ez_pass || vehicle.ezpass_number || "N/A"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === "notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s4)" }}>
              {/* Add Note Form */}
              <form
                onSubmit={handleAddNote}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--ads-s2)",
                  padding: "var(--ads-s4)",
                  backgroundColor: "var(--ads-canvas)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-sm)",
                }}
              >
                <textarea
                  rows={2}
                  placeholder="Type a new operational note for this vehicle..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
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
                      gap: "var(--ads-s2)",
                      padding: "9px 18px",
                      borderRadius: "var(--ads-r-pill)",
                      backgroundColor: "var(--ads-blue)",
                      border: "1px solid transparent",
                      color: "#FFFFFF",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      cursor: !newNoteText.trim() || isAddingNote ? "not-allowed" : "pointer",
                      opacity: !newNoteText.trim() || isAddingNote ? 0.4 : 1,
                      transition: "all var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    <Plus size={14} color="#FFFFFF" />
                    <span style={{ color: "#FFFFFF" }}>{isAddingNote ? "Adding..." : "Add Note"}</span>
                  </button>
                </div>
              </form>

              {notesLoading ? (
                <div style={{ padding: "var(--ads-s8)", textAlign: "center" }}>
                  <LoadingSpinner size="md" color="var(--ads-blue)" />
                </div>
              ) : notes.length === 0 ? (
                <div style={{ padding: "var(--ads-s10) var(--ads-s4)", textAlign: "center", color: "var(--ads-ink-tertiary)", fontSize: "0.875rem" }}>
                  No vehicle notes recorded yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s3)" }}>
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: "var(--ads-s3) var(--ads-s4)",
                        backgroundColor: "var(--ads-material-thick)",
                        border: "1px solid var(--ads-hairline)",
                        borderRadius: "var(--ads-r-md)",
                        boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        {note.title && (
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)", display: "block" }}>
                            {note.title}
                          </span>
                        )}
                        <p style={{ margin: "var(--ads-s1) 0", fontSize: "0.875rem", color: "var(--ads-ink-secondary)" }}>
                          {note.note}
                        </p>
                        <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                          {note.created_at ? new Date(note.created_at).toLocaleString() : ""}
                          {note.user_name || note.created_by ? ` • By ${note.user_name || note.created_by}` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        title="Delete note"
                        aria-label="Delete note"
                        style={{
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          borderRadius: "var(--ads-r-sm)",
                          border: "1px solid var(--ads-hairline)",
                          backgroundColor: "transparent",
                          color: "var(--ads-ink-tertiary)",
                          cursor: "pointer",
                          transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
                <div style={{ padding: "var(--ads-s8)", textAlign: "center" }}>
                  <LoadingSpinner size="md" color="var(--ads-blue)" />
                </div>
              ) : defects.length === 0 ? (
                <div style={{ padding: "var(--ads-s10) var(--ads-s4)", textAlign: "center", color: "var(--ads-ink-tertiary)", fontSize: "0.875rem" }}>
                  <CheckCircle2 size={32} color="var(--ads-green)" style={{ margin: "0 auto var(--ads-s2)" }} />
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--ads-green)" }}>Clean Inspection Record</p>
                  <span>No open defects or inspection flags reported for this vehicle.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s3)" }}>
                  {defects.map((def) => (
                    <div
                      key={def.id}
                      style={{
                        padding: "var(--ads-s3) var(--ads-s4)",
                        backgroundColor: "var(--ads-material-thick)",
                        border: "1px solid var(--ads-hairline)",
                        borderRadius: "var(--ads-r-md)",
                        boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                          {def.defect_title || def.defect_type || "Inspection Defect"}
                        </span>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: "var(--ads-r-pill)",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            letterSpacing: "-0.005em",
                            backgroundColor: def.severity === "critical" || def.severity === "high" ? "var(--ads-red-tint)" : "var(--ads-amber-tint)",
                            color: def.severity === "critical" || def.severity === "high" ? "var(--ads-red)" : "var(--ads-amber)",
                            border: "1px solid var(--ads-hairline)",
                          }}
                        >
                          {def.severity?.toUpperCase() || "SEV"}
                        </span>
                      </div>
                      {def.description && (
                        <p style={{ margin: "0.4rem 0", fontSize: "0.8125rem", color: "var(--ads-ink-secondary)" }}>
                          {def.description}
                        </p>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
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
                <div style={{ padding: "var(--ads-s8)", textAlign: "center" }}>
                  <LoadingSpinner size="md" color="var(--ads-blue)" />
                </div>
              ) : docs.length === 0 ? (
                <div style={{ padding: "var(--ads-s10) var(--ads-s4)", textAlign: "center", color: "var(--ads-ink-tertiary)", fontSize: "0.875rem" }}>
                  <FileText size={32} color="var(--ads-ink-quaternary)" style={{ margin: "0 auto var(--ads-s2)" }} />
                  <p style={{ margin: 0 }}>No documents uploaded for this vehicle.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s3)" }}>
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: "var(--ads-s3) var(--ads-s4)",
                        backgroundColor: "var(--ads-material-thick)",
                        border: "1px solid var(--ads-hairline)",
                        borderRadius: "var(--ads-r-md)",
                        boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                        <FileText size={18} color="var(--ads-blue)" />
                        <div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                            {doc.doc_name}
                          </span>
                          {doc.created_at && (
                            <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", display: "block" }}>
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
                            gap: "var(--ads-s1)",
                            color: "var(--ads-blue)",
                            fontSize: "0.8125rem",
                            textDecoration: "none",
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            transition: "opacity var(--ads-dur-fast) var(--ads-ease)",
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
