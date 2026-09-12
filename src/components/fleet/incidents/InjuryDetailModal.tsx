import React, { FC, useState, useEffect } from "react";
import {
  ShieldAlert,
  X,
  Loader2,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  Clock,
  Car,
  User,
  MapPin,
  Calendar,
  HeartPulse,
  Phone,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { axiosInstance } from "../../../api/axiosClient";
import { InjuryDetail } from "./types";
import DownloadReportButton from "./DownloadReportButton";

interface InjuryDetailModalProps {
  injuryId: string | null;
  onClose: () => void;
  onStatusUpdated?: (id: string, newStatus: string) => void;
  onViewLinkedAccident?: (accidentId: string) => void;
  embedded?: boolean;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function injuryTypeLabel(t?: string): string {
  switch (t) {
    case "vehicle_without_injury":
      return "Vehicle — No Injury";
    case "injury_with_vehicle":
      return "Vehicle + Injury";
    case "injury_without_vehicle":
      return "Injury Not Involving Vehicle";
    default:
      return t || "N/A";
  }
}

export const InjuryDetailModal: FC<InjuryDetailModalProps> = ({
  injuryId,
  onClose,
  onStatusUpdated,
  onViewLinkedAccident,
  embedded = false,
}) => {
  const [detail, setDetail] = useState<InjuryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (!injuryId) return;
    setLoading(true);
    axiosInstance
      .get(`/injury_report/v1/get_injury_data_by_id/${injuryId}`)
      .then((res) => {
        setDetail(res.data?.data || res.data || null);
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [injuryId]);

  if (!injuryId) return null;

  const handleStatusChange = async (newStatus: "open" | "resolved") => {
    if (!detail || !injuryId || detail.status?.toLowerCase() === newStatus) return;
    setStatusUpdating(true);
    try {
      await axiosInstance.patch(`/injury_report/v1/change_status/${injuryId}`, {
        status: newStatus,
      });
      setDetail({ ...detail, status: newStatus });
      if (onStatusUpdated) onStatusUpdated(injuryId, newStatus);
    } catch {
      // Keep existing status on error
    } finally {
      setStatusUpdating(false);
    }
  };  const isResolved = detail?.status?.toLowerCase() === "resolved";

  const innerCard = (
    <div
      style={{
        background: "var(--ads-material-thick)",
        backdropFilter: "var(--ads-blur-lg)",
        WebkitBackdropFilter: "var(--ads-blur-lg)",
        borderRadius: "var(--ads-r-xl)",
        width: "100%",
        maxWidth: embedded ? "100%" : "760px",
        maxHeight: embedded ? "none" : "90vh",
        overflow: embedded ? "visible" : "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: embedded
          ? "var(--ads-shadow-sm), var(--ads-bevel)"
          : "var(--ads-shadow-lg), var(--ads-bevel)",
        border: "1px solid var(--ads-hairline)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--ads-s5) var(--ads-s6)",
          borderBottom: "1px solid var(--ads-hairline)",
          background: "transparent",
          flexWrap: "wrap",
          gap: "var(--ads-s3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {embedded && (
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                padding: "0.5rem 0.85rem",
                borderRadius: "var(--ads-r-pill)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                background: "var(--ads-material-thick)",
                color: "var(--ads-ink)",
                border: "1px solid var(--ads-hairline)",
                boxShadow: "var(--ads-bevel)",
                cursor: "pointer",
                marginRight: "var(--ads-s1)",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Incident List</span>
            </button>
          )}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "var(--ads-blue-tint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <HeartPulse size={20} color="var(--ads-blue)" />
          </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                  Injury Report Details
                </h3>
                {detail && (
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleStatusChange(isResolved ? "open" : "resolved")}
                    title="Click to toggle Open / Resolved"
                    style={{
                      padding: "0.2rem 0.65rem",
                      borderRadius: "var(--ads-r-pill)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: isResolved
                        ? "1px solid var(--ads-green-tint)"
                        : "1px solid var(--ads-red-tint)",
                      backgroundColor: isResolved
                        ? "var(--ads-green-tint)"
                        : "var(--ads-red-tint)",
                      color: isResolved ? "var(--ads-green)" : "var(--ads-red)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    {statusUpdating ? (
                      <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />
                    ) : isResolved ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <Clock size={11} />
                    )}
                    <span style={{ textTransform: "capitalize" }}>
                      {detail.status || "Open"}
                    </span>
                  </button>
                )}
              </div>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                ID: {injuryId} {detail?.date ? `· ${fmtDate(detail.date)}` : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {detail && (
              <DownloadReportButton
                id={injuryId}
                type="injury"
                variant="button"
                label="Download Report"
              />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close injury report details"
              style={{
                background: "transparent",
                border: "1px solid var(--ads-hairline)",
                cursor: "pointer",
                color: "var(--ads-ink-tertiary)",
                padding: "6px",
                borderRadius: "var(--ads-r-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="scrollable" style={{ flex: 1, overflowY: "auto", padding: "var(--ads-s6)" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "260px",
                gap: "0.75rem",
              }}
            >
              <Loader2 size={28} style={{ animation: "spin 0.8s linear infinite", color: "var(--ads-blue)" }} />
              <span style={{ fontSize: "0.875rem", color: "var(--ads-ink-tertiary)", fontWeight: 500 }}>
                Loading injury report…
              </span>
            </div>
          ) : !detail ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--ads-ink-quaternary)" }}>
              <AlertCircle size={36} style={{ marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Unable to load injury details.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Linked accident banner */}
              {detail.accident_form_id && (
                <div
                  style={{
                    padding: "var(--ads-s3) var(--ads-s4)",
                    borderRadius: "var(--ads-r-sm)",
                    backgroundColor: "var(--ads-red-tint)",
                    border: "1px solid var(--ads-red-tint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Paperclip size={16} color="var(--ads-red)" />
                    <span style={{ fontSize: "0.8125rem", color: "var(--ads-red)", fontWeight: 600 }}>
                      Linked Accident Report: #{detail.accident_form_id}
                    </span>
                  </div>
                  {onViewLinkedAccident && (
                    <button
                      type="button"
                      onClick={() => onViewLinkedAccident(detail.accident_form_id!)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "var(--ads-r-pill)",
                        border: "1px solid transparent",
                        backgroundColor: "var(--ads-red)",
                        color: "#FFFFFF",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        cursor: "pointer",
                        transition: "all var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      View Accident
                    </button>
                  )}
                </div>
              )}

              {/* 1. Driver & Personal Information */}
              <Section title="Driver & Personal Information">
                <Grid3>
                  <FieldItem
                    label="Driver Name"
                    value={detail.personal_information?.driver_name || "N/A"}
                    icon={<User size={12} />}
                  />
                  <FieldItem
                    label="Phone"
                    value={detail.personal_information?.driver_phone || "N/A"}
                    icon={<Phone size={12} />}
                  />
                  <FieldItem
                    label="Email"
                    value={detail.personal_information?.driver_email || "N/A"}
                  />
                  <FieldItem
                    label="Emergency Contact"
                    value={detail.personal_information?.emergency_contact_name || "N/A"}
                  />
                  <FieldItem
                    label="Emergency Phone"
                    value={detail.personal_information?.emergency_contact_phone || "N/A"}
                  />
                  <FieldItem
                    label="Injury Type"
                    value={injuryTypeLabel(detail.injury_type)}
                  />
                </Grid3>
              </Section>

              {/* 2. Event & Incident Details */}
              <Section title="Incident Details">
                <Grid3>
                  <FieldItem
                    label="Incident Date"
                    value={fmtDate(
                      detail.incident_event_information?.incident_date || detail.date
                    )}
                    icon={<Calendar size={12} />}
                  />
                  <FieldItem
                    label="Incident Time"
                    value={
                      detail.incident_event_information?.incident_time ||
                      detail.time ||
                      "N/A"
                    }
                    icon={<Clock size={12} />}
                  />
                  <FieldItem
                    label="Location"
                    value={
                      detail.incident_event_information?.incident_location || "N/A"
                    }
                    icon={<MapPin size={12} />}
                  />
                  <FieldItem
                    label="Weather"
                    value={
                      detail.incident_event_information?.weather_condition || "N/A"
                    }
                  />
                </Grid3>

                {detail.incident_event_information?.incident_details && (
                  <div style={{ marginTop: "0.85rem" }}>
                    <p
                      style={{
                        margin: "0 0 0.35rem",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--ads-ink-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Incident Narrative
                    </p>
                    <div
                      style={{
                        backgroundColor: "var(--ads-material-thick)",
                        padding: "0.85rem",
                        borderRadius: "var(--ads-r-sm)",
                        border: "1px solid var(--ads-hairline)",
                        fontSize: "0.875rem",
                        color: "var(--ads-ink-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {detail.incident_event_information.incident_details}
                    </div>
                  </div>
                )}
              </Section>

              {/* 3. Medical & Treatment Info */}
              <Section title="Medical Attention & Treatment">
                <Grid3>
                  <FieldItem
                    label="Treatment Administered"
                    value={
                      detail.incident_event_information?.treatment_administered || "None"
                    }
                  />
                  <FieldItem
                    label="Hospital / Clinic Visited"
                    value={
                      detail.incident_event_information?.hospital_visited || "N/A"
                    }
                    icon={<Building2 size={12} />}
                  />
                  <FieldItem
                    label="Physician Name"
                    value={
                      detail.incident_event_information?.physician_name || "N/A"
                    }
                  />
                  <FieldItem
                    label="Work Restrictions Advised"
                    value={
                      detail.incident_event_information?.restrictions_advised || "None"
                    }
                  />
                </Grid3>
              </Section>

              {/* 4. Vehicle Information */}
              {detail.vehicle_information && (
                <Section title="Vehicle Information">
                  <Grid3>
                    <FieldItem
                      label="Vehicle Name / Unit"
                      value={detail.vehicle_information.vehicle_name || "N/A"}
                      icon={<Car size={12} />}
                    />
                    <FieldItem
                      label="License Plate"
                      value={detail.vehicle_information.vehicle_license_plate || "N/A"}
                    />
                    <FieldItem
                      label="VIN"
                      value={detail.vehicle_information.vin_no || "N/A"}
                    />
                  </Grid3>
                </Section>
              )}

              {/* 5. Supervisor & Witnesses */}
              <Section title="Supervision & Witnesses">
                <Grid3>
                  <FieldItem
                    label="Supervisor Notified"
                    value={detail.supervisor_notified ? "Yes" : "No"}
                  />
                  <FieldItem
                    label="Supervisor Name"
                    value={detail.supervisor_name || "N/A"}
                  />
                  <FieldItem
                    label="Witness Name"
                    value={detail.witness_information?.witness_name || "None"}
                  />
                  <FieldItem
                    label="Witness Phone"
                    value={detail.witness_information?.witness_phone || "N/A"}
                  />
                </Grid3>
              </Section>

              {/* 6. Attached Photos / Documents */}
              {detail.images && detail.images.length > 0 && (
                <Section title={`Attached Photos (${detail.images.length})`}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
                    {detail.images.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block" }}
                      >
                        <img
                          src={src}
                          alt={`Injury evidence ${i + 1}`}
                          style={{
                            width: 90,
                            height: 90,
                            objectFit: "cover",
                            borderRadius: "var(--ads-r-sm)",
                            border: "1px solid var(--ads-hairline-strong)",
                            boxShadow: "var(--ads-shadow-xs)",
                            transition: "all var(--ads-dur-fast) var(--ads-ease)",
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return innerCard;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ads-s4)",
      }}
      onClick={onClose}
    >
      {innerCard}
    </div>
  );
};

const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <p
      style={{
        margin: "0 0 var(--ads-s2)",
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "var(--ads-blue)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {title}
    </p>
    <div
      style={{
        backgroundColor: "var(--ads-canvas)",
        border: "1px solid var(--ads-hairline)",
        borderRadius: "var(--ads-r-md)",
        padding: "var(--ads-s4)",
      }}
    >
      {children}
    </div>
  </div>
);

const Grid3: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "0.75rem",
    }}
  >
    {children}
  </div>
);

const FieldItem: FC<{ label: string; value?: any; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div>
    <p
      style={{
        margin: "0 0 0.2rem",
        fontSize: "0.68rem",
        fontWeight: 600,
        color: "var(--ads-ink-quaternary)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
      }}
    >
      {icon}
      {label}
    </p>
    <p
      style={{
        margin: 0,
        fontSize: "0.8125rem",
        color: "var(--ads-ink)",
        fontWeight: 600,
      }}
    >
      {typeof value === "string" || typeof value === "number"
        ? value || "N/A"
        : value ?? "N/A"}
    </p>
  </div>
);

export default InjuryDetailModal;
