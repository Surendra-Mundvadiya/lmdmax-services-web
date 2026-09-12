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
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        width: "100%",
        maxWidth: embedded ? "100%" : "760px",
        maxHeight: embedded ? "none" : "90vh",
        overflow: embedded ? "visible" : "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: embedded ? "0 1px 3px 0 rgba(0, 0, 0, 0.1)" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        border: embedded ? "2px solid #E2E8F0" : "1px solid #E2E8F0",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          flexWrap: "wrap",
          gap: "0.75rem",
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
                gap: "0.5rem",
                padding: "0.5rem 0.85rem",
                borderRadius: "10px",
                fontSize: "0.75rem",
                fontWeight: 700,
                backgroundColor: "#F1F5F9",
                color: "#334155",
                border: "1px solid #E2E8F0",
                cursor: "pointer",
                marginRight: "0.25rem",
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
              borderRadius: "10px",
              backgroundColor: "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <HeartPulse size={20} color="#2563EB" />
          </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>
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
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: isResolved ? "1px solid #A7F3D0" : "1px solid #FECACA",
                      backgroundColor: isResolved ? "#ECFDF5" : "#FEF2F2",
                      color: isResolved ? "#065F46" : "#DC2626",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all 0.15s ease",
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
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>
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
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748B",
                padding: "6px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="scrollable" style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
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
              <Loader2 size={28} style={{ animation: "spin 0.8s linear infinite", color: "#2563EB" }} />
              <span style={{ fontSize: "0.875rem", color: "#64748B", fontWeight: 500 }}>
                Loading injury report…
              </span>
            </div>
          ) : !detail ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94A3B8" }}>
              <AlertCircle size={36} style={{ marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Unable to load injury details.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Linked accident banner */}
              {detail.accident_form_id && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Paperclip size={16} color="#DC2626" />
                    <span style={{ fontSize: "0.8125rem", color: "#B91C1C", fontWeight: 600 }}>
                      Linked Accident Report: #{detail.accident_form_id}
                    </span>
                  </div>
                  {onViewLinkedAccident && (
                    <button
                      type="button"
                      onClick={() => onViewLinkedAccident(detail.accident_form_id!)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "#DC2626",
                        color: "#FFFFFF",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
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
                        fontWeight: 700,
                        color: "#64748B",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Incident Narrative
                    </p>
                    <div
                      style={{
                        backgroundColor: "#FFFFFF",
                        padding: "0.85rem",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        fontSize: "0.875rem",
                        color: "#334155",
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
                            borderRadius: "10px",
                            border: "1px solid #CBD5E1",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
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
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
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
        margin: "0 0 0.5rem",
        fontSize: "0.72rem",
        fontWeight: 700,
        color: "#2563EB",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {title}
    </p>
    <div
      style={{
        backgroundColor: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: "10px",
        padding: "0.9rem",
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
        color: "#94A3B8",
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
        color: "#0F172A",
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
