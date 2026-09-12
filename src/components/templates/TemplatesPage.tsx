import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  Layers,
  ChevronRight,
  FileText,
  ArrowLeft,
} from "lucide-react";
import GlassAppLayout from "../layout/GlassAppLayout";
import TemplateCard from "./TemplateCard";
import TemplateAddEditModal from "./TemplateAddEditModal";
import DeleteTemplateModal from "./DeleteTemplateModal";
import {
  templatesApi,
  TemplateItem,
  CreateTemplatePayload,
  UpdateTemplatePayload,
} from "../../api/templatesApi";
import { useAdminStore } from "../../store/adminStore";
import "./templates-apple.css";

export const TemplatesPage: FC = () => {
  const navigate = useNavigate();

  // Main data state
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopyingDefaults, setIsCopyingDefaults] = useState<boolean>(false);
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);

  // Status Filter ("all" | "active" | "inactive")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Search Query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Notification banner state
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Modals state
  const [addEditModalOpen, setAddEditModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateItem | null>(null);

  // Admins store
  const fetchAdmins = useAdminStore((state) => state.fetchAdmins);
  const admins = useAdminStore((state) => state.admins);

  const showNotification = (msg: { text: string; type: "success" | "error" | "info" }) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr?.text === msg.text ? null : curr));
    }, 5500);
  };

  // Fetch templates from performance microservice (or local cache on 503)
  const loadTemplates = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await templatesApi.getTemplates();
      setTemplates(data);
      setServiceNotice(null);
    } catch (err: any) {
      if (err?.status === 503 || err?.isServiceUnavailable || String(err?.message || "").includes("503")) {
        setServiceNotice(
          "Performance template service (prfsrv) is temporarily returning 503 Service Unavailable. Templates operate at the company ownership level. You can use standard templates or create custom templates below."
        );
      } else {
        showNotification({
          text: err.message || "Failed to load templates",
          type: "error",
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    if (admins.length === 0) {
      fetchAdmins();
    }
  }, [loadTemplates, fetchAdmins, admins.length]);

  // Copy default boilerplate templates
  const handleCopyDefaults = async () => {
    setIsCopyingDefaults(true);
    try {
      const copied = await templatesApi.copyDefaultTemplates();
      showNotification({
        text: `Successfully initialized ${copied.length > 0 ? copied.length : "default"} standard templates!`,
        type: "success",
      });
      await loadTemplates(true);
    } catch (err: any) {
      showNotification({
        text: err.message || "Failed to copy default templates",
        type: "error",
      });
    } finally {
      setIsCopyingDefaults(false);
    }
  };

  // Toggle template status
  const handleToggleStatus = async (template: TemplateItem) => {
    const nextStatus = template.status === "active" ? "inactive" : "active";
    setStatusTogglingId(template._id);
    try {
      await templatesApi.updateTemplateStatus(template._id, nextStatus);
      setTemplates((prev) =>
        prev.map((t) => (t._id === template._id ? { ...t, status: nextStatus } : t))
      );
      showNotification({
        text: `Template "${template.title}" is now ${nextStatus}.`,
        type: "success",
      });
    } catch (err: any) {
      showNotification({
        text: err.message || "Failed to update template status",
        type: "error",
      });
    } finally {
      setStatusTogglingId(null);
    }
  };

  // Save add/edit
  const handleSaveTemplate = async (payload: CreateTemplatePayload | UpdateTemplatePayload) => {
    setIsSubmittingForm(true);
    try {
      if (editingTemplate) {
        const updated = await templatesApi.updateTemplate(editingTemplate._id, payload);
        setTemplates((prev) =>
          prev.map((t) => (t._id === editingTemplate._id ? { ...t, ...updated } : t))
        );
        showNotification({
          text: `Template "${payload.title || editingTemplate.title}" updated successfully.`,
          type: "success",
        });
      } else {
        const created = await templatesApi.createTemplate(payload as CreateTemplatePayload);
        setTemplates((prev) => [created, ...prev]);
        showNotification({
          text: `Template "${payload.title}" created successfully.`,
          type: "success",
        });
      }
      setAddEditModalOpen(false);
      setEditingTemplate(null);
    } catch (err: any) {
      showNotification({
        text: err.message || "Failed to save template",
        type: "error",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Delete template callback on successful deletion
  const handleDeleteSuccess = (templateId: string, templateTitle: string) => {
    setTemplates((prev) => prev.filter((t) => (t._id || (t as any).id) !== templateId));
    showNotification({
      text: `Template "${templateTitle}" has been removed.`,
      type: "success",
    });
    setDeleteModalOpen(false);
    setDeletingTemplate(null);
    loadTemplates(true);
  };

  // Filtered Templates matching search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase().trim();
    return templates.filter((template) => {
      const matchesTitle = (template.title || "").toLowerCase().includes(q);
      const matchesText = (template.text || "").toLowerCase().includes(q);
      const matchesTags = (template.tags || "").toLowerCase().includes(q);
      return matchesTitle || matchesText || matchesTags;
    });
  }, [templates, searchQuery]);

  const activeTemplates = useMemo(
    () => filteredTemplates.filter((t) => t.status === "active"),
    [filteredTemplates]
  );

  const inactiveTemplates = useMemo(
    () => filteredTemplates.filter((t) => t.status === "inactive"),
    [filteredTemplates]
  );

  const totalActiveCount = useMemo(
    () => templates.filter((t) => t.status === "active").length,
    [templates]
  );

  const totalInactiveCount = useMemo(
    () => templates.filter((t) => t.status === "inactive").length,
    [templates]
  );

  return (
    <GlassAppLayout
      currentRoute="templates"
      activeBreadcrumb={{ section: "Utilities", page: "Templates" }}
    >
      {addEditModalOpen ? (
        <div className="operations-main-content scrollable">
          <TemplateAddEditModal
            isOpen={true}
            embedded={true}
            isEditMode={Boolean(editingTemplate)}
            templateData={editingTemplate}
            isSubmitting={isSubmittingForm}
            onClose={() => {
              setAddEditModalOpen(false);
              setEditingTemplate(null);
            }}
            onSave={handleSaveTemplate}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            gap: "0.85rem",
          }}
        >
          {/* ── 1. Top Header Options on the Background Screen ── */}
          <div className="upload-filter-toolbar">
            <div className="upload-breadcrumb-wrap">
              <span
                className="upload-breadcrumb-root"
                onClick={() => navigate("/dashboard")}
              >
                Utilities
              </span>
              <ChevronRight size={14} style={{ color: "var(--ads-ink-tertiary)" }} />
              <span className="upload-breadcrumb-current">Templates</span>
              <ChevronRight size={14} style={{ color: "var(--ads-ink-tertiary)" }} />
              <span className="upload-breadcrumb-active-report">
                {statusFilter === "all"
                  ? "All Templates"
                  : statusFilter === "active"
                  ? "Active Templates"
                  : "Inactive Templates"}
              </span>
            </div>

            {/* Right: View by Capsule Pills + Add Template Primary Action */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div className="upload-view-by-wrap">
                <span className="upload-view-by-label">View by</span>
                <div className="upload-segmented-capsule">
                  <button
                    type="button"
                    className={`upload-segmented-btn ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    <span>All</span>
                    <span className="upload-segmented-count">{templates.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`upload-segmented-btn ${statusFilter === "active" ? "active" : ""}`}
                    onClick={() => setStatusFilter("active")}
                  >
                    <span>Active</span>
                    <span className="upload-segmented-count">{totalActiveCount}</span>
                  </button>

                  <button
                    type="button"
                    className={`upload-segmented-btn ${statusFilter === "inactive" ? "active" : ""}`}
                    onClick={() => setStatusFilter("inactive")}
                  >
                    <span>Inactive</span>
                    <span className="upload-segmented-count">{totalInactiveCount}</span>
                  </button>
                </div>
              </div>

              {/* Add Template Primary Action Button */}
              <button
                type="button"
                className="btn-blue-primary btn-sm btn-add-template"
                style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                onClick={() => {
                  setEditingTemplate(null);
                  setAddEditModalOpen(true);
                }}
                title="Add New Template"
              >
                <Plus size={15} />
                <span>Add Template</span>
              </button>

              {templates.length === 0 && (
                <button
                  type="button"
                  className="upload-action-pill-btn"
                  onClick={() => handleCopyDefaults()}
                  disabled={isCopyingDefaults}
                  title="Copy standard boilerplate templates"
                >
                  <Copy size={14} style={{ color: "var(--ads-blue)" }} />
                  <span>{isCopyingDefaults ? "Copying..." : "Copy Defaults"}</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Notification Banner */}
          {notification && (
            <div className="notification-banner-wrapper">
              <div className={`notification-banner ${notification.type}`}>
                {notification.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span className="notification-message">{notification.text}</span>
                <button
                  type="button"
                  className="close-notif-btn"
                  onClick={() => setNotification(null)}
                  aria-label="Dismiss notification"
                  title="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── 3. Clean Floating Workspace Container Card ── */}
          <div className="upload-workspace-container" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {/* In-Card Top Header */}
            <div
              style={{
                padding: "var(--ads-s3) var(--ads-s5)",
                borderBottom: "1px solid var(--ads-hairline)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "var(--ads-s3)",
                background: "var(--ads-material-thin)",
                backdropFilter: "var(--ads-blur-lg)",
                WebkitBackdropFilter: "var(--ads-blur-lg)",
                flexShrink: 0,
              }}
            >
              {/* Left: Squircle Icon + Title + Count Pill */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "var(--ads-r-sm)",
                    background: "var(--ads-blue-tint)",
                    color: "var(--ads-blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid transparent",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={19} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "var(--ads-ink)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Templates
                    </h3>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: "var(--ads-r-pill)",
                        background: "var(--ads-blue-tint)",
                        color: "#0058B0",
                        border: "1px solid transparent",
                      }}
                    >
                      {statusFilter === "active"
                        ? `${activeTemplates.length} active`
                        : statusFilter === "inactive"
                        ? `${inactiveTemplates.length} inactive`
                        : `${filteredTemplates.length} total`}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                    Company standardized communication and operational templates
                  </p>
                </div>
              </div>

              {/* Right: In-Card Search Input */}
              <div className="standard-search-wrap">
                <Search size={15} className="standard-search-icon" />
                <input
                  type="text"
                  className="standard-search-input"
                  aria-label="Search templates"
                  placeholder="Search Templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="standard-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Optional Service Notice */}
            {serviceNotice && (
              <div
                style={{
                  margin: "var(--ads-s3) var(--ads-s5) 0",
                  padding: "var(--ads-s3) var(--ads-s4)",
                  background: "var(--ads-amber-tint)",
                  border: "1px solid rgba(178, 80, 0, 0.22)",
                  borderRadius: "var(--ads-r-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--ads-s3)",
                  fontSize: "0.75rem",
                  lineHeight: 1.45,
                  color: "var(--ads-amber)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                  <AlertCircle size={16} style={{ color: "var(--ads-amber)", flexShrink: 0 }} />
                  <span>{serviceNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => loadTemplates()}
                  style={{
                    flexShrink: 0,
                    padding: "5px 13px",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid rgba(178, 80, 0, 0.28)",
                    background: "var(--ads-white)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--ads-amber)",
                    cursor: "pointer",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Body Content / Grid Views */}
            <div className="templates-scroll-area" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1.25rem" }}>
              {isLoading ? (
                /* Loading Skeleton Grid */
                <div className="templates-skeleton-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="template-card-skeleton">
                      <div className="skeleton-line skeleton-title" />
                      <div className="skeleton-line skeleton-body-1" />
                      <div className="skeleton-line skeleton-body-2" />
                      <div className="skeleton-line skeleton-tags" />
                      <div className="skeleton-line skeleton-footer" />
                    </div>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                /* Empty State */
                <div className="templates-empty-state">
                  <div className="templates-empty-icon-box">
                    <Layers size={40} className="templates-empty-icon" />
                  </div>
                  <h3 className="templates-empty-title">No Templates Configured</h3>
                  <p className="templates-empty-desc">
                    Your company doesn't have any communication templates set up yet. You can import
                    the standard LMDmax boilerplate templates with one click or create your own custom templates.
                  </p>
                  <div className="templates-empty-actions">
                    <button
                      type="button"
                      className="btn-blue-primary"
                      onClick={() => handleCopyDefaults()}
                      disabled={isCopyingDefaults}
                    >
                      <Copy size={16} />
                      <span>{isCopyingDefaults ? "Copying Defaults..." : "Copy Default Templates"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-cancel"
                      onClick={() => {
                        setEditingTemplate(null);
                        setAddEditModalOpen(true);
                      }}
                    >
                      <Plus size={16} />
                      <span>Create Custom Template</span>
                    </button>
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                /* No search results */
                <div className="templates-no-results">
                  <Search size={32} className="no-results-icon" />
                  <h4>No Matching Templates Found</h4>
                  <p>
                    No templates match your search query <strong>"{searchQuery}"</strong>. Try
                    adjusting your keywords or clearing the filter.
                  </p>
                  <button
                    type="button"
                    className="btn-outline-cancel btn-sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                /* Templates Cards Grid matching statusFilter */
                <div className="templates-sections-container">
                  {/* 1. Active Section (rendered if statusFilter is 'all' or 'active') */}
                  {(statusFilter === "all" || statusFilter === "active") && (
                    <section className="templates-section">
                      <div className="templates-section-header">
                        <div className="section-title-wrap">
                          <span className="section-status-dot active" />
                          <h3 className="templates-section-title">
                            Active ({activeTemplates.length})
                          </h3>
                        </div>
                        <div className="section-divider-line" />
                      </div>

                      {activeTemplates.length > 0 ? (
                        <div className="templates-cards-grid">
                          {activeTemplates.map((template) => (
                            <TemplateCard
                              key={template._id}
                              template={template}
                              onEdit={(tmpl) => {
                                setEditingTemplate(tmpl);
                                setAddEditModalOpen(true);
                              }}
                              onDelete={(tmpl) => {
                                setDeletingTemplate(tmpl);
                                setDeleteModalOpen(true);
                              }}
                              onToggleStatus={handleToggleStatus}
                              isStatusToggling={statusTogglingId === template._id}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="section-empty-hint">
                          No active templates found matching your search.
                        </div>
                      )}
                    </section>
                  )}

                  {/* 2. Inactive Section (rendered if statusFilter is 'all' or 'inactive') */}
                  {(statusFilter === "all" || statusFilter === "inactive") && inactiveTemplates.length > 0 && (
                    <section className="templates-section">
                      <div className="templates-section-header">
                        <div className="section-title-wrap">
                          <span className="section-status-dot inactive" />
                          <h3 className="templates-section-title">
                            Inactive ({inactiveTemplates.length})
                          </h3>
                        </div>
                        <div className="section-divider-line" />
                      </div>

                      <div className="templates-cards-grid">
                        {inactiveTemplates.map((template) => (
                          <TemplateCard
                            key={template._id}
                            template={template}
                            onEdit={(tmpl) => {
                              setEditingTemplate(tmpl);
                              setAddEditModalOpen(true);
                            }}
                            onDelete={(tmpl) => {
                              setDeletingTemplate(tmpl);
                              setDeleteModalOpen(true);
                            }}
                            onToggleStatus={handleToggleStatus}
                            isStatusToggling={statusTogglingId === template._id}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteTemplateModal
        isOpen={deleteModalOpen}
        template={deletingTemplate}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingTemplate(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </GlassAppLayout>
  );
};

export default TemplatesPage;
