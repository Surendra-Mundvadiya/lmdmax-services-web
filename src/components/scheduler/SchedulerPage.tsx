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
                  padding: "var(--ads-s3) var(--ads-s5)",
                  borderBottom: "1px solid var(--ads-hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "var(--ads-s3)",
                  background: "var(--ads-material-thin)",
                  WebkitBackdropFilter: "var(--ads-blur-lg)",
                  backdropFilter: "var(--ads-blur-lg)",
                  flexShrink: 0,
                }}
              >
                {/* Left: Icon + Title + Count */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "var(--ads-r-sm)",
                      background: "var(--ads-blue-tint)",
                      color: "var(--ads-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(0, 113, 227, 0.22)",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={19} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                      <h3 className="ads-h3" style={{ margin: 0 }}>
                        Time Off Requests
                      </h3>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          padding: "2px var(--ads-s2)",
                          borderRadius: "var(--ads-r-pill)",
                          background: "var(--ads-blue-tint)",
                          color: "var(--ads-blue)",
                          border: "1px solid rgba(0, 113, 227, 0.22)",
                        }}
                      >
                        {filteredTimeOff.length}{" "}
                        {filteredTimeOff.length === 1 ? "request" : "requests"}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "0.75rem",
                        color: "var(--ads-ink-tertiary)",
                      }}
                    >
                      Driver leave and time off submissions requiring review or approval
                    </p>
                  </div>
                </div>

                {/* Right: In-Card Search and Refresh */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)", flexWrap: "wrap" }}>
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
                    aria-label="Refresh time off requests"
                    title="Refresh Time Off Requests"
                  >
                    <RefreshCw
                      size={13}
                      className={loading ? "animate-spin" : ""}
                      style={{ color: "var(--ads-blue)" }}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Table Area */}
              <div
                className="driver-table-wrapper"
                style={{
                  borderBottomLeftRadius: "var(--ads-r-lg)",
                  borderBottomRightRadius: "var(--ads-r-lg)",
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
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            padding: "var(--ads-s10)",
                            color: "var(--ads-ink-tertiary)",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ads-s2)" }}>
                            <RefreshCw size={24} className="animate-spin" style={{ color: "var(--ads-blue)" }} />
                            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                              Loading time-off requests...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTimeOff.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            padding: "var(--ads-s10) var(--ads-s4)",
                            color: "var(--ads-ink-tertiary)",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ads-s2)" }}>
                            <Clock size={32} style={{ color: "var(--ads-ink-quaternary)" }} />
                            <h4 className="ads-h4" style={{ margin: 0 }}>
                              No Time Off Requests
                            </h4>
                            <p style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", margin: 0 }}>
                              All driver PTO and absence requests will appear here for manager review and approval.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTimeOff.map((req) => (
                        <tr key={req.id}>
                          <td>
                            <span style={{ fontWeight: 600, color: "var(--ads-ink)", fontSize: "0.8125rem" }}>
                              {req.driver_name}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-secondary)" }}>
                              {req.start_date}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-secondary)" }}>
                              {req.end_date}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.8125rem", color: "var(--ads-ink-secondary)" }}>
                              {req.reason || "Personal Leave / PTO"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`ads-badge ${
                                req.status === "approved"
                                  ? "ads-badge--green"
                                  : req.status === "rejected"
                                  ? "ads-badge--red"
                                  : "ads-badge--amber"
                              }`}
                              style={{ textTransform: "capitalize" }}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {req.status === "pending" ? (
                              <div style={{ display: "flex", gap: "var(--ads-s1)", justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  onClick={() => handleTimeOffAction(req.id, "approved")}
                                  className="ads-btn ads-btn--sm"
                                  style={{
                                    background: "var(--ads-green-tint)",
                                    border: "1px solid rgba(36, 138, 61, 0.28)",
                                    color: "var(--ads-green)",
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTimeOffAction(req.id, "rejected")}
                                  className="ads-btn ads-btn--sm"
                                  style={{
                                    background: "var(--ads-red-tint)",
                                    border: "1px solid rgba(215, 0, 21, 0.28)",
                                    color: "var(--ads-red)",
                                  }}
                                >
                                  <XCircle size={13} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                                Reviewed
                              </span>
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
