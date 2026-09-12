import React, { FC, useState, useEffect } from "react";
import { ArrowLeft, X, Calendar, Lock, Globe, AlertCircle, FileText, Plus, Save } from "lucide-react";
import LoadingSpinner from "../../common/LoadingSpinner";
import type { NoteItem } from "../../../api/notesTasksApi";

interface AddEditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    _id?: string;
    title: string;
    note: string;
    date: string;
    view_all: boolean;
    colour: string;
  }) => Promise<void>;
  note?: NoteItem | null;
  embedded?: boolean;
}

// Pastel note colors matching Performance App (AddNotes.tsx)
const NOTE_PASTEL_COLORS = [
  { name: "Mint", hex: "#E0FBE1" },
  { name: "Cream", hex: "#FFFCF0" },
  { name: "Warm Yellow", hex: "#FBF5E0" },
  { name: "Soft Blue", hex: "#E0E0FB" },
  { name: "Lavender", hex: "#F3E0FB" },
  { name: "Blush Pink", hex: "#FBE0F8" },
  { name: "Soft Peach", hex: "#FBE7E0" },
];

export const AddEditNoteModal: FC<AddEditNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  note: initialNote,
  embedded = false,
}) => {
  const isEditing = Boolean(initialNote && initialNote._id);

  const [title, setTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [viewAll, setViewAll] = useState(true);
  const [colour, setColour] = useState(NOTE_PASTEL_COLORS[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title || "");
      setNoteBody(initialNote.note || "");
      if (initialNote.date) {
        setDate(initialNote.date.includes("T") ? initialNote.date.split("T")[0] : initialNote.date);
      } else {
        setDate(new Date().toISOString().split("T")[0]);
      }
      setViewAll(initialNote.view_all !== false);
      setColour(initialNote.colour || NOTE_PASTEL_COLORS[0].hex);
    } else {
      setTitle("");
      setNoteBody("");
      setDate(new Date().toISOString().split("T")[0]);
      setViewAll(true);
      setColour(NOTE_PASTEL_COLORS[0].hex);
    }
    setError(null);
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a note title");
      return;
    }
    if (!noteBody.trim()) {
      setError("Please enter note content");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        _id: initialNote?._id,
        title: title.trim(),
        note: noteBody.trim(),
        date,
        view_all: viewAll,
        colour,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <>
      {error && (
        <div
          style={{
            padding: "0.6rem 0.85rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "8px",
            color: "#991B1B",
            fontSize: "0.775rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <div className="notes-form-group">
        <label className="notes-form-label">
          Note Title <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Afternoon Wave 2 Handover..."
          className="notes-form-input"
          autoFocus
        />
      </div>

      {/* Date and Visibility Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        <div className="notes-form-group">
          <label className="notes-form-label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="notes-form-input"
          />
        </div>

        <div className="notes-form-group">
          <label className="notes-form-label">Visibility</label>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            <button
              type="button"
              onClick={() => setViewAll(true)}
              style={{
                flex: 1,
                padding: "0.55rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: "7px",
                border: viewAll ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
                backgroundColor: viewAll ? "#EFF6FF" : "#FFFFFF",
                color: viewAll ? "#1D4ED8" : "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                cursor: "pointer",
              }}
            >
              <Globe size={14} />
              <span>Team</span>
            </button>

            <button
              type="button"
              onClick={() => setViewAll(false)}
              style={{
                flex: 1,
                padding: "0.55rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: "7px",
                border: !viewAll ? "1.5px solid #7C3AED" : "1px solid #E2E8F0",
                backgroundColor: !viewAll ? "#FAF5FF" : "#FFFFFF",
                color: !viewAll ? "#6D28D9" : "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                cursor: "pointer",
              }}
            >
              <Lock size={14} />
              <span>Private</span>
            </button>
          </div>
        </div>
      </div>

      {/* Note Body */}
      <div className="notes-form-group">
        <label className="notes-form-label">
          Note Content <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          rows={6}
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          placeholder="Type your notes, briefings, instructions or observations..."
          className="notes-form-textarea"
        />
      </div>

      {/* Color Palette */}
      <div className="notes-form-group">
        <label className="notes-form-label">Card Background Color</label>
        <div className="notes-color-palette" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
          {NOTE_PASTEL_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => setColour(c.hex)}
              className={`notes-color-swatch ${colour === c.hex ? "active" : ""}`}
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                backgroundColor: c.hex,
                border: colour === c.hex ? "2px solid #2563EB" : "1px solid rgba(0,0,0,0.15)",
                cursor: "pointer",
                boxShadow: colour === c.hex ? "0 0 0 2px rgba(37,99,235,0.2)" : "none",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="add-driver-screen-container">
        {/* 1. Header: Back + Title on Left, Cancel & Submit Button on Right (matching Add Driver & Add Admin) */}
        <div className="add-driver-header">
          <div className="add-driver-header-left">
            <button
              type="button"
              className="back-btn"
              onClick={onClose}
              title="Back to Notes"
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              <span>Back to Notes</span>
            </button>
            <div className="screen-title-divider" />
            <h2 className="screen-heading">
              {isEditing ? "Edit Note" : "Add Note"}
            </h2>
          </div>

          <div className="add-driver-header-right">
            <button
              type="button"
              className="btn-outline-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-note-form"
              className="btn-blue-primary"
              disabled={isSubmitting || !title.trim() || !noteBody.trim()}
              style={{ color: "#FFFFFF" }}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span style={{ color: "#FFFFFF" }}>Saving...</span>
                </>
              ) : isEditing ? (
                <>
                  <Save size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Save Note</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Main Form Card */}
        <div className="add-driver-card">
          <form
            id="add-note-form"
            onSubmit={handleSubmit}
            className="add-driver-form"
            noValidate
          >
            {formContent}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="notes-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="notes-modal-card">
        {/* Header */}
        <div className="notes-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={15} />
            </div>
            <div>
              <h2 className="notes-modal-title">
                {isEditing ? "Edit Note" : "Create New Note"}
              </h2>
              <div style={{ fontSize: "0.725rem", color: "#64748B" }}>
                Keep your team in sync with daily shift handovers
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="notes-modal-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="notes-modal-body">
            {error && (
              <div
                style={{
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  color: "#991B1B",
                  fontSize: "0.775rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div className="notes-form-group">
              <label className="notes-form-label">
                Note Title <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Afternoon Wave 2 Handover..."
                className="notes-form-input"
                autoFocus
              />
            </div>

            {/* Date and Visibility Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="notes-form-group">
                <label className="notes-form-label">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="notes-form-input"
                />
              </div>

              <div className="notes-form-group">
                <label className="notes-form-label">Visibility</label>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button
                    type="button"
                    onClick={() => setViewAll(true)}
                    style={{
                      flex: 1,
                      padding: "0.45rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "7px",
                      border: viewAll ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
                      backgroundColor: viewAll ? "#EFF6FF" : "#FFFFFF",
                      color: viewAll ? "#1D4ED8" : "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      cursor: "pointer",
                    }}
                  >
                    <Globe size={13} />
                    <span>Team</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewAll(false)}
                    style={{
                      flex: 1,
                      padding: "0.45rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "7px",
                      border: !viewAll ? "1.5px solid #7C3AED" : "1px solid #E2E8F0",
                      backgroundColor: !viewAll ? "#FAF5FF" : "#FFFFFF",
                      color: !viewAll ? "#6D28D9" : "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      cursor: "pointer",
                    }}
                  >
                    <Lock size={13} />
                    <span>Private</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Note Body */}
            <div className="notes-form-group">
              <label className="notes-form-label">
                Note Content <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <textarea
                rows={5}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Type your notes, briefings, instructions or observations..."
                className="notes-form-textarea"
              />
            </div>

            {/* Color Palette */}
            <div className="notes-form-group">
              <label className="notes-form-label">Card Background Color</label>
              <div className="notes-color-palette">
                {NOTE_PASTEL_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setColour(c.hex)}
                    className={`notes-color-swatch ${colour === c.hex ? "active" : ""}`}
                    style={{ backgroundColor: c.hex, border: "1px solid rgba(0,0,0,0.15)" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="notes-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            {/* Rule 3: Blue button with pure white text */}
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !noteBody.trim()}
              className="btn-add-note"
              style={{ padding: "0.45rem 1.1rem" }}
            >
              <span style={{ color: "#FFFFFF" }}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Note" : "Create Note"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditNoteModal;
