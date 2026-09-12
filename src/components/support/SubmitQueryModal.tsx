import React, { FC, useState } from "react";
import {
  X,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { SupportApi } from "../../api/supportApi";

interface SubmitQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitQueryModal: FC<SubmitQueryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitError("Only image files are allowed as attachments.");
      return;
    }

    try {
      setUploadingImage(true);
      setSubmitError(null);
      const url = await SupportApi.uploadAttachment(file);
      if (url) {
        setAttachments((prev) => [...prev, url]);
      }
    } catch {
      // Fallback: If direct image upload fails, generate preview or notify user
      setSubmitError("Failed to upload image. Please check your connection.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!title.trim()) {
      setTitleError("Please enter a title for your query");
      hasError = true;
    } else {
      setTitleError("");
    }

    if (!description.trim()) {
      setDescError("Please describe your query or issue");
      hasError = true;
    } else {
      setDescError("");
    }

    if (hasError) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      await SupportApi.createTicket({
        subject: title.trim(),
        description: description.trim(),
        priority: 2,
        attachments,
        from: "fleet",
      });

      setSubmitted(true);
      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit query. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setTitle("");
    setDescription("");
    setTitleError("");
    setDescError("");
    setAttachments([]);
    setSubmitError(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(3px)",
        padding: "1rem",
      }}
      onClick={handleModalClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: submitted ? "440px" : "560px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          transition: "all 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          /* Success Screen */
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                color: "#2563EB",
              }}
            >
              <CheckCircle size={32} />
            </div>

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#0F172A",
                marginBottom: "0.5rem",
              }}
            >
              Query Submitted Successfully
            </h3>

            <p
              style={{
                fontSize: "0.875rem",
                color: "#475569",
                lineHeight: 1.5,
                marginBottom: "1rem",
              }}
            >
              We have received your query and our support team will get back to you soon.
            </p>

            <div
              style={{
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "0.8125rem",
                color: "#1E40AF",
                marginBottom: "1.5rem",
                textAlign: "left",
              }}
            >
              <strong>Notice:</strong> If you are not able to find the response email, please check in your junk/spam email folder.
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontSize: "0.875rem",
                fontWeight: 650,
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1D4ED8")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
            >
              Done
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                How can we help you?
              </h3>
              <button
                type="button"
                onClick={handleModalClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748B",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              {submitError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    fontSize: "0.8125rem",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Title Field */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    color: "#334155",
                    marginBottom: "0.35rem",
                  }}
                >
                  Title of your Query <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Question regarding inspection checklist"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "6px",
                    border: titleError ? "1px solid #EF4444" : "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                  onBlur={(e) => (e.target.style.borderColor = titleError ? "#EF4444" : "#CBD5E1")}
                />
                {titleError && (
                  <span style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "0.25rem", display: "block" }}>
                    {titleError}
                  </span>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    color: "#334155",
                    marginBottom: "0.35rem",
                  }}
                >
                  Describe your Query / Issue <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  placeholder="Provide full details about the issue or question..."
                  rows={5}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (e.target.value.trim()) setDescError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "6px",
                    border: descError ? "1px solid #EF4444" : "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                  onBlur={(e) => (e.target.style.borderColor = descError ? "#EF4444" : "#CBD5E1")}
                />
                {descError && (
                  <span style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "0.25rem", display: "block" }}>
                    {descError}
                  </span>
                )}
              </div>

              {/* Screenshot / Attachment Uploader */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 650, color: "#334155" }}>
                    Attachments (Optional)
                  </span>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#2563EB",
                      cursor: uploadingImage ? "not-allowed" : "pointer",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "6px",
                      border: "1px dashed #93C5FD",
                      backgroundColor: "#EFF6FF",
                    }}
                  >
                    {uploadingImage ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Paperclip size={13} />
                    )}
                    <span>{uploadingImage ? "Uploading..." : "Add Screenshot"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Attachments List */}
                {attachments.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {attachments.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          width: "64px",
                          height: "64px",
                          borderRadius: "6px",
                          border: "1px solid #CBD5E1",
                          overflow: "hidden",
                          backgroundColor: "#F8FAFC",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(15, 23, 42, 0.75)",
                            color: "#FFFFFF",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                          }}
                          title="Remove attachment"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                backgroundColor: "#F8FAFC",
              }}
            >
              <button
                type="button"
                onClick={handleModalClose}
                disabled={submitting}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  color: "#475569",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  fontSize: "0.8125rem",
                  fontWeight: 650,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.backgroundColor = "#1D4ED8";
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.currentTarget.style.backgroundColor = "#2563EB";
                }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>{submitting ? "Sending..." : "Send"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
