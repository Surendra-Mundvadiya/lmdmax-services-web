import React, { FC, useState } from "react";
import { X, Wand2, Sparkles, AlertCircle, Check } from "lucide-react";

interface AutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onRunAutoAssign: (payload: {
    route_count: Record<string, number>;
    schedule_start_date: string;
    schedule_end_date: string;
  }) => Promise<void>;
}

export const AutoAssignModal: FC<AutoAssignModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onRunAutoAssign,
}) => {
  const [routeCounts, setRouteCounts] = useState<Record<string, number>>({
    sunday: 12,
    monday: 15,
    tuesday: 15,
    wednesday: 15,
    thursday: 15,
    friday: 16,
    saturday: 14,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCountChange = (day: string, val: number) => {
    setRouteCounts((prev) => ({
      ...prev,
      [day]: Math.max(0, val),
    }));
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await onRunAutoAssign({
        route_count: routeCounts,
        schedule_start_date: startDate,
        schedule_end_date: endDate,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute auto-assign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { key: "sunday", label: "Sunday" },
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
  ];

  const totalRoutes = Object.values(routeCounts).reduce((a, b) => a + b, 0);

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
                background: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                borderRadius: "var(--ads-r-sm)",
              }}
            >
              <Wand2 size={16} />
            </div>
            <div>
              <h2 className="sch-modal-title" style={{ color: "var(--ads-ink)" }}>
                Auto-Assign / Fill Roster
              </h2>
              <p className="sch-modal-subtitle" style={{ color: "var(--ads-ink-tertiary)" }}>
                Match driver availability, ratings & target hours automatically
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sch-modal-close-btn"
            style={{ color: "var(--ads-ink-tertiary)", borderRadius: "var(--ads-r-sm)" }}
            aria-label="Close auto-assign dialog"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleRun}
          className="sch-modal-body"
          style={{ padding: "var(--ads-s5)", gap: "var(--ads-s4)" }}
        >
          <div
            style={{
              padding: "var(--ads-s3)",
              borderRadius: "var(--ads-r-md)",
              background: "var(--ads-blue-tint)",
              border: "1px solid rgba(0, 113, 227, 0.22)",
              fontSize: "0.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--ads-s3)",
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: "var(--ads-ink)", display: "block" }}>
                Scheduling Window
              </span>
              <span style={{ color: "var(--ads-ink-secondary)" }}>
                {startDate} to {endDate}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontWeight: 600, color: "var(--ads-ink)", display: "block" }}>
                Total Target
              </span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ads-blue)" }}>
                {totalRoutes} Routes
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

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--ads-ink-secondary)",
                marginBottom: "var(--ads-s2)",
              }}
            >
              Daily Route Targets
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "var(--ads-s2)" }}>
              {days.map((d) => (
                <div
                  key={d.key}
                  style={{
                    padding: "var(--ads-s2)",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thin)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--ads-ink-secondary)",
                      marginBottom: "var(--ads-s1)",
                    }}
                  >
                    {d.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={routeCounts[d.key] || 0}
                    onChange={(e) => handleCountChange(d.key, parseInt(e.target.value, 10) || 0)}
                    className="sch-form-input ads-input"
                    aria-label={`${d.label} route target`}
                    style={{
                      height: "32px",
                      textAlign: "center",
                      fontWeight: 600,
                      padding: 0,
                      borderRadius: "var(--ads-r-sm)",
                      borderColor: "var(--ads-hairline)",
                      color: "var(--ads-ink)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--ads-ink-tertiary)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--ads-s1)",
            }}
          >
            <p style={{ display: "flex", alignItems: "center", gap: "var(--ads-s1)", margin: 0 }}>
              <Check size={12} style={{ color: "var(--ads-green)" }} />
              Honors approved driver leaves and PTO unavailabilities.
            </p>
            <p style={{ display: "flex", alignItems: "center", gap: "var(--ads-s1)", margin: 0 }}>
              <Check size={12} style={{ color: "var(--ads-green)" }} />
              Prioritizes top scorecard performers and avoids 6th day overtime.
            </p>
          </div>

          {/* Footer */}
          <div
            className="sch-modal-footer"
            style={{
              background: "transparent",
              borderTop: "1px solid var(--ads-hairline)",
              padding: "var(--ads-s4) 0 0",
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
              type="submit"
              disabled={loading}
              className="sch-btn-primary ads-btn ads-btn--primary"
            >
              <Sparkles size={14} style={{ color: "#FFFFFF" }} />
              <span>{loading ? "Running Auto-Schedule..." : "Run Auto-Assign"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
