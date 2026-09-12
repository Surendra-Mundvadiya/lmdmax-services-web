import React, { FC, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ChevronRight,
} from "lucide-react";
import GlassAppLayout from "../layout/GlassAppLayout";
import { ShiftWorkspace } from "./shifts/ShiftWorkspace";
import {
  schedulerApi,
  SchedulerTimeOffItem,
} from "../../api/schedulerApi";

export const SchedulerPage: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTimeOffView =
    location.pathname.includes("time-off") || location.pathname.includes("timeoff");

  const [timeOffRequests, setTimeOffRequests] = useState<SchedulerTimeOffItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadTimeOffData = async () => {
    setLoading(true);
    try {
      const toList = await schedulerApi.getTimeOffRequests();
      setTimeOffRequests(toList);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTimeOffView) {
      loadTimeOffData();
    }
  }, [isTimeOffView]);

  const handleTimeOffAction = async (id: number, status: "approved" | "rejected") => {
    try {
      await schedulerApi.updateTimeOffStatus(id, status);
      loadTimeOffData();
    } catch {
      // Handled
    }
  };

  const filteredTimeOff = timeOffRequests.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (t.driver_name || "").toLowerCase().includes(q) ||
      (t.reason || "").toLowerCase().includes(q) ||
      (t.status || t.leave_status || "").toLowerCase().includes(q)
    );
  });

  return (
    <GlassAppLayout
      currentRoute="scheduler"
      activeBreadcrumb={{ section: "Operations", page: "Schedule" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          gap: "0.85rem",
        }}
      >
        {/* ── Content Area ── */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {!isTimeOffView ? (
            /* VIEW 1: SHIFT ROSTER */
            <div
              className="upload-workspace-container"
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <ShiftWorkspace />
            </div>
          ) : (
            /* VIEW 2: TIME OFF REQUESTS */
            <div
              className="upload-workspace-container"
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              {/* In-Card Header */}
              <div
                style={{
                  padding: "0.85rem 1.25rem",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  flexShrink: 0,
                }}
              >
                {/* Left: Icon + Title + Count */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      backgroundColor: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #DBEAFE",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={19} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          color: "#0F172A",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Time Off Requests
                      </h3>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.55rem",
                          borderRadius: "9999px",
                          backgroundColor: "#EFF6FF",
                          color: "#2563EB",
                          border: "1px solid #BFDBFE",
                        }}
                      >
                        {filteredTimeOff.length}{" "}
                        {filteredTimeOff.length === 1 ? "request" : "requests"}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748B" }}>
                      Driver leave and time off submissions requiring review or approval
                    </p>
                  </div>
                </div>

                {/* Right: In-Card Search and Refresh */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
                  <div className="standard-search-wrap">
                    <Search size={15} className="standard-search-icon" />
                    <input
                      type="text"
                      className="standard-search-input"
                      placeholder="Search requests by driver name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadTimeOffData}
                    className="upload-action-pill-btn"
                    title="Refresh Time Off Requests"
                  >
                    <RefreshCw
                      size={13}
                      className={loading ? "animate-spin" : ""}
                      style={{ color: "#2563EB" }}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Table Area */}
              <div
                className="driver-table-wrapper"
                style={{
                  borderBottomLeftRadius: "18px",
                  borderBottomRightRadius: "18px",
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                <table className="driver-data-table">
                  <thead>
                    <tr>
                      <th>Driver Name</th>
                      <th style={{ width: "140px" }}>Start Date</th>
                      <th style={{ width: "140px" }}>End Date</th>
                      <th>Reason / Notes</th>
                      <th style={{ width: "120px" }}>Status</th>
                      <th style={{ width: "160px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#64748B" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                            <RefreshCw size={24} className="animate-spin" style={{ color: "#2563EB" }} />
                            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                              Loading time-off requests...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTimeOff.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "3.5rem 1rem", color: "#64748B" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                            <Clock size={32} style={{ color: "#94A3B8" }} />
                            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                              No Time Off Requests
                            </h4>
                            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
                              All driver PTO and absence requests will appear here for manager review and approval.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTimeOff.map((req) => (
                        <tr key={req.id}>
                          <td>
                            <span style={{ fontWeight: 650, color: "#0F172A", fontSize: "0.8125rem" }}>
                              {req.driver_name}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
                              {req.start_date}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
                              {req.end_date}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
                              {req.reason || "Personal Leave / PTO"}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "9999px",
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                                backgroundColor:
                                  req.status === "approved"
                                    ? "#ECFDF5"
                                    : req.status === "rejected"
                                    ? "#FEF2F2"
                                    : "#FFFBEB",
                                color:
                                  req.status === "approved"
                                    ? "#059669"
                                    : req.status === "rejected"
                                    ? "#DC2626"
                                    : "#D97706",
                                border:
                                  req.status === "approved"
                                    ? "1px solid #A7F3D0"
                                    : req.status === "rejected"
                                    ? "1px solid #FECACA"
                                    : "1px solid #FDE68A",
                                textTransform: "capitalize",
                              }}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {req.status === "pending" ? (
                              <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  onClick={() => handleTimeOffAction(req.id, "approved")}
                                  style={{
                                    background: "#ECFDF5",
                                    border: "1px solid #A7F3D0",
                                    borderRadius: "8px",
                                    color: "#059669",
                                    padding: "0.3rem 0.65rem",
                                    fontSize: "0.75rem",
                                    fontWeight: 650,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTimeOffAction(req.id, "rejected")}
                                  style={{
                                    background: "#FEF2F2",
                                    border: "1px solid #FECACA",
                                    borderRadius: "8px",
                                    color: "#DC2626",
                                    padding: "0.3rem 0.65rem",
                                    fontSize: "0.75rem",
                                    fontWeight: 650,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                  }}
                                >
                                  <XCircle size={13} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Reviewed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassAppLayout>
  );
};

export default SchedulerPage;
