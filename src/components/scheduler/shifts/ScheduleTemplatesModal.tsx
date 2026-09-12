import React, { FC, useState, useEffect } from "react";
import {
  X,
  Plus,
  Bookmark,
  Calendar,
  Check,
  AlertCircle,
  Clock,
  Download,
  Upload,
} from "lucide-react";
import {
  schedulerApi,
  ScheduleTemplateItem,
  SchedulerShiftItem,
} from "../../../api/schedulerApi";

interface ScheduleTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string | number;
  startDateStr: string;
  endDateStr: string;
  currentShifts: SchedulerShiftItem[];
  onTemplateApplied: () => Promise<void>;
}

export const ScheduleTemplatesModal: FC<ScheduleTemplatesModalProps> = ({
  isOpen,
  onClose,
  companyId,
  startDateStr,
  endDateStr,
  currentShifts,
  onTemplateApplied,
}) => {
  const [templates, setTemplates] = useState<ScheduleTemplateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSavingNew, setIsSavingNew] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await schedulerApi.getScheduleTemplates(companyId);
      setTemplates(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setIsSavingNew(false);
      setTemplateName("");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, companyId]);

  const handleSaveCurrentAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setErrorMessage("Please enter a name for your template.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await schedulerApi.saveScheduleTemplate({
        name: templateName.trim(),
        company_id: companyId,
        temp_data: {
          start_date: startDateStr,
          end_date: endDateStr,
          shifts_count: currentShifts.length,
          schedules: currentShifts.map((s) => ({
            assign_to: s.assign_to,
            schedule_date: s.schedule_date,
            shift_duration_start: s.shift_duration_start,
            shift_duration_end: s.shift_duration_end,
            break_time: s.break_time,
            total_hours: s.total_hours,
            route_code: s.route_code,
            wave: s.wave,
            vehicle_type: s.vehicle_type,
          })),
        },
      });

      setSuccessMessage(`Template "${templateName}" saved successfully.`);
      setTemplateName("");
      setIsSavingNew(false);
      await fetchTemplates();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Failed to save template.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId: number, name: string) => {
    if (!window.confirm(`Load and apply template "${name}" to current date range (${startDateStr} to ${endDateStr})?`)) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await schedulerApi.loadScheduleTemplate({
        template_id: templateId,
        start_date: startDateStr,
        end_date: endDateStr,
        company_id: companyId,
      });

      setSuccessMessage(`Template "${name}" loaded successfully.`);
      await onTemplateApplied();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Failed to load template.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ads-scrim"
      style={{
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ads-s4)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--ads-material-thick)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          backdropFilter: "var(--ads-blur-lg)",
          borderRadius: "var(--ads-r-xl)",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          border: "1px solid var(--ads-hairline)",
          overflow: "hidden",
          animation: "ads-sheet-in var(--ads-dur) var(--ads-ease)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--ads-s4) var(--ads-s5)",
            borderBottom: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "var(--ads-r-sm)",
                background: "var(--ads-blue-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ads-blue)",
                border: "1px solid rgba(0, 113, 227, 0.22)",
                flexShrink: 0,
              }}
            >
              <Bookmark size={18} />
            </div>
            <div>
              <h2 className="ads-h3" style={{ margin: 0 }}>
                Schedule Templates
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
                Save reusable schedule blueprints or load existing schedules into this period
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            {!isSavingNew && (
              <button
                type="button"
                onClick={() => setIsSavingNew(true)}
                className="ads-btn ads-btn--primary ads-btn--sm"
              >
                <Plus size={15} style={{ color: "#FFFFFF" }} />
                <span>Save Current</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close schedule templates dialog"
              title="Close"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderRadius: "var(--ads-r-sm)",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                padding: "var(--ads-s1)",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div
            style={{
              padding: "var(--ads-s3) var(--ads-s5)",
              background: "var(--ads-red-tint)",
              borderBottom: "1px solid rgba(215, 0, 21, 0.28)",
              color: "var(--ads-red)",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: "var(--ads-s3) var(--ads-s5)",
              background: "var(--ads-green-tint)",
              borderBottom: "1px solid rgba(36, 138, 61, 0.28)",
              color: "var(--ads-green)",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s2)",
            }}
          >
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "var(--ads-s5)", overflowY: "auto", flex: 1 }}>
          {isSavingNew ? (
            <form
              onSubmit={handleSaveCurrentAsTemplate}
              style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s4)" }}
            >
              <h3 className="ads-h4" style={{ margin: 0 }}>
                Save Current Schedule as Template
              </h3>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
                This will capture the currently active {currentShifts.length} shifts ({startDateStr} to {endDateStr}) as a reusable blueprint.
              </p>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--ads-ink-secondary)",
                    marginBottom: "var(--ads-s1)",
                  }}
                >
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard 7-Day Peak Schedule"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="ads-input"
                  style={{ fontSize: "0.875rem" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--ads-s2)",
                  marginTop: "var(--ads-s2)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsSavingNew(false)}
                  className="ads-btn ads-btn--secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="ads-btn ads-btn--primary">
                  {loading ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s3)" }}>
              {templates.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--ads-s10) var(--ads-s4)",
                    background: "var(--ads-material-thin)",
                    borderRadius: "var(--ads-r-md)",
                    border: "1px dashed var(--ads-hairline-strong)",
                  }}
                >
                  <Bookmark
                    size={30}
                    style={{ color: "var(--ads-ink-quaternary)", margin: "0 auto var(--ads-s2)" }}
                  />
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                    No schedule templates found
                  </p>
                  <p
                    style={{
                      margin: "4px 0 var(--ads-s4)",
                      fontSize: "0.75rem",
                      color: "var(--ads-ink-tertiary)",
                    }}
                  >
                    You can save the current schedule as a template for future weeks.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSavingNew(true)}
                    className="ads-btn ads-btn--primary ads-btn--sm"
                  >
                    + Save Current Schedule
                  </button>
                </div>
              ) : (
                templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="ads-card"
                    style={{
                      padding: "var(--ads-s3) var(--ads-s4)",
                      borderRadius: "var(--ads-r-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--ads-s4)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                        {tmpl.name}
                      </span>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--ads-ink-tertiary)",
                          marginTop: "2px",
                        }}
                      >
                        Template #{tmpl.id}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl.id, tmpl.name)}
                      disabled={loading}
                      className="ads-btn ads-btn--sm"
                      style={{
                        background: "var(--ads-blue-tint)",
                        color: "var(--ads-blue)",
                        border: "1px solid rgba(0, 113, 227, 0.22)",
                      }}
                    >
                      <Upload size={12} />
                      <span>Load into Dates</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
