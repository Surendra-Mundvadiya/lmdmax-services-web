import React, { FC, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Camera,
  Award,
  ChevronRight,
} from "lucide-react";
import GlassAppLayout from "../layout/GlassAppLayout";
import UnifiedCurationTable from "./UnifiedCurationTable";
import NetradyneCurationTable from "./NetradyneCurationTable";
import EmentorCurationTable from "./EmentorCurationTable";
import {
  curationApi,
  RemainingCuration,
  UnresolvedNetradyneCuration,
  EmentorCurationItem,
} from "../../api/curationApi";
import { useCurationStore } from "../../store/curationStore";
import { useDriverStore } from "../../store/driverStore";

export type CurationTabType = "unified" | "netradyne" | "ementor";

export const CurationsPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Current active tab
  const [activeTab, setActiveTab] = useState<CurationTabType>("unified");

  // Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // Real data state
  const [unifiedCurations, setUnifiedCurations] = useState<RemainingCuration[]>([]);
  const [netradyneCurations, setNetradyneCurations] = useState<UnresolvedNetradyneCuration[]>([]);
  const [ementorCurations, setEmentorCurations] = useState<EmentorCurationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Store actions
  const curationCounts = useCurationStore((state) => state.counts);
  const fetchCurationCount = useCurationStore((state) => state.fetchCurationCount);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);

  // Notification Banner
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = useCallback((msg: { text: string; type: "success" | "error" }) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr?.text === msg.text ? null : curr));
    }, 4500);
  }, []);

  // Fetch all real curations from performance microservice
  const loadCurationData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [unifiedRes, netradyneRes, ementorRes] = await Promise.all([
        curationApi.getUnifiedCurations().catch(() => ({ remainingCurations: [] })),
        curationApi.getNetradyneCurations().catch(() => ({ updatedCurations: [] })),
        curationApi.getEmentorCurations().catch(() => []),
      ]);

      setUnifiedCurations(unifiedRes.remainingCurations || []);
      setNetradyneCurations(netradyneRes.updatedCurations || []);
      setEmentorCurations(ementorRes || []);

      // Also refresh live badge counts
      await fetchCurationCount(true);
    } catch (err: any) {
      showNotification({
        text: err?.message || "Failed to load curation data",
        type: "error",
      });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fetchCurationCount, showNotification]);

  // Initial mount
  useEffect(() => {
    loadCurationData();
    fetchDrivers();
  }, [loadCurationData, fetchDrivers]);

  // Handle incoming notification from navigation (e.g. driver added from curation)
  useEffect(() => {
    const locState = location.state as any;
    if (locState?.notification) {
      showNotification(locState.notification);
      window.history.replaceState({}, document.title, window.location.pathname);
      loadCurationData(true);
    }
  }, [location.state, showNotification, loadCurationData]);

  // Handlers for Add Driver -> Navigate directly to Add Driver screen with returnUrl and from metadata
  const handleAddUnifiedDriver = (row: RemainingCuration) => {
    navigate("/operations?mode=add", {
      state: {
        viewMode: "add",
        from: "curations",
        returnUrl: "/curations",
        initialDriver: {
          name: row.name,
          first_name: (row.name || "").split(" ")[0] || "",
          last_name: (row.name || "").split(" ").slice(1).join(" ") || "",
          transporter_id: (row.transporter_id || "").replace(/^#+/, ""),
          curation_id: row._id,
          curation_type: "unified",
        },
      },
    });
  };

  const handleAddNetradyneDriver = (row: UnresolvedNetradyneCuration) => {
    navigate("/operations?mode=add", {
      state: {
        viewMode: "add",
        from: "curations",
        returnUrl: "/curations",
        initialDriver: {
          name: row.driver_name,
          first_name: (row.driver_name || "").split(" ")[0] || "",
          last_name: (row.driver_name || "").split(" ").slice(1).join(" ") || "",
          netradyne_id: (row.netradyne_id || "").replace(/^#+/, ""),
          transporter_id: "",
          curation_id: row._id,
          curation_type: "netradyne",
        },
      },
    });
  };

  const handleAddEmentorDriver = (row: EmentorCurationItem) => {
    navigate("/operations?mode=add", {
      state: {
        viewMode: "add",
        from: "curations",
        returnUrl: "/curations",
        initialDriver: {
          name: row.name,
          first_name: (row.name || "").split(" ")[0] || "",
          last_name: (row.name || "").split(" ").slice(1).join(" ") || "",
          transporter_id: "",
          curation_id: row._id,
          curation_type: "ementor",
        },
      },
    });
  };

  // Resolved tab badge numbers
  const unifiedBadgeCount = unifiedCurations.length || curationCounts.transporter_id || 0;
  const netradyneBadgeCount = netradyneCurations.length || curationCounts.netradyne || 0;
  const ementorBadgeCount = ementorCurations.length || curationCounts.ementor || 0;

  const activeTabMeta = {
    unified: {
      label: "Unified Transporter ID",
      icon: Layers,
      count: unifiedBadgeCount,
      desc: "Drivers matched by Amazon Transporter ID",
    },
    netradyne: {
      label: "Netradyne Telematics",
      icon: Camera,
      count: netradyneBadgeCount,
      desc: "Telematics and safety camera profiles",
    },
    ementor: {
      label: "Mentor FICO",
      icon: Award,
      count: ementorBadgeCount,
      desc: "eMentor FICO driver score records",
    },
  }[activeTab];

  const ActiveTabIcon = activeTabMeta.icon;

  return (
    <GlassAppLayout
      currentRoute="curations"
      activeBreadcrumb={{ section: "Utilities", page: "Curations" }}
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
        {/* ── 1. Top Header Options on the Background Screen (No Second Header Card, No Top Search) ── */}
        <div className="upload-filter-toolbar">
          {/* Left: Breadcrumbs in the normal way on the background screen */}
          <div className="upload-breadcrumb-wrap">
            <span
              className="upload-breadcrumb-root"
              onClick={() => navigate("/dashboard")}
            >
              Utilities
            </span>
            <ChevronRight size={14} style={{ color: "#64748B" }} />
            <span className="upload-breadcrumb-current">Curations</span>
            <ChevronRight size={14} style={{ color: "#64748B" }} />
            <span className="upload-breadcrumb-active-report">
              {activeTabMeta.label}
            </span>
          </div>

          {/* Right: View by Capsule Pills */}
          <div className="upload-view-by-wrap">
            <span className="upload-view-by-label">View by</span>
            <div className="upload-segmented-capsule">
              <button
                type="button"
                className={`upload-segmented-btn ${activeTab === "unified" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("unified");
                  setSearchQuery("");
                }}
              >
                <span>Unified</span>
                {unifiedBadgeCount > 0 && (
                  <span className="upload-segmented-count">{unifiedBadgeCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`upload-segmented-btn ${activeTab === "netradyne" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("netradyne");
                  setSearchQuery("");
                }}
              >
                <span>Netradyne</span>
                {netradyneBadgeCount > 0 && (
                  <span className="upload-segmented-count">{netradyneBadgeCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`upload-segmented-btn ${activeTab === "ementor" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("ementor");
                  setSearchQuery("");
                }}
              >
                <span>eMentor</span>
                {ementorBadgeCount > 0 && (
                  <span className="upload-segmented-count">{ementorBadgeCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="notification-banner-wrapper">
            <div className={`notification-banner ${notification.type}`}>
              {notification.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="notification-message">{notification.text}</span>
              <button
                type="button"
                className="close-notif-btn"
                onClick={() => setNotification(null)}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── 2. Clean Floating Workspace Container Card ── */}
        <div className="upload-workspace-container" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {/* In-Card Header with squircle avatar/icon, active title, description and in-card search */}
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
            {/* Left: Squircle Icon + Title + Count Pill */}
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
                <ActiveTabIcon size={19} />
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
                    {activeTabMeta.label}
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
                    {activeTabMeta.count} {activeTabMeta.count === 1 ? "record" : "records"}
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748B" }}>
                  {activeTabMeta.desc}
                </p>
              </div>
            </div>

            {/* Right: In-Card Search Input */}
            <div className="standard-search-wrap">
              <Search size={15} className="standard-search-icon" />
              <input
                type="text"
                className="standard-search-input"
                placeholder="Search Curation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="standard-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Table Scroll Area */}
          <div className="curations-scroll-area" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {activeTab === "unified" && (
              <UnifiedCurationTable
                curations={unifiedCurations}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onAddDriver={handleAddUnifiedDriver}
              />
            )}

            {activeTab === "netradyne" && (
              <NetradyneCurationTable
                curations={netradyneCurations}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onAddDriver={handleAddNetradyneDriver}
              />
            )}

            {activeTab === "ementor" && (
              <EmentorCurationTable
                curations={ementorCurations}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onAddDriver={handleAddEmentorDriver}
              />
            )}
          </div>
        </div>
      </div>
    </GlassAppLayout>
  );
};

export default CurationsPage;
