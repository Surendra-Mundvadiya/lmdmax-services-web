import React, { FC, useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Search,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldAlert,
  Sliders,
  Check,
} from "lucide-react";
import { fleetApi, VehicleRecord } from "../../../api/fleetApi";
import { AppDateNavigator } from "../../common/AppDateNavigator";

export const InspectionCautionView: FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [inspectionForms, setInspectionForms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "caution" | "warning">("all");



  const loadData = async (date: string) => {
    setLoading(true);
    try {
      const [vList, forms] = await Promise.all([
        fleetApi.getVehicles(),
        fleetApi.getDriverInspectionForms(date),
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

  // Derive caution flagged records
  const cautionRecords = useMemo(() => {
    const results: Array<{
      id: string;
      vehicle: VehicleRecord;
      caution_type: string;
      description: string;
      reported_at: string;
      status: "caution" | "resolved" | "monitoring";
    }> = [];

    vehicles.forEach((veh) => {
      const form = inspectionForms.find((f) => String(f.vehicle) === String(veh.id));
      const pre = form?.pre_inspection_info || {};
      const post = form?.post_inspection_info || {};

      if (pre.engine_light === true || post.engine_light === true) {
        results.push({
          id: `engine-${veh.id}`,
          vehicle: veh,
          caution_type: "Engine Light Alert",
          description: "Engine warning light detected during inspection",
          reported_at: form?.created_at || selectedDate,
          status: "caution",
        });
      }

      if (pre.windshield_fluid === false || post.windshield_fluid === false) {
        results.push({
          id: `fluid-${veh.id}`,
          vehicle: veh,
          caution_type: "Washer Fluid Low",
          description: "Windshield washer fluid low, requires top-up",
          reported_at: form?.created_at || selectedDate,
          status: "caution",
        });
      }

      if (pre.clean === false || post.clean === false) {
        results.push({
          id: `clean-${veh.id}`,
          vehicle: veh,
          caution_type: "Cabin Cleanliness",
          description: "Cabin/cargo area flagged for sanitization/cleanup",
          reported_at: form?.created_at || selectedDate,
          status: "caution",
        });
      }
    });

    return results;
  }, [vehicles, inspectionForms, selectedDate]);

  const filteredCautions = useMemo(() => {
    return cautionRecords.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const v = item.vehicle;
        const matchesUnit = (v.unit_number || v.name || "").toLowerCase().includes(q);
        const matchesVin = (v.vin || "").toLowerCase().includes(q);
        const matchesType = item.caution_type.toLowerCase().includes(q);
        if (!matchesUnit && !matchesVin && !matchesType) return false;
      }
      return true;
    });
  }, [cautionRecords, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* 1. Header */}
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
              backgroundColor: "#FFFBEB",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #FDE68A",
            }}
          >
            <AlertCircle size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
              Inspection Question Form
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0.15rem 0 0 0" }}>
              Inspection caution questions, warning flags & preventive resolution tracker
            </p>
          </div>
        </div>

        {/* Right actions: Date Selector & Refresh */}
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

      {/* 2. Metric Cards */}
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
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#D97706", textTransform: "uppercase" }}>
            Active Cautions
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#D97706", marginTop: "0.25rem" }}>
            {cautionRecords.length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Requires fleet attention</span>
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
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>
            Clean / Normal
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>
            {Math.max(0, vehicles.length - cautionRecords.length)}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Zero caution flags</span>
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
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563EB", textTransform: "uppercase" }}>
            Total Evaluated
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2563EB", marginTop: "0.25rem" }}>
            {vehicles.length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Active fleet vehicles</span>
        </div>
      </div>

      {/* 3. Search Bar */}
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
            placeholder="Search caution flags by Unit #, VIN, Caution Type..."
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
      </div>

      {/* 4. Caution Flags Table */}
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
                  CAUTION CATEGORY
                </th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                  ISSUE DETAILS
                </th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                  REPORT DATE
                </th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2.5rem", textAlign: "center", color: "#64748B" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <RefreshCw size={18} className="animate-spin" style={{ color: "#2563EB" }} />
                      <span>Loading inspection caution records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCautions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2.5rem", textAlign: "center", color: "#64748B" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <CheckCircle2 size={32} style={{ color: "#059669" }} />
                      <span style={{ fontWeight: 600, color: "#1E293B" }}>
                        Zero Caution Flags on {selectedDate}
                      </span>
                      <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
                        All inspected vehicles passed cautionary checks without defects.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCautions.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      transition: "background-color 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFFDF5")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            backgroundColor: "#FFFBEB",
                            color: "#D97706",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #FDE68A",
                          }}
                        >
                          <Truck size={16} />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                            {item.vehicle.unit_number || item.vehicle.name}
                          </span>
                          <p style={{ margin: 0, fontSize: "0.6875rem", color: "#64748B" }}>
                            VIN: {item.vehicle.vin}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "4px",
                          backgroundColor: "#FFFBEB",
                          color: "#B45309",
                          border: "1px solid #FDE68A",
                        }}
                      >
                        <AlertTriangle size={12} />
                        {item.caution_type}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8125rem", color: "#475569" }}>
                      {item.description}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8125rem", color: "#64748B" }}>
                      {item.reported_at}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#B45309",
                          backgroundColor: "#FEF3C7",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        Needs Review
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InspectionCautionView;
