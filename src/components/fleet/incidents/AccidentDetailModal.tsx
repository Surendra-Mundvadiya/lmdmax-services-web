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
  ArrowLeft,
} from "lucide-react";
import { axiosInstance, getClientTimeZone } from "../../../api/axiosClient";
import { IncidentDetail } from "./types";
import DownloadReportButton from "./DownloadReportButton";

interface AccidentDetailModalProps {
  incidentId: string | null;
  onClose: () => void;
  onStatusUpdated?: (id: string, newStatus: string) => void;
  onViewLinkedInjury?: (injuryId: string) => void;
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

export const AccidentDetailModal: FC<AccidentDetailModalProps> = ({
  incidentId,
  onClose,
  onStatusUpdated,
  onViewLinkedInjury,
  embedded = false,
}) => {
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    axiosInstance
      .get(`/incident_report_form/v1/incident_report_v2/${incidentId}`)
      .then((res) => {
        setDetail(res.data?.data || res.data || null);
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (!incidentId) return null;

  const handleStatusChange = async (newStatus: "open" | "resolved") => {
    if (!detail || !incidentId || detail.status?.toLowerCase() === newStatus) return;
    setStatusUpdating(true);
    try {
      const tz = getClientTimeZone();
      await axiosInstance.patch(
        `/incident_report_form/v1/incident_report/${incidentId}?timezone=${encodeURIComponent(tz)}`,
        {
          ...detail,
          status: newStatus,
        }
      );
      setDetail({ ...detail, status: newStatus });
      if (onStatusUpdated) onStatusUpdated(incidentId, newStatus);
    } catch {
      // Keep existing status on error
    } finally {
      setStatusUpdating(false);
    }
  };

  const isResolved = detail?.status?.toLowerCase() === "resolved";

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
              backgroundColor: "var(--ads-red-tint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} color="var(--ads-red)" />
          </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                  Accident Report Details
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
                ID: {incidentId} {detail?.date ? `· ${fmtDate(detail.date)}` : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {detail && (
              <DownloadReportButton
                id={incidentId}
                type="accident"
                date={detail.date}
                time={detail.time}
                variant="button"
                label="Download PDF"
              />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close accident report details"
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
                Loading accident report…
              </span>
            </div>
          ) : !detail ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--ads-ink-quaternary)" }}>
              <AlertCircle size={36} style={{ marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Unable to load accident details.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Linked injury banner */}
              {detail.injury_form_id && (
                <div
                  style={{
                    padding: "var(--ads-s3) var(--ads-s4)",
                    borderRadius: "var(--ads-r-sm)",
                    backgroundColor: "var(--ads-blue-tint)",
                    border: "1px solid var(--ads-blue-tint-strong)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Paperclip size={16} color="var(--ads-blue)" />
                    <span style={{ fontSize: "0.8125rem", color: "var(--ads-blue)", fontWeight: 600 }}>
                      Linked Injury Report: #{detail.injury_form_id}
                    </span>
                  </div>
                  {onViewLinkedInjury && (
                    <button
                      type="button"
                      onClick={() => onViewLinkedInjury(detail.injury_form_id!)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "var(--ads-r-pill)",
                        border: "1px solid transparent",
                        backgroundColor: "var(--ads-blue)",
                        color: "#FFFFFF",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        cursor: "pointer",
                        transition: "all var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      View Injury
                    </button>
                  )}
                </div>
              )}

              {/* 1. Incident Overview */}
              <Section title="Incident Overview">
                <Grid3>
                  <FieldItem label="Date" value={fmtDate(detail.date)} icon={<Calendar size={12} />} />
                  <FieldItem label="Time" value={detail.time || "N/A"} icon={<Clock size={12} />} />
                  <FieldItem label="Driver" value={detail.driver_name || "N/A"} icon={<User size={12} />} />
                  <FieldItem label="Vehicle Unit" value={detail.vehicle_unit || "N/A"} icon={<Car size={12} />} />
                  <FieldItem label="Location" value={detail.accident_location || "N/A"} icon={<MapPin size={12} />} />
                  <FieldItem label="Destination" value={detail.destination || "N/A"} />
                  <FieldItem label="Anyone Hurt?" value={detail.hurt ? "Yes" : "No"} />
                  <FieldItem label="Dispatcher Called?" value={detail.called_dispatcher ? "Yes" : "No"} />
                  <FieldItem label="Lawsuit Filed?" value={detail.has_third_party_lawsuit ? "Yes" : "No"} />
                </Grid3>

                {detail.incident_details || detail.incident_detail ? (
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
                      Incident Details & Narrative
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
                      {detail.incident_details || detail.incident_detail}
                    </div>
                  </div>
                ) : null}
              </Section>

              {/* 2. Road & Environmental Conditions */}
              <Section title="Road & Environmental Conditions">
                <Grid3>
                  <FieldItem label="Weather" value={detail.weather} />
                  <FieldItem label="Road Condition" value={detail.road_condition} />
                  <FieldItem label="Traffic Density" value={detail.traffic} />
                  <FieldItem label="Light Condition" value={detail.light_condition} />
                  <FieldItem label="Road Attitude" value={detail.road_attitude} />
                  <FieldItem label="Road Surface" value={detail.road_construction} />
                </Grid3>
              </Section>

              {/* 3. Police Information */}
              {detail.police && (
                <Section title="Police Information">
                  <Grid3>
                    <FieldItem label="Police Called?" value={detail.police.is_police_called ? "Yes" : "No"} />
                    <FieldItem label="Department" value={detail.police.police_department} />
                    <FieldItem label="Report No." value={detail.police.report_number} />
                    <FieldItem label="Officer Name" value={detail.police.officer_name} />
                    <FieldItem label="Citation Issued?" value={detail.police.citation_issued ? "Yes" : "No"} />
                    <FieldItem label="Phone" value={detail.police.phone_number} />
                  </Grid3>
                  {detail.police.other_details && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <FieldItem label="Other Details" value={detail.police.other_details} />
                    </div>
                  )}
                </Section>
              )}

              {/* 4. Vehicle Damage Notes */}
              {detail.damage_comments && (
                <Section title="Vehicle Damage">
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
                    {detail.damage_comments}
                  </div>
                </Section>
              )}

              {/* 5. Lawsuit Information */}
              {detail.has_third_party_lawsuit && detail.lawsuit && (
                <Section title="Lawsuit Information">
                  <Grid3>
                    <FieldItem label="Filing Date" value={fmtDate(detail.lawsuit.lawsuit_date)} />
                    <FieldItem label="Lawyer Name" value={detail.lawsuit.lawyer_name} />
                    <FieldItem label="Adjuster Name" value={detail.lawsuit.adjuster_name} />
                  </Grid3>
                  {detail.lawsuit.notes && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <FieldItem label="Lawsuit Notes" value={detail.lawsuit.notes} />
                    </div>
                  )}
                </Section>
              )}

              {/* 6. Photos & Attached Documents */}
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
                          alt={`Incident evidence ${i + 1}`}
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

export default AccidentDetailModal;
