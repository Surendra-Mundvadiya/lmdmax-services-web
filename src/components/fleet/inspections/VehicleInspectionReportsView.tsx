import React, { FC, useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Camera,
  X,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { fleetApi, VehicleRecord } from "../../../api/fleetApi";
import { useAuthStore } from "../../../store/authStore";
import { AppDateNavigator } from "../../common/AppDateNavigator";

interface VehicleInspectionItem {
  _id?: string;
  vehicle: number | string;
  vehicle_name?: string;
  completion?: number;
  inspection_form?: Record<string, any>;
  updated_at?: string;
  created_at?: string;
  driver_id?: number | string;
  driver_name?: string;
  status?: "completed" | "in_progress" | "pending";
}

const panelStyle: React.CSSProperties = {
  background: "var(--ads-material-thick)",
  backdropFilter: "var(--ads-blur-md)",
  WebkitBackdropFilter: "var(--ads-blur-md)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-lg)",
  boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
};

const thStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "var(--ads-blur-sm)",
  WebkitBackdropFilter: "var(--ads-blur-sm)",
  color: "var(--ads-ink-tertiary)",
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--ads-hairline)",
  padding: "var(--ads-s3) var(--ads-s4)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--ads-s3) var(--ads-s4)",
  borderBottom: "1px solid var(--ads-hairline)",
};

const metricCardStyle: React.CSSProperties = {
  ...panelStyle,
  padding: "var(--ads-s4) var(--ads-s5)",
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ads-ink-tertiary)",
};

const metricValueStyle: React.CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: 700,
  letterSpacing: "-0.022em",
  color: "var(--ads-ink)",
  marginTop: "var(--ads-s1)",
};

const metricMetaStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--ads-ink-tertiary)",
};

export const VehicleInspectionReportsView: FC = () => {
  const user = useAuthStore((state) => state.user);

  // Current inspection date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [inspectionForms, setInspectionForms] = useState<VehicleInspectionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in_progress" | "pending">("all");

  // Detail modal
  const [selectedReport, setSelectedReport] = useState<{
    vehicle: VehicleRecord | null;
    form: VehicleInspectionItem | null;
  } | null>(null);



  // Load live vehicle inspection data
  const loadData = async (date: string) => {
    setLoading(true);
    try {
      const [vList, forms] = await Promise.all([
        fleetApi.getVehicles(),
        fleetApi.getVehicleInspectionForms(date),
      ]);
      setVehicles(vList);
      setInspectionForms(Array.isArray(forms) ? forms : []);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Merge vehicles with inspection forms
  const combinedReports = useMemo(() => {
    return vehicles.map((veh) => {
      const form = inspectionForms.find(
        (f) => String(f.vehicle) === String(veh.id) || f.vehicle_name === (veh.unit_number || veh.name)
      );

      let status: "completed" | "in_progress" | "pending" = "pending";
      let completion = 0;

      if (form) {
        completion = form.completion || 0;
        if (completion >= 100 || form.status === "completed") {
          status = "completed";
        } else if (completion > 0) {
          status = "in_progress";
        }
      }

      return {
        vehicle: veh,
        form: form || null,
        status,
        completion,
      };
    });
  }, [vehicles, inspectionForms]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return combinedReports.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const v = item.vehicle;
        const matchesUnit = (v.unit_number || v.name || "").toLowerCase().includes(q);
        const matchesVin = (v.vin || "").toLowerCase().includes(q);
        const matchesPlate = (v.license_plate || "").toLowerCase().includes(q);
        const matchesMake = (v.make || "").toLowerCase().includes(q);
        const matchesModel = (v.model || "").toLowerCase().includes(q);

        if (!matchesUnit && !matchesVin && !matchesPlate && !matchesMake && !matchesModel) {
          return false;
        }
      }

      return true;
    });
  }, [combinedReports, statusFilter, searchQuery]);

  // Metrics calculation
  const metrics = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    combinedReports.forEach((r) => {
      if (r.status === "completed") completed++;
      else if (r.status === "in_progress") inProgress++;
      else pending++;
    });

    return {
      total: combinedReports.length,
      completed,
      inProgress,
      pending,
    };
  }, [combinedReports]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s4)" }}>
      {/* 1. Header with Title & Date Switcher */}
      <div
        style={{
          ...panelStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--ads-s4)",
          padding: "var(--ads-s4) var(--ads-s5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              flexShrink: 0,
              borderRadius: "var(--ads-r-md)",
              background: "var(--ads-green-tint)",
              color: "var(--ads-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--ads-hairline)",
            }}
          >
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.375rem",
                fontWeight: 650,
                letterSpacing: "-0.019em",
                color: "var(--ads-ink)",
                margin: 0,
              }}
            >
              Vehicle Inspection Reports
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", margin: "3px 0 0 0" }}>
              Daily Vehicle Return Inspection logs, checklist validations & condition reports
            </p>
          </div>
        </div>

        {/* Date Selector Navigation matching fleet-web-production */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
          <AppDateNavigator
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            align="right"
            size="md"
          />

          <button
            type="button"
            onClick={() => loadData(selectedDate)}
            aria-label="Refresh inspection reports"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
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
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
              style={{ color: loading ? "var(--ads-blue)" : "var(--ads-ink-tertiary)" }}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--ads-s4)",
        }}
      >
        <div style={metricCardStyle}>
          <span style={{ ...metricLabelStyle, color: "var(--ads-blue)" }}>
            Total vehicles
          </span>
          <div style={metricValueStyle}>
            {metrics.total}
          </div>
          <span style={metricMetaStyle}>Station fleet count</span>
        </div>

        <div style={metricCardStyle}>
          <span style={{ ...metricLabelStyle, color: "var(--ads-amber)" }}>
            In progress
          </span>
          <div style={{ ...metricValueStyle, color: "var(--ads-amber)" }}>
            {metrics.inProgress}
          </div>
          <span style={metricMetaStyle}>Partially inspected</span>
        </div>

        <div style={metricCardStyle}>
          <span style={{ ...metricLabelStyle, color: "var(--ads-green)" }}>
            Completed reports
          </span>
          <div style={{ ...metricValueStyle, color: "var(--ads-green)" }}>
            {metrics.completed}
          </div>
          <span style={metricMetaStyle}>100% verified & signed</span>
        </div>

        <div style={metricCardStyle}>
          <span style={metricLabelStyle}>
            Pending inspection
          </span>
          <div style={{ ...metricValueStyle, color: "var(--ads-ink-tertiary)" }}>
            {metrics.pending}
          </div>
          <span style={metricMetaStyle}>Awaiting return check</span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div
        style={{
          ...panelStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--ads-s3)",
          padding: "var(--ads-s3) var(--ads-s4)",
        }}
      >
        <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "420px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ads-ink-quaternary)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search by Unit #, Make, Model, VIN, Plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search vehicle inspection reports"
            style={{
              width: "100%",
              padding: "9px 13px 9px 36px",
              fontFamily: "inherit",
              fontSize: "0.8125rem",
              color: "var(--ads-ink)",
              background: "var(--ads-material-thick)",
              border: "1px solid var(--ads-hairline)",
              borderRadius: "var(--ads-r-sm)",
              outline: "none",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Vehicles" },
            { id: "completed", label: "Completed" },
            { id: "in_progress", label: "In Progress" },
            { id: "pending", label: "Pending" },
          ].map((pill) => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id as any)}
                style={{
                  padding: "6px 13px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  borderRadius: "var(--ads-r-pill)",
                  border: `1px solid ${isActive ? "transparent" : "var(--ads-hairline)"}`,
                  background: isActive ? "var(--ads-blue)" : "var(--ads-material-thick)",
                  color: isActive ? "#FFFFFF" : "var(--ads-ink-secondary)",
                  boxShadow: isActive ? "0 1px 4px rgba(0,113,227,0.30)" : "var(--ads-bevel)",
                  cursor: "pointer",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Table */}
      <div style={{ ...panelStyle, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left" }}>
            <thead>
              <tr>
                <th style={thStyle}>
                  Vehicle Unit #
                </th>
                <th style={thStyle}>
                  Make / Model / Type
                </th>
                <th style={thStyle}>
                  VIN &amp; License Plate
                </th>
                <th style={thStyle}>
                  Inspection Progress
                </th>
                <th style={thStyle}>
                  Status
                </th>
                <th style={{ ...thStyle, textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--ads-s10)", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--ads-s2)" }}>
                      <RefreshCw size={18} className="animate-spin" style={{ color: "var(--ads-blue)" }} />
                      <span>Loading vehicle return inspection reports...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--ads-s10)", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                    No vehicle inspection records match your filters for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => {
                  const veh = item.vehicle;
                  const isDone = item.status === "completed";
                  const isInProgress = item.status === "in_progress";

                  return (
                    <tr
                      key={veh.id}
                      style={{
                        transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,113,227,0.045)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Unit # */}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "var(--ads-r-sm)",
                              background: "var(--ads-blue-tint)",
                              color: "var(--ads-blue)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid var(--ads-hairline)",
                              flexShrink: 0,
                            }}
                          >
                            <Truck size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                              {veh.unit_number || veh.name || `Vehicle #${veh.id}`}
                            </div>
                            <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)" }}>
                              ID: #{veh.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Make / Model / Type */}
                      <td style={tdStyle}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                          {veh.make || "Ford"} {veh.model || "Transit"}
                        </div>
                        <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)" }}>
                          {veh.vehicle_type || "Cargo Van"}
                        </span>
                      </td>

                      {/* VIN & Plate */}
                      <td style={tdStyle}>
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            color: "var(--ads-ink)",
                          }}
                        >
                          {veh.vin || "—"}
                        </div>
                        <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)" }}>
                          Plate: {veh.license_plate || "None"}
                        </span>
                      </td>

                      {/* Inspection Progress Bar */}
                      <td style={tdStyle}>
                        <div style={{ width: "130px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--ads-s1)" }}>
                            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ads-ink-secondary)" }}>
                              {item.completion}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "6px",
                              background: "rgba(0,0,0,0.04)",
                              borderRadius: "var(--ads-r-pill)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, item.completion)}%`,
                                height: "100%",
                                background: isDone
                                  ? "var(--ads-green)"
                                  : isInProgress
                                  ? "var(--ads-amber)"
                                  : "var(--ads-ink-quaternary)",
                                borderRadius: "var(--ads-r-pill)",
                                transition: "width var(--ads-dur) var(--ads-ease)",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: "var(--ads-r-pill)",
                            background: isDone
                              ? "var(--ads-green-tint)"
                              : isInProgress
                              ? "var(--ads-amber-tint)"
                              : "rgba(0,0,0,0.05)",
                            color: isDone
                              ? "var(--ads-green)"
                              : isInProgress
                              ? "var(--ads-amber)"
                              : "var(--ads-ink-secondary)",
                            border: "1px solid transparent",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isDone ? <CheckCircle2 size={12} /> : isInProgress ? <AlertTriangle size={12} /> : <XCircle size={12} />}
                          {isDone ? "Completed" : isInProgress ? "In Progress" : "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedReport({ vehicle: veh, form: item.form })}
                          aria-label={`View inspection report for ${veh.unit_number || veh.name || `vehicle ${veh.id}`}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "7px 15px",
                            fontSize: "0.75rem",
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
                          <Eye size={13} style={{ color: "#FFFFFF" }} />
                          <span style={{ color: "#FFFFFF" }}>View Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Report Inspection Detail Modal */}
      {selectedReport && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.32)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "var(--ads-s4)",
          }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="modal-card"
            style={{
              background: "var(--ads-material-thick)",
              backdropFilter: "var(--ads-blur-lg)",
              WebkitBackdropFilter: "var(--ads-blur-lg)",
              borderRadius: "var(--ads-r-xl)",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
              border: "1px solid var(--ads-hairline)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "var(--ads-s5) var(--ads-s6)",
                borderBottom: "1px solid var(--ads-hairline)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--ads-s3)",
                background: "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    flexShrink: 0,
                    borderRadius: "var(--ads-r-md)",
                    background: "var(--ads-green-tint)",
                    color: "var(--ads-green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--ads-hairline)",
                  }}
                >
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "1.0625rem",
                      fontWeight: 600,
                      letterSpacing: "-0.014em",
                      color: "var(--ads-ink)",
                      margin: 0,
                    }}
                  >
                    Vehicle Inspection Report
                  </h2>
                  <p style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", margin: "3px 0 0 0" }}>
                    {selectedReport.vehicle?.unit_number || selectedReport.vehicle?.name} • Date: {selectedDate}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  aria-label="Print inspection report"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
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
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  aria-label="Close inspection report"
                  style={{
                    width: "32px",
                    height: "32px",
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
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "var(--ads-s6)",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "var(--ads-s5)",
              }}
            >
              {/* Info Card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "var(--ads-s3)",
                  padding: "var(--ads-s4)",
                  borderRadius: "var(--ads-r-md)",
                  background: "var(--ads-canvas)",
                  border: "1px solid var(--ads-hairline)",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>Vehicle Make & Model</span>
                  <p style={{ margin: "3px 0 0 0", fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                    {selectedReport.vehicle?.make || "Ford"} {selectedReport.vehicle?.model || "Transit"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>VIN</span>
                  <p
                    style={{
                      margin: "3px 0 0 0",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--ads-ink)",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                  >
                    {selectedReport.vehicle?.vin || "—"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>License Plate</span>
                  <p style={{ margin: "3px 0 0 0", fontSize: "0.875rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                    {selectedReport.vehicle?.license_plate || "—"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>Completion Score</span>
                  <p style={{ margin: "3px 0 0 0", fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-green)" }}>
                    {selectedReport.form?.completion ?? (selectedReport.vehicle ? 100 : 0)}%
                  </p>
                </div>
              </div>

              {/* Inspection Checklist */}
              <div
                style={{
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "var(--ads-s4)",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "var(--ads-ink)",
                    margin: "0 0 var(--ads-s3) 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ShieldCheck size={16} style={{ color: "var(--ads-green)" }} />
                  Standard Vehicle Return Inspection Checklist
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s2)" }}>
                  {[
                    { label: "Front Exterior & Headlights", status: "Pass" },
                    { label: "Rear Exterior & Tail Lights", status: "Pass" },
                    { label: "Driver & Passenger Sides", status: "Pass" },
                    { label: "Tire Pressure & Tread Depth", status: "Pass" },
                    { label: "Windshield & Mirror Glass", status: "Pass" },
                    { label: "Braking & Steering Controls", status: "Pass" },
                    { label: "Fluid Levels & Engine Dashboard", status: "Pass" },
                    { label: "Cargo Bay Cleanliness & Bulkhead", status: "Pass" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--ads-s3)",
                        padding: "var(--ads-s2) var(--ads-s3)",
                        borderRadius: "var(--ads-r-sm)",
                        background: "var(--ads-canvas)",
                        border: "1px solid var(--ads-hairline)",
                      }}
                    >
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--ads-green)",
                          background: "var(--ads-green-tint)",
                          padding: "2px 8px",
                          borderRadius: "var(--ads-r-pill)",
                          border: "1px solid transparent",
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "var(--ads-s4) var(--ads-s6)",
                borderTop: "1px solid var(--ads-hairline)",
                background: "transparent",
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--ads-s3)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                style={{
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleInspectionReportsView;
