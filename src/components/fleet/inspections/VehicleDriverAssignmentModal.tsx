import React, { FC, useState, useEffect, useMemo } from "react";
import {
  X,
  Truck,
  User,
  ArrowLeftRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Link,
  Unlink,
  Check,
  Loader2,
  Building,
} from "lucide-react";
import { VehicleRecord } from "../../../api/fleetApi";
import type { Driver } from "../../../types/driver";

interface VehicleDriverAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleRecord[];
  drivers: Driver[];
  initialVehicleId?: number | string;
  initialDriverId?: number | string;
  onAssign: (
    vehicleId: number | string,
    driverId: number | null,
    driverName: string
  ) => Promise<void>;
}

export const VehicleDriverAssignmentModal: FC<VehicleDriverAssignmentModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  drivers,
  initialVehicleId,
  initialDriverId,
  onAssign,
}) => {
  // Mode: "vehicle-to-driver" | "driver-to-vehicle"
  const [mode, setMode] = useState<"vehicle-to-driver" | "driver-to-vehicle">("vehicle-to-driver");

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | string>(
    initialVehicleId || (vehicles[0]?.id ?? "")
  );
  const [selectedDriverId, setSelectedDriverId] = useState<number | string>(
    initialDriverId || (drivers[0]?.id ?? "")
  );

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial selections if opened with specific vehicle or driver
  useEffect(() => {
    if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
      setMode("vehicle-to-driver");
    } else if (initialDriverId) {
      setSelectedDriverId(initialDriverId);
      setMode("driver-to-vehicle");
    }
  }, [initialVehicleId, initialDriverId, isOpen]);

  if (!isOpen) return null;

  // Currently selected vehicle object
  const currentVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId));
  // Currently selected driver object
  const currentDriver = drivers.find((d) => String(d.id) === String(selectedDriverId));

  // Filtered vehicles list
  const filteredVehicles = vehicles.filter((v) => {
    if (!vehicleSearch) return true;
    const q = vehicleSearch.toLowerCase();
    return (
      v.unit_number?.toLowerCase().includes(q) ||
      v.vin?.toLowerCase().includes(q) ||
      v.license_plate?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.assigned_driver_name?.toLowerCase().includes(q)
    );
  });

  // Filtered drivers list
  const filteredDrivers = drivers.filter((d) => {
    if (!driverSearch) return true;
    const q = driverSearch.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.transporter_id?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.phone?.toLowerCase().includes(q)
    );
  });

  const handleConfirmAssignment = async () => {
    if (!selectedVehicleId) {
      setErrorMsg("Please select a vehicle to assign.");
      return;
    }
    if (!selectedDriverId) {
      setErrorMsg("Please select a driver to assign.");
      return;
    }

    const driverObj = drivers.find((d) => String(d.id) === String(selectedDriverId));
    const driverName = driverObj?.name || `Driver #${selectedDriverId}`;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAssign(selectedVehicleId, Number(selectedDriverId) || 0, driverName);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update vehicle assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    if (!selectedVehicleId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAssign(selectedVehicleId, null, "");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to remove assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-5 border-b-2 border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Vehicle-Driver Two-Way Assignment
                </h3>
                <p className="text-xs text-slate-500">
                  Link or reassign active fleet vehicles and drivers with real-time sync
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-5 pt-4 pb-2 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("vehicle-to-driver")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "vehicle-to-driver"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Truck size={14} />
                <span>Vehicle → Driver</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("driver-to-vehicle")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "driver-to-vehicle"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User size={14} />
                <span>Driver → Vehicle</span>
              </button>
            </div>

            <div className="text-[11px] font-semibold text-slate-500">
              Two-Way Binding Active
            </div>
          </div>

          {/* Error Banner if any */}
          {errorMsg && (
            <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Body */}
          <div className="p-5 space-y-4">
            {mode === "vehicle-to-driver" ? (
              /* Vehicle -> Driver Workflow */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: Select Vehicle */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={13} className="text-blue-600" />
                    1. Select Vehicle
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Vehicle Unit #, Make, Model..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-1.5 bg-slate-50/50">
                    {filteredVehicles.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No vehicles matching filter.
                      </div>
                    ) : (
                      filteredVehicles.map((v) => {
                        const isSelected = String(v.id) === String(selectedVehicleId);
                        return (
                          <div
                            key={v.id}
                            onClick={() => setSelectedVehicleId(v.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-50 border-blue-400 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {v.unit_number || `VAN-${v.id}`}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  v.status === "grounded"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {v.status || "in_service"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                              <span className="text-slate-500">{v.make || v.model || "Fleet Vehicle"}</span>
                              <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                                {v.assigned_driver_name ? `👤 ${v.assigned_driver_name}` : "⚪ Unassigned"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Step 2: Choose Available Driver */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-blue-600" />
                    2. Choose Driver to Assign
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Driver Name..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-1.5 bg-slate-50/50">
                    {filteredDrivers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No drivers matching filter.
                      </div>
                    ) : (
                      filteredDrivers.map((d) => {
                        const isSelected = String(d.id) === String(selectedDriverId);
                        return (
                          <div
                            key={d.id}
                            onClick={() => setSelectedDriverId(d.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-50 border-blue-400 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {d.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  d.status === "active"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {d.status?.toUpperCase() || "ACTIVE"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Station: {d.stations?.[0]?.station_code || "Primary"}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Driver -> Vehicle Workflow */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: Select Driver */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-blue-600" />
                    1. Select Driver
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Driver Name..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-1.5 bg-slate-50/50">
                    {filteredDrivers.map((d) => {
                      const isSelected = String(d.id) === String(selectedDriverId);
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDriverId(d.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {d.name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                              Driver
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Choose Vehicle to Assign */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={13} className="text-blue-600" />
                    2. Choose Vehicle to Assign
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Vehicle Unit #, Make, Model..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-1.5 bg-slate-50/50">
                    {filteredVehicles.map((v) => {
                      const isSelected = String(v.id) === String(selectedVehicleId);
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {v.unit_number || `VAN-${v.id}`}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {v.make || v.model || "Fleet"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 font-medium">
                            {v.assigned_driver_name ? `Assigned to: ${v.assigned_driver_name}` : "Available for assignment"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Live Binding Preview Card */}
            <div className="p-3.5 bg-blue-50/70 border-2 border-blue-200 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                  Pending Assignment Preview
                </span>
                <span className="text-[11px] text-blue-700 font-medium">
                  Two-Way Live Sync
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 min-w-0">
                  <Truck size={16} className="text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">
                      {currentVehicle?.unit_number || `Vehicle #${selectedVehicleId}`}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {currentVehicle?.make || currentVehicle?.model || "Active Fleet"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                  <ArrowLeftRight size={14} />
                  <span className="text-[11px]">LINKED</span>
                </div>

                <div className="flex items-center gap-2 min-w-0 text-right">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">
                      {currentDriver?.name || `Driver #${selectedDriverId}`}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {currentDriver?.status || "Active Driver"}
                    </span>
                  </div>
                  <User size={16} className="text-blue-600 flex-shrink-0" />
                </div>
              </div>

              {currentVehicle?.assigned_driver_name && (
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 flex items-center justify-between">
                  <span>
                    Currently assigned to: <strong>{currentVehicle.assigned_driver_name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleUnassign}
                    disabled={isSubmitting}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline ml-2"
                  >
                    Unassign Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t-2 border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {currentVehicle?.assigned_driver_name && (
                <button
                  type="button"
                  onClick={handleUnassign}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Unlink size={14} />
                  <span>Unassign Driver</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                style={{ color: "#FFFFFF" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" style={{ color: "#FFFFFF" }} />
                    <span>Syncing Assignment...</span>
                  </>
                ) : (
                  <>
                    <Link size={14} style={{ color: "#FFFFFF" }} />
                    <span>Confirm Two-Way Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDriverAssignmentModal;
