import React, { FC } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { TabType } from "./types";

interface DeleteConfirmModalProps {
  type: TabType;
  id: string;
  otherFormId?: string;
  onConfirm: (deleteMode: "single" | "both") => void;
  onClose: () => void;
}

export const DeleteConfirmModal: FC<DeleteConfirmModalProps> = ({
  type,
  id,
  otherFormId,
  onConfirm,
  onClose,
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.55)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
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
        borderRadius: "14px",
        padding: "1.5rem",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
        border: "1px solid #E2E8F0",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: "flex", gap: "0.85rem", marginBottom: "1rem" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            backgroundColor: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={20} color="#DC2626" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0F172A" }}>
            Delete {type === "accident" ? "Accident" : "Injury"} Report?
          </h3>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.8125rem", color: "#64748B", lineHeight: 1.5 }}>
            Are you sure you want to delete report #{id}? This action permanently deletes the report record.
          </p>
        </div>
      </div>

      {otherFormId && (
        <div
          style={{
            padding: "0.75rem 0.9rem",
            borderRadius: "10px",
            backgroundColor: "#FFFBEB",
            border: "1px solid #FDE68A",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
          }}
        >
          <AlertTriangle size={16} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#92400E", lineHeight: 1.4 }}>
            This report is linked to {type === "accident" ? "Injury" : "Accident"} report #{otherFormId}. You can delete this report only or both linked reports.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#475569",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        {otherFormId && (
          <button
            type="button"
            onClick={() => onConfirm("both")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Delete Both
          </button>
        )}
        <button
          type="button"
          onClick={() => onConfirm("single")}
          style={{
            padding: "0.5rem 1.1rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#DC2626",
            color: "#FFFFFF",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmModal;
