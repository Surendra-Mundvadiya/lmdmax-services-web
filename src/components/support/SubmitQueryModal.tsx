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
        backgroundColor: "rgba(0, 0, 0, 0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: "1rem",
      }}
      onClick={handleModalClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: submitted ? "440px" : "560px",
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          borderRadius: "var(--ads-r-xl)",
          border: "1px solid var(--ads-hairline)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          overflow: "hidden",
          transition:
            "transform var(--ads-dur) var(--ads-ease), opacity var(--ads-dur) var(--ads-ease), box-shadow var(--ads-dur) var(--ads-ease)",
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
                backgroundColor: "var(--ads-blue-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                color: "var(--ads-blue)",
              }}
            >
              <CheckCircle size={32} />
            </div>

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--ads-ink)",
                letterSpacing: "-0.015em",
                marginBottom: "0.5rem",
              }}
            >
              Query Submitted Successfully
            </h3>

            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--ads-ink-secondary)",
                lineHeight: 1.5,
                marginBottom: "1rem",
              }}
            >
              We have received your query and our support team will get back to you soon.
            </p>

            <div
              style={{
                backgroundColor: "var(--ads-blue-tint)",
                border: "1px solid var(--ads-blue-tint-strong)",
                borderRadius: "var(--ads-r-sm)",
                padding: "0.75rem 1rem",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                color: "var(--ads-blue)",
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
                borderRadius: "var(--ads-r-sm)",
                border: "none",
                backgroundColor: "var(--ads-blue)",
                color: "#FFFFFF",
                fontSize: "0.875rem",
                fontWeight: 650,
                cursor: "pointer",
                boxShadow: "var(--ads-shadow-xs)",
                transition:
                  "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--ads-blue-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "var(--ads-shadow-sm)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--ads-blue)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
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
                borderBottom: "1px solid var(--ads-hairline)",
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
                  letterSpacing: "-0.015em",
                  color: "var(--ads-ink)",
                }}
              >
                How can we help you?
              </h3>
              <button
                type="button"
                onClick={handleModalClose}
                style={{
                  background: "transparent",
                  border: "1px solid transparent",
                  color: "var(--ads-ink-tertiary)",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "var(--ads-r-xs)",
                  display: "flex",
                  transition:
                    "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--ads-canvas)";
                  e.currentTarget.style.borderColor = "var(--ads-hairline)";
                  e.currentTarget.style.color = "var(--ads-ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.color = "var(--ads-ink-tertiary)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                aria-label="Close dialog"
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
                    borderRadius: "var(--ads-r-sm)",
                    backgroundColor: "var(--ads-red-tint)",
                    border: "1px solid var(--ads-red)",
                    color: "var(--ads-red)",
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
                  htmlFor="support-query-title"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    color: "var(--ads-ink-secondary)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Title of your Query <span style={{ color: "var(--ads-red)" }}>*</span>
                </label>
                <input
                  id="support-query-title"
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
                    borderRadius: "var(--ads-r-xs)",
                    border: titleError
                      ? "1px solid var(--ads-red)"
                      : "1px solid var(--ads-hairline-strong)",
                    backgroundColor: "var(--ads-white)",
                    fontSize: "0.875rem",
                    color: "var(--ads-ink)",
                    outline: "none",
                    boxSizing: "border-box",
                    transition:
                      "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--ads-blue)";
                    e.target.style.boxShadow = "var(--ads-shadow-focus)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = titleError
                      ? "var(--ads-red)"
                      : "var(--ads-hairline-strong)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {titleError && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--ads-red)",
                      marginTop: "0.25rem",
                      display: "block",
                    }}
                  >
                    {titleError}
                  </span>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="support-query-description"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    color: "var(--ads-ink-secondary)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Describe your Query / Issue <span style={{ color: "var(--ads-red)" }}>*</span>
                </label>
                <textarea
                  id="support-query-description"
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
                    borderRadius: "var(--ads-r-xs)",
                    border: descError
                      ? "1px solid var(--ads-red)"
                      : "1px solid var(--ads-hairline-strong)",
                    backgroundColor: "var(--ads-white)",
                    fontSize: "0.875rem",
                    color: "var(--ads-ink)",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                    transition:
                      "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--ads-blue)";
                    e.target.style.boxShadow = "var(--ads-shadow-focus)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = descError
                      ? "var(--ads-red)"
                      : "var(--ads-hairline-strong)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {descError && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--ads-red)",
                      marginTop: "0.25rem",
                      display: "block",
                    }}
                  >
                    {descError}
                  </span>
                )}
              </div>

              {/* Screenshot / Attachment Uploader */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 650,
                      color: "var(--ads-ink-secondary)",
                    }}
                  >
                    Attachments (Optional)
                  </span>
                  <label
                    htmlFor="support-query-attachment"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--ads-blue)",
                      cursor: uploadingImage ? "not-allowed" : "pointer",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "var(--ads-r-xs)",
                      border: "1px dashed var(--ads-blue-tint-strong)",
                      backgroundColor: "var(--ads-blue-tint)",
                      transition:
                        "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                    }}
                    onMouseEnter={(e) => {
                      if (!uploadingImage) {
                        e.currentTarget.style.borderColor = "var(--ads-blue)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--ads-blue-tint-strong)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {uploadingImage ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Paperclip size={13} />
                    )}
                    <span>{uploadingImage ? "Uploading..." : "Add Screenshot"}</span>
                    <input
                      id="support-query-attachment"
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
                          borderRadius: "var(--ads-r-xs)",
                          border: "1px solid var(--ads-hairline)",
                          overflow: "hidden",
                          backgroundColor: "var(--ads-canvas)",
                          boxShadow: "var(--ads-shadow-xs)",
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
                            borderRadius: "var(--ads-r-pill)",
                            backgroundColor: "rgba(0, 0, 0, 0.62)",
                            color: "#FFFFFF",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            transition:
                              "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--ads-red)";
                            e.currentTarget.style.transform = "scale(1.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.62)";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                          aria-label={`Remove attachment ${idx + 1}`}
                          title="Remove attachment"
                        >
                          <Trash2 size={10} style={{ color: "#FFFFFF" }} />
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
                borderTop: "1px solid var(--ads-hairline)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                backgroundColor: "var(--ads-canvas)",
              }}
            >
              <button
                type="button"
                onClick={handleModalClose}
                disabled={submitting}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--ads-r-xs)",
                  border: "1px solid var(--ads-hairline-strong)",
                  backgroundColor: "var(--ads-white)",
                  color: "var(--ads-ink-secondary)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  transition:
                    "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = "var(--ads-canvas)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--ads-white)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onMouseDown={(e) => {
                  if (!submitting) e.currentTarget.style.transform = "scale(0.97)";
                }}
                onMouseUp={(e) => {
                  if (!submitting) e.currentTarget.style.transform = "translateY(-1px)";
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
                  borderRadius: "var(--ads-r-xs)",
                  border: "none",
                  backgroundColor: "var(--ads-blue)",
                  color: "#FFFFFF",
                  fontSize: "0.8125rem",
                  fontWeight: 650,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.75 : 1,
                  boxShadow: "var(--ads-shadow-xs)",
                  transition:
                    "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease)",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue-hover)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-sm)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                  }
                }}
                onMouseDown={(e) => {
                  if (!submitting) e.currentTarget.style.transform = "scale(0.97)";
                }}
                onMouseUp={(e) => {
                  if (!submitting) e.currentTarget.style.transform = "translateY(-1px)";
                }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" style={{ color: "#FFFFFF" }} />}
                <span style={{ color: "#FFFFFF" }}>{submitting ? "Sending..." : "Send"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
