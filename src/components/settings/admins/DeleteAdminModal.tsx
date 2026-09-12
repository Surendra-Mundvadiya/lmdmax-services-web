import React, { FC, useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import type { AdminUser } from "../../../types/admin";
import { useAdminStore } from "../../../store/adminStore";

interface DeleteAdminModalProps {
  admin: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminName: string) => void;
}

export const DeleteAdminModal: FC<DeleteAdminModalProps> = ({
  admin,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const deleteAdminApi = useAdminStore((state) => state.deleteAdminApi);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !admin) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await deleteAdminApi(admin.id);
      if (res.success) {
        onSuccess(admin.name);
        onClose();
      } else {
        setError(res.message || "Failed to remove administrator");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="custom-modal-overlay ads-admin-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-dialog delete-dialog ads-admin-modal"
        style={{ maxWidth: "430px", width: "100%", margin: "auto" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="custom-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                flexShrink: 0,
                borderRadius: "var(--ads-r-sm)",
                background: "var(--ads-red-tint)",
                color: "var(--ads-red)",
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 className="custom-modal-title" style={{ color: "var(--ads-red)" }}>
              Delete Administrator
            </h3>
          </div>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          className="custom-modal-body"
          style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s3)" }}
        >
          {error && (
            <div
              style={{
                padding: "var(--ads-s3)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--ads-red)",
                background: "var(--ads-red-tint)",
                borderRadius: "var(--ads-r-sm)",
              }}
            >
              {error}
            </div>
          )}

          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              lineHeight: 1.55,
              color: "var(--ads-ink-secondary)",
            }}
          >
            Are you sure you want to delete administrator{" "}
            <strong style={{ color: "var(--ads-ink)", fontWeight: 600 }}>"{admin.name}"</strong>?
          </p>

          <p style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.5, color: "var(--ads-ink-tertiary)" }}>
            This action cannot be undone. This administrator will immediately lose access to the system.
          </p>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            display: "flex",
            gap: "var(--ads-s3)",
            justifyContent: "flex-end",
            marginTop: "var(--ads-s4)",
            paddingTop: "var(--ads-s4)",
            borderTop: "1px solid var(--ads-hairline)",
          }}
        >
          <button
            type="button"
            className="btn-outline-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger-primary"
            onClick={handleDelete}
            disabled={isSubmitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--ads-s2)",
              backgroundColor: "var(--ads-red)",
              color: "#FFFFFF",
              border: "1px solid transparent",
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: "0.8125rem",
              letterSpacing: "-0.01em",
              cursor: "pointer",
              transition:
                "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Deleting...</span>
              </>
            ) : (
              <span style={{ color: "#FFFFFF" }}>Delete Admin</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAdminModal;
