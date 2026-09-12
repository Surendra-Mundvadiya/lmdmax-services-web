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
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.1rem 1.5rem",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
                border: "1px solid #DBEAFE",
              }}
            >
              <Bookmark size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "#0F172A" }}>
                Schedule Templates
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "#64748B" }}>
                Save reusable schedule blueprints or load existing schedules into this period
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {!isSavingNew && (
              <button
                type="button"
                onClick={() => setIsSavingNew(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus size={15} style={{ color: "#FFFFFF" }} />
                <span>Save Current</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748B",
                cursor: "pointer",
                padding: "0.4rem",
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
              padding: "0.75rem 1.25rem",
              backgroundColor: "#FEF2F2",
              borderBottom: "1px solid #FECACA",
              color: "#B91C1C",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: "0.75rem 1.25rem",
              backgroundColor: "#ECFDF5",
              borderBottom: "1px solid #A7F3D0",
              color: "#047857",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1 }}>
          {isSavingNew ? (
            <form onSubmit={handleSaveCurrentAsTemplate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "#1E293B" }}>
                Save Current Schedule as Template
              </h3>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748B" }}>
                This will capture the currently active {currentShifts.length} shifts ({startDateStr} to {endDateStr}) as a reusable blueprint.
              </p>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.35rem" }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard 7-Day Peak Schedule"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsSavingNew(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "8px",
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {templates.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2.5rem 1rem",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "12px",
                    border: "1px dashed #CBD5E1",
                  }}
                >
                  <Bookmark size={30} style={{ color: "#94A3B8", margin: "0 auto 0.5rem" }} />
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>
                    No schedule templates found
                  </p>
                  <p style={{ margin: "4px 0 1rem", fontSize: "0.75rem", color: "#94A3B8" }}>
                    You can save the current schedule as a template for future weeks.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSavingNew(true)}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "8px",
                      backgroundColor: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Save Current Schedule
                  </button>
                </div>
              ) : (
                templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    style={{
                      padding: "0.85rem 1.15rem",
                      borderRadius: "10px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>
                        {tmpl.name}
                      </span>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "0.2rem" }}>
                        Template #{tmpl.id}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl.id, tmpl.name)}
                      disabled={loading}
                      style={{
                        padding: "0.4rem 0.75rem",
                        borderRadius: "6px",
                        backgroundColor: "#EFF6FF",
                        color: "#2563EB",
                        border: "1px solid #DBEAFE",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
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
