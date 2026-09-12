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
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-md)",
          WebkitBackdropFilter: "var(--ads-blur-md)",
          padding: "var(--ads-s4) var(--ads-s5)",
          borderRadius: "var(--ads-r-lg)",
          border: "1px solid var(--ads-hairline)",
          boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "var(--ads-amber-tint)",
              color: "var(--ads-amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--ads-hairline)",
            }}
          >
            <AlertCircle size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ads-ink)", margin: 0, letterSpacing: "-0.022em" }}>
              Inspection Question Form
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", margin: "0.15rem 0 0 0" }}>
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
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-md)",
            WebkitBackdropFilter: "var(--ads-blur-md)",
            padding: "var(--ads-s4) var(--ads-s5)",
            borderRadius: "var(--ads-r-lg)",
            border: "1px solid var(--ads-hairline)",
            boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
            transition: "transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-sm), var(--ads-bevel)";
          }}
        >
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--ads-amber)", textTransform: "uppercase" }}>
            Active Cautions
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ads-amber)", marginTop: "0.25rem", letterSpacing: "-0.022em" }}>
            {cautionRecords.length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>Requires fleet attention</span>
        </div>

        <div
          style={{
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-md)",
            WebkitBackdropFilter: "var(--ads-blur-md)",
            padding: "var(--ads-s4) var(--ads-s5)",
            borderRadius: "var(--ads-r-lg)",
            border: "1px solid var(--ads-hairline)",
            boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
            transition: "transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-sm), var(--ads-bevel)";
          }}
        >
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--ads-green)", textTransform: "uppercase" }}>
            Clean / Normal
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ads-green)", marginTop: "0.25rem", letterSpacing: "-0.022em" }}>
            {Math.max(0, vehicles.length - cautionRecords.length)}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>Zero caution flags</span>
        </div>

        <div
          style={{
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-md)",
            WebkitBackdropFilter: "var(--ads-blur-md)",
            padding: "var(--ads-s4) var(--ads-s5)",
            borderRadius: "var(--ads-r-lg)",
            border: "1px solid var(--ads-hairline)",
            boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
            transition: "transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--ads-shadow-sm), var(--ads-bevel)";
          }}
        >
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--ads-blue)", textTransform: "uppercase" }}>
            Total Evaluated
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ads-blue)", marginTop: "0.25rem", letterSpacing: "-0.022em" }}>
            {vehicles.length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>Active fleet vehicles</span>
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
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-md)",
          WebkitBackdropFilter: "var(--ads-blur-md)",
          padding: "var(--ads-s3) var(--ads-s4)",
          borderRadius: "var(--ads-r-md)",
          border: "1px solid var(--ads-hairline)",
          boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
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
              color: "var(--ads-ink-quaternary)",
            }}
          />
          <input
            type="text"
            placeholder="Search caution flags by Unit #, VIN, Caution Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 13px 9px 2.25rem",
              fontSize: "0.8125rem",
              border: "1px solid var(--ads-hairline)",
              background: "var(--ads-material-thick)",
              color: "var(--ads-ink)",
              borderRadius: "var(--ads-r-sm)",
              outline: "none",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          />
        </div>
      </div>

      {/* 4. Caution Flags Table */}
      <div
        style={{
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-md)",
          WebkitBackdropFilter: "var(--ads-blur-md)",
          borderRadius: "var(--ads-r-lg)",
          border: "1px solid var(--ads-hairline)",
          overflow: "hidden",
          boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                  VEHICLE UNIT #
                </th>
                <th style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                  CAUTION CATEGORY
                </th>
                <th style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                  ISSUE DETAILS
                </th>
                <th style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                  REPORT DATE
                </th>
                <th style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "var(--ads-s10)", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <RefreshCw size={18} className="animate-spin" style={{ color: "var(--ads-blue)" }} />
                      <span>Loading inspection caution records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCautions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "var(--ads-s10)", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <CheckCircle2 size={32} style={{ color: "var(--ads-green)" }} />
                      <span style={{ fontWeight: 600, color: "var(--ads-ink)" }}>
                        Zero Caution Flags on {selectedDate}
                      </span>
                      <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
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
                      borderBottom: "1px solid var(--ads-hairline)",
                      transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,113,227,0.045)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "var(--ads-s3) var(--ads-s4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "var(--ads-r-xs)",
                            backgroundColor: "var(--ads-amber-tint)",
                            color: "var(--ads-amber)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid var(--ads-hairline)",
                          }}
                        >
                          <Truck size={16} />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                            {item.vehicle.unit_number || item.vehicle.name}
                          </span>
                          <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)" }}>
                            VIN: {item.vehicle.vin}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "var(--ads-s3) var(--ads-s4)" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: "var(--ads-r-pill)",
                          backgroundColor: "var(--ads-amber-tint)",
                          color: "var(--ads-amber)",
                          border: "1px solid transparent",
                        }}
                      >
                        <AlertTriangle size={12} />
                        {item.caution_type}
                      </span>
                    </td>
                    <td style={{ padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.8125rem", color: "var(--ads-ink-secondary)" }}>
                      {item.description}
                    </td>
                    <td style={{ padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
                      {item.reported_at}
                    </td>
                    <td style={{ padding: "var(--ads-s3) var(--ads-s4)" }}>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--ads-amber)",
                          backgroundColor: "var(--ads-amber-tint)",
                          padding: "3px 9px",
                          borderRadius: "var(--ads-r-pill)",
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
