import React, {
  FC,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Search,
  ShieldAlert,
  ChevronDown,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  X,
  Calendar,
  Car,
  User,
  Paperclip,
  CheckCircle2,
  Clock,
  Plus,
  Send,
} from "lucide-react";
import { axiosInstance, getClientTimeZone } from "../../../api/axiosClient";
import { useAuthStore } from "../../../store/authStore";
import { fleetApi, VehicleRecord } from "../../../api/fleetApi";
import { useSearchParams } from "react-router-dom";
import {
  FilterStatus,
  TabType,
  InjuryType,
  IncidentListItem,
  InjuryListItem,
} from "./types";
import AccidentDetailModal from "./AccidentDetailModal";
import InjuryDetailModal from "./InjuryDetailModal";
import SendReportLinkModal from "./SendReportLinkModal";
import SendReportLinkScreen from "./SendReportLinkScreen";
import AddAccidentModal from "./AddAccidentModal";
import AddInjuryModal from "./AddInjuryModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import DownloadReportButton from "./DownloadReportButton";
import "./incident.css";

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

function statusStyle(s: string): React.CSSProperties {
  const lower = (s || "").toLowerCase();
  if (lower === "open")
    return {
      backgroundColor: "#FEF2F2",
      color: "#DC2626",
      border: "1px solid #FECACA",
    };
  if (lower === "resolved")
    return {
      backgroundColor: "#ECFDF5",
      color: "#065F46",
      border: "1px solid #A7F3D0",
    };
  return {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    border: "1px solid #CBD5E1",
  };
}

function injuryTypeLabel(t: string): string {
  switch (t) {
    case "vehicle_without_injury":
      return "Vehicle — No Injury";
    case "injury_with_vehicle":
      return "Vehicle + Injury";
    case "injury_without_vehicle":
      return "No Vehicle";
    default:
      return t || "—";
  }
}

export const AccidentInjuryView: FC = () => {
  const { user, stations } = useAuthStore();
  const currentStation = stations?.find((s) => s.current) || stations?.[0];
  const companyType = user?.company?.type || (currentStation as any)?.type || "lmd";
  const isLMD = companyType === "lmd";

  // ── Main State & URL Sync ──
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === "injury" ? "injury" : "accident"
  );

  useEffect(() => {
    if (tabParam === "injury" && activeTab !== "injury") {
      setActiveTab("injury");
    } else if (tabParam === "accident" && activeTab !== "accident") {
      setActiveTab("accident");
    }
  }, [tabParam, activeTab]);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [injuryTypeFilter, setInjuryTypeFilter] = useState<InjuryType>("all");
  const [searchText, setSearchText] = useState("");

  // Raw lists from APIs
  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [injuries, setInjuries] = useState<InjuryListItem[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [loadingInjuries, setLoadingInjuries] = useState(false);

  // Vehicles and drivers for fallback names
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [driversMap, setDriversMap] = useState<Map<string, string>>(new Map());

  // Screens and Modals state
  const [isSendReportScreenOpen, setIsSendReportScreenOpen] = useState(false);
  const [detailAccidentId, setDetailAccidentId] = useState<string | null>(null);
  const [detailInjuryId, setDetailInjuryId] = useState<string | null>(null);
  const [sendReportModal, setSendReportModal] = useState<{
    open: boolean;
    type: "accident" | "injury";
  }>({ open: false, type: "accident" });
  const [addReportModal, setAddReportModal] = useState<{
    open: boolean;
    type: "accident" | "injury";
  }>({ open: false, type: "accident" });
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    otherFormId?: string;
  } | null>(null);

  // Dropdowns for header buttons
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const toastTimer = useRef<any>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // Close add dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(e.target as Node)
      ) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Load Reference Drivers & Vehicles ──
  useEffect(() => {
    fleetApi
      .getVehicles()
      .then((res) => setVehicles(res || []))
      .catch(() => {});

    axiosInstance
      .get("drivers/v1/drivers/all_stations?limit=700&is_deleted=false")
      .then((res) => {
        const raw = res.data?.data?.data || res.data?.data || res.data || [];
        const list: any[] = Array.isArray(raw) ? raw : raw?.drivers || [];
        const map = new Map<string, string>();
        list.forEach((d: any) => {
          const name = String(
            d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Driver #${d.id}`
          );
          map.set(String(d.id), name);
        });
        setDriversMap(map);
      })
      .catch(() => {});
  }, []);

  // ── Fetch Incidents ──
  const fetchIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    try {
      const res = await axiosInstance.get("/incident_report_form/v1/incident_report_v2");
      const raw: any[] = res.data?.data || res.data || [];
      const mapped: IncidentListItem[] = raw.map((item: any) => {
        const dId = item.driver != null ? String(item.driver) : "";
        const vId = item.vehicle != null ? String(item.vehicle) : "";
        const resolvedDriverName =
          item.driver_name || (dId ? driversMap.get(dId) : null) || (dId ? `Driver #${dId}` : "Unknown");
        const foundVehicle = vId ? vehicles.find((v) => String(v.id) === vId) : null;
        const resolvedVehicleName =
          item.vehicle_name ||
          item.vehicle_unit ||
          foundVehicle?.unit_number ||
          foundVehicle?.name ||
          (vId ? `VAN-${vId}` : "Unknown");

        return {
          id: String(item._id || item.id || ""),
          date: item.date || null,
          driver: item.driver ?? null,
          vehicle: item.vehicle ?? null,
          lawsuitFiled: !!item.has_third_party_lawsuit,
          status: item.status || "open",
          addedByName: item.added_by_name || "",
          addedByType: String(item.added_by_type || ""),
          otherFormId: item.injury_form_id || "",
          driverName: resolvedDriverName,
          vehicleName: resolvedVehicleName,
          vin: item.vin || foundVehicle?.vin || "—",
          plateNumber: item.plate_number || item.license_plate || foundVehicle?.license_plate || "—",
        };
      });
      setIncidents(mapped);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load accident reports", "error");
      setIncidents([]);
    } finally {
      setLoadingIncidents(false);
    }
  }, [driversMap, vehicles]);

  // ── Fetch Injuries ──
  const fetchInjuries = useCallback(async () => {
    setLoadingInjuries(true);
    try {
      const res = await axiosInstance.get(
        `/injury_report/v1/get_all_injury?injury_type=${injuryTypeFilter}&status=${statusFilter}`
      );
      const raw: any[] = res.data?.data || res.data || [];
      const mapped: InjuryListItem[] = raw.map((item: any) => {
        const dId = item.driver != null ? String(item.driver) : "";
        const vId = item.vehicle != null ? String(item.vehicle) : "";
        const resolvedDriverName =
          item.personal_information?.driver_name ||
          item.driver_name ||
          (dId ? driversMap.get(dId) : null) ||
          (dId ? `Driver #${dId}` : "Unknown");
        const foundVehicle = vId ? vehicles.find((v) => String(v.id) === vId) : null;
        const resolvedVehicleName =
          item.vehicle_information?.vehicle_name ||
          foundVehicle?.unit_number ||
          foundVehicle?.name ||
          (vId ? `VAN-${vId}` : "—");

        return {
          id: String(item._id || item.id || ""),
          date: item.incident_event_information?.incident_date || item.date || null,
          driver: item.driver ?? null,
          vehicle: item.vehicle ?? null,
          status: item.status || "open",
          injuryType: item.injury_type || "all",
          driverName: resolvedDriverName,
          vehicleName: resolvedVehicleName,
          vin: item.vehicle_information?.vin_no || foundVehicle?.vin || "—",
          plateNumber:
            item.vehicle_information?.vehicle_license_plate ||
            foundVehicle?.license_plate ||
            "—",
          addedByName: item.added_by_name || "",
          addedByType: String(item.added_by_type || ""),
          otherFormId: item.accident_form_id || "",
        };
      });
      setInjuries(mapped);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load injury reports", "error");
      setInjuries([]);
    } finally {
      setLoadingInjuries(false);
    }
  }, [injuryTypeFilter, statusFilter, driversMap, vehicles]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (isLMD && activeTab === "injury") fetchInjuries();
  }, [activeTab, isLMD, fetchInjuries]);

  // ── Quick Toggle Status from Table ──
  const handleToggleRowStatus = async (
    id: string,
    currentStatus: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const newStatus = currentStatus.toLowerCase() === "resolved" ? "open" : "resolved";
    const isAccident = activeTab === "accident";
    const tz = getClientTimeZone();

    try {
      if (isAccident) {
        await axiosInstance.patch(
          `/incident_report_form/v1/incident_report/${id}?timezone=${encodeURIComponent(tz)}`,
          { status: newStatus }
        );
        setIncidents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      } else {
        await axiosInstance.patch(`/injury_report/v1/change_status/${id}`, {
          status: newStatus,
        });
        setInjuries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
      showToast(`Status updated to ${newStatus}`, "success");
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  // ── Delete Handler ──
  const handleDeleteConfirm = async (mode: "single" | "both") => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    const isAccident = activeTab === "accident";
    try {
      if (isAccident) {
        await axiosInstance.delete(
          `/incident_report_form/v1/incident_report/${id}?vehicle=true&query=${mode === "both" ? "both" : "one"}`
        );
      } else {
        await axiosInstance.delete(
          `/injury_report/v1/injury_report/${id}?query=${mode === "both" ? "both" : "one"}`
        );
      }
      showToast(
        `${isAccident ? "Accident" : "Injury"} report deleted successfully`,
        "success"
      );
      setDeleteTarget(null);
      if (isAccident) fetchIncidents();
      else fetchInjuries();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Delete failed", "error");
      setDeleteTarget(null);
    }
  };

  // ── Filtered Data ──
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const statusMatch =
        statusFilter === "all" || inc.status.toLowerCase() === statusFilter;
      const q = searchText.toLowerCase().trim();
      const searchMatch =
        !q ||
        inc.driverName.toLowerCase().includes(q) ||
        inc.vehicleName.toLowerCase().includes(q) ||
        inc.vin.toLowerCase().includes(q) ||
        inc.plateNumber.toLowerCase().includes(q) ||
        inc.status.toLowerCase().includes(q);
      return statusMatch && searchMatch;
    });
  }, [incidents, statusFilter, searchText]);

  const filteredInjuries = useMemo(() => {
    return injuries.filter((inj) => {
      const statusMatch =
        statusFilter === "all" || inj.status.toLowerCase() === statusFilter;
      const injuryMatch =
        injuryTypeFilter === "all" || inj.injuryType === injuryTypeFilter;
      const q = searchText.toLowerCase().trim();
      const searchMatch =
        !q ||
        inj.driverName.toLowerCase().includes(q) ||
        inj.vehicleName.toLowerCase().includes(q) ||
        inj.vin.toLowerCase().includes(q) ||
        inj.status.toLowerCase().includes(q);
      return statusMatch && injuryMatch && searchMatch;
    });
  }, [injuries, statusFilter, injuryTypeFilter, searchText]);

  const isLoading = activeTab === "accident" ? loadingIncidents : loadingInjuries;
  const displayList = activeTab === "accident" ? filteredIncidents : filteredInjuries;
  const totalRaw = activeTab === "accident" ? incidents.length : injuries.length;

  // Status counts for active tab
  const currentTabList = activeTab === "accident" ? incidents : injuries;
  const allCount = currentTabList.length;
  const openCount = useMemo(
    () => currentTabList.filter((item) => item.status.toLowerCase() === "open").length,
    [currentTabList]
  );
  const resolvedCount = useMemo(
    () => currentTabList.filter((item) => item.status.toLowerCase() === "resolved").length,
    [currentTabList]
  );

  // Render Send Report Link embedded directly in background complete screen
  if (isSendReportScreenOpen) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
        }}
      >
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "70px",
              right: "24px",
              zIndex: 99999,
              backgroundColor: toast.type === "success" ? "#065F46" : "#991B1B",
              color: "#FFFFFF",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {toast.message}
          </div>
        )}

        <SendReportLinkScreen
          initialType={activeTab}
          onClose={() => setIsSendReportScreenOpen(false)}
          onSuccessToast={(msg) => showToast(msg, "success")}
        />
      </div>
    );
  }

  // Render accident details embedded directly in background complete screen
  if (detailAccidentId) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
        }}
      >
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "70px",
              right: "24px",
              zIndex: 99999,
              backgroundColor: toast.type === "success" ? "#065F46" : "#991B1B",
              color: "#FFFFFF",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {toast.message}
          </div>
        )}

        <AccidentDetailModal
          incidentId={detailAccidentId}
          embedded={true}
          onClose={() => setDetailAccidentId(null)}
          onStatusUpdated={(id, s) => {
            setIncidents((prev) =>
              prev.map((it) => (it.id === id ? { ...it, status: s } : it))
            );
          }}
          onViewLinkedInjury={(injId) => {
            setDetailAccidentId(null);
            setDetailInjuryId(injId);
          }}
        />
      </div>
    );
  }

  // Render injury details embedded directly in background complete screen
  if (detailInjuryId) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
        }}
      >
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "70px",
              right: "24px",
              zIndex: 99999,
              backgroundColor: toast.type === "success" ? "#065F46" : "#991B1B",
              color: "#FFFFFF",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {toast.message}
          </div>
        )}

        <InjuryDetailModal
          injuryId={detailInjuryId}
          embedded={true}
          onClose={() => setDetailInjuryId(null)}
          onStatusUpdated={(id, s) => {
            setInjuries((prev) =>
              prev.map((it) => (it.id === id ? { ...it, status: s } : it))
            );
          }}
          onViewLinkedAccident={(accId) => {
            setDetailInjuryId(null);
            setDetailAccidentId(accId);
          }}
        />
      </div>
    );
  }

  // Render Add Accident Report embedded directly in background complete screen
  if (addReportModal.open && addReportModal.type === "accident") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "70px",
              right: "24px",
              zIndex: 99999,
              backgroundColor: toast.type === "success" ? "#065F46" : "#991B1B",
              color: "#FFFFFF",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}

        <AddAccidentModal
          open={true}
          embedded={true}
          onClose={() => setAddReportModal({ open: false, type: "accident" })}
          onSuccess={() => {
            fetchIncidents();
          }}
          onSuccessToast={(msg) => showToast(msg, "success")}
        />
      </div>
    );
  }

  // Render Add Injury Report embedded directly in background complete screen
  if (addReportModal.open && addReportModal.type === "injury") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "70px",
              right: "24px",
              zIndex: 99999,
              backgroundColor: toast.type === "success" ? "#065F46" : "#991B1B",
              color: "#FFFFFF",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}

        <AddInjuryModal
          open={true}
          embedded={true}
          onClose={() => setAddReportModal({ open: false, type: "injury" })}
          onSuccess={() => {
            fetchInjuries();
          }}
          onSuccessToast={(msg) => showToast(msg, "success")}
        />
      </div>
    );
  }

  return (
    <div className="incident-container">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "70px",
            right: "24px",
            zIndex: 99999,
            backgroundColor: toast.type === "success" ? "#065F46" : "#991B1B",
            color: "#FFFFFF",
            padding: "0.75rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {/* Modals */}

      {sendReportModal.open && (
        <SendReportLinkModal
          open={sendReportModal.open}
          initialType={sendReportModal.type}
          onClose={() => setSendReportModal({ open: false, type: "accident" })}
          onSuccessToast={(msg) => showToast(msg, "success")}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          type={activeTab}
          id={deleteTarget.id}
          otherFormId={deleteTarget.otherFormId}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Page Header & Top Actions ── */}
      <div className="incident-header-row">
        {/* Left: Navigation Tabs */}
        {isLMD ? (
          <div className="incident-tabs">
            {(["accident", "injury"] as TabType[]).map((tab) => {
              const isActive = activeTab === tab;
              const count = tab === "accident" ? incidents.length : injuries.length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setSearchParams({ tab });
                    setSearchText("");
                  }}
                  className={`incident-tab-btn ${isActive ? "active" : ""}`}
                >
                  <span>{tab === "accident" ? "Accident Reports" : "Injury Reports"}</span>
                  <span className="incident-tab-badge">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>
            Accident Reports ({incidents.length})
          </div>
        )}

        {/* Right: Action Buttons Group */}
        <div className="incident-actions-group">
          {/* Send Report Link Single Button (Dedicated background screen open, no dropdown) */}
          <button
            type="button"
            id="btn-send-report-link"
            onClick={() => setIsSendReportScreenOpen(true)}
            className="incident-btn-secondary"
            title="Send accident or injury report link to driver"
          >
            <Send size={14} />
            <span>Send Report Link</span>
          </button>

          {/* Add Report Dropdown */}
          <div style={{ position: "relative" }} ref={addDropdownRef}>
            <button
              type="button"
              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              className="incident-btn-primary"
            >
              <Plus size={15} />
              <span>Add Report</span>
              <ChevronDown size={13} />
            </button>

            {addDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 4px)",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  border: "1px solid #E2E8F0",
                  zIndex: 99999,
                  minWidth: "210px",
                  overflow: "hidden",
                  padding: "0.25rem 0",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAddDropdownOpen(false);
                    setAddReportModal({ open: true, type: "accident" });
                  }}
                  style={{
                    width: "100%",
                    padding: "0.65rem 1rem",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#0F172A",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EFF6FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <ShieldAlert size={15} color="#DC2626" />
                  <span>Accident Report</span>
                </button>
                {isLMD && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddDropdownOpen(false);
                      setAddReportModal({ open: true, type: "injury" });
                    }}
                    style={{
                      width: "100%",
                      padding: "0.65rem 1rem",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#0F172A",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      borderTop: "1px solid #F1F5F9",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EFF6FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Plus size={15} color="#2563EB" />
                    <span>Injury Report</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toolbar Row (Segmented Status Filter, Search, Injury Filter, Meta) ── */}
      <div className="incident-toolbar-row">
        <div className="incident-toolbar-left">
          {/* Status Segmented Control Group */}
          <div className="incident-status-segment-group">
            <button
              type="button"
              className={`incident-segment-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              <span>All</span>
              <span className="incident-segment-pill all">{allCount}</span>
            </button>

            <button
              type="button"
              className={`incident-segment-btn ${statusFilter === "open" ? "active open" : ""}`}
              onClick={() => setStatusFilter("open")}
            >
              <span className="incident-status-dot open" />
              <span>Open</span>
              <span className="incident-segment-pill open">{openCount}</span>
            </button>

            <button
              type="button"
              className={`incident-segment-btn ${statusFilter === "resolved" ? "active resolved" : ""}`}
              onClick={() => setStatusFilter("resolved")}
            >
              <span className="incident-status-dot resolved" />
              <span>Resolved</span>
              <span className="incident-segment-pill resolved">{resolvedCount}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="incident-search-wrap">
            <Search size={14} className="incident-search-icon" />
            <input
              type="text"
              className="incident-search-input"
              placeholder={`Search ${activeTab === "accident" ? "driver, vehicle, plate, VIN" : "driver, vehicle, VIN"}…`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                className="incident-search-clear"
                onClick={() => setSearchText("")}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Injury Type Filter (only on injury tab) */}
          {activeTab === "injury" && isLMD && (
            <div className="incident-injury-select-wrap">
              <select
                className="incident-injury-select"
                value={injuryTypeFilter}
                onChange={(e) => setInjuryTypeFilter(e.target.value as InjuryType)}
              >
                <option value="all">All Injury Types</option>
                <option value="vehicle_without_injury">Vehicle — No Injury</option>
                <option value="injury_with_vehicle">Vehicle + Injury</option>
                <option value="injury_without_vehicle">No Vehicle</option>
              </select>
              <ChevronDown
                size={13}
                style={{
                  position: "absolute",
                  right: "0.65rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#94A3B8",
                }}
              />
            </div>
          )}
        </div>

        {/* Right Toolbar Area: Clear & Record Count */}
        <div className="incident-toolbar-right">
          {(searchText || statusFilter !== "all" || injuryTypeFilter !== "all") && (
            <button
              type="button"
              className="incident-clear-btn"
              onClick={() => {
                setSearchText("");
                setStatusFilter("all");
                setInjuryTypeFilter("all");
              }}
            >
              Reset Filters
            </button>
          )}

          {!isLoading && (
            <span className="incident-records-badge">
              Showing <strong>{displayList.length}</strong> of <strong>{totalRaw}</strong>
            </span>
          )}
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="incident-table-card">
        <div className="incident-table-wrapper scrollable">
          {isLoading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "280px",
                gap: "0.75rem",
              }}
            >
              <Loader2
                size={32}
                style={{ animation: "spin 0.8s linear infinite", color: "#2563EB" }}
              />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748B" }}>
                Loading {activeTab === "accident" ? "accident" : "injury"} records…
              </span>
            </div>
          ) : displayList.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "280px",
                gap: "0.6rem",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "14px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldAlert size={24} color="#94A3B8" />
              </div>
              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1E293B" }}>
                No {activeTab === "accident" ? "Accident" : "Injury"} Records
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8125rem",
                  color: "#64748B",
                  textAlign: "center",
                  maxWidth: 360,
                  lineHeight: 1.6,
                }}
              >
                {searchText || statusFilter !== "all" || injuryTypeFilter !== "all"
                  ? "No records match your current filters."
                  : `No ${activeTab} reports found. When reports are filed or submitted by drivers, they will appear here.`}
              </p>
              {(searchText || statusFilter !== "all" || injuryTypeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText("");
                    setStatusFilter("all");
                    setInjuryTypeFilter("all");
                  }}
                  className="incident-clear-btn"
                  style={{ marginTop: "0.25rem" }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : activeTab === "accident" ? (
            // ── ACCIDENT TABLE ──
            <table className="incident-data-table">
              <thead className="incident-table-head">
                <tr>
                  <th style={{ width: 46, textAlign: "center" }}>#</th>
                  <th style={{ minWidth: 110 }}>DATE</th>
                  <th>DRIVER</th>
                  <th>VEHICLE</th>
                  <th style={{ minWidth: 90 }}>VIN</th>
                  <th style={{ minWidth: 100 }}>PLATE</th>
                  <th style={{ minWidth: 85 }}>LAWSUIT</th>
                  <th style={{ minWidth: 90 }}>ADDED BY</th>
                  <th style={{ minWidth: 100 }}>STATUS</th>
                  <th style={{ minWidth: 110, textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(filteredIncidents as IncidentListItem[]).map((inc, idx) => (
                  <tr
                    key={inc.id}
                    className="incident-table-row"
                    onClick={() => setDetailAccidentId(inc.id)}
                  >
                    <td
                      style={{
                        color: "#94A3B8",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        textAlign: "center",
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Calendar size={13} color="#64748B" />
                        <span style={{ fontSize: "0.8125rem", color: "#334155", fontWeight: 500 }}>
                          {fmtDate(inc.date)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#EFF6FF",
                            color: "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.6875rem",
                            flexShrink: 0,
                          }}
                        >
                          {inc.driverName ? inc.driverName.charAt(0).toUpperCase() : "D"}
                        </div>
                        <span
                          style={{
                            fontWeight: 650,
                            color: "#0F172A",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {inc.driverName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Car size={13} color="#64748B" />
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#334155",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {inc.vehicleName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: "0.75rem",
                          color: "#475569",
                          background: "#F1F5F9",
                          padding: "2px 6px",
                          borderRadius: "5px",
                        }}
                      >
                        {inc.vin || "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: "0.75rem",
                          color: "#475569",
                        }}
                      >
                        {inc.plateNumber || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`incident-lawsuit-pill ${inc.lawsuitFiled ? "yes" : "no"}`}>
                        {inc.lawsuitFiled ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#334155" }}>
                          {inc.addedByName || "—"}
                        </span>
                        {inc.addedByType === "4" && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.6875rem",
                              color: "#2563EB",
                              fontWeight: 700,
                            }}
                          >
                            Driver
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => handleToggleRowStatus(inc.id, inc.status, e)}
                        title="Click to toggle Open / Resolved"
                        className={`incident-status-pill ${inc.status.toLowerCase() === "resolved" ? "resolved" : "open"}`}
                      >
                        <span className={`incident-status-dot ${inc.status.toLowerCase() === "resolved" ? "resolved" : "open"}`} />
                        <span>{inc.status}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "0.35rem",
                        }}
                      >
                        <button
                          type="button"
                          className="incident-action-btn"
                          title="View Incident Details"
                          onClick={() => setDetailAccidentId(inc.id)}
                        >
                          <Eye size={14} />
                        </button>

                        <DownloadReportButton
                          id={inc.id}
                          type="accident"
                          date={inc.date}
                          variant="icon"
                          onSuccess={() => showToast("Report downloaded", "success")}
                          onError={(msg) => showToast(msg, "error")}
                        />

                        <button
                          type="button"
                          className="incident-action-btn delete"
                          title="Delete Report"
                          onClick={() =>
                            setDeleteTarget({
                              id: inc.id,
                              otherFormId: inc.otherFormId || undefined,
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>

                        {inc.otherFormId && (
                          <button
                            type="button"
                            className="incident-action-btn"
                            title={`Linked injury report: #${inc.otherFormId}`}
                            onClick={() => setDetailInjuryId(inc.otherFormId)}
                            style={{ color: "#2563EB", borderColor: "#BFDBFE", background: "#EFF6FF" }}
                          >
                            <Paperclip size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // ── INJURY TABLE ──
            <table className="incident-data-table">
              <thead className="incident-table-head">
                <tr>
                  <th style={{ width: 46, textAlign: "center" }}>#</th>
                  <th style={{ minWidth: 110 }}>DATE</th>
                  <th>DRIVER</th>
                  <th>VEHICLE</th>
                  <th style={{ minWidth: 90 }}>VIN</th>
                  <th style={{ minWidth: 100 }}>PLATE</th>
                  <th style={{ minWidth: 140 }}>INJURY TYPE</th>
                  <th style={{ minWidth: 90 }}>ADDED BY</th>
                  <th style={{ minWidth: 100 }}>STATUS</th>
                  <th style={{ minWidth: 110, textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(filteredInjuries as InjuryListItem[]).map((inj, idx) => (
                  <tr
                    key={inj.id}
                    className="incident-table-row"
                    onClick={() => setDetailInjuryId(inj.id)}
                  >
                    <td
                      style={{
                        color: "#94A3B8",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        textAlign: "center",
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Calendar size={13} color="#64748B" />
                        <span style={{ fontSize: "0.8125rem", color: "#334155", fontWeight: 500 }}>
                          {fmtDate(inj.date)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#EFF6FF",
                            color: "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.6875rem",
                            flexShrink: 0,
                          }}
                        >
                          {inj.driverName ? inj.driverName.charAt(0).toUpperCase() : "D"}
                        </div>
                        <span
                          style={{
                            fontWeight: 650,
                            color: "#0F172A",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {inj.driverName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Car size={13} color="#64748B" />
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#334155",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {inj.vehicleName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: "0.75rem",
                          color: "#475569",
                          background: "#F1F5F9",
                          padding: "2px 6px",
                          borderRadius: "5px",
                        }}
                      >
                        {inj.vin || "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: "0.75rem",
                          color: "#475569",
                        }}
                      >
                        {inj.plateNumber || "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.15rem 0.55rem",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          fontWeight: 650,
                          backgroundColor: "#F1F5F9",
                          color: "#334155",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        {injuryTypeLabel(inj.injuryType)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#334155" }}>
                        {inj.addedByName || "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => handleToggleRowStatus(inj.id, inj.status, e)}
                        title="Click to toggle Open / Resolved"
                        className={`incident-status-pill ${inj.status.toLowerCase() === "resolved" ? "resolved" : "open"}`}
                      >
                        <span className={`incident-status-dot ${inj.status.toLowerCase() === "resolved" ? "resolved" : "open"}`} />
                        <span>{inj.status}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "0.35rem",
                        }}
                      >
                        <button
                          type="button"
                          className="incident-action-btn"
                          title="View Injury Details"
                          onClick={() => setDetailInjuryId(inj.id)}
                        >
                          <Eye size={14} />
                        </button>

                        <DownloadReportButton
                          id={inj.id}
                          type="injury"
                          date={inj.date}
                          variant="icon"
                          onSuccess={() => showToast("Report downloaded", "success")}
                          onError={(msg) => showToast(msg, "error")}
                        />

                        <button
                          type="button"
                          className="incident-action-btn delete"
                          title="Delete Injury Report"
                          onClick={() =>
                            setDeleteTarget({
                              id: inj.id,
                              otherFormId: inj.otherFormId || undefined,
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>

                        {inj.otherFormId && (
                          <button
                            type="button"
                            className="incident-action-btn"
                            title={`Linked accident report: #${inj.otherFormId}`}
                            onClick={() => setDetailAccidentId(inj.otherFormId)}
                            style={{ color: "#2563EB", borderColor: "#BFDBFE", background: "#EFF6FF" }}
                          >
                            <Paperclip size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AccidentInjuryView;
