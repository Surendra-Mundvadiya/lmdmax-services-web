import React, { FC, useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  X,
  FileText,
  Code2,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  RotateCcw,
  Check,
  Info,
  Plus,
  Save,
} from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";
import { TemplateItem, CreateTemplatePayload, UpdateTemplatePayload } from "../../api/templatesApi";

interface TemplateAddEditModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  templateData: TemplateItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (data: CreateTemplatePayload | UpdateTemplatePayload) => Promise<void>;
  embedded?: boolean;
}

export const TemplateAddEditModal: FC<TemplateAddEditModalProps> = ({
  isOpen,
  isEditMode,
  templateData,
  isSubmitting,
  onClose,
  onSave,
  embedded = false,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"template" | "custom_template">("template");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<{ title?: string; text?: string; tags?: string }>({});

  const richEditorRef = useRef<HTMLDivElement>(null);

  // Initialize or reset form when modal opens or templateData changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && templateData) {
        setTitle(templateData.title || "");
        setType(templateData.type || "template");
        setText(templateData.text || "");
        setTags(templateData.tags || "");
        setErrors({});
      } else {
        setTitle("");
        setType("template");
        setText("");
        setTags("");
        setErrors({});
      }
    }
  }, [isOpen, isEditMode, templateData]);

  // Synchronize rich editor content when type is custom_template
  useEffect(() => {
    if (isOpen && type === "custom_template" && richEditorRef.current) {
      if (richEditorRef.current.innerHTML !== text) {
        richEditorRef.current.innerHTML = text;
      }
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  // Validation
  const validate = (): boolean => {
    const newErrors: { title?: string; text?: string; tags?: string } = {};

    if (!title.trim()) {
      newErrors.title = "Template Title is required.";
    }

    const cleanText =
      type === "custom_template"
        ? (text || "").replace(/<[^>]*>/g, "").trim()
        : text.trim();

    if (!cleanText) {
      newErrors.text = "Template message text is required.";
    }

    if (!tags.trim()) {
      newErrors.tags = "At least one tag is required (e.g. general, eoc, safety).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    await onSave({
      title: title.trim(),
      text,
      tags: tags.trim(),
      type,
    });
  };

  const handleTypeChange = (newType: "template" | "custom_template") => {
    if (isEditMode) return; // Locked on Edit
    if (newType === type) return;

    if (text.trim()) {
      const confirmSwitch = window.confirm(
        "Switching editor mode may alter or clear your formatted message. Do you want to proceed?"
      );
      if (!confirmSwitch) return;
    }
    setType(newType);
    setText("");
    if (richEditorRef.current) {
      richEditorRef.current.innerHTML = "";
    }
  };

  // Rich editor command helper
  const execFormat = (cmd: string, val: string = "") => {
    document.execCommand(cmd, false, val);
    if (richEditorRef.current) {
      setText(richEditorRef.current.innerHTML);
    }
  };

  const formElements = (
    <>
      {/* 1. Template Title */}
      <div className="template-form-field">
        <label className="template-form-label" htmlFor="template-title-input">
          Template Title <span className="required-star">*</span>
        </label>
        <input
          id="template-title-input"
          type="text"
          className={`template-form-input ${errors.title ? "error" : ""}`}
          placeholder="Template Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          disabled={isSubmitting}
          maxLength={120}
        />
        {errors.title && <span className="template-field-error">{errors.title}</span>}
      </div>

      {/* 2. Editor Mode Switch (Clean inline toggle matching performance app) */}
      <div className="template-editor-mode-row">
        <span className={`editor-mode-label ${type === "template" ? "active" : ""}`}>
          Default Editor
        </span>
        <label
          className="template-toggle-switch"
          title={isEditMode ? "Editor mode is locked for existing templates" : ""}
        >
          <input
            type="checkbox"
            checked={type === "custom_template"}
            disabled={isEditMode || isSubmitting}
            onChange={(e) => handleTypeChange(e.target.checked ? "custom_template" : "template")}
          />
          <span className="template-toggle-slider" />
        </label>
        <span className={`editor-mode-label ${type === "custom_template" ? "active" : ""}`}>
          Custom Editor
        </span>
        {!isEditMode && (
          <span className="editor-mode-note">
            (Switching may reset message content)
          </span>
        )}
      </div>

      {/* 3. Message Body */}
      <div className="template-form-field" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "260px" }}>
        <label className="template-form-label" htmlFor="template-message-body">
          Add Message <span className="required-star">*</span>
        </label>

        {type === "custom_template" ? (
          <div className={`template-rich-editor-wrapper ${errors.text ? "error" : ""}`} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "220px" }}>
            {/* Rich formatting toolbar */}
            <div className="template-rich-toolbar">
              <button
                type="button"
                className="toolbar-action-btn"
                onClick={() => execFormat("bold")}
                title="Bold (Ctrl+B)"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                className="toolbar-action-btn"
                onClick={() => execFormat("italic")}
                title="Italic (Ctrl+I)"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                className="toolbar-action-btn"
                onClick={() => execFormat("underline")}
                title="Underline (Ctrl+U)"
              >
                <Underline size={14} />
              </button>
              <div className="toolbar-divider" />
              <button
                type="button"
                className="toolbar-action-btn"
                onClick={() => execFormat("insertUnorderedList")}
                title="Bullet List"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                className="toolbar-action-btn"
                onClick={() => execFormat("insertOrderedList")}
                title="Numbered List"
              >
                <ListOrdered size={14} />
              </button>
              <div className="toolbar-divider" />
              <button
                type="button"
                className="toolbar-action-btn"
                onClick={() => execFormat("removeFormat")}
                title="Clear Formatting"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Contenteditable area */}
            <div
              id="template-message-body"
              ref={richEditorRef}
              className="template-rich-content"
              contentEditable
              style={{ flex: 1, minHeight: "180px" }}
              onInput={(e) => {
                const html = e.currentTarget.innerHTML;
                setText(html);
                if (errors.text) setErrors((prev) => ({ ...prev, text: undefined }));
              }}
              data-placeholder="Compose your rich formatted template message here..."
            />
          </div>
        ) : (
          <textarea
            id="template-message-body"
            className={`template-form-textarea ${errors.text ? "error" : ""}`}
            rows={10}
            style={{ flex: 1, minHeight: "220px", resize: "vertical" }}
            placeholder="Add Message"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (errors.text) setErrors((prev) => ({ ...prev, text: undefined }));
            }}
            disabled={isSubmitting}
          />
        )}
        {errors.text && <span className="template-field-error">{errors.text}</span>}
      </div>

      {/* 4. Tags Input */}
      <div className="template-form-field">
        <label className="template-form-label" htmlFor="template-tags-input">
          Add Tags <span className="required-star">*</span>
        </label>
        <input
          id="template-tags-input"
          type="text"
          className={`template-form-input ${errors.tags ? "error" : ""}`}
          placeholder="Add Tags (e.g. scorecard, seatbelt, weekly)"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            if (errors.tags) setErrors((prev) => ({ ...prev, tags: undefined }));
          }}
          disabled={isSubmitting}
        />
        {errors.tags && <span className="template-field-error">{errors.tags}</span>}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="add-driver-screen-container">
        {/* 1. Header: Back + Title on Left, Cancel & Submit Button on Right (matching Add Driver & Add Admin) */}
        <div className="add-driver-header">
          <div className="add-driver-header-left">
            <button
              type="button"
              className="back-btn"
              onClick={onClose}
              title="Back to Templates"
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              <span>Back to Templates</span>
            </button>
            <div className="screen-title-divider" />
            <h2 className="screen-heading">
              {isEditMode ? "Edit Template" : "Add Template"}
            </h2>
          </div>

          <div className="add-driver-header-right">
            <button
              type="button"
              className="btn-outline-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="template-form"
              className="btn-blue-primary"
              disabled={isSubmitting}
              style={{ color: "#FFFFFF" }}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span style={{ color: "#FFFFFF" }}>Saving...</span>
                </>
              ) : isEditMode ? (
                <>
                  <Save size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Save Template</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Main Form Card */}
        <div className="add-driver-card">
          <form
            id="template-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {formElements}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div
        className="template-modal-card form-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="template-modal-header">
          <h3 className="template-modal-heading">
            {isEditMode ? "Edit Template" : "Add Template"}
          </h3>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            title="Close"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="template-modal-form">
          {formElements}

          {/* Modal Footer Actions */}
          <div className="template-modal-footer">
            <button
              type="button"
              className="btn-outline-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-blue-primary btn-save-template"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-spinner-text">Saving...</span>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateAddEditModal;
