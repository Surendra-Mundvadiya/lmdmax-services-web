import React, { FC, useState } from "react";
import { X, Send, Clock, AlertCircle } from "lucide-react";
import { SchedulerShiftItem } from "../../../api/schedulerApi";

interface PublishScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftShifts: SchedulerShiftItem[];
  dateRangeLabel: string;
  onConfirmPublish: (shiftIds: number[]) => Promise<void>;
}

export const PublishScheduleModal: FC<PublishScheduleModalProps> = ({
  isOpen,
  onClose,
  draftShifts,
  dateRangeLabel,
  onConfirmPublish,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const uniqueDriverCount = new Set(
    draftShifts.map((s) => s.assign_to).filter((id) => id != null)
  ).size;

  const handlePublish = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const ids = draftShifts.map((s) => s.id);
      await onConfirmPublish(ids);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sch-modal-backdrop">
      <div className="sch-modal-dialog" style={{ maxWidth: "560px" }}>
        {/* Header */}
        <div className="sch-modal-header" style={{ backgroundColor: "#FFFBEB" }}>
          <div className="sch-modal-title-group">
            <div className="sch-modal-icon-badge" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
              <Send size={16} />
            </div>
            <div>
              <h2 className="sch-modal-title">Publish Shift Schedule</h2>
              <p className="sch-modal-subtitle">
                Review and release unpublished draft shifts to drivers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sch-modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="sch-modal-body">
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
            <div style={{ padding: "0.75rem", borderRadius: "12px", backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", textAlign: "center" }}>
              <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#B45309", textTransform: "capitalize", display: "block" }}>
                Draft shifts
              </span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#78350F", marginTop: "0.2rem", display: "block" }}>
                {draftShifts.length}
              </span>
            </div>

            <div style={{ padding: "0.75rem", borderRadius: "12px", backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", textAlign: "center" }}>
              <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#1D4ED8", textTransform: "capitalize", display: "block" }}>
                Drivers
              </span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1E3A8A", marginTop: "0.2rem", display: "block" }}>
                {uniqueDriverCount}
              </span>
            </div>

            <div style={{ padding: "0.75rem", borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", textAlign: "center" }}>
              <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#64748B", textTransform: "capitalize", display: "block" }}>
                Date window
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A", marginTop: "0.4rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={dateRangeLabel}>
                {dateRangeLabel}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding: "0.65rem 0.85rem", borderRadius: "8px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626", flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Draft shifts list */}
          <div>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>
              Draft Shifts Ready to Publish ({draftShifts.length})
            </h3>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden", maxHeight: "200px", overflowY: "auto", backgroundColor: "#F8FAFC" }}>
              {draftShifts.map((shift) => (
                <div
                  key={shift.id}
                  style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", backgroundColor: "#FFFFFF" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B", flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {shift.driver_name || "Unassigned"}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "#64748B", fontFamily: "monospace" }}>
                      {shift.schedule_date}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748B", fontSize: "0.6875rem", flexShrink: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                      <Clock size={11} style={{ color: "#94A3B8" }} />
                      {shift.shift_duration_start?.slice(0, 5)} - {shift.shift_duration_end?.slice(0, 5)}
                    </span>
                    {shift.route_code && (
                      <span style={{ padding: "0.1rem 0.35rem", borderRadius: "4px", backgroundColor: "#F1F5F9", color: "#334155", fontWeight: 600, fontSize: "0.625rem" }}>
                        {shift.route_code}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "0.6875rem", color: "#64748B", fontStyle: "italic", margin: 0 }}>
            Published shifts will instantly update to solid blue status and be dispatched to driver rosters.
          </p>
        </div>

        {/* Footer */}
        <div className="sch-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="sch-btn-secondary"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={loading || draftShifts.length === 0}
            className="sch-btn-publish active"
            style={{ height: "36px", padding: "0 1.25rem", fontSize: "0.8125rem", color: "#FFFFFF" }}
          >
            <Send size={14} style={{ color: "#FFFFFF" }} />
            <span>{loading ? "Publishing..." : `Publish ${draftShifts.length} Shifts Now`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
