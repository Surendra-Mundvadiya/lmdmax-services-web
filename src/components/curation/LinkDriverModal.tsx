import React, { FC, useState, useMemo } from "react";
import {
  X,
  Search,
  Link,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Hash,
  Camera,
} from "lucide-react";
import { curationApi } from "../../api/curationApi";
import { useDriverStore } from "../../store/driverStore";
import { useCurationStore } from "../../store/curationStore";
import type { Driver } from "../../types/driver";

export interface LinkDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  curationRow?: {
    _id: string;
    name: string;
    transporter_id?: string;
    netradyne_id?: string;
    curation_type?: "unified" | "netradyne" | "ementor";
  };
  onSuccess?: (driverName: string) => void;
}

export const LinkDriverModal: FC<LinkDriverModalProps> = ({
  isOpen,
  onClose,
  curationRow,
  onSuccess,
}) => {
  const drivers = useDriverStore((state) => state.drivers);
  const updateDriver = useDriverStore((state) => state.updateDriver);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
  const fetchCurationCount = useCurationStore((state) => state.fetchCurationCount);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter existing drivers by search or match curation name
  const candidateDrivers = useMemo(() => {
    if (!curationRow) return [];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return drivers.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.transporter_id && d.transporter_id.toLowerCase().includes(q)) ||
          (d.email && d.email.toLowerCase().includes(q))
      );
    }
    // Default: find best matches by name
    const rawCurationName = curationRow.name.toLowerCase().trim();
    const firstName = rawCurationName.split(/\s+/)[0];

    return drivers.filter((d) => {
      const dName = d.name.toLowerCase();
      return (
        dName.includes(rawCurationName) ||
        (firstName && dName.includes(firstName)) ||
        (curationRow.transporter_id && d.transporter_id === curationRow.transporter_id)
      );
    });
  }, [drivers, curationRow, searchQuery]);

  if (!isOpen || !curationRow) return null;

  const handleConfirmLink = async () => {
    if (!selectedDriver) {
      setErrorMsg("Please select a driver to link.");
      return;
    }

    setIsLinking(true);
    setErrorMsg(null);

    try {
      // 1. Associate driver name in performance service
      await curationApi.addAssociatedNames(
        curationRow.name,
        selectedDriver.id,
        curationRow.netradyne_id
          ? { [curationRow.netradyne_id]: selectedDriver.name }
          : undefined
      );

      // 2. Update driver profile if missing transporter_id or netradyne_id
      const updates: Partial<Driver> = {};
      if (curationRow.transporter_id && !selectedDriver.transporter_id) {
        updates.transporter_id = curationRow.transporter_id;
      }
      if (curationRow.netradyne_id && !selectedDriver.netradyne_id) {
        updates.netradyne_id = curationRow.netradyne_id;
      }
      if (Object.keys(updates).length > 0) {
        updateDriver(selectedDriver.id, updates);
      }

      // 3. Resolve / delete curation item
      try {
        await curationApi.deleteCuration(
          curationRow._id,
          curationRow.curation_type === "unified" ? "transporter_id" : "netradyne_id"
        );
      } catch (delErr) {
        console.warn("curationApi.deleteCuration note:", delErr);
      }

      // 4. Synchronize drivers and counts
      await fetchDrivers();
      await fetchCurationCount(true);

      onSuccess?.(selectedDriver.name);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to link driver.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-dialog"
        style={{ maxWidth: "540px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="custom-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Link size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Link Driver to Curation</h3>
              <p className="text-xs text-slate-500">
                Associate &quot;{curationRow.name}&quot; with an existing driver profile
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLinking}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={15} className="flex-shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Curation Details Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 capitalize tracking-normal block mb-1">
              Pending curation record
            </span>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
              <div className="flex items-center gap-2">
                <User size={15} className="text-blue-600" />
                <span>{curationRow.name}</span>
              </div>
              {curationRow.transporter_id && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                  <Hash size={12} className="text-slate-400" />
                  <span>{curationRow.transporter_id}</span>
                </div>
              )}
              {curationRow.netradyne_id && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                  <Camera size={12} className="text-slate-400" />
                  <span>{curationRow.netradyne_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Existing Drivers */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Search Existing Drivers
            </label>
            <div className="standard-search-wrap">
              <Search size={14} className="standard-search-icon" />
              <input
                type="text"
                className="standard-search-input"
                placeholder="Search driver by name, TID or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="standard-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Driver Selection List */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-500">
              {candidateDrivers.length} matching driver{candidateDrivers.length !== 1 ? "s" : ""} found:
            </span>

            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-1.5 bg-slate-50/50">
              {candidateDrivers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No existing drivers matched &quot;{searchQuery || curationRow.name}&quot;. Try searching another name or create a new driver.
                </div>
              ) : (
                candidateDrivers.map((d) => {
                  const isSelected = selectedDriver?.id === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDriver(d)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-500 shadow-sm"
                          : "bg-white border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            isSelected ? "bg-blue-600" : "bg-slate-400"
                          }`}
                        >
                          {d.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{d.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {d.email || d.phone || "Active Driver"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center pl-2">
                        {isSelected && <CheckCircle2 size={16} className="text-blue-600" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="custom-modal-footer">
          <button
            type="button"
            className="btn-outline-secondary"
            onClick={onClose}
            disabled={isLinking}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-blue-primary flex items-center gap-2"
            onClick={handleConfirmLink}
            disabled={isLinking || !selectedDriver}
          >
            {isLinking ? (
              <>
                <Loader2 size={15} className="animate-spin text-white" />
                <span>Linking Driver...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} className="text-white" />
                <span>Confirm Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkDriverModal;
