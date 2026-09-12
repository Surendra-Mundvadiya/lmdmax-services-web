import React, { FC, useState } from "react";
import {
  ArrowLeft,
  Truck,
  User,
  Calendar,
  Gauge,
  Fuel,
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Link,
  Maximize2,
  X,
} from "lucide-react";
import { InspectionRecord } from "../../../api/fleetApi";

interface EmbeddedInspectionReportViewProps {
  inspection: InspectionRecord;
  onBack: () => void;
  onReassignVehicle?: (inspection: InspectionRecord) => void;
}

const panelStyle: React.CSSProperties = {
  background: "var(--ads-material-thick)",
  backdropFilter: "var(--ads-blur-md)",
  WebkitBackdropFilter: "var(--ads-blur-md)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-lg)",
  boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
};

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
  whiteSpace: "nowrap",
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

const kpiCardStyle: React.CSSProperties = {
  background: "var(--ads-canvas)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-md)",
  padding: "var(--ads-s4)",
};

const kpiLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "0.75rem",
  color: "var(--ads-ink-tertiary)",
  fontWeight: 500,
  marginBottom: "var(--ads-s1)",
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--ads-ink)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const kpiMetaStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: "var(--ads-ink-quaternary)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: "var(--ads-s2)",
  fontSize: "1.0625rem",
  fontWeight: 600,
  letterSpacing: "-0.014em",
  color: "var(--ads-ink)",
};

export const EmbeddedInspectionReportView: FC<EmbeddedInspectionReportViewProps> = ({
  inspection,
  onBack,
  onReassignVehicle,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "exterior" | "powertrain" | "interior" | "safety"
  >("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const checklist = inspection.checklist || [];
  const filteredChecklist =
    activeCategory === "all"
      ? checklist
      : checklist.filter((item) => item.category === activeCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span style={statusPillStyle("var(--ads-green-tint)", "var(--ads-green)")}>
            <CheckCircle2 size={14} style={{ color: "var(--ads-green)" }} />
            PASS / OPERATIONAL
          </span>
        );
      case "caution":
        return (
          <span style={statusPillStyle("var(--ads-amber-tint)", "var(--ads-amber)")}>
            <AlertTriangle size={14} style={{ color: "var(--ads-amber)" }} />
            CAUTION REQUIRED
          </span>
        );
      case "failed":
        return (
          <span style={statusPillStyle("var(--ads-red-tint)", "var(--ads-red)")}>
            <XCircle size={14} style={{ color: "var(--ads-red)" }} />
            GROUNDED / DEFECTIVE
          </span>
        );
      default:
        return (
          <span style={statusPillStyle("rgba(0,0,0,0.05)", "var(--ads-ink-secondary)")}>
            {status.toUpperCase()}
          </span>
        );
    }
  };

  const getItemStatusBadge = (status: "pass" | "caution" | "fail") => {
    switch (status) {
      case "pass":
        return (
          <span style={itemPillStyle("var(--ads-green-tint)", "var(--ads-green)")}>
            <CheckCircle2 size={11} style={{ color: "var(--ads-green)" }} />
            Passed
          </span>
        );
      case "caution":
        return (
          <span style={itemPillStyle("var(--ads-amber-tint)", "var(--ads-amber)")}>
            <AlertTriangle size={11} style={{ color: "var(--ads-amber)" }} />
            Caution
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s4)", width: "100%" }}>
      {/* Top Header Card with Back Button */}
      <div style={{ ...panelStyle, padding: "var(--ads-s5)" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--ads-s2)",
                padding: "9px 18px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                background: "var(--ads-material-thick)",
                color: "var(--ads-ink)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-pill)",
                boxShadow: "var(--ads-bevel)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Inspections</span>
            </button>

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
                <span style={{ color: "var(--ads-ink-quaternary)" }}>•</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)" }}>
                  {inspection.shift_type || "Daily Inspection"}
                </span>
                <span style={{ color: "var(--ads-ink-quaternary)" }}>•</span>
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
                <h2
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
                  <Truck size={22} style={{ color: "var(--ads-blue)" }} />
                  {inspection.vehicle_unit || "Vehicle Unit"}
                </h2>
                {getStatusBadge(inspection.status)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            {onReassignVehicle && (
              <button
                type="button"
                onClick={() => onReassignVehicle(inspection)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  background: "var(--ads-blue)",
                  color: "#FFFFFF",
                  border: "1px solid transparent",
                  borderRadius: "var(--ads-r-pill)",
                  cursor: "pointer",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <Link size={14} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Reassign Vehicle</span>
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "var(--ads-s3)",
            paddingTop: "var(--ads-s3)",
            borderTop: "1px solid var(--ads-hairline)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--ads-s4)",
            fontSize: "0.75rem",
            color: "var(--ads-ink-tertiary)",
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
            License Plate: <strong style={{ color: "var(--ads-ink-secondary)" }}>{inspection.license_plate || "—"}</strong>
          </span>
          <span>•</span>
          <span>
            Make/Model:{" "}
            <strong style={{ color: "var(--ads-ink-secondary)" }}>
              {(inspection as any).make || "Fleet"} {(inspection as any).model || "Transit"}
            </strong>
          </span>
        </div>
      </div>

      {/* Main Details Body */}
      <div
        style={{
          ...panelStyle,
          padding: "var(--ads-s6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--ads-s6)",
        }}
      >
        {/* KPI Metrics Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "var(--ads-s4)",
          }}
        >
          <div style={kpiCardStyle}>
            <div style={kpiLabelStyle}>
              <User size={14} style={{ color: "var(--ads-blue)" }} />
              <span>Assigned Driver</span>
            </div>
            <div style={kpiValueStyle}>
              {inspection.driver_name || "Unassigned"}
            </div>
            <div style={kpiMetaStyle}>
              {inspection.driver_id ? `ID #${inspection.driver_id}` : "Fleet Driver"}
            </div>
          </div>

          <div style={kpiCardStyle}>
            <div style={kpiLabelStyle}>
              <Calendar size={14} style={{ color: "var(--ads-blue)" }} />
              <span>Inspection Date</span>
            </div>
            <div style={kpiValueStyle}>
              {inspection.date || "Today"}
            </div>
            <div style={kpiMetaStyle}>
              {inspection.shift_type || "RTS Check"}
            </div>
          </div>

          <div style={kpiCardStyle}>
            <div style={kpiLabelStyle}>
              <Gauge size={14} style={{ color: "var(--ads-blue)" }} />
              <span>Odometer</span>
            </div>
            <div style={kpiValueStyle}>
              {inspection.odometer ? `${inspection.odometer.toLocaleString()} mi` : "—"}
            </div>
            <div style={kpiMetaStyle}>
              Verified by driver
            </div>
          </div>

          <div style={kpiCardStyle}>
            <div style={kpiLabelStyle}>
              <Fuel size={14} style={{ color: "var(--ads-blue)" }} />
              <span>Fuel / Battery</span>
            </div>
            <div style={kpiValueStyle}>
              {inspection.fuel_level || "Full (100%)"}
            </div>
            <div style={{ ...kpiMetaStyle, color: "var(--ads-green)", fontWeight: 600 }}>
              Operating level
            </div>
          </div>
        </div>

        {/* Defects Alert Banner if applicable */}
        {(inspection.status === "failed" ||
          inspection.status === "caution" ||
          (inspection.defects_found && inspection.defects_found > 0)) && (
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
                <XCircle size={20} style={{ color: "var(--ads-red)" }} />
              ) : (
                <AlertTriangle size={20} style={{ color: "var(--ads-amber)" }} />
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
                  "Driver or safety inspector flagged physical items during vehicle return check. Requires maintenance review."}
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
              <ShieldCheck size={18} style={{ color: "var(--ads-blue)" }} />
              Itemized DVIC Checklist Questions
            </h4>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
              {checklist.filter((i) => i.status === "pass").length} / {checklist.length} Passed
            </span>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderBottom: "1px solid var(--ads-hairline)",
              paddingBottom: "var(--ads-s2)",
              marginBottom: "var(--ads-s4)",
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
                  padding: "7px 15px",
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

          {/* Checklist Items List */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "var(--ads-s3)",
            }}
          >
            {filteredChecklist.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "var(--ads-s6)",
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "var(--ads-ink-quaternary)",
                  background: "var(--ads-canvas)",
                  borderRadius: "var(--ads-r-md)",
                  border: "1px solid var(--ads-hairline)",
                }}
              >
                No checklist items found for this category.
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
              <Camera size={18} style={{ color: "var(--ads-blue)" }} />
              Inspection Photos & Captures ({inspection.images?.length || 0})
            </h4>
            <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-quaternary)" }}>
              Timestamped Inspection Captures
            </span>
          </div>

          {!inspection.images || inspection.images.length === 0 ? (
            <div
              style={{
                padding: "var(--ads-s8)",
                textAlign: "center",
                border: "1px dashed var(--ads-hairline-strong)",
                borderRadius: "var(--ads-r-md)",
                background: "var(--ads-canvas)",
                fontSize: "0.75rem",
                color: "var(--ads-ink-quaternary)",
              }}
            >
              <Camera
                size={28}
                style={{ display: "block", margin: "0 auto var(--ads-s2)", color: "var(--ads-ink-quaternary)" }}
              />
              No defect or exterior photos uploaded with this inspection.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "var(--ads-s4)",
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
                    <Maximize2 size={18} style={{ color: "#FFFFFF" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Footer Metadata */}
        <div
          style={{
            padding: "var(--ads-s4)",
            background: "var(--ads-canvas)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-md)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
            fontSize: "0.75rem",
            color: "var(--ads-ink-tertiary)",
          }}
        >
          <div>
            Submission Source: <strong style={{ color: "var(--ads-ink)" }}>{inspection.submission_source || "Mobile Driver App"}</strong>
          </div>
          <div>
            Verified On: <strong style={{ color: "var(--ads-ink)" }}>{inspection.verified_on ? new Date(inspection.verified_on).toLocaleString() : "Submitted"}</strong>
          </div>
          <div>
            Inspector: <strong style={{ color: "var(--ads-ink)" }}>{inspection.verified_by || inspection.driver_name || "Self-Reported"}</strong>
          </div>
        </div>
      </div>

      {/* Lightbox for inspecting captured photos */}
      {selectedPhoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
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
              alt="Inspection photo enlarged"
              style={{
                maxHeight: "85vh",
                maxWidth: "100%",
                objectFit: "contain",
                margin: "0 auto",
                display: "block",
                borderRadius: "var(--ads-r-lg)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddedInspectionReportView;
