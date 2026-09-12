import React, { FC, useMemo } from "react";
import { Edit3, Trash2, Tag, FileText, Code2, Clock } from "lucide-react";
import { TemplateItem } from "../../api/templatesApi";
import { useAdminStore } from "../../store/adminStore";

interface TemplateCardProps {
  template: TemplateItem;
  onEdit: (template: TemplateItem) => void;
  onDelete: (template: TemplateItem) => void;
  onToggleStatus: (template: TemplateItem) => void;
  isStatusToggling?: boolean;
}

const formatDate = (dateStr?: string | Date): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
};

export const TemplateCard: FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onToggleStatus,
  isStatusToggling = false,
}) => {
  const admins = useAdminStore((state) => state.admins);

  // Parse tags into array
  const tagsList = useMemo(() => {
    if (!template.tags) return [];
    return template.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [template.tags]);

  // Resolve author name
  const authorInfo = useMemo(() => {
    if (template.updated_by) {
      const admin = admins.find((a) => String(a.id) === String(template.updated_by));
      const name = admin ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim() || admin.name || "Admin" : "Admin";
      return `Updated by ${name} at ${formatDate(template.updated_at)}`;
    }
    if (template.created_by) {
      const admin = admins.find((a) => String(a.id) === String(template.created_by));
      const name = admin ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim() || admin.name || "Admin" : "Admin";
      return `Created by ${name} at ${formatDate(template.created_at)}`;
    }
    return `Created at ${formatDate(template.created_at)}`;
  }, [template, admins]);

  const isActive = template.status === "active";

  return (
    <div className={`template-card ${isActive ? "active" : "inactive"}`}>
      {/* Top Header */}
      <div className="template-card-header">
        <div className="template-card-title-wrap">
          <div
            className="template-type-badge-icon"
            title={template.type === "custom_template" ? "Custom HTML Template" : "Standard Template"}
          >
            {template.type === "custom_template" ? (
              <Code2 size={15} className="type-icon custom" />
            ) : (
              <FileText size={15} className="type-icon standard" />
            )}
          </div>
          <h4 className="template-card-title" title={template.title}>
            {template.title}
          </h4>
        </div>

        {/* Action Controls */}
        <div className="template-card-actions">
          {/* Status Toggle Switch */}
          <label
            className="template-toggle-switch"
            title={isActive ? "Deactivate template" : "Activate template"}
          >
            <input
              type="checkbox"
              checked={isActive}
              disabled={isStatusToggling}
              onChange={() => onToggleStatus(template)}
            />
            <span className="template-toggle-slider" />
          </label>

          {/* Edit Button */}
          <button
            type="button"
            className="template-icon-btn edit-btn"
            onClick={() => onEdit(template)}
            aria-label={`Edit template: ${template.title}`}
            title="Edit Template"
          >
            <Edit3 size={15} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            className="template-icon-btn delete-btn"
            onClick={() => onDelete(template)}
            aria-label={`Delete template: ${template.title}`}
            title="Delete Template"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Body / Message Preview */}
      <div className="template-card-body">
        {template.type === "custom_template" ? (
          <div
            className="template-html-preview"
            dangerouslySetInnerHTML={{ __html: template.text }}
          />
        ) : (
          <p className="template-text-preview">{template.text}</p>
        )}
      </div>

      {/* Tags List */}
      {tagsList.length > 0 && (
        <div className="template-tags-row">
          <Tag size={12} className="template-tags-icon" />
          <div className="template-tags-list">
            {tagsList.map((tag, idx) => (
              <span key={`${tag}-${idx}`} className="template-tag-chip">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Attribution */}
      <div className="template-card-footer">
        <Clock size={12} className="template-footer-icon" />
        <span className="template-footer-text">{authorInfo}</span>
      </div>
    </div>
  );
};

export default TemplateCard;
