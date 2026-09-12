import React, { FC, useState, useEffect, useMemo } from "react";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  RefreshCw,
  Link,
  Filter,
  ShieldCheck,
  ChevronRight,
  User,
  Gauge,
  Fuel,
  Building,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import {
  fleetApi,
  VehicleRecord,
  InspectionRecord,
  normalizeInspectionRecord,
} from "../../../api/fleetApi";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import InspectionReportDrawer from "./InspectionReportDrawer";
import EmbeddedInspectionReportView from "./EmbeddedInspectionReportView";
import VehicleDriverAssignmentModal from "./VehicleDriverAssignmentModal";
import NewInspectionModal from "./NewInspectionModal";

export const VehicleInspectionView: FC = () => {
  // Global Store State
  const drivers = useDriverStore((state) => state.drivers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
  const stations = useAuthStore((state) => state.stations);
  const user = useAuthStore((state) => state.user);

  // Active Station Code
  const activeStation =
    user?.station_code ||
    user?.company?.station_code ||
    (stations[0]?.station_code ?? "QUE2");

  // Local State
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "pre" | "post" | "default">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_service" | "needs_inspection" | "grounded" | "defects">("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  // Modals & Slide-over Drawer
  const [drawerInspection, setDrawerInspection] = useState<InspectionRecord | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState<boolean>(false);
  const [assignmentVehicleId, setAssignmentVehicleId] = useState<number | string | undefined>(undefined);
  const [isNewInspectionModalOpen, setIsNewInspectionModalOpen] = useState<boolean>(false);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load Vehicles, Drivers & Inspections
  const loadData = async (dateToFetch: string = selectedDate) => {
    try {
      setIsLoading(true);
      const [vList, inspList] = await Promise.all([
        fleetApi.getVehicles(),
        fleetApi.getInspectionsByDate(dateToFetch),
        drivers.length === 0 ? fetchDrivers() : Promise.resolve(),
      ]);

      setVehicles(vList);
      setInspections(inspList);
    } catch {
      // API call handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(selectedDate);
  };

  // Two-Way Assignment Handler with Optimistic UI Update
  const handleAssignment = async (
    vehicleId: number | string,
    driverId: number | null,
    driverName: string
  ) => {
    // 1. Snapshot previous state for rollback
    const prevVehicles = [...vehicles];
    const prevInspections = [...inspections];

    // 2. Real-time Optimistic Update
    setVehicles((prev) =>
      prev.map((v) => {
        if (String(v.id) === String(vehicleId)) {
          return {
            ...v,
            assigned_driver: driverId,
            assigned_driver_name: driverName || "",
          };
        }
        return v;
      })
    );

    setInspections((prev) =>
      prev.map((insp) => {
        if (String(insp.vehicle_id) === String(vehicleId)) {
          return {
            ...insp,
            driver_id: driverId || undefined,
            driver_name: driverName || "Unassigned",
          };
        }
        return insp;
      })
    );

    showToast(
      driverId
        ? `Optimistically assigned ${driverName} to vehicle #${vehicleId}.`
        : `Vehicle #${vehicleId} has been unassigned.`,
      "success"
    );

    // 3. Background Sync to Backend
    try {
      await fleetApi.assignVehicleDriver(vehicleId, driverId, driverName);
    } catch (err: any) {
      // Rollback on failure
      setVehicles(prevVehicles);
      setInspections(prevInspections);
      showToast(err?.message || "Failed to persist assignment to server. Reverted.", "error");
    }
  };

  // New Inspection Submission Handler
  const handleCreateInspection = async (data: Partial<InspectionRecord>) => {
    // 1. Optimistic Add to Table
    const normalized = normalizeInspectionRecord(data, "driver", inspections.length);
    setInspections((prev) => [normalized, ...prev]);

    // Also update vehicle odometer/status if provided
    if (data.vehicle_id && data.odometer) {
      setVehicles((prev) =>
        prev.map((v) =>
          String(v.id) === String(data.vehicle_id)
            ? {
                ...v,
                odometer: data.odometer,
                status: data.status === "failed" ? "grounded" : v.status,
              }
            : v
        )
      );
    }

    showToast(`Inspection #${normalized.id} recorded successfully.`, "success");

    // 2. Backend Submission
    try {
      await fleetApi.createInspection(data);
    } catch {
      // Offline fallback already reflected
    }
  };

  // KPIs & Metrics
  const totalInspected = inspections.length;
  const passedCount = inspections.filter((i) => i.status === "passed").length;
  const passRate = totalInspected > 0 ? Math.round((passedCount / totalInspected) * 100) : 100;
  const defectCount = inspections.filter((i) => i.status === "failed" || i.status === "caution").length;
  const assignedVehiclesCount = vehicles.filter((v) => Boolean(v.assigned_driver_name)).length;

  // Filter & Search Logic
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      // 1. Tab filter (All | Pre | Post | Default)
      if (activeTab !== "all" && insp.inspection_type !== activeTab) {
        return false;
      }

      // 2. Status pill filter
      if (statusFilter === "in_service" && insp.status !== "passed") {
        return false;
      }
      if (statusFilter === "needs_inspection" && insp.status !== "pending") {
        return false;
      }
      if (statusFilter === "grounded" && insp.status !== "failed") {
        return false;
      }
      if (statusFilter === "defects" && insp.status !== "failed" && insp.status !== "caution") {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUnit = insp.vehicle_unit?.toLowerCase().includes(q);
        const matchesVin = insp.vin?.toLowerCase().includes(q);
        const matchesPlate = insp.license_plate?.toLowerCase().includes(q);
        const matchesDriver = insp.driver_name?.toLowerCase().includes(q);
        const matchesShift = insp.shift_type?.toLowerCase().includes(q);
        if (!matchesUnit && !matchesVin && !matchesPlate && !matchesDriver && !matchesShift) {
          return false;
        }
      }

      return true;
    });
  }, [inspections, activeTab, statusFilter, searchQuery]);

  // If viewing full report, render the embedded inspection report in the background complete screen
  if (drawerInspection) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {toastMsg && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
              toastMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-rose-50 text-rose-800 border-rose-300"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        )}

        <EmbeddedInspectionReportView
          inspection={drawerInspection}
          onBack={() => setDrawerInspection(null)}
          onReassignVehicle={(insp) => {
            setAssignmentVehicleId(insp.vehicle_id);
            setIsAssignmentModalOpen(true);
          }}
        />

        {/* Two-Way Vehicle-Driver Assignment Modal if triggered */}
        <VehicleDriverAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          vehicles={vehicles}
          drivers={drivers}
          initialVehicleId={assignmentVehicleId}
          onAssign={handleAssignment}
        />
      </div>
    );
  }

  // Render New Inspection Form embedded directly in background complete screen
  if (isNewInspectionModalOpen) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
        {toastMsg && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
              toastMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-rose-50 text-rose-800 border-rose-300"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        )}

        <NewInspectionModal
          isOpen={true}
          embedded={true}
          onClose={() => setIsNewInspectionModalOpen(false)}
          vehicles={vehicles}
          drivers={drivers}
          onSubmit={async (data) => {
            await handleCreateInspection(data);
            setIsNewInspectionModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-300"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Breadcrumb & Actions Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Breadcrumb & Title */}
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
            <span className="hover:text-blue-600 cursor-pointer">Fleet</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-blue-600">Vehicle Inspections</span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              <Building size={11} className="text-blue-600" />
              Station: {activeStation}
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck size={24} className="text-blue-600" />
              Inspection & Assignment View
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Fleet Tracking
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Inspections & Vehicles"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Date Picker */}
          <div className="relative flex items-center">
            <Calendar size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            />
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAssignmentVehicleId(undefined);
                setIsAssignmentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-xs flex items-center gap-1.5"
              style={{ color: "#FFFFFF" }}
            >
              <Link size={14} style={{ color: "#FFFFFF" }} />
              <span>Assign Vehicle</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewInspectionModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 transition-all shadow-xs flex items-center gap-1.5"
              style={{ color: "#FFFFFF" }}
            >
              <Plus size={14} style={{ color: "#FFFFFF" }} />
              <span>+ Log Inspection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fleet KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Inspected Today</span>
            <FileText size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalInspected} <span className="text-xs font-medium text-slate-400">records</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Total fleet vans: {vehicles.length}</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Pass Rate</span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {passRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {passedCount} passed without open safety flags
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Defects / Caution Flags</span>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <div className={`text-2xl font-black ${defectCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
            {defectCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {defectCount === 0 ? "Zero flagged defects" : "Needs maintenance dispatch check"}
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Assigned Fleet</span>
            <Truck size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {assignedVehiclesCount} / {vehicles.length}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            {vehicles.length > 0 ? `${Math.round((assignedVehiclesCount / vehicles.length) * 100)}% active allocation` : "—"}
          </div>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Toolbar: Search, Filter Pills & Tabs */}
        <div className="p-4 border-b-2 border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Multi-Tab Filter Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
            {[
              { id: "all", label: "All Inspections", count: inspections.length },
              { id: "pre", label: "Pre-Inspection", count: inspections.filter((i) => i.inspection_type === "pre").length },
              { id: "post", label: "Post-Inspection (Return)", count: inspections.filter((i) => i.inspection_type === "post").length },
              { id: "default", label: "Default / Daily DVIC", count: inspections.filter((i) => i.inspection_type === "default").length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-300/60 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Search & Status Filter Pills */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Unit #, VIN, Driver..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: "all", label: "All Status" },
                { id: "in_service", label: "Passed" },
                { id: "defects", label: "Defects / Flagged" },
                { id: "grounded", label: "Grounded" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === pill.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b-2 border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3">Vehicle Info</th>
                <th className="px-4 py-3">Driver Name</th>
                <th className="px-4 py-3">Inspection Type</th>
                <th className="px-4 py-3">Checklist Status</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Submission Details</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">
                      Syncing live inspection records and fleet vehicles...
                    </p>
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-30 text-slate-500" />
                    <p className="text-sm font-bold text-slate-700">
                      No inspection logs found for {selectedDate}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      No records match the selected filter. You can log an inspection or switch the date above.
                    </p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setIsNewInspectionModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs"
                        style={{ color: "#FFFFFF" }}
                      >
                        + Log New Inspection Form
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInspections.map((insp) => {
                  const isPassed = insp.status === "passed";
                  const isCaution = insp.status === "caution";
                  const isFailed = insp.status === "failed";

                  return (
                    <tr
                      key={insp.id}
                      className="hover:bg-blue-50/30 transition-colors group cursor-default"
                    >
                      {/* 1. Vehicle Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Truck size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">
                              {insp.vehicle_unit || "Fleet Van"}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 truncate">
                              {insp.vin || "VIN —"}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-600">
                              Plate: <span className="text-slate-800">{insp.license_plate || "—"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Driver Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                            {insp.driver_name?.charAt(0) || "D"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {insp.driver_name || "Unassigned"}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {insp.driver_id ? `ID: #${insp.driver_id}` : "Assigned driver"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Inspection Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            insp.inspection_type === "post"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : insp.inspection_type === "default"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {insp.inspection_type === "post"
                            ? "Post-Trip (Return)"
                            : insp.inspection_type === "default"
                            ? "Daily DVIC"
                            : "Pre-Trip DVIC"}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {insp.shift_type || "Daily Inspection"}
                        </div>
                      </td>

                      {/* 4. Checklist Status (Pass / Caution / Fail) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isPassed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            PASS (Satisfactory)
                          </span>
                        )}
                        {isCaution && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle size={12} className="text-amber-600" />
                            CAUTION ({insp.defects_found || 1} defect)
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={12} className="text-rose-600" />
                            FAIL / GROUNDED
                          </span>
                        )}
                      </td>

                      {/* 5. Date & Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{insp.date}</div>
                        <div className="text-[10px] text-slate-400">
                          {insp.verified_on
                            ? new Date(insp.verified_on).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Submitted"}
                        </div>
                      </td>

                      {/* 6. Submission Details */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-slate-700">
                            <Gauge size={11} className="text-slate-400" />
                            <span>{insp.odometer ? `${insp.odometer.toLocaleString()} mi` : "—"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Fuel size={11} className="text-slate-400" />
                            <span>{insp.fuel_level || "Standard"}</span>
                          </div>
                        </div>
                      </td>

                      {/* 7. Row Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDrawerInspection(insp)}
                            className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <FileText size={12} />
                            <span>Full Report</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAssignmentVehicleId(insp.vehicle_id);
                              setIsAssignmentModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Reassign or update driver for this vehicle"
                          >
                            <Link size={12} />
                            <span>Assign</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{filteredInspections.length}</strong> of <strong>{inspections.length}</strong> inspection records
          </span>
          <span className="font-semibold text-slate-600">
            Real-Time DVIC Fleet Operations
          </span>
        </div>
      </div>

      {/* Two-Way Vehicle-Driver Assignment Modal */}
      <VehicleDriverAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        vehicles={vehicles}
        drivers={drivers}
        initialVehicleId={assignmentVehicleId}
        onAssign={handleAssignment}
      />
    </div>
  );
};

export default VehicleInspectionView;
