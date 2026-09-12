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
    <div className="sch-modal-backdrop">
      <div className="sch-modal-dialog">
        {/* Header */}
        <div className="sch-modal-header">
          <div className="sch-modal-title-group">
            <div className="sch-modal-icon-badge">
              <Wand2 size={16} />
            </div>
            <div>
              <h2 className="sch-modal-title">Auto-Assign / Fill Roster</h2>
              <p className="sch-modal-subtitle">
                Match driver availability, ratings & target hours automatically
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

        {/* Content Form */}
        <form onSubmit={handleRun} className="sch-modal-body">
          <div style={{ padding: "0.75rem", borderRadius: "12px", backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 700, color: "#1E3A8A", display: "block" }}>Scheduling Window</span>
              <span style={{ color: "#2563EB" }}>{startDate} to {endDate}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontWeight: 700, color: "#1E3A8A", display: "block" }}>Total Target</span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#1D4ED8" }}>{totalRoutes} Routes</span>
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding: "0.65rem", borderRadius: "8px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626", flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>
              Daily Route Targets
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.5rem" }}>
              {days.map((d) => (
                <div key={d.key} style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", textAlign: "center" }}>
                  <span style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                    {d.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={routeCounts[d.key] || 0}
                    onChange={(e) => handleCountChange(d.key, parseInt(e.target.value, 10) || 0)}
                    className="sch-form-input"
                    style={{ height: "32px", textAlign: "center", fontWeight: 700, padding: 0 }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "0.6875rem", color: "#64748B", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <p style={{ display: "flex", alignItems: "center", gap: "0.3rem", margin: 0 }}>
              <Check size={12} style={{ color: "#10B981" }} />
              Honors approved driver leaves and PTO unavailabilities.
            </p>
            <p style={{ display: "flex", alignItems: "center", gap: "0.3rem", margin: 0 }}>
              <Check size={12} style={{ color: "#10B981" }} />
              Prioritizes top scorecard performers and avoids 6th day overtime.
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
              type="submit"
              disabled={loading}
              className="sch-btn-primary"
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
