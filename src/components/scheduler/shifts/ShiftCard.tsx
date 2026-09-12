import React, { FC, useState } from "react";
import {
  Clock,
  Route,
  ShieldAlert,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { SchedulerShiftItem, getShiftStatusBadge } from "../../../api/schedulerApi";

interface ShiftCardProps {
  shift: SchedulerShiftItem;
  compact?: boolean;
  onEdit?: (shift: SchedulerShiftItem) => void;
  onDelete?: (shiftId: number) => void;
  onMarkExtra?: (shiftId: number, isBackup: boolean) => void;
  onDragStart?: (e: React.DragEvent, shift: SchedulerShiftItem) => void;
}

export const ShiftCard: FC<ShiftCardProps> = ({
  shift,
  compact = false,
  onEdit,
  onDelete,
  onMarkExtra,
  onDragStart,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const isConflict = shift.isConflict;
  const isBackup = Boolean(shift.is_backup || shift.sch_status === "backup");
  const isExtraAttendance = Boolean(shift.call_out_id);
  const statusBadge = getShiftStatusBadge(shift);

  // Format times nicely (e.g. 09:30:00 -> 09:30)
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
  };

  const startTime = formatTime(shift.shift_duration_start);
  const endTime = formatTime(shift.shift_duration_end);

  const cardStatusClass = isConflict
    ? "conflict"
    : isBackup || isExtraAttendance
    ? "backup"
    : !shift.is_published
    ? "draft"
    : "published";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        shiftId: shift.id,
        assign_to: shift.assign_to,
        schedule_date: shift.schedule_date,
      })
    );
    e.dataTransfer.effectAllowed = "move";
    if (onDragStart) onDragStart(e, shift);
  };

  return (
    <div
      className={`sch-shift-card ${cardStatusClass}`}
      onClick={() => onEdit && onEdit(shift)}
      draggable={true}
      onDragStart={handleDragStart}
      style={{
        cursor: "grab",
        position: "relative",
        borderLeft: isBackup
          ? "3px solid #9333EA"
          : isExtraAttendance
          ? "3px solid #7C3AED"
          : undefined,
      }}
      title="Drag shift to reschedule to another driver or date"
    >
      {/* Header: Times & Status Badge */}
      <div className="sch-shift-card-header">
        <div className="sch-shift-time">
          <Clock
            size={12}
            style={{
              color: isConflict
                ? "#DC2626"
                : isBackup
                ? "#9333EA"
                : !shift.is_published
                ? "#D97706"
                : "#2563EB",
            }}
          />
          <span style={{ fontWeight: 600 }}>
            {startTime} – {endTime}
          </span>
        </div>

        {/* Dynamic Status Badges from Live Backend logic */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {isConflict ? (
            <span className="sch-shift-badge conflict">
              <AlertTriangle size={10} />
              Conflict
            </span>
          ) : isBackup ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontSize: "0.625rem",
                fontWeight: 700,
                backgroundColor: "#FAF5FF",
                color: "#9333EA",
                border: "1px solid #E9D5FF",
              }}
              title="Marked as Extra (Backup)"
            >
              <Sparkles size={9} />
              Backup
            </span>
          ) : isExtraAttendance ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontSize: "0.625rem",
                fontWeight: 700,
                backgroundColor: "#F5F3FF",
                color: "#7C3AED",
                border: "1px solid #DDD6FE",
              }}
              title="Marked as Extra (Attendance)"
            >
              <Sparkles size={9} />
              Extra
            </span>
          ) : statusBadge === "confirmed" ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontSize: "0.625rem",
                fontWeight: 600,
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                border: "1px solid #BFDBFE",
              }}
            >
              <CheckCircle2 size={9} />
              Confirmed
            </span>
          ) : statusBadge === "declined" ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontSize: "0.625rem",
                fontWeight: 600,
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
              }}
            >
              <XCircle size={9} />
              Declined
            </span>
          ) : statusBadge === "pending" ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontSize: "0.625rem",
                fontWeight: 600,
                backgroundColor: "#F1F5F9",
                color: "#475569",
                border: "1px solid #E2E8F0",
              }}
            >
              Pending
            </span>
          ) : !shift.is_published ? (
            <span className="sch-shift-badge draft">
              Draft
            </span>
          ) : (
            <span className="sch-shift-badge published">
              <CheckCircle2 size={10} />
              Published
            </span>
          )}
        </div>
      </div>

      {/* Conflict description if any */}
      {isConflict && shift.conflictReason && (
        <div className="sch-shift-conflict-desc">
          <ShieldAlert size={10} />
          <span>{shift.conflictReason}</span>
        </div>
      )}

      {/* Footer: Route, Wave, Hours */}
      <div className="sch-shift-footer">
        {shift.route_code && (
          <span className="sch-shift-pill">
            <Route size={10} style={{ color: "#94A3B8" }} />
            {shift.route_code}
          </span>
        )}

        {shift.wave && (
          <span className="sch-shift-pill">
            {shift.wave}
          </span>
        )}

        {shift.total_hours && (
          <span className="sch-shift-hours-tally">
            {shift.total_hours}h
          </span>
        )}
      </div>

      {/* Hover Action Overlay */}
      <div className="sch-shift-actions-overlay" onClick={(e) => e.stopPropagation()}>
        {/* Mark Extra / Backup Action Button */}
        {onMarkExtra && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkExtra(shift.id, !isBackup);
            }}
            className="sch-shift-action-btn"
            style={{
              color: isBackup ? "#9333EA" : "#64748B",
              backgroundColor: isBackup ? "#FAF5FF" : undefined,
            }}
            title={isBackup ? "Unmark Extra - Backup" : "Mark Extra - Backup"}
          >
            <Sparkles size={11} />
          </button>
        )}

        {/* Edit Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(shift);
          }}
          className="sch-shift-action-btn edit"
          title="Edit Shift"
        >
          <Edit2 size={11} />
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this shift?")) {
              onDelete && onDelete(shift.id);
            }
          }}
          className="sch-shift-action-btn del"
          title="Delete Shift"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};

