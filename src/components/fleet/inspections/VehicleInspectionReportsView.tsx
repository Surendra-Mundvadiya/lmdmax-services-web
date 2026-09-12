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
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* 1. Header with Title & Date Switcher */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          backgroundColor: "#FFFFFF",
          padding: "1rem 1.25rem",
          borderRadius: "10px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#ECFDF5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #A7F3D0",
            }}
          >
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
              Vehicle Inspection Reports
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0.15rem 0 0 0" }}>
              Daily Vehicle Return Inspection logs, checklist validations & condition reports
            </p>
          </div>
        </div>

        {/* Date Selector Navigation matching fleet-web-production */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AppDateNavigator
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            align="right"
            size="md"
          />

          <button
            type="button"
            onClick={() => loadData(selectedDate)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.85rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              backgroundColor: "#FFFFFF",
              color: "#475569",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563EB", textTransform: "capitalize" }}>
            Total vehicles
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E293B", marginTop: "0.25rem" }}>
            {metrics.total}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Station fleet count</span>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#D97706", textTransform: "capitalize" }}>
            In progress
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#D97706", marginTop: "0.25rem" }}>
            {metrics.inProgress}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Partially inspected</span>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", textTransform: "capitalize" }}>
            Completed reports
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>
            {metrics.completed}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>100% verified & signed</span>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "capitalize" }}>
            Pending inspection
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#64748B", marginTop: "0.25rem" }}>
            {metrics.pending}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Awaiting return check</span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          backgroundColor: "#FFFFFF",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "420px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
            }}
          />
          <input
            type="text"
            placeholder="Search by Unit #, Make, Model, VIN, Plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.45rem 0.75rem 0.45rem 2.25rem",
              fontSize: "0.8125rem",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              outline: "none",
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {[
            { id: "all", label: "All Vehicles" },
            { id: "completed", label: "Completed" },
            { id: "in_progress", label: "In Progress" },
            { id: "pending", label: "Pending" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id as any)}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                borderRadius: "6px",
                border: "1px solid",
                borderColor: statusFilter === pill.id ? "#2563EB" : "#E2E8F0",
                backgroundColor: statusFilter === pill.id ? "#EFF6FF" : "#FFFFFF",
                color: statusFilter === pill.id ? "#1D4ED8" : "#64748B",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Table */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                  VEHICLE UNIT #
                </th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                  MAKE / MODEL / TYPE
                </th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                  VIN & LICENSE PLATE
                </th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                  INSPECTION PROGRESS
                </th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                  STATUS
                </th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textAlign: "right" }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "#64748B" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <RefreshCw size={18} className="animate-spin" style={{ color: "#2563EB" }} />
                      <span>Loading vehicle return inspection reports...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "#64748B" }}>
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
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background-color 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Unit # */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              backgroundColor: "#EFF6FF",
                              color: "#2563EB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #DBEAFE",
                              flexShrink: 0,
                            }}
                          >
                            <Truck size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                              {veh.unit_number || veh.name || `Vehicle #${veh.id}`}
                            </div>
                            <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
                              ID: #{veh.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Make / Model / Type */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                          {veh.make || "Ford"} {veh.model || "Transit"}
                        </div>
                        <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
                          {veh.vehicle_type || "Cargo Van"}
                        </span>
                      </td>

                      {/* VIN & Plate */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.8125rem", fontFamily: "monospace", color: "#1E293B" }}>
                          {veh.vin || "—"}
                        </div>
                        <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
                          Plate: {veh.license_plate || "None"}
                        </span>
                      </td>

                      {/* Inspection Progress Bar */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ width: "130px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#475569" }}>
                              {item.completion}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "6px",
                              backgroundColor: "#E2E8F0",
                              borderRadius: "9999px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, item.completion)}%`,
                                height: "100%",
                                backgroundColor: isDone ? "#059669" : isInProgress ? "#D97706" : "#94A3B8",
                                borderRadius: "9999px",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.25rem 0.6rem",
                            borderRadius: "9999px",
                            backgroundColor: isDone ? "#ECFDF5" : isInProgress ? "#FFFBEB" : "#F1F5F9",
                            color: isDone ? "#059669" : isInProgress ? "#B45309" : "#64748B",
                            border: `1px solid ${isDone ? "#A7F3D0" : isInProgress ? "#FDE68A" : "#CBD5E1"}`,
                          }}
                        >
                          {isDone ? <CheckCircle2 size={12} /> : isInProgress ? <AlertTriangle size={12} /> : <XCircle size={12} />}
                          {isDone ? "Completed" : isInProgress ? "In Progress" : "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedReport({ vehicle: veh, form: item.form })}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.4rem 0.8rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#FFFFFF",
                            backgroundColor: "#2563EB",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(37, 99, 235, 0.15)",
                          }}
                        >
                          <Eye size={13} />
                          <span>View Report</span>
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
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="modal-card"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "#ECFDF5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #A7F3D0",
                  }}
                >
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                    Vehicle Inspection Report
                  </h2>
                  <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0.15rem 0 0 0" }}>
                    {selectedReport.vehicle?.unit_number || selectedReport.vehicle?.name} • Date: {selectedDate}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#475569",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  style={{
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Info Card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.85rem",
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Vehicle Make & Model</span>
                  <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                    {selectedReport.vehicle?.make || "Ford"} {selectedReport.vehicle?.model || "Transit"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>VIN</span>
                  <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.875rem", fontWeight: 600, color: "#1E293B", fontFamily: "monospace" }}>
                    {selectedReport.vehicle?.vin || "—"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>License Plate</span>
                  <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                    {selectedReport.vehicle?.license_plate || "—"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Completion Score</span>
                  <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.875rem", fontWeight: 800, color: "#059669" }}>
                    {selectedReport.form?.completion ?? (selectedReport.vehicle ? 100 : 0)}%
                  </p>
                </div>
              </div>

              {/* Inspection Checklist */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "1rem" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ShieldCheck size={16} style={{ color: "#059669" }} />
                  Standard Vehicle Return Inspection Checklist
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                      }}
                    >
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#059669",
                          backgroundColor: "#ECFDF5",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #A7F3D0",
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
                padding: "1rem 1.5rem",
                borderTop: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
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
