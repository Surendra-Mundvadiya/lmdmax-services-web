import React, { FC, useState } from "react";
import { AlertTriangle, X, Trash2, Loader2 } from "lucide-react";
import { TemplateItem, templatesApi } from "../../api/templatesApi";

interface DeleteTemplateModalProps {
  isOpen: boolean;
  template: TemplateItem | null;
  onClose: () => void;
  onSuccess: (templateId: string, title: string) => void;
}

export const DeleteTemplateModal: FC<DeleteTemplateModalProps> = ({
  isOpen,
  template,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !template) return null;

  const templateId = template._id || (template as any).id;

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await templatesApi.deleteTemplate(templateId);
      if (res.success) {
        onSuccess(templateId, template.title);
        onClose();
      } else {
        setError(res.message || "Failed to delete template");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while deleting template");
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
        {/* Header: Title only, no subtitle */}
        <div className="custom-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <h3 className="custom-modal-title text-red-600">Delete Template</h3>
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

        {/* Body: Clean message only, no tags, no template type info */}
        <div className="custom-modal-body flex flex-col gap-2.5 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-700 leading-relaxed m-0">
            Are you sure you want to remove template{" "}
            <strong className="text-slate-900 font-semibold">"{template.title}"</strong>?
          </p>

          <p className="text-xs text-slate-500 leading-normal m-0">
            This action cannot be undone. This template will be permanently removed from your company's library.
          </p>
        </div>

        {/* Footer */}
        <div className="custom-modal-footer">
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
                <Loader2 size={16} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTemplateModal;
