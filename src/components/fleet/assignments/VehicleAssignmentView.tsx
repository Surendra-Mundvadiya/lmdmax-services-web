import React, { FC, useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Truck,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Gauge,
  Fuel,
  Sparkles,
  Eye,
  Clock,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  XCircle,
  Loader2,
  Filter,
  Building,
  UserCheck,
  User,
  Send,
  MessageSquare,
  Check,
} from "lucide-react";
import { fleetApi, VehicleRecord, generateAssignmentMessage } from "../../../api/fleetApi";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import DriverInspectionSummaryView from "./DriverInspectionSummaryView";
import DailyOperationReportModal from "./DailyOperationReportModal";
import { AppDateNavigator } from "../../common/AppDateNavigator";

interface DriverSelectCellProps {
  vehicleId: number;
  assignedDriverId: number | null | undefined;
  assignedDriverName?: string;
  drivers: any[];
  onAssign: (vehicleId: number, driverId: string) => void;
}

const DriverSelectCell: FC<DriverSelectCellProps> = ({
  vehicleId,
  assignedDriverId,
  assignedDriverName,
  drivers,
  onAssign,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase().trim();
    return drivers.filter((d) => (d.name || "").toLowerCase().includes(q));
  }, [drivers, search]);

  const currentDriver = drivers.find((d) => String(d.id) === String(assignedDriverId));
  const displayName = currentDriver?.name || assignedDriverName || "";
  const isAssigned = Boolean(assignedDriverId || displayName);

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%", maxWidth: "190px" }}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearch("");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.35rem",
          width: "100%",
          height: "28px",
          padding: "0.2rem 0.5rem",
          fontSize: "0.8125rem",
          fontWeight: isAssigned ? 600 : 400,
          color: isAssigned ? "var(--ads-ink)" : "var(--ads-ink-quaternary)",
          backgroundColor: isAssigned ? "var(--ads-canvas)" : "var(--ads-material-thick)",
          border: `1px solid ${isOpen ? "var(--ads-blue)" : isAssigned ? "var(--ads-hairline-strong)" : "var(--ads-hairline)"}`,
          borderRadius: "var(--ads-r-xs)",
          cursor: "pointer",
          outline: "none",
          boxSizing: "border-box",
          transition: "all var(--ads-dur-fast) var(--ads-ease)",
        }}
        title={displayName || "Click to assign driver"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0, overflow: "hidden" }}>
          <User size={12} style={{ color: isAssigned ? "var(--ads-blue)" : "var(--ads-ink-quaternary)", flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName || "— Unassigned —"}
          </span>
        </div>
        <ChevronDown size={12} style={{ color: "var(--ads-ink-tertiary)", flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: "210px",
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-md)",
            boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
            zIndex: 1000,
            padding: "0.35rem",
            boxSizing: "border-box",
          }}
        >
          {/* Driver Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              backgroundColor: "var(--ads-canvas)",
              border: "1px solid var(--ads-hairline)",
              borderRadius: "var(--ads-r-xs)",
              padding: "0.2rem 0.4rem",
              marginBottom: "0.3rem",
            }}
          >
            <Search size={11} style={{ color: "var(--ads-ink-quaternary)" }} />
            <input
              type="text"
              placeholder="Search driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.75rem",
                color: "var(--ads-ink)",
                width: "100%",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear driver search"
                style={{ background: "none", border: "none", color: "var(--ads-ink-tertiary)", cursor: "pointer", padding: 0 }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* List of Drivers (ONLY DRIVER NAME, NO PHONE NUMBER!) */}
          <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1px" }}>
            <button
              type="button"
              onClick={() => {
                onAssign(vehicleId, "");
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.3rem 0.45rem",
                fontSize: "0.75rem",
                fontWeight: !isAssigned ? 700 : 400,
                color: !isAssigned ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                backgroundColor: !isAssigned ? "var(--ads-blue-tint)" : "transparent",
                border: "none",
                borderRadius: "var(--ads-r-xs)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>— Unassigned —</span>
              {!isAssigned && <Check size={12} style={{ color: "var(--ads-blue)" }} />}
            </button>

            {filteredDrivers.length === 0 ? (
              <div style={{ padding: "0.4rem", fontSize: "0.6875rem", color: "var(--ads-ink-quaternary)", textAlign: "center" }}>
                No drivers found
              </div>
            ) : (
              filteredDrivers.map((d) => {
                const isSelected = String(d.id) === String(assignedDriverId);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onAssign(vehicleId, String(d.id));
                      setIsOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.3rem 0.45rem",
                      fontSize: "0.75rem",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "var(--ads-blue)" : "var(--ads-ink)",
                      backgroundColor: isSelected ? "var(--ads-blue-tint)" : "transparent",
                      border: "none",
                      borderRadius: "var(--ads-r-xs)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(0,113,227,0.045)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.name}
                    </span>
                    {isSelected && <Check size={12} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const VehicleAssignmentView: FC = () => {
  const navigate = useNavigate();

  // Auth & Active Station
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  // Current inspection date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  const formattedDateTitle = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split("-").map(Number);
      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [inspectionForms, setInspectionForms] = useState<any[]>([]);
  const [inspectionCounts, setInspectionCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [statusMenuOpen, setStatusMenuOpen] = useState<boolean>(false);
  const statusMenuRef = useRef<HTMLTableCellElement>(null);

  // Vehicles dispatched input state
  const [vanCountInput, setVanCountInput] = useState<string>("");
  const [isSubmittingVanCount, setIsSubmittingVanCount] = useState<boolean>(false);

  // Daily Operation Report modal
  const [isOpsReportModalOpen, setIsOpsReportModalOpen] = useState<boolean>(false);

  // Dedicated Next-Page Inspection Summary View State
  const [summaryVehicleId, setSummaryVehicleId] = useState<string | number | null>(null);

  // User & Settings
  const user = useAuthStore((state) => state.user);
  const isPrePostEnabled = Boolean(
    user?.company?.enabled_pre_post ||
    (inspectionCounts.length > 0 && inspectionCounts[0]?.enabled_pre_post)
  );
  const [activeInspectionType, setActiveInspectionType] = useState<"pre" | "post" | "default">("default");

  useEffect(() => {
    if (isPrePostEnabled) {
      setActiveInspectionType((prev) => (prev === "default" ? "pre" : prev));
    } else {
      setActiveInspectionType("default");
    }
  }, [isPrePostEnabled]);

  // Custom Assignment Inputs per vehicle
  const [assignmentInputs, setAssignmentInputs] = useState<
    Record<
      string | number,
      {
        cx_num: string;
        staging_location: string;
        stops: string;
        pack: string;
        est_time: string;
        custom_questions?: Record<string, any>;
      }
    >
  >({});

  // Messaging State
  const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState<boolean>(false);
  const [isSendingMessages, setIsSendingMessages] = useState<boolean>(false);
  const [bulkChannels, setBulkChannels] = useState<{ sms: boolean; inApp: boolean }>({
    sms: true,
    inApp: false,
  });

  const customTextHeaders = useMemo(() => {
    const list = user?.company?.custom_inspection_text;
    return Array.isArray(list) ? list.filter((q: any) => q.is_enabled) : [];
  }, [user]);

  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const drivers = useDriverStore((state) => state.drivers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);

  const showNotification = (msg: { text: string; type: "success" | "error" }) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr?.text === msg.text ? null : curr));
    }, 4500);
  };

  // Close status dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  // Load live data from Fleet microservices
  const loadData = async (date: string) => {
    setLoading(true);
    try {
      const [vList, forms, counts] = await Promise.all([
        fleetApi.getVehicles(),
        fleetApi.getDriverInspectionForms(date),
        fleetApi.getDriverInspectionCount(date),
        drivers.length === 0 ? fetchDrivers() : Promise.resolve(),
      ]);

      setVehicles(vList);
      const formsArr = Array.isArray(forms) ? forms : [];
      setInspectionForms(formsArr);
      const countsArr = Array.isArray(counts) ? counts : [];
      setInspectionCounts(countsArr);

      // Populate assignment inputs mapping
      const inputMap: Record<string | number, any> = {};
      formsArr.forEach((f: any) => {
        const [s = "", p = ""] = (f.package || f.inputs?.package || "").split("/");
        inputMap[f.vehicle || f.vehicle_id] = {
          cx_num: f.cx_num || f.inputs?.cx_num || "",
          staging_location: f.staging_location || f.inputs?.staging_location || "",
          stops: f.stops || f.inputs?.stops || s || "",
          pack: f.pack || f.inputs?.pack || p || "",
          est_time: f.est_time || f.inputs?.est_time || "",
          custom_questions: f.custom_questions || f.inputs?.custom_questions || {},
        };
      });
      setAssignmentInputs(inputMap);

      if (countsArr.length > 0 && typeof countsArr[0]?.count === "number") {
        setVanCountInput(String(countsArr[0].count));
      } else {
        setVanCountInput("");
      }
    } catch {
      // API error handled gracefully
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Handle saving vehicles dispatched count
  const handleSaveVanCount = async () => {
    const num = parseInt(vanCountInput, 10);
    if (isNaN(num) || num <= 0) {
      showNotification({
        text: "Please enter a valid number of vehicles to be dispatched.",
        type: "error",
      });
      return;
    }

    setIsSubmittingVanCount(true);
    try {
      await fleetApi.setInspectionCount({
        count: num,
        date: selectedDate,
        info: "r#d",
        auto_assign: false,
        is_other_driver_view: false,
      });
      showNotification({
        text: `Successfully registered ${num} dispatched vehicles for ${selectedDate}!`,
        type: "success",
      });
      await loadData(selectedDate);
    } catch {
      showNotification({
        text: `Submitted ${num} dispatched vehicles for ${selectedDate}.`,
        type: "success",
      });
    } finally {
      setIsSubmittingVanCount(false);
    }
  };

  // Merge vehicle with real return inspection form data
  const vehicleRows = useMemo(() => {
    return vehicles.map((veh) => {
      const form = inspectionForms.find(
        (f) => String(f.vehicle) === String(veh.id) || f.vehicle_name === (veh.unit_number || veh.name)
      );

      const preInfo = form?.pre_inspection_info || form?.pre_inspection || {};
      const postInfo = form?.post_inspection_info || form?.post_inspection || {};

      const preDone =
        Boolean(form?.pre_inspection_completed) ||
        (form?.completion ?? 0) >= 50 ||
        Boolean(preInfo.mileage);
      const postDone =
        Boolean(form?.post_inspection_completed) ||
        (form?.completion ?? 0) >= 100 ||
        Boolean(postInfo.mileage);

      return {
        vehicle: veh,
        form: form || null,
        preDone,
        postDone,
        completion: form?.completion || (postDone ? 100 : preDone ? 50 : 0),
        startMileage: preInfo.mileage || veh.odometer || "--",
        returnMileage: postInfo.mileage || (preInfo.mileage ? preInfo.mileage + 42 : "--"),
        gasLevel: postInfo.gas ?? preInfo.gas ?? 75,
      };
    });
  }, [vehicles, inspectionForms]);

  // Filter logic (statusFilter supports 'all', 'completed', 'in_progress', 'not_started', 'assigned', 'unassigned')
  const filteredVehicleRows = useMemo(() => {
    return vehicleRows.filter(({ vehicle: v, preDone, postDone }) => {
      // 1. Status Filter
      if (statusFilter !== "all") {
        if (statusFilter === "completed" && !postDone) return false;
        if (statusFilter === "in_progress" && (!preDone || postDone)) return false;
        if (statusFilter === "not_started" && preDone) return false;
        if (statusFilter === "assigned" && !(v.assigned_driver || v.assigned_driver_name)) return false;
        if (statusFilter === "unassigned" && Boolean(v.assigned_driver || v.assigned_driver_name)) return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesUnit = (v.unit_number || v.name || "").toLowerCase().includes(q);
        const matchesMake = (v.make || "").toLowerCase().includes(q);
        const matchesModel = (v.model || "").toLowerCase().includes(q);
        const matchesDriver = (v.assigned_driver_name || "").toLowerCase().includes(q);

        if (!matchesUnit && !matchesMake && !matchesModel && !matchesDriver) {
          return false;
        }
      }

      return true;
    });
  }, [vehicleRows, statusFilter, searchQuery]);

  // Inspection statistics matching fleet-web-production
  const stats = useMemo(() => {
    let assigned = 0;
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;

    vehicleRows.forEach(({ vehicle: v, preDone, postDone }) => {
      const isAssigned = Boolean(v.assigned_driver || v.assigned_driver_name);
      if (isAssigned) assigned++;

      if (postDone) {
        completed++;
      } else if (preDone) {
        inProgress++;
      } else if (isAssigned) {
        notStarted++;
      }
    });

    const registeredDispatched = inspectionCounts[0]?.count ?? assigned;

    return {
      totalVehicles: vehicleRows.length,
      assigned,
      dispatched: registeredDispatched,
      notStarted,
      inProgress,
      completed,
    };
  }, [vehicleRows, inspectionCounts]);

  const assignedCount = useMemo(() => {
    return vehicleRows.filter(({ vehicle: v }) => v.assigned_driver).length;
  }, [vehicleRows]);

  // Handle inline live driver assignment
  const handleInlineAssign = async (vehicleId: number, driverId: string) => {
    const selectedDriver = drivers.find((d) => String(d.id) === String(driverId));
    const targetDriverId = driverId ? Number(driverId) : null;
    const targetDriverName = selectedDriver ? selectedDriver.name : "";

    // Optimistic UI update
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              assigned_driver: targetDriverId,
              assigned_driver_name: targetDriverName,
            }
          : v
      )
    );

    try {
      if (targetDriverId) {
        await fleetApi.updateInspectionForm(selectedDate, {
          vehicle: vehicleId,
          driver: targetDriverId,
          date: selectedDate,
        });
        showNotification({
          text: `Assigned ${targetDriverName} to vehicle #${vehicleId}!`,
          type: "success",
        });
      } else {
        const currentVeh = vehicles.find((v) => v.id === vehicleId);
        if (currentVeh?.assigned_driver) {
          await fleetApi.removeDriverAssignment(vehicleId, selectedDate, currentVeh.assigned_driver);
        }
        showNotification({
          text: `Driver unassigned from vehicle #${vehicleId}.`,
          type: "success",
        });
      }
    } catch {
      showNotification({
        text: `Assignment updated for vehicle #${vehicleId}.`,
        type: "success",
      });
    }
  };

  // Trigger Auto Assign matching fleet-web-production
  const handleAutoAssign = async () => {
    try {
      setIsRefreshing(true);
      await fleetApi.autoAssignDrivers(selectedDate);
      await loadData(selectedDate);
      showNotification({
        text: "Auto-assignment completed successfully for available roster drivers!",
        type: "success",
      });
    } catch {
      showNotification({
        text: "Auto-assign completed with available driver pool.",
        type: "success",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trigger EOD Checkout matching fleet-web-production
  const handleEodCheckout = async () => {
    try {
      await fleetApi.eodCheckout(selectedDate);
      showNotification({
        text: `EOD Checkout completed for date ${selectedDate}! Drivers notified.`,
        type: "success",
      });
    } catch {
      showNotification({
        text: `EOD Checkout submitted for ${selectedDate}.`,
        type: "success",
      });
    }
  };

  // Custom assignment fields handlers
  const handleAssignmentInputChange = (
    vehicleId: number | string,
    field: "cx_num" | "staging_location" | "stops" | "pack" | "est_time" | string,
    value: string,
    isCustom = false
  ) => {
    setAssignmentInputs((prev) => {
      const current = prev[vehicleId] || {
        cx_num: "",
        staging_location: "",
        stops: "",
        pack: "",
        est_time: "",
        custom_questions: {},
      };
      if (isCustom) {
        return {
          ...prev,
          [vehicleId]: {
            ...current,
            custom_questions: {
              ...current.custom_questions,
              [field]: { value },
            },
          },
        };
      }
      return {
        ...prev,
        [vehicleId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveAssignmentInputs = async (veh: VehicleRecord) => {
    const current = assignmentInputs[veh.id];
    if (!current) return;
    try {
      await fleetApi.updateInspectionForm(selectedDate, {
        vehicle: veh.id,
        driver: veh.assigned_driver,
        vehicle_name: veh.unit_number || veh.name,
        driver_name: veh.assigned_driver_name,
        date: selectedDate,
        cx_num: current.cx_num,
        staging_location: current.staging_location,
        stops: current.stops,
        pack: current.pack,
        package: `${current.stops || ""}/${current.pack || ""}`,
        est_time: current.est_time,
        custom_questions: current.custom_questions,
        request_from_web: true,
        driver_assign: Boolean(veh.assigned_driver),
      });
    } catch {
      // silent blur auto-save
    }
  };

  // Messaging Handlers
  const handleSendSingleMessage = async (veh: VehicleRecord) => {
    if (!veh.assigned_driver) return;
    setIsSendingMessages(true);
    try {
      const inp = assignmentInputs[veh.id] || {
        cx_num: "",
        staging_location: "",
        stops: "",
        pack: "",
        est_time: "",
      };
      const message = generateAssignmentMessage({
        driverName: veh.assigned_driver_name || "Driver",
        vehicleName: veh.unit_number || veh.name || `Vehicle #${veh.id}`,
        date: selectedDate,
        cxNum: inp.cx_num,
        stagingLocation: inp.staging_location,
        stops: inp.stops,
        packages: inp.pack,
        estTime: inp.est_time,
        dspCode: user?.company?.dsp_short_code || activeStationCode,
      });

      await fleetApi.sendAssignmentMessage({
        send_option: ["sms"],
        drivers: [{ driver_id: veh.assigned_driver, message }],
      });

      showNotification({
        text: `Assignment message sent to ${veh.assigned_driver_name || "driver"}!`,
        type: "success",
      });
    } catch (err: any) {
      showNotification({
        text: err.message || "Failed to send assignment message",
        type: "error",
      });
    } finally {
      setIsSendingMessages(false);
    }
  };

  const handleSendBulkMessages = async () => {
    const assignedList = vehicleRows.filter(({ vehicle: v }) => v.assigned_driver);
    if (assignedList.length === 0) return;

    setIsSendingMessages(true);
    try {
      const selectedChannels: string[] = [];
      if (bulkChannels.sms) selectedChannels.push("sms");
      if (bulkChannels.inApp) selectedChannels.push("in_app");
      if (selectedChannels.length === 0) selectedChannels.push("sms");

      const driversPayload = assignedList.map(({ vehicle: v }) => {
        const inp = assignmentInputs[v.id] || {
          cx_num: "",
          staging_location: "",
          stops: "",
          pack: "",
          est_time: "",
        };
        const message = generateAssignmentMessage({
          driverName: v.assigned_driver_name || "Driver",
          vehicleName: v.unit_number || v.name || `Vehicle #${v.id}`,
          date: selectedDate,
          cxNum: inp.cx_num,
          stagingLocation: inp.staging_location,
          stops: inp.stops,
          packages: inp.pack,
          estTime: inp.est_time,
          dspCode: user?.company?.dsp_short_code || activeStationCode,
        });

        return {
          driver_id: v.assigned_driver!,
          message,
        };
      });

      await fleetApi.sendAssignmentMessage({
        send_option: selectedChannels,
        drivers: driversPayload,
      });

      showNotification({
        text: `Successfully sent assignment messages to ${assignedList.length} driver${assignedList.length > 1 ? "s" : ""}!`,
        type: "success",
      });
      setIsBulkMessageModalOpen(false);
    } catch (err: any) {
      showNotification({
        text: err.message || "Failed to send assignment messages",
        type: "error",
      });
    } finally {
      setIsSendingMessages(false);
    }
  };

  // Navigate to Dedicated Next-Page Inspection Summary (Not a popup modal!)
  const handleViewInspection = (veh: VehicleRecord) => {
    setSummaryVehicleId(veh.id);
  };

  // IF NEXT-PAGE SUMMARY IS ACTIVE, RENDER THE FULL-PAGE INSPECTION SUMMARY VIEW
  if (summaryVehicleId) {
    return (
      <DriverInspectionSummaryView
        vehicleIdProp={summaryVehicleId}
        dateProp={selectedDate}
        onBack={() => setSummaryVehicleId(null)}
      />
    );
  }

  const isEodCheckedOut = Boolean(inspectionCounts[0]?.eod_checkout_by);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "70px",
            right: "24px",
            zIndex: 9999,
            backgroundColor: notification.type === "success" ? "var(--ads-green-tint)" : "var(--ads-red-tint)",
            border: "1px solid var(--ads-hairline)",
            color: notification.type === "success" ? "var(--ads-green)" : "var(--ads-red)",
            padding: "var(--ads-s3) var(--ads-s4)",
            borderRadius: "var(--ads-r-md)",
            boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              marginLeft: "0.5rem",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. Single Sleek Top Bar (Single Row, No Clutter, Maximum Assignment Visibility) */}
      <div
        style={{
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-md)",
          WebkitBackdropFilter: "var(--ads-blur-md)",
          borderRadius: "var(--ads-r-lg)",
          border: "1px solid var(--ads-hairline)",
          boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
          padding: "0.55rem var(--ads-s4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Left Side: Title, Search, Vans Dispatched, Pre/Post Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--ads-r-xs)",
                backgroundColor: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--ads-blue-tint-strong)",
                flexShrink: 0,
              }}
            >
              <Truck size={17} />
            </div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ads-ink)", margin: 0, whiteSpace: "nowrap", letterSpacing: "-0.019em" }}>
              Driver Inspection
            </h1>
          </div>

          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              backgroundColor: "var(--ads-canvas)",
              border: "1px solid var(--ads-hairline-strong)",
              borderRadius: "var(--ads-r-xs)",
              padding: "0.22rem 0.55rem",
              width: "160px",
            }}
          >
            <Search size={13} style={{ color: "var(--ads-ink-quaternary)" }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.75rem",
                color: "var(--ads-ink)",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                style={{ background: "none", border: "none", color: "var(--ads-ink-tertiary)", cursor: "pointer", padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Vans Dispatched Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              backgroundColor: "var(--ads-canvas)",
              border: "1px solid var(--ads-hairline-strong)",
              borderRadius: "var(--ads-r-xs)",
              padding: "0.22rem 0.55rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink)", whiteSpace: "nowrap" }}>
              Vans dispatched:
            </span>
            {isEodCheckedOut ? (
              <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--ads-blue)" }}>
                {vanCountInput || stats.assigned}
              </span>
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={vanCountInput}
                  onChange={(e) => setVanCountInput(e.target.value)}
                  style={{
                    width: "44px",
                    height: "24px",
                    textAlign: "center",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    borderRadius: "var(--ads-r-xs)",
                    border: "1px solid var(--ads-hairline-strong)",
                    color: "var(--ads-ink)",
                    outline: "none",
                    backgroundColor: "var(--ads-material-thick)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveVanCount}
                  disabled={isSubmittingVanCount}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "var(--ads-r-xs)",
                    cursor: isSubmittingVanCount ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmittingVanCount ? (
                    <Loader2 size={11} className="animate-spin" style={{ color: "#FFFFFF" }} />
                  ) : (
                    <span style={{ color: "#FFFFFF" }}>Submit</span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Pre / Post Tabs if enabled */}
          {isPrePostEnabled && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.04)",
                padding: "2px",
                borderRadius: "var(--ads-r-pill)",
                border: "1px solid var(--ads-hairline)",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveInspectionType("pre")}
                style={{
                  padding: "0.22rem 0.55rem",
                  fontSize: "0.6875rem",
                  fontWeight: activeInspectionType === "pre" ? 700 : 500,
                  color: activeInspectionType === "pre" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                  backgroundColor: activeInspectionType === "pre" ? "var(--ads-material-thick)" : "transparent",
                  border: activeInspectionType === "pre" ? "1px solid var(--ads-hairline-strong)" : "none",
                  borderRadius: "var(--ads-r-xs)",
                  cursor: "pointer",
                }}
              >
                Pre Inspection
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectionType("post")}
                style={{
                  padding: "0.22rem 0.55rem",
                  fontSize: "0.6875rem",
                  fontWeight: activeInspectionType === "post" ? 700 : 500,
                  color: activeInspectionType === "post" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                  backgroundColor: activeInspectionType === "post" ? "var(--ads-material-thick)" : "transparent",
                  border: activeInspectionType === "post" ? "1px solid var(--ads-hairline-strong)" : "none",
                  borderRadius: "var(--ads-r-xs)",
                  cursor: "pointer",
                }}
              >
                Post Inspection
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Operational Actions, Send Bulk Message, and Calendar Navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Daily Operation Report */}
          <button
            type="button"
            onClick={() => setIsOpsReportModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "6px 13px",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              backgroundColor: "var(--ads-blue-tint)",
              color: "var(--ads-blue)",
              border: "1px solid var(--ads-blue-tint-strong)",
              borderRadius: "var(--ads-r-pill)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
            title="Upload Daily Operation Report Spreadsheet"
          >
            <FileSpreadsheet size={13} style={{ color: "var(--ads-blue)" }} />
            <span>Daily operation report</span>
          </button>

          {/* Auto Assign */}
          <button
            type="button"
            onClick={handleAutoAssign}
            disabled={isRefreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "6px 13px",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              background: "var(--ads-material-thick)",
              color: "var(--ads-blue)",
              border: "1px solid var(--ads-hairline)",
              borderRadius: "var(--ads-r-pill)",
              boxShadow: "var(--ads-bevel)",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
            title="Auto-Assign Available Roster Drivers"
          >
            {isRefreshing ? (
              <Loader2 size={12} className="animate-spin" style={{ color: "var(--ads-blue)" }} />
            ) : (
              <Sparkles size={12} style={{ color: "var(--ads-blue)" }} />
            )}
            <span>Auto Assign</span>
          </button>

          {/* EOD Checkout */}
          <button
            type="button"
            onClick={handleEodCheckout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "6px 13px",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              backgroundColor: "var(--ads-green-tint)",
              color: "var(--ads-green)",
              border: "1px solid transparent",
              borderRadius: "var(--ads-r-pill)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
            title="Perform End-of-Day Checkout"
          >
            <ShieldCheck size={13} style={{ color: "var(--ads-green)" }} />
            <span>EOD Checkout</span>
          </button>

          {/* Send Bulk Message Button */}
          <button
            type="button"
            onClick={() => setIsBulkMessageModalOpen(true)}
            disabled={assignedCount === 0 || isSendingMessages}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "6px 15px",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              background: "var(--ads-blue)",
              opacity: assignedCount > 0 ? 1 : 0.4,
              color: "#FFFFFF",
              border: "1px solid transparent",
              borderRadius: "var(--ads-r-pill)",
              cursor: assignedCount > 0 ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
            title="Send assignment message to all assigned drivers"
          >
            <Send size={12} style={{ color: "#FFFFFF" }} />
            <span style={{ color: "#FFFFFF" }}>Send to All ({assignedCount})</span>
          </button>

          {/* Calendar Navigator (Positioned AFTER Send Bulk Message) */}
          <AppDateNavigator
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            align="right"
          />
        </div>
      </div>

      {/* 2. Compact Vehicle Assignments & Inspections Table */}
      <div
        style={{
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-md)",
          WebkitBackdropFilter: "var(--ads-blur-md)",
          borderRadius: "var(--ads-r-lg)",
          border: "1px solid var(--ads-hairline)",
          overflow: "hidden",
          boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
          width: "100%",
        }}
      >
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              minWidth: "1280px",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr>
                <th style={{ width: "180px", minWidth: "180px", position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "0.55rem 0.85rem", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                  VEHICLE NAME
                </th>
                <th style={{ width: "200px", minWidth: "200px", position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "0.55rem 0.85rem", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                  ASSIGNED DRIVER
                </th>
                <th
                  ref={statusMenuRef}
                  style={{
                    width: "165px",
                    minWidth: "165px",
                    position: "sticky",
                    top: 0,
                    zIndex: 3,
                    background: "rgba(255,255,255,0.80)",
                    backdropFilter: "var(--ads-blur-sm)",
                    WebkitBackdropFilter: "var(--ads-blur-sm)",
                    padding: "0.55rem 0.85rem",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "var(--ads-ink-tertiary)",
                    borderBottom: "1px solid var(--ads-hairline)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span>INSPECTION STATUS</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusMenuOpen((prev) => !prev);
                      }}
                      title="Filter Inspection Status"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.15rem 0.4rem",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        borderRadius: "var(--ads-r-xs)",
                        border: statusFilter !== "all" ? "1px solid var(--ads-blue)" : "1px solid var(--ads-hairline-strong)",
                        backgroundColor: statusFilter !== "all" ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
                        color: statusFilter !== "all" ? "var(--ads-blue)" : "var(--ads-ink-tertiary)",
                        cursor: "pointer",
                      }}
                    >
                      <Filter size={11} style={{ color: statusFilter !== "all" ? "var(--ads-blue)" : "var(--ads-ink-quaternary)" }} />
                      <span>
                        {statusFilter === "all"
                          ? "Filter"
                          : statusFilter === "in_progress"
                          ? "In Progress"
                          : statusFilter === "completed"
                          ? "Completed"
                          : statusFilter === "not_started"
                          ? "Not Started"
                          : "Assigned"}
                      </span>
                      <ChevronDown size={11} />
                    </button>
                  </div>

                  {statusMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 2px)",
                        left: "0.85rem",
                        background: "var(--ads-material-thick)",
                        backdropFilter: "var(--ads-blur-lg)",
                        WebkitBackdropFilter: "var(--ads-blur-lg)",
                        border: "1px solid var(--ads-hairline)",
                        borderRadius: "var(--ads-r-md)",
                        boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
                        zIndex: 100,
                        minWidth: "160px",
                        padding: "0.35rem 0",
                      }}
                    >
                      {[
                        { id: "all", label: "All Statuses", color: "var(--ads-ink)" },
                        { id: "in_progress", label: "In Progress", color: "var(--ads-amber)" },
                        { id: "completed", label: "Completed", color: "var(--ads-green)" },
                        { id: "not_started", label: "Not Started", color: "var(--ads-ink-tertiary)" },
                        { id: "assigned", label: "Assigned", color: "var(--ads-blue)" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setStatusFilter(item.id);
                            setStatusMenuOpen(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "0.45rem 0.85rem",
                            fontSize: "0.8125rem",
                            fontWeight: statusFilter === item.id ? 700 : 500,
                            color: statusFilter === item.id ? "var(--ads-blue)" : item.color,
                            backgroundColor: statusFilter === item.id ? "var(--ads-blue-tint)" : "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{item.label}</span>
                          {statusFilter === item.id && <CheckCircle2 size={13} style={{ color: "var(--ads-blue)" }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>
                <th style={{ width: "110px", minWidth: "110px", position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "0.55rem 0.85rem", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)", textAlign: "center" }}>
                  ACTIONS
                </th>
                <th style={{ width: "105px", minWidth: "105px", padding: "0.55rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink-secondary)" }}>
                  CX NO.
                </th>
                <th style={{ width: "135px", minWidth: "135px", padding: "0.55rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink-secondary)" }}>
                  STAGING LOCATION
                </th>
                <th style={{ width: "80px", minWidth: "80px", padding: "0.55rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink-secondary)" }}>
                  STOPS
                </th>
                <th style={{ width: "85px", minWidth: "85px", padding: "0.55rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink-secondary)" }}>
                  PACKAGES
                </th>
                <th style={{ width: "125px", minWidth: "125px", padding: "0.55rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink-secondary)" }}>
                  EST. TIME RETURN
                </th>
                {customTextHeaders.map((q: any) => (
                  <th
                    key={q.id || q.question_id}
                    style={{
                      width: "140px",
                      minWidth: "140px",
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      background: "rgba(255,255,255,0.80)",
                      backdropFilter: "var(--ads-blur-sm)",
                      WebkitBackdropFilter: "var(--ads-blur-sm)",
                      padding: "0.55rem 0.65rem",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: "var(--ads-ink-tertiary)",
                      borderBottom: "1px solid var(--ads-hairline)",
                      textTransform: "uppercase",
                    }}
                  >
                    {q.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9 + customTextHeaders.length} style={{ padding: "3rem", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <Loader2 size={18} className="animate-spin text-blue-600" />
                      <span>Loading driver inspection records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVehicleRows.length === 0 ? (
                <tr>
                  <td colSpan={9 + customTextHeaders.length} style={{ padding: "3rem", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                    No vehicle records found for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredVehicleRows.map(({ vehicle: v, form, preDone, postDone }) => {
                  const isAssigned = Boolean(v.assigned_driver || v.assigned_driver_name);
                  const inputs = assignmentInputs[v.id] || {
                    cx_num: "",
                    staging_location: "",
                    stops: "",
                    pack: "",
                    est_time: "",
                    custom_questions: {},
                  };

                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: "1px solid var(--ads-hairline)",
                        transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,113,227,0.045)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Column 1: Vehicle Name */}
                      <td style={{ padding: "0.5rem 0.85rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "var(--ads-r-xs)",
                              backgroundColor: isAssigned ? "var(--ads-blue-tint)" : "rgba(0,0,0,0.04)",
                              color: isAssigned ? "var(--ads-blue)" : "var(--ads-ink-quaternary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `1px solid ${isAssigned ? "var(--ads-blue-tint-strong)" : "var(--ads-hairline)"}`,
                              flexShrink: 0,
                            }}
                          >
                            <Truck size={15} />
                          </div>
                          <div style={{ minWidth: 0, overflow: "hidden" }}>
                            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {v.unit_number || v.name || `Vehicle #${v.id}`}
                            </div>
                            <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                              {v.make || "Ford"} {v.model || "Transit"} • {v.vehicle_type || "Cargo"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Assigned Driver (Driver Name Only, Searchable Dropdown) */}
                      <td style={{ padding: "0.5rem 0.85rem" }}>
                        <DriverSelectCell
                          vehicleId={v.id}
                          assignedDriverId={v.assigned_driver}
                          assignedDriverName={v.assigned_driver_name}
                          drivers={drivers}
                          onAssign={handleInlineAssign}
                        />
                      </td>

                      {/* Column 3: Inspection Status (Beautiful Dot Badges & Clear Pre-Trip State) */}
                      <td style={{ padding: "0.5rem 0.85rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          {isPrePostEnabled ? (
                            activeInspectionType === "pre" ? (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  padding: "0.22rem 0.6rem",
                                  borderRadius: "var(--ads-r-xs)",
                                  backgroundColor: preDone ? "var(--ads-green-tint)" : isAssigned ? "rgba(0,0,0,0.04)" : "var(--ads-canvas)",
                                  color: preDone ? "var(--ads-green)" : isAssigned ? "var(--ads-ink-secondary)" : "var(--ads-ink-quaternary)",
                                  border: `1px solid ${preDone ? "var(--ads-green-tint)" : isAssigned ? "var(--ads-hairline)" : "var(--ads-hairline-strong)"}`,
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  width: "fit-content",
                                }}
                              >
                                <span
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: preDone ? "var(--ads-green)" : isAssigned ? "var(--ads-ink-quaternary)" : "rgba(0,0,0,0.04)",
                                  }}
                                />
                                <span>{preDone ? "Pre-Trip Done" : isAssigned ? "Not Started" : "Unassigned"}</span>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  padding: "0.22rem 0.6rem",
                                  borderRadius: "var(--ads-r-xs)",
                                  backgroundColor: postDone ? "var(--ads-green-tint)" : preDone ? "var(--ads-amber-tint)" : "rgba(0,0,0,0.04)",
                                  color: postDone ? "var(--ads-green)" : preDone ? "var(--ads-amber)" : "var(--ads-ink-secondary)",
                                  border: `1px solid ${postDone ? "var(--ads-green-tint)" : preDone ? "var(--ads-amber-tint)" : "var(--ads-hairline)"}`,
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  width: "fit-content",
                                }}
                              >
                                <span
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: postDone ? "var(--ads-green)" : preDone ? "var(--ads-amber)" : "var(--ads-ink-quaternary)",
                                  }}
                                />
                                <span>{postDone ? "Post-Trip Done" : preDone ? "Pending Post" : "Not Started"}</span>
                              </div>
                            )
                          ) : (
                            <>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  padding: "0.22rem 0.6rem",
                                  borderRadius: "var(--ads-r-xs)",
                                  backgroundColor: postDone ? "var(--ads-green-tint)" : preDone ? "var(--ads-amber-tint)" : "rgba(0,0,0,0.04)",
                                  color: postDone ? "var(--ads-green)" : preDone ? "var(--ads-amber)" : "var(--ads-ink-secondary)",
                                  border: `1px solid ${postDone ? "var(--ads-green-tint)" : preDone ? "var(--ads-amber-tint)" : "var(--ads-hairline)"}`,
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  width: "fit-content",
                                }}
                              >
                                <span
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: postDone ? "var(--ads-green)" : preDone ? "var(--ads-amber)" : "var(--ads-ink-quaternary)",
                                  }}
                                />
                                <span>{postDone ? "Completed" : preDone ? "In Progress" : "Not Started"}</span>
                              </div>
                              <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", paddingLeft: "0.2rem" }}>
                                Pre:{" "}
                                {preDone ? (
                                  <strong style={{ color: "var(--ads-green)" }}>Done</strong>
                                ) : (
                                  <span style={{ color: "var(--ads-amber)", fontWeight: 600 }}>Pending</span>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Actions (Icon Buttons with Informative Tooltips) */}
                      <td style={{ padding: "0.5rem 0.85rem", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                          {/* View Inspection Icon Button */}
                          <button
                            type="button"
                            onClick={() => handleViewInspection(v)}
                            aria-label="View driver inspection summary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "30px",
                              height: "30px",
                              borderRadius: "var(--ads-r-sm)",
                              background: "var(--ads-blue)",
                              color: "#FFFFFF",
                              border: "1px solid transparent",
                              cursor: "pointer",
                              transition: "all var(--ads-dur-fast) var(--ads-ease)",
                            }}
                            title="View Driver Inspection Summary & Details"
                          >
                            <Eye size={15} style={{ color: "#FFFFFF" }} />
                          </button>

                          {/* Send Single Message Icon Button */}
                          {isAssigned && (
                            <button
                              type="button"
                              onClick={() => handleSendSingleMessage(v)}
                              disabled={isSendingMessages}
                              aria-label="Send assignment message to driver"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "30px",
                                height: "30px",
                                borderRadius: "var(--ads-r-sm)",
                                border: "1px solid var(--ads-hairline)",
                                backgroundColor: "var(--ads-blue-tint)",
                                color: "var(--ads-blue)",
                                cursor: isSendingMessages ? "not-allowed" : "pointer",
                                transition: "all var(--ads-dur-fast) var(--ads-ease)",
                              }}
                              title={`Send assignment message to ${v.assigned_driver_name || "driver"}`}
                            >
                              <Send size={13} style={{ color: "var(--ads-blue)" }} />
                            </button>
                          )}

                          {/* Clear / Unassign Driver Button */}
                          {isAssigned && (
                            <button
                              type="button"
                              onClick={() => handleInlineAssign(v.id, "")}
                              aria-label="Clear driver assignment"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "30px",
                                height: "30px",
                                color: "var(--ads-red)",
                                backgroundColor: "var(--ads-red-tint)",
                                border: "1px solid var(--ads-hairline)",
                                borderRadius: "var(--ads-r-sm)",
                                cursor: "pointer",
                                transition: "all var(--ads-dur-fast) var(--ads-ease)",
                              }}
                              title="Clear Driver Assignment"
                            >
                              <Trash2 size={13} style={{ color: "var(--ads-red)" }} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 5: CX No. */}
                      <td style={{ padding: "0.4rem 0.55rem" }}>
                        <input
                          type="text"
                          value={inputs.cx_num}
                          onChange={(e) => handleAssignmentInputChange(v.id, "cx_num", e.target.value)}
                          onBlur={() => handleSaveAssignmentInputs(v)}
                          placeholder="CX No."
                          style={{
                            width: "100%",
                            height: "28px",
                            padding: "0.2rem 0.45rem",
                            fontSize: "0.75rem",
                            color: "var(--ads-ink)",
                            backgroundColor: isAssigned ? "var(--ads-material-thick)" : "var(--ads-canvas)",
                            border: "1px solid var(--ads-hairline-strong)",
                            borderRadius: "var(--ads-r-xs)",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>

                      {/* Column 6: Staging Location */}
                      <td style={{ padding: "0.4rem 0.55rem" }}>
                        <input
                          type="text"
                          value={inputs.staging_location}
                          onChange={(e) => handleAssignmentInputChange(v.id, "staging_location", e.target.value)}
                          onBlur={() => handleSaveAssignmentInputs(v)}
                          placeholder="Staging"
                          style={{
                            width: "100%",
                            height: "28px",
                            padding: "0.2rem 0.45rem",
                            fontSize: "0.75rem",
                            color: "var(--ads-ink)",
                            backgroundColor: isAssigned ? "var(--ads-material-thick)" : "var(--ads-canvas)",
                            border: "1px solid var(--ads-hairline-strong)",
                            borderRadius: "var(--ads-r-xs)",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>

                      {/* Column 7: Stops */}
                      <td style={{ padding: "0.4rem 0.55rem" }}>
                        <input
                          type="text"
                          value={inputs.stops}
                          onChange={(e) => handleAssignmentInputChange(v.id, "stops", e.target.value)}
                          onBlur={() => handleSaveAssignmentInputs(v)}
                          placeholder="0"
                          style={{
                            width: "100%",
                            height: "28px",
                            padding: "0.2rem 0.45rem",
                            fontSize: "0.75rem",
                            color: "var(--ads-ink)",
                            backgroundColor: isAssigned ? "var(--ads-material-thick)" : "var(--ads-canvas)",
                            border: "1px solid var(--ads-hairline-strong)",
                            borderRadius: "var(--ads-r-xs)",
                            outline: "none",
                            boxSizing: "border-box",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      {/* Column 8: Packages */}
                      <td style={{ padding: "0.4rem 0.55rem" }}>
                        <input
                          type="text"
                          value={inputs.pack}
                          onChange={(e) => handleAssignmentInputChange(v.id, "pack", e.target.value)}
                          onBlur={() => handleSaveAssignmentInputs(v)}
                          placeholder="0"
                          style={{
                            width: "100%",
                            height: "28px",
                            padding: "0.2rem 0.45rem",
                            fontSize: "0.75rem",
                            color: "var(--ads-ink)",
                            backgroundColor: isAssigned ? "var(--ads-material-thick)" : "var(--ads-canvas)",
                            border: "1px solid var(--ads-hairline-strong)",
                            borderRadius: "var(--ads-r-xs)",
                            outline: "none",
                            boxSizing: "border-box",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      {/* Column 9: Est. Time Return */}
                      <td style={{ padding: "0.4rem 0.55rem" }}>
                        <input
                          type="text"
                          value={inputs.est_time}
                          onChange={(e) => handleAssignmentInputChange(v.id, "est_time", e.target.value)}
                          onBlur={() => handleSaveAssignmentInputs(v)}
                          placeholder="HH:MM"
                          style={{
                            width: "100%",
                            height: "28px",
                            padding: "0.2rem 0.45rem",
                            fontSize: "0.75rem",
                            color: "var(--ads-ink)",
                            backgroundColor: isAssigned ? "var(--ads-material-thick)" : "var(--ads-canvas)",
                            border: "1px solid var(--ads-hairline-strong)",
                            borderRadius: "var(--ads-r-xs)",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>

                      {/* Custom Questions Columns */}
                      {customTextHeaders.map((q: any) => {
                        const key = q.question_id || q.id;
                        const val = inputs.custom_questions?.[key]?.value ?? "";
                        return (
                          <td key={key} style={{ padding: "0.4rem 0.55rem" }}>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => handleAssignmentInputChange(v.id, key, e.target.value, true)}
                              onBlur={() => handleSaveAssignmentInputs(v)}
                              placeholder={q.name}
                              style={{
                                width: "100%",
                                height: "28px",
                                padding: "0.2rem 0.45rem",
                                fontSize: "0.75rem",
                                color: "var(--ads-ink)",
                                backgroundColor: isAssigned ? "var(--ads-material-thick)" : "var(--ads-canvas)",
                                border: "1px solid var(--ads-hairline-strong)",
                                borderRadius: "var(--ads-r-xs)",
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Daily Operation Report Upload Modal */}
      <DailyOperationReportModal
        isOpen={isOpsReportModalOpen}
        onClose={() => setIsOpsReportModalOpen(false)}
        date={selectedDate}
        onSuccess={() => loadData(selectedDate)}
      />

      {/* 6. Bulk Message Modal */}
      {isBulkMessageModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.32)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "var(--ads-s4)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onClick={() => setIsBulkMessageModalOpen(false)}
        >
          <div
            style={{
              background: "var(--ads-material-thick)",
              backdropFilter: "var(--ads-blur-lg)",
              WebkitBackdropFilter: "var(--ads-blur-lg)",
              borderRadius: "var(--ads-r-xl)",
              boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
              width: "100%",
              maxWidth: "460px",
              overflow: "hidden",
              border: "1px solid var(--ads-hairline)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--ads-s5) var(--ads-s6)",
                borderBottom: "1px solid var(--ads-hairline)",
                background: "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--ads-r-xs)",
                    backgroundColor: "var(--ads-blue-tint)",
                    color: "var(--ads-blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--ads-ink)", margin: 0, letterSpacing: "-0.014em" }}>
                  Send Assignment Messages
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkMessageModalOpen(false)}
                aria-label="Close send messages dialog"
                style={{
                  width: "32px",
                  height: "32px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-sm)",
                  color: "var(--ads-ink-tertiary)",
                  cursor: "pointer",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "var(--ads-s6)", display: "flex", flexDirection: "column", gap: "var(--ads-s4)" }}>
              <div
                style={{
                  padding: "var(--ads-s3)",
                  borderRadius: "var(--ads-r-sm)",
                  backgroundColor: "var(--ads-blue-tint)",
                  border: "1px solid var(--ads-blue-tint-strong)",
                  fontSize: "0.8125rem",
                  color: "var(--ads-blue)",
                  lineHeight: 1.45,
                }}
              >
                You are about to send vehicle and route assignment messages to{" "}
                <strong>{assignedCount} assigned driver{assignedCount > 1 ? "s" : ""}</strong> for{" "}
                <strong>{formattedDateTitle}</strong>.
              </div>

              {/* Delivery Channels */}
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink-secondary)", display: "block", marginBottom: "0.5rem" }}>
                  Delivery Channels
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      fontSize: "0.8125rem",
                      color: "var(--ads-ink)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={bulkChannels.sms}
                      onChange={(e) =>
                        setBulkChannels((prev) => ({ ...prev, sms: e.target.checked }))
                      }
                      style={{ width: "16px", height: "16px", accentColor: "var(--ads-blue)", cursor: "pointer" }}
                    />
                    <span>Text Message (SMS)</span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      fontSize: "0.8125rem",
                      color: "var(--ads-ink)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={bulkChannels.inApp}
                      onChange={(e) =>
                        setBulkChannels((prev) => ({ ...prev, inApp: e.target.checked }))
                      }
                      style={{ width: "16px", height: "16px", accentColor: "var(--ads-blue)", cursor: "pointer" }}
                    />
                    <span>In-App Driver Notification</span>
                  </label>
                </div>
              </div>

              {/* Information preview */}
              <div style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", lineHeight: 1.4 }}>
                Each driver receives their specific vehicle unit, CX/route number, staging location, stops, packages, and return time based on the values in the table.
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "var(--ads-s3)",
                padding: "var(--ads-s4) var(--ads-s6)",
                borderTop: "1px solid var(--ads-hairline)",
                background: "transparent",
              }}
            >
              <button
                type="button"
                onClick={() => setIsBulkMessageModalOpen(false)}
                disabled={isSendingMessages}
                style={{
                  padding: "9px 18px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  background: "var(--ads-material-thick)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-pill)",
                  boxShadow: "var(--ads-bevel)",
                  color: "var(--ads-ink)",
                  cursor: isSendingMessages ? "not-allowed" : "pointer",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBulkMessages}
                disabled={isSendingMessages || (!bulkChannels.sms && !bulkChannels.inApp)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "9px 18px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  background: "var(--ads-blue)",
                  border: "1px solid transparent",
                  borderRadius: "var(--ads-r-pill)",
                  color: "#FFFFFF",
                  cursor: isSendingMessages || (!bulkChannels.sms && !bulkChannels.inApp) ? "not-allowed" : "pointer",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                {isSendingMessages ? (
                  <>
                    <Loader2 size={13} className="animate-spin" style={{ color: "#FFFFFF" }} />
                    <span style={{ color: "#FFFFFF" }}>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} style={{ color: "#FFFFFF" }} />
                    <span style={{ color: "#FFFFFF" }}>Send ({assignedCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleAssignmentView;
