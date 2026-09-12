import React, { FC, useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import type { Driver } from "../../../types/driver";
import { useDriverStore } from "../../../store/driverStore";

interface DeleteDriverModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (driverName: string) => void;
}

export const DeleteDriverModal: FC<DeleteDriverModalProps> = ({
  driver,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const deleteDriverAsync = useDriverStore((state) => state.deleteDriverAsync);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !driver) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await deleteDriverAsync(driver.id);
      if (res.success) {
        onSuccess(driver.name);
        onClose();
      } else {
        setError(res.message || "Failed to remove driver");
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
            <h3 className="custom-modal-title text-red-600">Delete Driver</h3>
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
        <div className="custom-modal-body flex flex-col gap-2.5 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-700 leading-relaxed m-0">
            Are you sure you want to remove driver <strong className="text-slate-900 font-semibold">"{driver.name}"</strong>?
          </p>

          <p className="text-xs text-slate-500 leading-normal m-0">
            This action cannot be undone. This driver will be permanently removed from all stations.
          </p>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            display: "flex",
            gap: "0.85rem",
            justifyContent: "flex-end",
            marginTop: "1rem",
            paddingTop: "0.85rem",
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
              fontWeight: 600,
              fontSize: "0.8125rem",
              letterSpacing: "-0.01em",
              lineHeight: 1,
              boxShadow: "0 1px 3px rgba(215, 0, 21, 0.24)",
              cursor: "pointer",
              transition: "background-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} style={{ color: "#FFFFFF" }} className="animate-spin" />
                <span style={{ color: "#FFFFFF" }}>Deleting...</span>
              </>
            ) : (
              <span style={{ color: "#FFFFFF" }}>Delete Driver</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDriverModal;
