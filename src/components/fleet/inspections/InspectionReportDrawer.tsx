import React, { FC, useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  User,
  Calendar,
  Gauge,
  Fuel,
  Camera,
  ShieldCheck,
  Maximize2,
} from "lucide-react";
import { InspectionRecord, ChecklistItem } from "../../../api/fleetApi";

interface InspectionReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionRecord | null;
  onReassignVehicle?: (inspection: InspectionRecord) => void;
}

const statusPillStyle = (tint: string, fg: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 12px",
  borderRadius: "var(--ads-r-pill)",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "-0.005em",
  background: tint,
  color: fg,
  border: "1px solid transparent",
});

const itemPillStyle = (tint: string, fg: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 8px",
  borderRadius: "var(--ads-r-pill)",
  fontSize: "0.6875rem",
  fontWeight: 600,
  background: tint,
  color: fg,
  border: "1px solid transparent",
});

const summaryCardStyle: React.CSSProperties = {
  background: "var(--ads-canvas)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-md)",
  padding: "var(--ads-s3)",
};

const summaryLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "0.75rem",
  color: "var(--ads-ink-tertiary)",
  fontWeight: 500,
  marginBottom: "var(--ads-s1)",
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--ads-ink)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const summaryMetaStyle: React.CSSProperties = {
  fontSize: "0.625rem",
  color: "var(--ads-ink-quaternary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: "var(--ads-s2)",
  fontSize: "0.9375rem",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  color: "var(--ads-ink)",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--ads-s2)",
  fontSize: "0.75rem",
};

export const InspectionReportDrawer: FC<InspectionReportDrawerProps> = ({
  isOpen,
  onClose,
  inspection,
  onReassignVehicle,
}) => {
  const [activeCategory, setActiveCategory] = useState<"all" | "exterior" | "powertrain" | "interior" | "safety">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, selectedPhoto, onClose]);

  if (!isOpen || !inspection) return null;

  const checklist = inspection.checklist || [];
  const filteredChecklist = activeCategory === "all"
    ? checklist
    : checklist.filter((item) => item.category === activeCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span style={statusPillStyle("var(--ads-green-tint)", "var(--ads-green)")}>
            <CheckCircle2 size={13} style={{ color: "var(--ads-green)" }} />
            PASS
          </span>
        );
      case "caution":
        return (
          <span style={statusPillStyle("var(--ads-amber-tint)", "var(--ads-amber)")}>
            <AlertTriangle size={13} style={{ color: "var(--ads-amber)" }} />
            CAUTION
          </span>
        );
      case "failed":
        return (
          <span style={statusPillStyle("var(--ads-red-tint)", "var(--ads-red)")}>
            <XCircle size={13} style={{ color: "var(--ads-red)" }} />
            FAIL / GROUNDED
          </span>
        );
      default:
        return (
          <span style={statusPillStyle("rgba(0,0,0,0.05)", "var(--ads-ink-secondary)")}>
            PENDING
          </span>
        );
    }
  };

  const getItemStatusBadge = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "pass":
        return (
          <span style={itemPillStyle("var(--ads-green-tint)", "var(--ads-green)")}>
            <CheckCircle2 size={11} style={{ color: "var(--ads-green)" }} />
            Satisfactory
          </span>
        );
      case "caution":
        return (
          <span style={itemPillStyle("var(--ads-amber-tint)", "var(--ads-amber)")}>
            <AlertTriangle size={11} style={{ color: "var(--ads-amber)" }} />
            Attention Needed
          </span>
        );
      case "fail":
        return (
          <span style={itemPillStyle("var(--ads-red-tint)", "var(--ads-red)")}>
            <XCircle size={11} style={{ color: "var(--ads-red)" }} />
            Defect / Grounded
          </span>
        );
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, overflow: "hidden" }}>
      {/* Dimmed Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.32)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          right: 0,
          maxWidth: "100%",
          display: "flex",
          paddingLeft: "var(--ads-s10)",
        }}
      >
        <div
          style={{
            width: "100vw",
            maxWidth: "42rem",
            display: "flex",
            flexDirection: "column",
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-xl) 0 0 var(--ads-r-xl)",
            boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "var(--ads-s5) var(--ads-s6)",
              background: "transparent",
              borderBottom: "1px solid var(--ads-hairline)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "var(--ads-s3)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--ads-s2)",
                  marginBottom: "var(--ads-s1)",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "var(--ads-ink-quaternary)",
                  }}
                >
                  Inspection Report
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-quaternary)" }}>•</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)" }}>
                  {inspection.shift_type || "Daily Inspection"}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-quaternary)" }}>•</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: "var(--ads-ink-tertiary)",
                  }}
                >
                  #{inspection.id}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)", flexWrap: "wrap" }}>
                <h3
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ads-s2)",
                    fontSize: "1.375rem",
                    fontWeight: 650,
                    letterSpacing: "-0.019em",
                    color: "var(--ads-ink)",
                  }}
                >
                  <Truck size={20} style={{ color: "var(--ads-blue)" }} />
                  {inspection.vehicle_unit || "Vehicle"}
                </h3>
                {getStatusBadge(inspection.status)}
              </div>
              <p
                style={{
                  margin: "var(--ads-s1) 0 0 0",
                  fontSize: "0.75rem",
                  color: "var(--ads-ink-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--ads-s2)",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  VIN:{" "}
                  <strong
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      color: "var(--ads-ink-secondary)",
                    }}
                  >
                    {inspection.vin || "—"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Plate: <strong style={{ color: "var(--ads-ink-secondary)" }}>{inspection.license_plate || "—"}</strong>
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspection report"
              title="Close drawer (Esc)"
              style={{
                width: "32px",
                height: "32px",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid var(--ads-hairline)",
                background: "transparent",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "var(--ads-s6)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--ads-s5)",
            }}
          >
            {/* Quick Summary Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "var(--ads-s3)",
              }}
            >
              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>
                  <User size={13} style={{ color: "var(--ads-blue)" }} />
                  <span>Driver</span>
                </div>
                <div style={summaryValueStyle}>
                  {inspection.driver_name || "Unassigned"}
                </div>
                <div style={summaryMetaStyle}>
                  {inspection.driver_id ? `ID: #${inspection.driver_id}` : "Assigned"}
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>
                  <Calendar size={13} style={{ color: "var(--ads-blue)" }} />
                  <span>Inspection Date</span>
                </div>
                <div style={summaryValueStyle}>
                  {inspection.date || "Today"}
                </div>
                <div style={summaryMetaStyle}>
                  {inspection.shift_type || "RTS Check"}
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>
                  <Gauge size={13} style={{ color: "var(--ads-blue)" }} />
                  <span>Odometer</span>
                </div>
                <div style={summaryValueStyle}>
                  {inspection.odometer ? `${inspection.odometer.toLocaleString()} mi` : "—"}
                </div>
                <div style={summaryMetaStyle}>
                  Verified by driver
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>
                  <Fuel size={13} style={{ color: "var(--ads-blue)" }} />
                  <span>Fuel / Battery</span>
                </div>
                <div style={summaryValueStyle}>
                  {inspection.fuel_level || "Full (100%)"}
                </div>
                <div style={{ ...summaryMetaStyle, color: "var(--ads-green)", fontWeight: 600 }}>
                  Operating level
                </div>
              </div>
            </div>

            {/* Defect / Notes Warning Banner if flagged */}
            {(inspection.status === "failed" || inspection.status === "caution" || (inspection.defects_found && inspection.defects_found > 0)) && (
              <div
                style={{
                  padding: "var(--ads-s4)",
                  borderRadius: "var(--ads-r-md)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--ads-s3)",
                  background:
                    inspection.status === "failed" ? "var(--ads-red-tint)" : "var(--ads-amber-tint)",
                  border: `1px solid ${
                    inspection.status === "failed" ? "var(--ads-red)" : "var(--ads-amber)"
                  }`,
                  color: inspection.status === "failed" ? "var(--ads-red)" : "var(--ads-amber)",
                }}
              >
                <div style={{ marginTop: "2px" }}>
                  {inspection.status === "failed" ? (
                    <XCircle size={18} style={{ color: "var(--ads-red)" }} />
                  ) : (
                    <AlertTriangle size={18} style={{ color: "var(--ads-amber)" }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 var(--ads-s1) 0",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {inspection.status === "failed"
                      ? "Grounded / Critical Defects Reported"
                      : "Caution Items Noted"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.5 }}>
                    {inspection.notes ||
                      "Driver or safety inspector flagged physical items during vehicle return check. Requires maintenance dispatch review."}
                  </p>
                </div>
              </div>
            )}

            {/* Itemized Checklist Tabs & Questions */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--ads-s2)",
                  marginBottom: "var(--ads-s3)",
                }}
              >
                <h4 style={sectionTitleStyle}>
                  <ShieldCheck size={16} style={{ color: "var(--ads-blue)" }} />
                  Itemized DVIC Checklist Questions
                </h4>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
                  {checklist.filter((i) => i.status === "pass").length} / {checklist.length} Passed
                </span>
              </div>

              {/* Category Pills */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderBottom: "1px solid var(--ads-hairline)",
                  paddingBottom: "var(--ads-s2)",
                  marginBottom: "var(--ads-s3)",
                  overflowX: "auto",
                }}
              >
                {[
                  { id: "all", label: "All Items" },
                  { id: "exterior", label: "Exterior & Body" },
                  { id: "powertrain", label: "Powertrain & Brakes" },
                  { id: "interior", label: "Interior & Controls" },
                  { id: "safety", label: "Safety Gear" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as any)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--ads-r-pill)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      border: "1px solid transparent",
                      background: activeCategory === cat.id ? "var(--ads-blue)" : "rgba(0,0,0,0.04)",
                      color: activeCategory === cat.id ? "#FFFFFF" : "var(--ads-ink-secondary)",
                      cursor: "pointer",
                      transition: "all var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s2)" }}>
                {filteredChecklist.length === 0 ? (
                  <div
                    style={{
                      padding: "var(--ads-s4)",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      color: "var(--ads-ink-quaternary)",
                      background: "var(--ads-canvas)",
                      borderRadius: "var(--ads-r-md)",
                      border: "1px solid var(--ads-hairline)",
                    }}
                  >
                    No items found for this category.
                  </div>
                ) : (
                  filteredChecklist.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "var(--ads-s3)",
                        borderRadius: "var(--ads-r-md)",
                        background:
                          item.status === "fail"
                            ? "var(--ads-red-tint)"
                            : item.status === "caution"
                            ? "var(--ads-amber-tint)"
                            : "var(--ads-material-thick)",
                        border: `1px solid ${
                          item.status === "fail"
                            ? "var(--ads-red)"
                            : item.status === "caution"
                            ? "var(--ads-amber)"
                            : "var(--ads-hairline)"
                        }`,
                        transition: "all var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--ads-s3)" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                              {item.title}
                            </span>
                            {getItemStatusBadge(item.status)}
                          </div>
                          {item.description && (
                            <p
                              style={{
                                margin: "var(--ads-s1) 0 0 0",
                                fontSize: "0.6875rem",
                                color: "var(--ads-ink-tertiary)",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.description}
                            </p>
                          )}
                          {item.notes && (
                            <div
                              style={{
                                marginTop: "var(--ads-s2)",
                                fontSize: "0.6875rem",
                                fontWeight: 600,
                                color: "var(--ads-red)",
                                background: "var(--ads-red-tint)",
                                padding: "var(--ads-s2)",
                                borderRadius: "var(--ads-r-sm)",
                                border: "1px solid var(--ads-hairline)",
                              }}
                            >
                              Inspector Note: {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Media & Photos Section */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--ads-s2)",
                  marginBottom: "var(--ads-s3)",
                }}
              >
                <h4 style={sectionTitleStyle}>
                  <Camera size={16} style={{ color: "var(--ads-blue)" }} />
                  Media & Photo Uploads ({inspection.images?.length || 0})
                </h4>
                <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-quaternary)" }}>
                  Timestamped Inspection Captures
                </span>
              </div>

              {(!inspection.images || inspection.images.length === 0) ? (
                <div
                  style={{
                    padding: "var(--ads-s6)",
                    textAlign: "center",
                    border: "1px dashed var(--ads-hairline-strong)",
                    borderRadius: "var(--ads-r-md)",
                    background: "var(--ads-canvas)",
                    fontSize: "0.75rem",
                    color: "var(--ads-ink-quaternary)",
                  }}
                >
                  <Camera
                    size={24}
                    style={{ display: "block", margin: "0 auto var(--ads-s1)", color: "var(--ads-ink-quaternary)" }}
                  />
                  No defect or exterior photos uploaded with this inspection.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: "var(--ads-s3)",
                  }}
                >
                  {inspection.images.map((img, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        aspectRatio: "16 / 9",
                        borderRadius: "var(--ads-r-md)",
                        overflow: "hidden",
                        border: "1px solid var(--ads-hairline)",
                        background: "var(--ads-canvas)",
                        cursor: "pointer",
                        boxShadow: "var(--ads-shadow-xs)",
                        transition: "transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                      }}
                      onClick={() => setSelectedPhoto(img)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "var(--ads-shadow-md)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                      }}
                    >
                      <img
                        src={img}
                        alt={`Inspection capture ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF",
                          background: "rgba(0,0,0,0.28)",
                          opacity: 0,
                          transition: "opacity var(--ads-dur-fast) var(--ads-ease)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                      >
                        <Maximize2 size={16} style={{ color: "#FFFFFF" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verification / Submission Details Footer Card */}
            <div
              style={{
                padding: "var(--ads-s4)",
                background: "var(--ads-canvas)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--ads-s2)",
              }}
            >
              <div style={metaRowStyle}>
                <span style={{ color: "var(--ads-ink-tertiary)", fontWeight: 500 }}>Submission Source</span>
                <span style={{ fontWeight: 600, color: "var(--ads-ink)" }}>
                  {inspection.submission_source || "Mobile Driver App"}
                </span>
              </div>
              <div style={metaRowStyle}>
                <span style={{ color: "var(--ads-ink-tertiary)", fontWeight: 500 }}>Verified By</span>
                <span style={{ fontWeight: 600, color: "var(--ads-ink)" }}>
                  {inspection.verified_by || "Station Safety Lead"}
                </span>
              </div>
              <div style={metaRowStyle}>
                <span style={{ color: "var(--ads-ink-tertiary)", fontWeight: 500 }}>Verified On</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--ads-ink)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {inspection.verified_on || inspection.created_at || "Today"}
                </span>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div
            style={{
              padding: "var(--ads-s4) var(--ads-s6)",
              background: "transparent",
              borderTop: "1px solid var(--ads-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--ads-s3)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--ads-ink)",
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-pill)",
                boxShadow: "var(--ads-bevel)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              Close Report
            </button>

            {onReassignVehicle && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReassignVehicle(inspection);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "#FFFFFF",
                  background: "var(--ads-blue)",
                  border: "1px solid transparent",
                  borderRadius: "var(--ads-r-pill)",
                  cursor: "pointer",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <Truck size={14} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Reassign Vehicle</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Photo Modal Zoom */}
      {selectedPhoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.32)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--ads-s4)",
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "56rem",
              maxHeight: "90vh",
              background: "var(--ads-material-thick)",
              backdropFilter: "var(--ads-blur-lg)",
              WebkitBackdropFilter: "var(--ads-blur-lg)",
              border: "1px solid var(--ads-hairline)",
              borderRadius: "var(--ads-r-xl)",
              boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
              overflow: "hidden",
              padding: "var(--ads-s2)",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close photo preview"
              style={{
                position: "absolute",
                top: "var(--ads-s4)",
                right: "var(--ads-s4)",
                zIndex: 10,
                width: "32px",
                height: "32px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid var(--ads-hairline)",
                background: "var(--ads-material-thick)",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <X size={18} />
            </button>
            <img
              src={selectedPhoto}
              alt="Expanded preview"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "var(--ads-r-lg)",
                display: "block",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionReportDrawer;
