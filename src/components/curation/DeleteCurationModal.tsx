import React, { FC, useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { curationApi } from "../../api/curationApi";
import { useCurationStore } from "../../store/curationStore";

export interface DeleteCurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  curationItem: {
    _id: string;
    name: string;
    curation_type?: string;
  } | null;
  onSuccess: (id: string, name: string) => void;
}

export const DeleteCurationModal: FC<DeleteCurationModalProps> = ({
  isOpen,
  onClose,
  curationItem,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const decrementCount = useCurationStore((state) => state.decrementCount);
  const fetchCurationCount = useCurationStore((state) => state.fetchCurationCount);

  if (!isOpen || !curationItem) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await curationApi.deleteCuration(curationItem._id, curationItem.curation_type);
      if (curationItem.curation_type === "netradyne") {
        decrementCount("netradyne");
      } else if (curationItem.curation_type === "ementor") {
        decrementCount("ementor");
      } else {
        decrementCount("transporter_id");
      }
      await fetchCurationCount(true);
      onSuccess(curationItem._id, curationItem.name);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to delete curation item");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-dialog delete-dialog"
        style={{ maxWidth: "430px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-content">
          {/* Warning Icon Badge */}
          <div className="delete-icon-badge">
            <Trash2 size={24} className="text-red-600" />
          </div>

          {/* Title and Confirmation Notice */}
          <h3 className="delete-modal-title">Delete Curation</h3>
          <p className="delete-modal-desc">
            Are you sure you want to dismiss the curation record for{" "}
            <strong className="text-slate-800">&quot;{curationItem.name}&quot;</strong>?
          </p>

          {errorMsg && (
            <div className="delete-modal-error">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="delete-modal-actions">
            <button
              type="button"
              className="btn-outline-secondary"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger-primary"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} className="text-white" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCurationModal;
