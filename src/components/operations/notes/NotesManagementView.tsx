import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  Lock,
  Globe,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  X,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { notesTasksApi, type NoteItem } from "../../../api/notesTasksApi";
import { AddEditNoteModal } from "./AddEditNoteModal";
import { PreviewNoteModal } from "./PreviewNoteModal";

export const NotesManagementView: FC = () => {
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  // Data state
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "SHARED" | "PRIVATE">("ALL");
  const [sortOrder, setSortOrder] = useState<"new" | "old">("new");

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [previewNote, setPreviewNote] = useState<NoteItem | null>(null);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<NoteItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await notesTasksApi.getNotes({
        sort: sortOrder,
        limit: 100,
      });
      setNotes(res.data || []);
    } catch (err: any) {
      console.error("Error loading notes:", err);
      setError(err?.message || "Failed to load notes from server");
    } finally {
      setIsLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Save (Create or Update)
  const handleSaveNote = async (data: {
    title: string;
    note: string;
    date: string;
    view_all: boolean;
    colour: string;
  }) => {
    if (editingNote) {
      const updated = await notesTasksApi.updateNote({
        _id: editingNote._id,
        ...data,
      });
      setNotes((prev) => prev.map((n) => (n._id === editingNote._id ? updated : n)));
      showToast("Note updated successfully");
    } else {
      const created = await notesTasksApi.createNote(data);
      setNotes((prev) => [created, ...prev]);
      showToast("Note created successfully");
    }
    setEditingNote(null);
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmNote) return;
    try {
      setIsDeleting(true);
      await notesTasksApi.deleteNote(deleteConfirmNote._id);
      setNotes((prev) => prev.filter((n) => n._id !== deleteConfirmNote._id));
      showToast("Note deleted successfully");
      setDeleteConfirmNote(null);
    } catch (err: any) {
      setError(err?.message || "Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = n.title?.toLowerCase().includes(q);
        const matchesNote = n.note?.toLowerCase().includes(q);
        const matchesAuthor = n.created_by?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNote && !matchesAuthor) return false;
      }
      if (visibilityFilter === "SHARED" && n.view_all === false) return false;
      if (visibilityFilter === "PRIVATE" && n.view_all !== false) return false;
      return true;
    });
  }, [notes, searchQuery, visibilityFilter]);

  // Metrics
  const totalNotes = notes.length;
  const sharedCount = useMemo(() => notes.filter((n) => n.view_all !== false).length, [notes]);
  const privateCount = useMemo(() => notes.filter((n) => n.view_all === false).length, [notes]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // If creating or editing a note, render embedded full screen on the background complete screen
  if (isAddEditOpen) {
    return (
      <div className="operations-main-content scrollable">
        <AddEditNoteModal
          isOpen={true}
          embedded={true}
          note={editingNote}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
        />
      </div>
    );
  }

  // If viewing note details, render embedded in the background complete screen
  if (previewNote) {
    const formattedDate = formatDate(previewNote.date);
    const cardBg = previewNote.colour || "#FFFFFF";

    return (
      <div className="notes-main-container">
        <div className="notes-card-container">
          <div className="notes-top-header" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <div className="notes-header-left">
              <button
                type="button"
                onClick={() => setPreviewNote(null)}
                className="tasks-tool-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.85rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: "0.5rem",
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Notes</span>
              </button>
              <div className="notes-title-row">
                <h1 className="notes-title">{previewNote.title}</h1>
                <span className="notes-station-badge">
                  <span className="live-dot" />
                  <span>Station: {activeStationCode}</span>
                </span>
              </div>
            </div>

            <div className="notes-header-right" style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  const target = previewNote;
                  setPreviewNote(null);
                  setEditingNote(target);
                  setIsAddEditOpen(true);
                }}
                className="btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmNote(previewNote);
                  setPreviewNote(null);
                }}
                className="btn-danger"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div
            style={{
              padding: "1.5rem",
              backgroundColor: cardBg,
              flex: 1,
              borderRadius: "0 0 16px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8rem", color: "#64748B", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Calendar size={14} style={{ color: "#2563EB" }} />
                <span>{formattedDate}</span>
              </span>

              {previewNote.view_all === false ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    color: "#6D28D9",
                    backgroundColor: "#F5F3FF",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "9999px",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                >
                  <Lock size={12} />
                  <span>Private to Me</span>
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    color: "#047857",
                    backgroundColor: "#ECFDF5",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "9999px",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                >
                  <Globe size={12} />
                  <span>Team Shared</span>
                </span>
              )}

              {previewNote.created_by && (
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#94A3B8" }}>
                  Created by: <strong style={{ color: "#475569" }}>{previewNote.created_by}</strong>
                </span>
              )}
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
                padding: "1.5rem",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                color: "#0F172A",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                minHeight: "220px",
              }}
            >
              {previewNote.note}
            </div>
          </div>
        </div>

        {/* Add / Edit Note Modal if triggered from edit */}
        <AddEditNoteModal
          isOpen={isAddEditOpen}
          note={editingNote}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
        />
      </div>
    );
  }

  return (
    <div className="notes-main-container">
      <div className="notes-card-container">
        {/* 1. Header */}
        <div className="notes-top-header">
          <div className="notes-header-left">
            <div className="notes-title-row">
              <h1 className="notes-title">Notes & Shift Logs</h1>
              <span className="notes-station-badge">
                <span className="live-dot" />
                <span>Station: {activeStationCode}</span>
              </span>
            </div>
            <p className="notes-subtitle">
              Maintain dispatcher shift handovers, operational briefings, and fleet logs
            </p>
          </div>

          <div className="notes-header-right">
            <button
              type="button"
              onClick={() => {
                setEditingNote(null);
                setIsAddEditOpen(true);
              }}
              className="btn-add-note"
            >
              <Plus size={15} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Add Note</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Toolbar */}
        <div className="notes-filter-toolbar">
          <div className="notes-toolbar-left">
            {/* Visibility Filter */}
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="notes-select-filter"
            >
              <option value="ALL">All Visibility</option>
              <option value="SHARED">Team Shared</option>
              <option value="PRIVATE">Visible Only to Me</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="notes-select-filter"
            >
              <option value="new">Newest First</option>
              <option value="old">Oldest First</option>
            </select>

            {/* Search Input */}
            <div className="notes-search-wrap">
              <Search size={14} className="notes-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="notes-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 6,
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="notes-toolbar-right">
            <button
              type="button"
              onClick={fetchNotes}
              disabled={isLoading}
              className="tasks-tool-btn"
              title="Refresh notes"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 3. KPI Bar */}
        <div className="notes-kpi-bar">
          <div className="notes-kpi-item">
            <div className="notes-kpi-icon blue">
              <FileText size={16} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748B" }}>TOTAL NOTES</span>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0F172A" }}>{totalNotes}</span>
            </div>
          </div>

          <div className="notes-kpi-item">
            <div className="notes-kpi-icon emerald">
              <Globe size={16} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748B" }}>TEAM SHARED</span>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0F172A" }}>{sharedCount}</span>
            </div>
          </div>

          <div className="notes-kpi-item">
            <div className="notes-kpi-icon purple">
              <Lock size={16} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748B" }}>PRIVATE TO ME</span>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0F172A" }}>{privateCount}</span>
            </div>
          </div>

          <div className="notes-kpi-item">
            <div className="notes-kpi-icon slate">
              <Clock size={16} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748B" }}>LATEST ENTRY</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                {notes[0]?.date ? formatDate(notes[0].date) : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successToast && (
          <div
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "#ECFDF5",
              color: "#065F46",
              borderBottom: "1px solid #A7F3D0",
              fontSize: "0.775rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={15} style={{ color: "#059669" }} />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              style={{ background: "none", border: "none", color: "#065F46", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "#FEF2F2",
              color: "#991B1B",
              borderBottom: "1px solid #FECACA",
              fontSize: "0.775rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={15} style={{ color: "#DC2626" }} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 4. Notes Grid Content */}
        <div className="notes-content-scroll">
          {filteredNotes.length > 0 ? (
            <div className="notes-grid">
              {filteredNotes.map((note) => (
                <div key={note._id} className="note-card">
                  {/* Top colored accent line */}
                  <div
                    className="note-card-top-bar"
                    style={{ backgroundColor: note.colour || "#4F8BFF" }}
                  />

                  {/* Header */}
                  <div className="note-card-header">
                    <h3 className="note-card-title">{note.title}</h3>
                    {note.view_all === false ? (
                      <span title="Private Note" style={{ color: "#7C3AED", display: "flex" }}>
                        <Lock size={13} />
                      </span>
                    ) : (
                      <span title="Team Shared Note" style={{ color: "#059669", display: "flex" }}>
                        <Globe size={13} />
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div
                    className="note-card-body"
                    onClick={() => setPreviewNote(note)}
                    style={{ cursor: "pointer" }}
                    title="Click to view full note"
                  >
                    <p className="note-card-text">{note.note}</p>
                  </div>

                  {/* Footer */}
                  <div className="note-card-footer">
                    <span>{formatDate(note.date)}</span>

                    <div className="note-actions-group">
                      <button
                        type="button"
                        onClick={() => setPreviewNote(note)}
                        className="note-action-btn"
                        title="View Full Note"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNote(note);
                          setIsAddEditOpen(true);
                        }}
                        className="note-action-btn"
                        title="Edit Note"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmNote(note)}
                        className="note-action-btn delete"
                        title="Delete Note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "4rem 1rem",
                color: "#94A3B8",
                gap: "0.5rem",
              }}
            >
              <FileText size={36} style={{ color: "#CBD5E1" }} />
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>
                No notes found
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Keep your station organized by logging shift handovers and duties.
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingNote(null);
                  setIsAddEditOpen(true);
                }}
                className="btn-add-note"
                style={{ marginTop: "0.5rem" }}
              >
                <Plus size={14} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Create First Note</span>
              </button>
            </div>
          )}
        </div>
      </div>



      {/* Delete Confirmation Modal */}
      {deleteConfirmNote && (
        <div
          className="tasks-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteConfirmNote(null);
          }}
        >
          <div className="tasks-modal-card" style={{ maxWidth: 440 }}>
            <div className="tasks-modal-header">
              <h2 className="tasks-modal-title" style={{ color: "#EF4444" }}>
                Delete Note
              </h2>
              <button
                type="button"
                onClick={() => setDeleteConfirmNote(null)}
                className="tasks-modal-close-btn"
              >
                <X size={16} />
              </button>
            </div>
            <div className="tasks-modal-body">
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "#334155", lineHeight: 1.5 }}>
                Are you sure you want to permanently delete note "{deleteConfirmNote.title}"?
              </p>
            </div>
            <div className="tasks-modal-footer">
              <button
                type="button"
                onClick={() => setDeleteConfirmNote(null)}
                disabled={isDeleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "7px",
                  padding: "0.45rem 0.95rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesManagementView;
