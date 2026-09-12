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
    <div
      className="sch-modal-backdrop"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.32)",
        WebkitBackdropFilter: "blur(6px)",
        backdropFilter: "blur(6px)",
        padding: "var(--ads-s4)",
      }}
    >
      <div
        className="sch-modal-dialog"
        style={{
          maxWidth: "560px",
          background: "var(--ads-material-thick)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          backdropFilter: "var(--ads-blur-lg)",
          border: "1px solid var(--ads-hairline)",
          borderRadius: "var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
        }}
      >
        {/* Header */}
        <div
          className="sch-modal-header"
          style={{
            background: "transparent",
            borderBottom: "1px solid var(--ads-hairline)",
            padding: "var(--ads-s4) var(--ads-s5)",
          }}
        >
          <div className="sch-modal-title-group">
            <div
              className="sch-modal-icon-badge"
              style={{
                background: "var(--ads-amber-tint)",
                color: "var(--ads-amber)",
                borderRadius: "var(--ads-r-sm)",
              }}
            >
              <Send size={16} />
            </div>
            <div>
              <h2 className="sch-modal-title" style={{ color: "var(--ads-ink)" }}>
                Publish Shift Schedule
              </h2>
              <p className="sch-modal-subtitle" style={{ color: "var(--ads-ink-tertiary)" }}>
                Review and release unpublished draft shifts to drivers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sch-modal-close-btn"
            style={{ color: "var(--ads-ink-tertiary)", borderRadius: "var(--ads-r-sm)" }}
            aria-label="Close publish schedule dialog"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="sch-modal-body" style={{ padding: "var(--ads-s5)", gap: "var(--ads-s4)" }}>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--ads-s2)" }}>
            <div
              style={{
                padding: "var(--ads-s3)",
                borderRadius: "var(--ads-r-md)",
                background: "var(--ads-amber-tint)",
                border: "1px solid rgba(178, 80, 0, 0.24)",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--ads-amber)",
                  textTransform: "capitalize",
                  display: "block",
                }}
              >
                Draft shifts
              </span>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--ads-ink)",
                  marginTop: "var(--ads-s1)",
                  display: "block",
                }}
              >
                {draftShifts.length}
              </span>
            </div>

            <div
              style={{
                padding: "var(--ads-s3)",
                borderRadius: "var(--ads-r-md)",
                background: "var(--ads-blue-tint)",
                border: "1px solid rgba(0, 113, 227, 0.22)",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--ads-blue)",
                  textTransform: "capitalize",
                  display: "block",
                }}
              >
                Drivers
              </span>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--ads-ink)",
                  marginTop: "var(--ads-s1)",
                  display: "block",
                }}
              >
                {uniqueDriverCount}
              </span>
            </div>

            <div
              style={{
                padding: "var(--ads-s3)",
                borderRadius: "var(--ads-r-md)",
                background: "var(--ads-material-thin)",
                border: "1px solid var(--ads-hairline)",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--ads-ink-tertiary)",
                  textTransform: "capitalize",
                  display: "block",
                }}
              >
                Date window
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--ads-ink)",
                  marginTop: "var(--ads-s2)",
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={dateRangeLabel}
              >
                {dateRangeLabel}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "var(--ads-s3)",
                borderRadius: "var(--ads-r-sm)",
                background: "var(--ads-red-tint)",
                border: "1px solid rgba(215, 0, 21, 0.28)",
                color: "var(--ads-red)",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Draft shifts list */}
          <div>
            <h3
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--ads-ink-secondary)",
                marginBottom: "var(--ads-s2)",
              }}
            >
              Draft Shifts Ready to Publish ({draftShifts.length})
            </h3>

            <div
              style={{
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-md)",
                overflow: "hidden",
                maxHeight: "200px",
                overflowY: "auto",
                background: "var(--ads-material-thin)",
              }}
            >
              {draftShifts.map((shift) => (
                <div
                  key={shift.id}
                  style={{
                    padding: "var(--ads-s2) var(--ads-s3)",
                    borderBottom: "1px solid var(--ads-hairline)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    background: "var(--ads-material-thick)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)", overflow: "hidden" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "var(--ads-r-pill)",
                        backgroundColor: "var(--ads-amber)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--ads-ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {shift.driver_name || "Unassigned"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--ads-ink-tertiary)",
                        fontFamily: "monospace",
                      }}
                    >
                      {shift.schedule_date}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--ads-s2)",
                      color: "var(--ads-ink-tertiary)",
                      fontSize: "0.6875rem",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--ads-s1)" }}>
                      <Clock size={11} style={{ color: "var(--ads-ink-quaternary)" }} />
                      {shift.shift_duration_start?.slice(0, 5)} - {shift.shift_duration_end?.slice(0, 5)}
                    </span>
                    {shift.route_code && (
                      <span
                        style={{
                          padding: "2px var(--ads-s1)",
                          borderRadius: "var(--ads-r-xs)",
                          background: "var(--ads-material-thick)",
                          border: "1px solid var(--ads-hairline)",
                          color: "var(--ads-ink-secondary)",
                          fontWeight: 600,
                          fontSize: "0.625rem",
                        }}
                      >
                        {shift.route_code}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", margin: 0 }}>
            Published shifts are dispatched to driver rosters and switch to the published status colour.
          </p>
        </div>

        {/* Footer */}
        <div
          className="sch-modal-footer"
          style={{
            background: "transparent",
            borderTop: "1px solid var(--ads-hairline)",
            padding: "var(--ads-s4) var(--ads-s5)",
            gap: "var(--ads-s2)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="sch-btn-secondary ads-btn ads-btn--secondary"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={loading || draftShifts.length === 0}
            className="sch-btn-primary ads-btn ads-btn--primary"
            style={{ height: "36px", fontSize: "0.8125rem", color: "#FFFFFF" }}
          >
            <Send size={14} style={{ color: "#FFFFFF" }} />
            <span>{loading ? "Publishing..." : `Publish ${draftShifts.length} Shifts Now`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
