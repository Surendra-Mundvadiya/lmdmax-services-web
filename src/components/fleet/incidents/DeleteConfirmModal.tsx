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
      backgroundColor: "rgba(0, 0, 0, 0.32)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--ads-s4)",
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: "var(--ads-material-thick)",
        backdropFilter: "var(--ads-blur-lg)",
        WebkitBackdropFilter: "var(--ads-blur-lg)",
        borderRadius: "var(--ads-r-xl)",
        padding: "var(--ads-s6)",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
        border: "1px solid var(--ads-hairline)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: "flex", gap: "var(--ads-s3)", marginBottom: "var(--ads-s4)" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--ads-r-md)",
            backgroundColor: "var(--ads-red-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={20} color="var(--ads-red)" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
            Delete {type === "accident" ? "Accident" : "Injury"} Report?
          </h3>
          <p style={{ margin: "var(--ads-s1) 0 0", fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", lineHeight: 1.5 }}>
            Are you sure you want to delete report #{id}? This action permanently deletes the report record.
          </p>
        </div>
      </div>

      {otherFormId && (
        <div
          style={{
            padding: "var(--ads-s3) var(--ads-s4)",
            borderRadius: "var(--ads-r-sm)",
            backgroundColor: "var(--ads-amber-tint)",
            border: "1px solid transparent",
            marginBottom: "var(--ads-s5)",
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--ads-s2)",
          }}
        >
          <AlertTriangle size={16} color="var(--ads-amber)" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--ads-amber)", lineHeight: 1.4 }}>
            This report is linked to {type === "accident" ? "Injury" : "Accident"} report #{otherFormId}. You can delete this report only or both linked reports.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--ads-s3)", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onClose}
          className="ads-btn ads-btn--secondary"
          style={{
            padding: "9px 18px",
            borderRadius: "var(--ads-r-pill)",
            border: "1px solid var(--ads-hairline)",
            background: "var(--ads-material-thick)",
            boxShadow: "var(--ads-bevel)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--ads-ink)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        {otherFormId && (
          <button
            type="button"
            onClick={() => onConfirm("both")}
            className="ads-btn ads-btn--danger"
            style={{
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid transparent",
              backgroundColor: "var(--ads-red)",
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: "pointer",
            }}
          >
            Delete Both
          </button>
        )}
        <button
          type="button"
          onClick={() => onConfirm("single")}
          className="ads-btn ads-btn--danger"
          style={{
            padding: "9px 18px",
            borderRadius: "var(--ads-r-pill)",
            border: "1px solid transparent",
            backgroundColor: "var(--ads-red)",
            color: "#FFFFFF",
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
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
