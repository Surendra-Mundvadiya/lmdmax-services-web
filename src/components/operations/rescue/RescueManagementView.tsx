import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  LifeBuoy,
  Package,
  MapPin,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useDriverStore } from "../../../store/driverStore";
import { calloutRescueApi, type RescueItem, type RescueStatus } from "../../../api/calloutRescueApi";
import { AddRescueModal } from "./AddRescueModal";
import { AppDateNavigator } from "../../common/AppDateNavigator";
import "./rescue.css";

export const RescueManagementView: FC = () => {
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  const drivers = useDriverStore((state) => state.drivers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);

  // Load drivers on mount if empty
  useEffect(() => {
    if (drivers.length === 0) {
      fetchDrivers();
    }
  }, [drivers.length, fetchDrivers]);

  // Date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Rescue data
  const [rescues, setRescues] = useState<RescueItem[]>([]);
  const [originalRescues, setOriginalRescues] = useState<RescueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Front Screen Pending Rescues State
  const [pendingRescues, setPendingRescues] = useState<RescueItem[]>([]);
  const [isSavingPending, setIsSavingPending] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");

  // Inline edit state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);

  // Modals
  const [editingRescue, setEditingRescue] = useState<RescueItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<RescueItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Station drivers
  const stationDrivers = useMemo(() => {
    const list = drivers.filter((d) => {
      if (d.status === "inactive" || d.is_deleted) return false;
      if (!activeStationCode) return true;
      const target = activeStationCode.trim().toUpperCase();
      return d.stations?.some(
        (st) => st.station_code && st.station_code.trim().toUpperCase() === target
      );
    });
    return list.length > 0 ? list : drivers.filter((d) => d.status !== "inactive" && !d.is_deleted);
  }, [drivers, activeStationCode]);

  // Fetch rescues
  const fetchRescues = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsEditMode(false);
      const data = await calloutRescueApi.getRescues(selectedDate);
      setRescues(data);
      setOriginalRescues(JSON.parse(JSON.stringify(data)));
    } catch (err: any) {
      setError(err.message || "Failed to load rescues for this date");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRescues();
  }, [fetchRescues]);



  // Front Screen Pending Rescues Handlers
  const handleAddPendingRescue = () => {
    setPendingRescues((prev) => [
      {
        date: selectedDate,
        rescuer_id: "",
        rescuer_name: "",
        caller_id: "",
        caller_name: "",
        status: "Completed",
        number_of_packages: "",
        number_of_stops: "",
        reason: "",
      },
      ...prev,
    ]);
  };

  const handlePendingRescueChange = (
    index: number,
    field: keyof RescueItem,
    value: any
  ) => {
    setPendingRescues((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === "rescuer_id") {
            const found = stationDrivers.find((d) => String(d.id) === String(value));
            if (found) updated.rescuer_name = found.name;
          } else if (field === "caller_id") {
            const found = stationDrivers.find((d) => String(d.id) === String(value));
            if (found) updated.caller_name = found.name;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemovePendingRescue = (index: number) => {
    setPendingRescues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePendingRescues = async () => {
    if (pendingRescues.length === 0) return;
    const invalid = pendingRescues.find(
      (r) => !r.rescuer_id || !r.caller_id || String(r.rescuer_id) === String(r.caller_id)
    );
    if (invalid) {
      setError(
        "Please select both a Rescuer and a Receiver driver (must be two different drivers) for each pending rescue row."
      );
      return;
    }
    try {
      setIsSavingPending(true);
      setError(null);
      const payload = pendingRescues.map((r) => ({
        ...r,
        date: selectedDate,
        number_of_packages: r.number_of_packages ? Number(r.number_of_packages) : 0,
        number_of_stops: r.number_of_stops ? Number(r.number_of_stops) : 0,
      }));
      const saved = await calloutRescueApi.saveRescues(payload);
      setPendingRescues([]);
      await fetchRescues();
      showToast(`${saved?.length || payload.length} rescue record(s) logged successfully!`);
    } catch (err: any) {
      setError(err.message || "Failed to save rescues");
    } finally {
      setIsSavingPending(false);
    }
  };

  const handleDiscardPendingRescues = () => {
    setPendingRescues([]);
  };

  // Add / Edit Rescue
  const handleSaveRescue = async (rescue: Partial<RescueItem>, isEdit: boolean) => {
    if (isEdit && editingRescue) {
      const payload: RescueItem = {
        ...editingRescue,
        ...rescue,
      } as RescueItem;
      await calloutRescueApi.editRescues([payload]);
      setRescues((prev) =>
        prev.map((r) => (r._id === editingRescue._id ? { ...r, ...payload } : r))
      );
      setOriginalRescues((prev) =>
        prev.map((r) => (r._id === editingRescue._id ? { ...r, ...payload } : r))
      );
      setEditingRescue(null);
      showToast("Rescue record updated successfully");
    } else {
      const saved = await calloutRescueApi.saveRescues([rescue]);
      if (saved && saved.length > 0) {
        const updated = [...saved, ...rescues];
        setRescues(updated);
        setOriginalRescues(JSON.parse(JSON.stringify(updated)));
        showToast("Rescue record logged successfully");
      }
    }
  };

  // Inline Edit Change
  const handleInlineChange = (
    index: number,
    field: keyof RescueItem,
    value: any
  ) => {
    setRescues((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          // If updating rescuer or caller by ID, sync name as well
          if (field === "rescuer_id") {
            const found = stationDrivers.find((d) => String(d.id) === String(value));
            if (found) updated.rescuer_name = found.name;
          } else if (field === "caller_id") {
            const found = stationDrivers.find((d) => String(d.id) === String(value));
            if (found) updated.caller_name = found.name;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Save Edits
  const handleSaveEdits = async () => {
    try {
      setIsSavingEdits(true);
      await calloutRescueApi.editRescues(rescues);
      setOriginalRescues(JSON.parse(JSON.stringify(rescues)));
      setIsEditMode(false);
      showToast("All rescue edits saved successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update rescues");
    } finally {
      setIsSavingEdits(false);
    }
  };

  // Discard Edits
  const handleDiscardEdits = () => {
    setRescues(JSON.parse(JSON.stringify(originalRescues)));
    setIsEditMode(false);
  };

  // Delete Rescue
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem || !deleteConfirmItem._id) return;
    try {
      setIsDeleting(true);
      await calloutRescueApi.deleteRescue({
        _id: deleteConfirmItem._id,
        rescuer_id: deleteConfirmItem.rescuer_id,
        caller_id: deleteConfirmItem.caller_id,
        date: selectedDate,
      });
      const filtered = rescues.filter((r) => r._id !== deleteConfirmItem._id);
      setRescues(filtered);
      setOriginalRescues(filtered);
      setDeleteConfirmItem(null);
      showToast("Rescue record deleted successfully");
    } catch (err: any) {
      setError(err.message || "Failed to delete rescue");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List (Search Only)
  const filteredRescues = useMemo(() => {
    if (!searchQuery.trim()) return rescues;
    const q = searchQuery.toLowerCase().trim();
    return rescues.filter((r) => {
      const matchesRescuer = r.rescuer_name?.toLowerCase().includes(q);
      const matchesReceiver = r.caller_name?.toLowerCase().includes(q);
      const matchesReason = r.reason?.toLowerCase().includes(q);
      return Boolean(matchesRescuer || matchesReceiver || matchesReason);
    });
  }, [rescues, searchQuery]);

  const isToday = useMemo(() => {
    return selectedDate === new Date().toISOString().split("T")[0];
  }, [selectedDate]);

  return (
    <div className="rescue-main-container">
      <div className="rescue-card-container">
        {/* Toast Notifications */}
        {successToast && (
          <div className="rescue-toast-banner">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={15} />
              <span>{successToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              aria-label="Dismiss message"
              title="Dismiss"
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && (
          <div className="rescue-toast-error">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              title="Dismiss"
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ==================== ACTION TOOLBAR (Matching Callouts & Chats) ==================== */}
        <div className="rescue-filter-toolbar">
          <div className="rescue-toolbar-left">
            {/* Search Input */}
            <div className="rescue-search-wrap">
              <Search size={14} className="rescue-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rescuer, receiver or reason..."
                className="rescue-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rescue-search-clear"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchRescues}
              disabled={isLoading}
              className="rescue-tool-btn"
              title="Refresh Rescues from Live Microservice"
              aria-label="Refresh Rescues from Live Microservice"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>

            {/* Station and Records count pill */}
            <span className="callout-station-badge">
              <span className="callout-live-dot" />
              {activeStationCode} • {filteredRescues.length} rescue{filteredRescues.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="rescue-toolbar-right">
            {/* Date Navigator directly integrated on toolbar */}
            <AppDateNavigator
              selectedDate={selectedDate}
              onChange={(newDate) => {
                setSelectedDate(newDate);
                setPendingRescues([]);
              }}
              size="sm"
            />

            {/* Primary Add Rescue Button */}
            <button
              type="button"
              onClick={handleAddPendingRescue}
              className="btn-add-rescue"
              title="Add a delivery rescue row"
            >
              <Plus size={15} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Add Rescue</span>
            </button>
          </div>
        </div>

        {/* ==================== PENDING SAVE BANNER ==================== */}
        {pendingRescues.length > 0 && (
          <div className="rescue-pending-banner">
            <div className="rescue-pending-text">
              <AlertCircle size={16} style={{ color: "var(--ads-blue)" }} />
              <span>
                <strong>{pendingRescues.length}</strong> new rescue sweep{pendingRescues.length > 1 ? "s" : ""} pending — review details and click save
              </span>
            </div>
            <div className="rescue-pending-actions">
              <button
                type="button"
                onClick={handleDiscardPendingRescues}
                disabled={isSavingPending}
                className="rescue-btn-discard"
              >
                <X size={14} />
                <span>Discard All</span>
              </button>
              <button
                type="button"
                onClick={handleAddPendingRescue}
                disabled={isSavingPending}
                className="rescue-btn-secondary"
              >
                <Plus size={14} />
                <span>+ Add Another Rescue</span>
              </button>
              <button
                type="button"
                onClick={handleSavePendingRescues}
                disabled={isSavingPending}
                className="rescue-btn-save"
              >
                <Check size={14} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>
                  {isSavingPending ? "Saving..." : `Save (${pendingRescues.length}) Rescues`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== DATA TABLE AREA ==================== */}
        <div className="rescue-table-container">
          {isLoading ? (
            <div className="rescue-empty-state">
              <RefreshCw size={26} className="animate-spin" style={{ color: "var(--ads-blue)" }} />
              <h3 className="rescue-empty-title">Loading Rescue Records...</h3>
              <p className="rescue-empty-desc">
                Fetching dynamic delivery sweeps and rescue coordination logs for station {activeStationCode}.
              </p>
            </div>
          ) : filteredRescues.length === 0 && pendingRescues.length === 0 ? (
            <div className="rescue-empty-state">
              <div className="rescue-empty-icon">
                <LifeBuoy size={26} />
              </div>
              <h3 className="rescue-empty-title">No Rescue Records Found</h3>
              <p className="rescue-empty-desc">
                No delivery rescues recorded for station {activeStationCode} on {selectedDate}.
              </p>
            </div>
          ) : (
            <div className="rescue-table-wrapper">
              <table className="rescue-table">
                <thead>
                  <tr>
                    <th>Rescuer Driver</th>
                    <th>Receiver Driver</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "center" }}>Packages</th>
                    <th style={{ textAlign: "center" }}>Stops</th>
                    <th>Reason / Notes</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* PENDING RESCUE ROWS (ADDED DIRECTLY ON FRONT SCREEN) */}
                  {pendingRescues.map((pending, pIdx) => (
                    <tr key={`pending-rescue-${pIdx}`} className="rescue-pending-row">
                      {/* 1. Rescuer Driver */}
                      <td>
                        <select
                          value={pending.rescuer_id}
                          onChange={(e) => handlePendingRescueChange(pIdx, "rescuer_id", e.target.value)}
                          className="rescue-inline-select"
                          style={{ fontWeight: 600 }}
                        >
                          <option value="">-- Select Rescuer --</option>
                          {stationDrivers
                            .filter((d) => String(d.id) !== String(pending.caller_id))
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                        </select>
                      </td>

                      {/* 2. Receiver Driver */}
                      <td>
                        <select
                          value={pending.caller_id}
                          onChange={(e) => handlePendingRescueChange(pIdx, "caller_id", e.target.value)}
                          className="rescue-inline-select"
                          style={{ fontWeight: 600 }}
                        >
                          <option value="">-- Select Receiver --</option>
                          {stationDrivers
                            .filter((d) => String(d.id) !== String(pending.rescuer_id))
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                        </select>
                      </td>

                      {/* 3. Status */}
                      <td style={{ textAlign: "center" }}>
                        <select
                          value={pending.status}
                          onChange={(e) =>
                            handlePendingRescueChange(pIdx, "status", e.target.value as RescueStatus)
                          }
                          className="rescue-inline-select"
                          style={{ width: "125px", margin: "0 auto", fontWeight: 700 }}
                        >
                          <option value="Completed">Completed</option>
                          <option value="Refuse">Refuse</option>
                        </select>
                      </td>

                      {/* 4. Packages */}
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pending.number_of_packages ?? ""}
                          onChange={(e) =>
                            handlePendingRescueChange(
                              pIdx,
                              "number_of_packages",
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="0"
                          className="rescue-inline-input"
                          style={{ width: "70px", textAlign: "center", margin: "0 auto", fontWeight: 700 }}
                        />
                      </td>

                      {/* 5. Stops */}
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pending.number_of_stops ?? ""}
                          onChange={(e) =>
                            handlePendingRescueChange(
                              pIdx,
                              "number_of_stops",
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="0"
                          className="rescue-inline-input"
                          style={{ width: "70px", textAlign: "center", margin: "0 auto", fontWeight: 700 }}
                        />
                      </td>

                      {/* 6. Reason */}
                      <td>
                        <input
                          type="text"
                          maxLength={250}
                          value={pending.reason || ""}
                          onChange={(e) => handlePendingRescueChange(pIdx, "reason", e.target.value)}
                          placeholder="Reason / Notes..."
                          className="rescue-inline-input"
                        />
                      </td>

                      {/* 7. Action */}
                      <td style={{ textAlign: "right" }}>
                        <div className="rescue-action-cell">
                          <button
                            type="button"
                            onClick={() => handleRemovePendingRescue(pIdx)}
                            title="Remove Pending Rescue"
                            aria-label="Remove Pending Rescue"
                            className="rescue-action-btn"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRescues.map((item, idx) => {
                    const originalIndex = rescues.findIndex((r) => r._id === item._id);
                    return (
                      <tr
                        key={item._id || idx}
                        className={isEditMode ? "is-editing-row" : ""}
                      >
                        {/* 1. Rescuer Driver */}
                        <td>
                          {isEditMode ? (
                            <select
                              value={item.rescuer_id}
                              onChange={(e) =>
                                handleInlineChange(originalIndex, "rescuer_id", e.target.value)
                              }
                              className="rescue-inline-select"
                            >
                              <option value="">Select Rescuer</option>
                              {stationDrivers
                                .filter((d) => String(d.id) !== String(item.caller_id))
                                .map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <div className="rescue-driver-cell">
                              <div className="rescue-driver-avatar">
                                {item.rescuer_name ? item.rescuer_name.charAt(0).toUpperCase() : "R"}
                              </div>
                              <div className="rescue-driver-info">
                                <span className="rescue-driver-name">{item.rescuer_name}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 2. Receiver Driver */}
                        <td>
                          {isEditMode ? (
                            <select
                              value={item.caller_id}
                              onChange={(e) =>
                                handleInlineChange(originalIndex, "caller_id", e.target.value)
                              }
                              className="rescue-inline-select"
                            >
                              <option value="">Select Receiver</option>
                              {stationDrivers
                                .filter((d) => String(d.id) !== String(item.rescuer_id))
                                .map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <div className="rescue-driver-cell">
                              <div className="rescue-driver-avatar receiver">
                                {item.caller_name ? item.caller_name.charAt(0).toUpperCase() : "C"}
                              </div>
                              <div className="rescue-driver-info">
                                <span className="rescue-driver-name">{item.caller_name}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 3. Status */}
                        <td style={{ textAlign: "center" }}>
                          {isEditMode ? (
                            <select
                              value={item.status}
                              onChange={(e) =>
                                handleInlineChange(
                                  originalIndex,
                                  "status",
                                  e.target.value as RescueStatus
                                )
                              }
                              className="rescue-inline-select"
                              style={{ width: "130px", margin: "0 auto" }}
                            >
                              <option value="Completed">Completed</option>
                              <option value="Refuse">Refuse</option>
                            </select>
                          ) : item.status === "Completed" ? (
                            <span className="rescue-status-badge completed">
                              <CheckCircle2 size={12} />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="rescue-status-badge refused">
                              <XCircle size={12} />
                              <span>Refused</span>
                            </span>
                          )}
                        </td>

                        {/* 4. Packages */}
                        <td style={{ textAlign: "center" }}>
                          {isEditMode ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.number_of_packages ?? ""}
                              onChange={(e) =>
                                handleInlineChange(
                                  originalIndex,
                                  "number_of_packages",
                                  e.target.value.replace(/\D/g, "")
                                )
                              }
                              className="rescue-inline-input"
                              style={{ width: "70px", textAlign: "center", margin: "0 auto" }}
                            />
                          ) : (
                            <span className="rescue-metric-pill">
                              <Package size={12} />
                              <span>{item.number_of_packages || 0}</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Stops */}
                        <td style={{ textAlign: "center" }}>
                          {isEditMode ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.number_of_stops ?? ""}
                              onChange={(e) =>
                                handleInlineChange(
                                  originalIndex,
                                  "number_of_stops",
                                  e.target.value.replace(/\D/g, "")
                                )
                              }
                              className="rescue-inline-input"
                              style={{ width: "70px", textAlign: "center", margin: "0 auto" }}
                            />
                          ) : (
                            <span className="rescue-metric-pill">
                              <MapPin size={12} />
                              <span>{item.number_of_stops || 0}</span>
                            </span>
                          )}
                        </td>

                        {/* 6. Reason / Notes */}
                        <td>
                          {isEditMode ? (
                            <input
                              type="text"
                              maxLength={250}
                              value={item.reason || ""}
                              onChange={(e) =>
                                handleInlineChange(originalIndex, "reason", e.target.value)
                              }
                              placeholder="Reason / Notes..."
                              className="rescue-inline-input"
                            />
                          ) : (
                            <span
                              className={`rescue-notes-cell ${!item.reason ? "rescue-notes-empty" : ""}`}
                              title={item.reason || "None"}
                            >
                              {item.reason || "None"}
                            </span>
                          )}
                        </td>

                        {/* 7. Actions */}
                        <td>
                          <div className="rescue-action-cell">
                            <button
                              type="button"
                              onClick={() => setEditingRescue(item)}
                              title="Edit Rescue Record"
                              aria-label="Edit Rescue Record"
                              className="rescue-action-btn edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(item)}
                              title="Delete Rescue Record"
                              aria-label="Delete Rescue Record"
                              className="rescue-action-btn"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>



      {/* ==================== 5. SINGLE RESCUE EDIT MODAL (OVERLAY) ==================== */}
      {editingRescue && (
        <AddRescueModal
          isOpen={true}
          embedded={false}
          isEditMode={true}
          initialRescue={editingRescue}
          onClose={() => setEditingRescue(null)}
          onSave={handleSaveRescue}
          currentDate={selectedDate}
        />
      )}

      {/* ==================== 6. DELETE CONFIRMATION MODAL ==================== */}
      {deleteConfirmItem && (
        <div className="rescue-modal-overlay">
          <div className="rescue-modal-dialog rescue-delete-dialog">
            <div className="rescue-delete-icon-wrap">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="rescue-modal-title" style={{ textAlign: "center" }}>
                Remove Rescue Record?
              </h3>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--ads-ink-tertiary)",
                  marginTop: "var(--ads-s2)",
                  lineHeight: 1.5,
                  textAlign: "center",
                }}
              >
                Are you sure you want to remove the rescue sweep record between{" "}
                <strong style={{ color: "var(--ads-ink)" }}>{deleteConfirmItem.rescuer_name}</strong> and{" "}
                <strong style={{ color: "var(--ads-ink)" }}>{deleteConfirmItem.caller_name}</strong> on{" "}
                {selectedDate}?
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", width: "100%" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isDeleting}
                className="rescue-btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rescue-delete-btn-danger"
                style={{ flex: 1 }}
              >
                {isDeleting ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RescueManagementView;
