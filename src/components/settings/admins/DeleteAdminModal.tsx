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
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-dialog delete-dialog"
        style={{ maxWidth: "430px", width: "100%", margin: "auto" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="custom-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <h3 className="custom-modal-title text-red-600">Delete Administrator</h3>
          </div>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="custom-modal-body flex flex-col gap-2.5 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-700 leading-relaxed m-0">
            Are you sure you want to delete administrator <strong className="text-slate-900 font-semibold">"{admin.name}"</strong>?
          </p>

          <p className="text-xs text-slate-500 leading-normal m-0">
            This action cannot be undone. This administrator will immediately lose access to the system.
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: "flex", gap: "0.85rem", justifyContent: "flex-end", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #E2E8F0" }}>
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
              gap: "0.45rem",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              border: "none",
              padding: "0.5rem 1.25rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin text-white" />
                <span className="text-white">Deleting...</span>
              </>
            ) : (
              <span className="text-white">Delete Admin</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAdminModal;
