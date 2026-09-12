import React, { FC } from "react";
import { X, Calendar, Lock, Globe, Edit2, Trash2, User } from "lucide-react";
import type { NoteItem } from "../../../api/notesTasksApi";

interface PreviewNoteModalProps {
  note: NoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (note: NoteItem) => void;
  onDelete?: (note: NoteItem) => void;
}

export const PreviewNoteModal: FC<PreviewNoteModalProps> = ({
  note,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !note) return null;

  const formattedDate = (() => {
    try {
      const dStr = note.date ? (note.date.includes("T") ? note.date.split("T")[0] : note.date) : "";
      if (!dStr) return "N/A";
      const [y, m, d] = dStr.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return note.date || "N/A";
    }
  })();

  const cardBg = note.colour || "#FFFFFF";

  return (
    <div
      className="notes-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="notes-modal-card" style={{ maxWidth: 580, backgroundColor: cardBg }}>
        {/* Header */}
        <div
          className="notes-modal-header"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          <div>
            <h2 className="notes-modal-title" style={{ fontSize: "1.15rem", marginBottom: "0.25rem" }}>
              {note.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.725rem", color: "#64748B" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <Calendar size={13} style={{ color: "#2563EB" }} />
                <span>{formattedDate}</span>
              </span>

              {note.view_all === false ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    color: "#6D28D9",
                    fontWeight: 600,
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
                    fontWeight: 600,
                  }}
                >
                  <Globe size={12} />
                  <span>Team Shared</span>
                </span>
              )}
            </div>
          </div>

          <button type="button" onClick={onClose} className="notes-modal-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Body Text */}
        <div
          className="notes-modal-body"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            padding: "1.25rem 1.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              color: "#1E293B",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {note.note}
          </div>
        </div>

        {/* Footer */}
        <div
          className="notes-modal-footer"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.725rem", color: "#64748B" }}>
            {note.created_by && <span>Created by: {note.created_by}</span>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              className="btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>

            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewNoteModal;
