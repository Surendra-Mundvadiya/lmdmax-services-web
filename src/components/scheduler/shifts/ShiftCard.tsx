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
  XCircle,
} from "lucide-react";
import { SchedulerShiftItem, getShiftStatusBadge } from "../../../api/schedulerApi";

/* ---------------------------------------------------------------------------
   Single status -> design-token mapping shared by every calendar view.
   Day / Week / Bi-Weekly / Month all resolve shift state through this table so
   the same shift reads identically wherever it is rendered.
   ------------------------------------------------------------------------ */

export type ShiftStatusKey =
  | "published"
  | "confirmed"
  | "draft"
  | "pending"
  | "declined"
  | "open"
  | "backup"
  | "extra"
  | "vto"
  | "conflict";

export interface ShiftStatusTone {
  label: string;
  initial: string;
  accent: string;
  ink: string;
  tint: string;
  line: string;
  dashed?: boolean;
}

export const SHIFT_STATUS_TONES: Record<ShiftStatusKey, ShiftStatusTone> = {
  published: {
    label: "Published",
    initial: "P",
    accent: "var(--ads-blue)",
    ink: "#0058B0",
    tint: "var(--ads-blue-tint)",
    line: "rgba(0, 113, 227, 0.28)",
  },
  confirmed: {
    label: "Confirmed",
    initial: "C",
    accent: "var(--ads-green)",
    ink: "var(--ads-green)",
    tint: "var(--ads-green-tint)",
    line: "rgba(36, 138, 61, 0.30)",
  },
  draft: {
    label: "Draft",
    initial: "D",
    accent: "var(--ads-amber)",
    ink: "var(--ads-amber)",
    tint: "var(--ads-amber-tint)",
    line: "rgba(178, 80, 0, 0.34)",
    dashed: true,
  },
  pending: {
    label: "Pending",
    initial: "•",
    accent: "var(--ads-ink-tertiary)",
    ink: "var(--ads-ink-secondary)",
    tint: "rgba(0, 0, 0, 0.05)",
    line: "var(--ads-hairline-strong)",
  },
  declined: {
    label: "Declined",
    initial: "✕",
    accent: "var(--ads-red)",
    ink: "var(--ads-red)",
    tint: "var(--ads-red-tint)",
    line: "rgba(215, 0, 21, 0.28)",
  },
  open: {
    label: "Open",
    initial: "O",
    accent: "var(--ads-ink-quaternary)",
    ink: "var(--ads-ink-secondary)",
    tint: "rgba(0, 0, 0, 0.04)",
    line: "var(--ads-hairline-strong)",
    dashed: true,
  },
  backup: {
    label: "Backup",
    initial: "B",
    accent: "var(--ads-purple)",
    ink: "var(--ads-purple)",
    tint: "var(--ads-purple-tint)",
    line: "rgba(110, 79, 196, 0.30)",
  },
  extra: {
    label: "Extra",
    initial: "E",
    accent: "var(--ads-purple)",
    ink: "var(--ads-purple)",
    tint: "var(--ads-purple-tint)",
    line: "rgba(110, 79, 196, 0.30)",
  },
  vto: {
    label: "VTO",
    initial: "V",
    accent: "var(--ads-purple)",
    ink: "var(--ads-purple)",
    tint: "var(--ads-purple-tint)",
    line: "rgba(110, 79, 196, 0.30)",
  },
  conflict: {
    label: "Conflict",
    initial: "!",
    accent: "var(--ads-red)",
    ink: "var(--ads-red)",
    tint: "var(--ads-red-tint)",
    line: "rgba(215, 0, 21, 0.30)",
  },
};

export function resolveShiftStatus(shift: SchedulerShiftItem): ShiftStatusKey {
  if (shift.isConflict) return "conflict";

  const badge = getShiftStatusBadge(shift);
  switch (badge) {
    case "backup":
      return "backup";
    case "extras":
      return "extra";
    case "vto":
      return "vto";
    case "unpublished":
      return "draft";
    case "open":
      return "open";
    case "confirmed":
      return "confirmed";
    case "declined":
      return "declined";
    case "pending":
      return "pending";
    default:
      return "published";
  }
}

const StatusGlyph: FC<{ statusKey: ShiftStatusKey; size: number }> = ({ statusKey, size }) => {
  if (statusKey === "conflict") return <AlertTriangle size={size} />;
  if (statusKey === "declined") return <XCircle size={size} />;
  if (statusKey === "backup" || statusKey === "extra" || statusKey === "vto")
    return <Sparkles size={size} />;
  if (statusKey === "published" || statusKey === "confirmed") return <CheckCircle2 size={size} />;
  return null;
};

/* Density presets — one geometry scale, four information densities. */
export type ShiftCardDensity = "comfortable" | "timeline" | "compact" | "micro";

const DENSITY: Record<
  ShiftCardDensity,
  { padding: string; radius: string; font: string }
> = {
  comfortable: { padding: "var(--ads-s2) var(--ads-s3)", radius: "var(--ads-r-sm)", font: "0.75rem" },
  timeline: { padding: "0 var(--ads-s3)", radius: "var(--ads-r-sm)", font: "0.75rem" },
  compact: { padding: "var(--ads-s1) var(--ads-s2)", radius: "var(--ads-r-xs)", font: "0.6875rem" },
  micro: { padding: "var(--ads-s1) var(--ads-s2)", radius: "var(--ads-r-xs)", font: "0.6875rem" },
};

interface ShiftCardProps {
  shift: SchedulerShiftItem;
  density?: ShiftCardDensity;
  title?: string;
  style?: React.CSSProperties;
  onEdit?: (shift: SchedulerShiftItem) => void;
  onDelete?: (shiftId: number) => void;
  onMarkExtra?: (shiftId: number, isBackup: boolean) => void;
  onDragStart?: (e: React.DragEvent, shift: SchedulerShiftItem) => void;
}

const ActionButton: FC<{
  label: string;
  tone: string;
  toneTint: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}> = ({ label, tone, toneTint, onClick, children }) => {
  const [hovered, setHovered] = useState<boolean>(false);
  const [pressed, setPressed] = useState<boolean>(false);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3px",
        border: "none",
        borderRadius: "var(--ads-r-xs)",
        background: hovered ? toneTint : "transparent",
        color: hovered ? tone : "var(--ads-ink-tertiary)",
        cursor: "pointer",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
      }}
    >
      {children}
    </button>
  );
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
};

export const ShiftCard: FC<ShiftCardProps> = ({
  shift,
  density = "comfortable",
  title,
  style,
  onEdit,
  onDelete,
  onMarkExtra,
  onDragStart,
}) => {
  const [hovered, setHovered] = useState<boolean>(false);

  const statusKey = resolveShiftStatus(shift);
  const tone = SHIFT_STATUS_TONES[statusKey];
  const geometry = DENSITY[density];
  const isBackup = Boolean(shift.is_backup || shift.sch_status === "backup");
  const isConflict = Boolean(shift.isConflict);

  const startTime = formatTime(shift.shift_duration_start);
  const endTime = formatTime(shift.shift_duration_end);

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

  const statusBadge = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        padding: "2px 7px",
        borderRadius: "var(--ads-r-pill)",
        fontSize: "0.625rem",
        fontWeight: 600,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        background: "var(--ads-material-thick)",
        color: tone.ink,
        border: `1px solid ${tone.line}`,
        flexShrink: 0,
      }}
    >
      <StatusGlyph statusKey={statusKey} size={9} />
      {tone.label}
    </span>
  );

  const metaPillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--ads-s1)",
    padding: "2px 7px",
    borderRadius: "var(--ads-r-xs)",
    background: "var(--ads-material-thick)",
    border: "1px solid var(--ads-hairline)",
    fontSize: "0.625rem",
    fontWeight: 600,
    color: "var(--ads-ink-secondary)",
    whiteSpace: "nowrap",
  };

  const rootStyle: React.CSSProperties = {
    position: "relative",
    boxSizing: "border-box",
    padding: geometry.padding,
    fontSize: geometry.font,
    borderRadius: geometry.radius,
    background: tone.tint,
    border: `1px solid ${tone.line}`,
    borderLeft: `3px solid ${tone.accent}`,
    borderStyle: tone.dashed ? "dashed" : "solid",
    borderLeftStyle: "solid",
    color: "var(--ads-ink)",
    cursor: "grab",
    userSelect: "none",
    overflow: "hidden",
    boxShadow: hovered ? "var(--ads-shadow-sm)" : "var(--ads-shadow-xs)",
    transform: hovered ? "translateY(-1px)" : "translateY(0)",
    transition:
      "transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
    ...(density === "timeline"
      ? { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--ads-s2)" }
      : { display: "flex", flexDirection: "column", gap: density === "comfortable" ? "var(--ads-s1)" : "2px" }),
    ...style,
  };

  const defaultTitle =
    density === "comfortable"
      ? "Drag shift to reschedule to another driver or date"
      : `${startTime} – ${endTime} (Drag to move)`;

  return (
    <div
      className={`ads-shift-card ${statusKey}`}
      onClick={() => onEdit && onEdit(shift)}
      draggable={true}
      onDragStart={handleDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={rootStyle}
      title={title || defaultTitle}
    >
      {density === "comfortable" && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--ads-s1)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--ads-s1)",
                fontWeight: 600,
                fontSize: "0.75rem",
                color: "var(--ads-ink)",
                letterSpacing: "-0.005em",
              }}
            >
              <Clock size={12} style={{ color: tone.accent, flexShrink: 0 }} />
              {startTime} – {endTime}
            </span>
            {statusBadge}
          </div>

          {isConflict && shift.conflictReason && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--ads-s1)",
                padding: "2px 6px",
                borderRadius: "var(--ads-r-xs)",
                background: "var(--ads-material-thick)",
                border: `1px solid ${SHIFT_STATUS_TONES.conflict.line}`,
                color: "var(--ads-red)",
                fontSize: "0.625rem",
                fontWeight: 600,
              }}
            >
              <ShieldAlert size={10} style={{ flexShrink: 0 }} />
              <span>{shift.conflictReason}</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ads-s1)",
              flexWrap: "wrap",
            }}
          >
            {shift.route_code && (
              <span style={metaPillStyle}>
                <Route size={10} style={{ color: "var(--ads-ink-quaternary)" }} />
                {shift.route_code}
              </span>
            )}

            {shift.wave && <span style={metaPillStyle}>{shift.wave}</span>}

            {shift.total_hours && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--ads-ink-tertiary)",
                }}
              >
                {shift.total_hours}h
              </span>
            )}
          </div>

          {hovered && (onMarkExtra || onEdit || onDelete) && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "var(--ads-s1)",
                right: "var(--ads-s1)",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                padding: "2px 4px",
                borderRadius: "var(--ads-r-xs)",
                background: "var(--ads-material-thick)",
                WebkitBackdropFilter: "var(--ads-blur-sm)",
                backdropFilter: "var(--ads-blur-sm)",
                border: "1px solid var(--ads-hairline)",
                boxShadow: "var(--ads-shadow-sm)",
              }}
            >
              {onMarkExtra && (
                <ActionButton
                  label={isBackup ? "Unmark shift as extra backup" : "Mark shift as extra backup"}
                  tone="var(--ads-purple)"
                  toneTint="var(--ads-purple-tint)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkExtra(shift.id, !isBackup);
                  }}
                >
                  <Sparkles size={11} />
                </ActionButton>
              )}

              {onEdit && (
                <ActionButton
                  label="Edit shift"
                  tone="var(--ads-blue)"
                  toneTint="var(--ads-blue-tint)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(shift);
                  }}
                >
                  <Edit2 size={11} />
                </ActionButton>
              )}

              {onDelete && (
                <ActionButton
                  label="Delete shift"
                  tone="var(--ads-red)"
                  toneTint="var(--ads-red-tint)"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this shift?")) {
                      onDelete(shift.id);
                    }
                  }}
                >
                  <Trash2 size={11} />
                </ActionButton>
              )}
            </div>
          )}
        </>
      )}

      {density === "timeline" && (
        <>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--ads-s1)",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <Clock size={12} style={{ color: tone.accent, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, whiteSpace: "nowrap", color: "var(--ads-ink)" }}>
              {startTime} – {endTime}
            </span>
            {shift.route_code && (
              <span style={{ ...metaPillStyle, overflow: "hidden", textOverflow: "ellipsis" }}>
                {shift.route_code}
              </span>
            )}
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--ads-s1)",
              flexShrink: 0,
            }}
          >
            {shift.total_hours && (
              <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
                {shift.total_hours}h
              </span>
            )}
            {statusBadge}
          </span>
        </>
      )}

      {density === "compact" && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s1)",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: "var(--ads-ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shift.driver_name || "Unassigned"}
          </span>
          <span
            style={{
              fontSize: "0.625rem",
              fontWeight: 600,
              color: "var(--ads-ink-tertiary)",
              flexShrink: 0,
            }}
          >
            {startTime}
          </span>
        </span>
      )}

      {density === "micro" && (
        <>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2px",
              fontWeight: 600,
              color: "var(--ads-ink)",
            }}
          >
            <span>{startTime}</span>
            <span
              style={{
                fontSize: "0.5625rem",
                fontWeight: 700,
                color: tone.ink,
                flexShrink: 0,
              }}
              title={tone.label}
            >
              {tone.initial}
            </span>
          </span>

          {shift.route_code && (
            <span
              style={{
                fontSize: "0.5625rem",
                fontWeight: 550,
                color: "var(--ads-ink-tertiary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shift.route_code}
            </span>
          )}
        </>
      )}
    </div>
  );
};
