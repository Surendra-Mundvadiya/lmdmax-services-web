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
          <div className="flex items-center gap-2.5" style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
            <div
              className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--ads-r-sm)",
                background: "var(--ads-red-tint)",
                color: "var(--ads-red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 className="custom-modal-title" style={{ color: "var(--ads-red)" }}>
              Delete Template
            </h3>
          </div>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close delete dialog"
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: Clean message only, no tags, no template type info */}
        <div
          className="custom-modal-body flex flex-col gap-2.5 py-4"
          style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s3)", padding: "var(--ads-s4) 0" }}
        >
          {error && (
            <div
              style={{
                padding: "var(--ads-s3) var(--ads-s4)",
                background: "var(--ads-red-tint)",
                border: "1px solid rgba(215, 0, 21, 0.22)",
                borderRadius: "var(--ads-r-sm)",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--ads-red)",
              }}
            >
              {error}
            </div>
          )}

          <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5, color: "var(--ads-ink-secondary)" }}>
            Are you sure you want to remove template{" "}
            <strong style={{ color: "var(--ads-ink)", fontWeight: 600 }}>"{template.title}"</strong>?
          </p>

          <p style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.45, color: "var(--ads-ink-tertiary)" }}>
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
              gap: "var(--ads-s2)",
              background: "var(--ads-red)",
              color: "#FFFFFF",
              border: "1px solid transparent",
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              fontWeight: 600,
              fontSize: "0.8125rem",
              letterSpacing: "-0.01em",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.4 : 1,
              boxShadow: "0 1px 3px rgba(215, 0, 21, 0.26)",
              transition:
                "background-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Delete Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTemplateModal;
