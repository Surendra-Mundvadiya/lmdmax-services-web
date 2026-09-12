import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Send,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  Plus,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useDriverStore } from "../../../store/driverStore";
import type { Driver } from "../../../types/driver";
import {
  calloutRescueApi,
  type CalloutItem,
  type ExcusedType,
} from "../../../api/calloutRescueApi";
import { DriverSelectDrawer } from "./DriverSelectDrawer";
import { CalloutTypeManagerModal } from "./CalloutTypeManagerModal";
import { SendCalloutMessageModal } from "./SendCalloutMessageModal";
import { AppDateNavigator } from "../../common/AppDateNavigator";
import "./callout.css";

const isCalloutExcused = (typeName: string): boolean => {
  const lower = (typeName || "").toLowerCase();
  return (
    lower.includes("paid time off") ||
    lower.includes("voluntary time off") ||
    lower.includes("standby") ||
    lower === "pto" ||
    lower === "vto"
  );
};

export const CalloutManagementView: FC = () => {
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  const drivers = useDriverStore((state) => state.drivers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);

  useEffect(() => {
    if (drivers.length === 0) {
      fetchDrivers();
    }
  }, [drivers.length, fetchDrivers]);

  // ── Date Selection ────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().split("T")[0]
  );

  // ── Data State ────────────────────────────────────────────────────────────
  const [callouts, setCallouts] = useState<CalloutItem[]>([]);
  const [originalCallouts, setOriginalCallouts] = useState<CalloutItem[]>([]);
  const [calloutTypes, setCalloutTypes] = useState<string[]>([]);
  const [deletedCalloutTypes, setDeletedCalloutTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // ── Search & Edit Mode ────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [isSavingNew, setIsSavingNew] = useState(false);

  // ── Drawers & Modals ──────────────────────────────────────────────────────
  const [isDriverDrawerOpen, setIsDriverDrawerOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [customTypeTargetRowId, setCustomTypeTargetRowId] = useState<string | number | null>(null);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgRecipients, setMsgRecipients] = useState<CalloutItem[]>([]);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<CalloutItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Toast Helper ──────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // ── Load Callout Types ────────────────────────────────────────────────────
  const loadTypes = useCallback(async () => {
    try {
      const res = await calloutRescueApi.getCalloutTypes();
      setCalloutTypes(res.options || []);
      setDeletedCalloutTypes(res.deleted || []);
    } catch (e) {
      console.warn("Error fetching callout types:", e);
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  // ── Fetch Callouts for Date ───────────────────────────────────────────────
  const fetchCallouts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsEditMode(false);
      const data = await calloutRescueApi.getCallouts(selectedDate);
      setCallouts(data);
      setOriginalCallouts(JSON.parse(JSON.stringify(data)));
    } catch (err: any) {
      setError(err?.message || "Failed to load callouts for this date");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchCallouts();
  }, [fetchCallouts]);

  // ── Add/Toggle Driver from DriverSelectDrawer ──────────────────────────────
  const handleToggleDriver = (driver: Driver) => {
    const existingIndex = callouts.findIndex(
      (c) => String(c.driver_id) === String(driver.id)
    );

    if (existingIndex === -1) {
      // Driver not in table -> append new unsaved row
      const defaultType = calloutTypes[0] || "Call Out - Same Day";
      const isExcused = isCalloutExcused(defaultType);
      const newRow: CalloutItem = {
        name: driver.name,
        driver_id: driver.id,
        date: selectedDate,
        callout_time: defaultType,
        excused: isExcused ? "Yes" : "No",
        reason: "",
        msg_sent: false,
      };
      setCallouts((prev) => [newRow, ...prev]);
      showToast(`${driver.name} added to callout list`);
    } else {
      const existing = callouts[existingIndex];
      if (existing._id) {
        showToast(`${driver.name} is already recorded in callouts for this date`);
      } else {
        // Remove pending unsaved row
        setCallouts((prev) =>
          prev.filter((c) => String(c.driver_id) !== String(driver.id))
        );
        showToast(`${driver.name} removed from list`);
      }
    }
  };

  // ── In-Place Change Handler ───────────────────────────────────────────────
  const handleSelectionChange = (
    field: keyof CalloutItem,
    value: any,
    targetId: string | number | undefined
  ) => {
    setCallouts((prev) =>
      prev.map((item) => {
        const matches =
          item._id === targetId || String(item.driver_id) === String(targetId);
        if (matches) {
          const updated = { ...item, [field]: value };
          if (field === "callout_time") {
            updated.excused = isCalloutExcused(String(value)) ? "Yes" : "No";
          }
          return updated;
        }
        return item;
      })
    );
  };

  // ── Save New Callouts (Unsaved Rows) ───────────────────────────────────────
  const unsavedCallouts = useMemo(
    () => callouts.filter((c) => !c._id),
    [callouts]
  );
  const hasUnsavedRows = unsavedCallouts.length > 0;

  const handleSaveNewCallouts = async () => {
    if (unsavedCallouts.length === 0) return;
    try {
      setIsSavingNew(true);
      setError(null);
      const savedResult = await calloutRescueApi.saveCallouts(unsavedCallouts);
      const savedDriverIds = new Set(savedResult.map((r) => String(r.driver_id)));
      const existingSaved = callouts.filter((c) => Boolean(c._id) && !savedDriverIds.has(String(c.driver_id)));
      const combined = [...savedResult, ...existingSaved];
      setCallouts(combined);
      setOriginalCallouts(JSON.parse(JSON.stringify(combined)));
      showToast("Callouts Added Successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to save callout records");
    } finally {
      setIsSavingNew(false);
    }
  };

  const handleDiscardNewCallouts = () => {
    setCallouts((prev) => prev.filter((c) => Boolean(c._id)));
    showToast("Discarded pending callout rows");
  };

  // ── Save In-Place Edits for Existing Rows ──────────────────────────────────
  const handleSaveEdits = async () => {
    try {
      setIsSavingEdits(true);
      setError(null);
      await calloutRescueApi.editCallouts(callouts);
      setOriginalCallouts(JSON.parse(JSON.stringify(callouts)));
      setIsEditMode(false);
      showToast("Callouts Edit Successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to update callout records");
    } finally {
      setIsSavingEdits(false);
    }
  };

  const handleDiscardEdits = () => {
    setCallouts(JSON.parse(JSON.stringify(originalCallouts)));
    setIsEditMode(false);
  };

  // ── Delete Callout ────────────────────────────────────────────────────────
  const handleDeleteRow = (item: CalloutItem, index: number) => {
    if (!item._id) {
      // Unsaved row -> instant removal
      setCallouts((prev) => prev.filter((_, i) => i !== index));
      showToast(`Removed ${item.name} from list`);
    } else {
      // Saved row -> open confirmation modal
      setDeleteConfirmItem(item);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem || !deleteConfirmItem._id) return;
    try {
      setIsDeleting(true);
      await calloutRescueApi.deleteCallout({
        _id: deleteConfirmItem._id,
        driver_id: deleteConfirmItem.driver_id,
        date: selectedDate,
      });
      const filtered = callouts.filter((c) => c._id !== deleteConfirmItem._id);
      setCallouts(filtered);
      setOriginalCallouts(filtered);
      setDeleteConfirmItem(null);
      showToast("CallOut deleted successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to delete callout record");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Custom Type Manager Handlers ──────────────────────────────────────────
  const handleTypesUpdated = (newOptions: string[], newDeleted: string[]) => {
    const newlyAdded = newOptions.find((opt) => !calloutTypes.includes(opt));
    setCalloutTypes(newOptions);
    setDeletedCalloutTypes(newDeleted);

    if (customTypeTargetRowId !== null) {
      const typeToAssign = newlyAdded || newOptions[newOptions.length - 1];
      if (typeToAssign) {
        handleSelectionChange("callout_time", typeToAssign, customTypeTargetRowId);
      }
      setCustomTypeTargetRowId(null);
    }
    showToast("Callout types updated and saved successfully");
  };

  // ── Send Notification Handlers (Single & Bulk) ────────────────────────────
  const handleOpenSendMessage = (item?: CalloutItem) => {
    const targets = item ? [item] : callouts.filter((c) => Boolean(c._id));
    if (targets.length === 0) {
      showToast("No saved callout records to notify. Please save callouts first.");
      return;
    }
    setMsgRecipients(targets);
    setIsMsgModalOpen(true);
  };

  const handleMessageSuccess = (sentDriverIds: (string | number)[]) => {
    setCallouts((prev) =>
      prev.map((c) =>
        sentDriverIds.some((id) => String(id) === String(c.driver_id))
          ? { ...c, msg_sent: true }
          : c
      )
    );
    setOriginalCallouts((prev) =>
      prev.map((c) =>
        sentDriverIds.some((id) => String(id) === String(c.driver_id))
          ? { ...c, msg_sent: true }
          : c
      )
    );
    showToast("Callout notification dispatched successfully via live microservice");
  };

  // ── Filtered Callouts (Search Only) ───────────────────────────────────────
  const filteredCallouts = useMemo(() => {
    if (!searchQuery.trim()) return callouts;
    const q = searchQuery.toLowerCase().trim();
    return callouts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.reason?.toLowerCase().includes(q) ||
        String(c.driver_id).includes(q) ||
        c.callout_time?.toLowerCase().includes(q)
    );
  }, [callouts, searchQuery]);

  return (
    <div className="callout-main-container">
      {/* ==================== SOLID WHITE CARD CONTAINER ==================== */}
      <div className="callout-card-container">
        {/* Toast Messages */}
        {successToast && (
          <div className="callout-toast-banner">
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
          <div className="callout-toast-error">
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

        {/* Action Toolbar */}
        <div className="callout-filter-toolbar">
          <div className="callout-toolbar-left">
            {/* Search Input */}
            <div className="callout-search-wrap">
              <Search size={14} className="callout-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search driver by name or reason..."
                className="callout-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="callout-search-clear"
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
              onClick={fetchCallouts}
              disabled={isLoading}
              className="callout-tool-btn"
              title="Refresh Callouts from Live API"
              aria-label="Refresh Callouts from Live API"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>

            {/* Station and Records count pill */}
            <span className="callout-station-badge">
              <span className="callout-live-dot" />
              {activeStationCode} • {filteredCallouts.length} callout{filteredCallouts.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="callout-toolbar-right">
            {/* Date Navigator directly integrated on toolbar */}
            <AppDateNavigator
              selectedDate={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              size="sm"
            />

            {/* Send Bulk Notifications Button */}
            <button
              type="button"
              onClick={() => handleOpenSendMessage()}
              disabled={callouts.length === 0}
              className="callout-btn-msg"
              title="Dispatch SMS or In-App notifications to drivers on callout"
            >
              <Send size={14} />
              <span>Send Notifications</span>
            </button>

            {/* Actions: Unsaved Rows Mode vs Edit Mode vs Normal Mode */}
            {hasUnsavedRows ? (
              <>
                <button
                  type="button"
                  onClick={handleDiscardNewCallouts}
                  disabled={isSavingNew}
                  className="callout-btn-discard"
                >
                  <X size={14} />
                  <span>Discard</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewCallouts}
                  disabled={isSavingNew}
                  className="callout-btn-save"
                >
                  <Check size={14} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>
                    {isSavingNew ? "Saving..." : `Save Callouts (${unsavedCallouts.length})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDriverDrawerOpen(true)}
                  className="callout-btn-edit"
                  title="Select more drivers"
                >
                  <Users size={14} />
                  <span>Select Drivers</span>
                </button>
              </>
            ) : isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={handleDiscardEdits}
                  disabled={isSavingEdits}
                  className="callout-btn-discard"
                >
                  <X size={14} />
                  <span>Discard</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isSavingEdits}
                  className="callout-btn-save"
                >
                  <Check size={14} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>
                    {isSavingEdits ? "Saving..." : "Save Changes"}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  disabled={callouts.length === 0}
                  className="callout-btn-edit"
                  title="Edit callout details directly in table"
                >
                  <Edit2 size={14} />
                  <span>Edit Table</span>
                </button>

                {/* Primary Action: Add Callouts (Opens DriverSelectDrawer) */}
                <button
                  type="button"
                  onClick={() => setIsDriverDrawerOpen(true)}
                  className="btn-add-callout-canvas"
                  title="Select drivers to add callout rows"
                >
                  <Plus size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Add Callouts</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="callout-table-container">
          {isLoading ? (
            <div className="callout-empty-state">
              <RefreshCw size={26} className="animate-spin" style={{ color: "var(--ads-blue)" }} />
              <h3 className="callout-empty-title">Loading Callout Records...</h3>
              <p className="callout-empty-desc">
                Fetching live callout attendance data from Performance microservice for station {activeStationCode}.
              </p>
            </div>
          ) : filteredCallouts.length === 0 ? (
            <div className="callout-empty-state">
              <div className="callout-empty-icon">
                <Clock size={26} />
              </div>
              <h3 className="callout-empty-title">No Callout Records Found</h3>
              <p className="callout-empty-desc">
                No driver callouts recorded for station {activeStationCode} on {selectedDate}.
              </p>
              <button
                type="button"
                onClick={() => setIsDriverDrawerOpen(true)}
                className="btn-add-callout-canvas"
                style={{ marginTop: "var(--ads-s2)" }}
              >
                <Users size={15} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Add Callouts</span>
              </button>
            </div>
          ) : (
            <div className="callout-table-wrapper">
              <table className="callout-table">
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Callout Type</th>
                    <th style={{ textAlign: "center" }}>Excused?</th>
                    <th>Reason / Notes</th>
                    <th style={{ textAlign: "center" }}>Message Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCallouts.map((item, index) => {
                    const rowKey = item._id || `${item.driver_id}-${index}`;
                    const targetId = item._id || item.driver_id;
                    const isRowUnsaved = !item._id;
                    const rowIsEditable = isRowUnsaved || isEditMode;

                    return (
                      <tr
                        key={rowKey}
                        style={{
                          backgroundColor: isRowUnsaved ? "rgba(0, 113, 227, 0.055)" : undefined,
                          boxShadow: isRowUnsaved ? "inset 3px 0 0 0 var(--ads-blue)" : undefined,
                        }}
                      >
                        {/* 1. Driver Name */}
                        <td>
                          <div className="callout-driver-cell">
                            <div
                              className="callout-driver-avatar"
                              style={{
                                backgroundColor: item.excused === "Yes" ? "var(--ads-green-tint)" : "var(--ads-red-tint)",
                                color: item.excused === "Yes" ? "var(--ads-green)" : "var(--ads-red)",
                              }}
                            >
                              {(item.name || "D").charAt(0).toUpperCase()}
                            </div>
                            <div className="callout-driver-info">
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span className="callout-driver-name">{item.name}</span>
                                {isRowUnsaved && (
                                  <span
                                    style={{
                                      fontSize: "0.6875rem",
                                      padding: "3px 9px",
                                      backgroundColor: "var(--ads-amber-tint)",
                                      color: "var(--ads-amber)",
                                      fontWeight: 600,
                                      letterSpacing: "-0.005em",
                                      lineHeight: 1.4,
                                      borderRadius: "var(--ads-r-pill)",
                                      border: "1px solid transparent",
                                    }}
                                  >
                                    Pending
                                  </span>
                                )}
                              </div>
                              <span className="callout-driver-id">ID: {item.driver_id}</span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Callout Type */}
                        <td>
                          {rowIsEditable ? (
                            <select
                              value={item.callout_time}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "add_option") {
                                  setCustomTypeTargetRowId(targetId);
                                  setIsTypeModalOpen(true);
                                } else {
                                  handleSelectionChange("callout_time", val, targetId);
                                }
                              }}
                              className="callout-inline-select"
                            >
                              {calloutTypes.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                              <option
                                value="add_option"
                                style={{
                                  color: "var(--ads-blue)",
                                  fontWeight: 600,
                                  backgroundColor: "var(--ads-blue-tint)",
                                }}
                              >
                                + Add option
                              </option>
                            </select>
                          ) : (
                            <span className="callout-type-badge">{item.callout_time}</span>
                          )}
                        </td>

                        {/* 3. Excused? */}
                        <td style={{ textAlign: "center" }}>
                          {rowIsEditable ? (
                            <select
                              value={item.excused}
                              onChange={(e) =>
                                handleSelectionChange(
                                  "excused",
                                  e.target.value as ExcusedType,
                                  targetId
                                )
                              }
                              className="callout-inline-select"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          ) : (
                            <span
                              className={`callout-excused-badge ${
                                item.excused === "Yes" ? "yes" : "no"
                              }`}
                            >
                              {item.excused === "Yes" ? "Excused" : "Unexcused"}
                            </span>
                          )}
                        </td>

                        {/* 4. Reason / Notes */}
                        <td>
                          {rowIsEditable ? (
                            <input
                              type="text"
                              maxLength={250}
                              value={item.reason || ""}
                              onChange={(e) =>
                                handleSelectionChange("reason", e.target.value, targetId)
                              }
                              placeholder="Reason / Notes..."
                              className="callout-inline-input"
                            />
                          ) : (
                            <span
                              className={`callout-notes-cell ${!item.reason ? "callout-notes-empty" : ""}`}
                              title={item.reason || "No notes"}
                            >
                              {item.reason || "—"}
                            </span>
                          )}
                        </td>

                        {/* 5. Message Status */}
                        <td style={{ textAlign: "center" }}>
                          {isRowUnsaved ? (
                            <span
                              className="callout-msg-badge unsent"
                              style={{ color: "var(--ads-ink-secondary)", backgroundColor: "rgba(0, 0, 0, 0.05)", borderColor: "transparent" }}
                            >
                              Not Saved
                            </span>
                          ) : (
                            <span className={`callout-msg-badge ${item.msg_sent ? "sent" : "unsent"}`}>
                              {item.msg_sent ? (
                                <>
                                  <CheckCircle2 size={12} style={{ color: "var(--ads-green)" }} />
                                  <span>Sent</span>
                                </>
                              ) : (
                                <span>Not Sent</span>
                              )}
                            </span>
                          )}
                        </td>

                        {/* 6. Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div className="callout-action-cell">
                            {/* Send Message to Individual Driver (Only saved records) */}
                            {!isRowUnsaved && (
                              <button
                                type="button"
                                onClick={() => handleOpenSendMessage(item)}
                                disabled={isEditMode}
                                className="callout-action-btn send"
                                title={item.msg_sent ? "Resend Callout Message" : "Send Callout Message"}
                                aria-label={item.msg_sent ? "Resend Callout Message" : "Send Callout Message"}
                              >
                                <Send size={15} />
                              </button>
                            )}

                            {/* Delete Callout Row */}
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(item, index)}
                              className="callout-action-btn"
                              title={isRowUnsaved ? "Remove Pending Row" : "Delete Callout Record"}
                              aria-label={isRowUnsaved ? "Remove Pending Row" : "Delete Callout Record"}
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

      {/* ==================== DRAWERS & MODALS ==================== */}
      {/* 1. Driver Select Drawer (Performance App Parity) */}
      <DriverSelectDrawer
        isOpen={isDriverDrawerOpen}
        onClose={() => setIsDriverDrawerOpen(false)}
        selectedDriverIds={callouts.map((c) => c.driver_id)}
        onToggleDriver={handleToggleDriver}
      />

      {/* 2. Custom Callout Type Manager Modal */}
      <CalloutTypeManagerModal
        isOpen={isTypeModalOpen}
        onClose={() => {
          setIsTypeModalOpen(false);
          setCustomTypeTargetRowId(null);
        }}
        options={calloutTypes}
        deleted={deletedCalloutTypes}
        onTypesUpdated={handleTypesUpdated}
      />

      {/* 3. Send Message Modal (SMS & In-App) */}
      <SendCalloutMessageModal
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
        recipients={msgRecipients}
        currentDate={selectedDate}
        onSuccess={handleMessageSuccess}
      />

      {/* 4. Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="callout-modal-overlay" onClick={() => setDeleteConfirmItem(null)}>
          <div className="callout-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="callout-delete-icon-wrap">
              <Trash2 size={24} />
            </div>
            <h3 className="callout-modal-title">Delete Callout Record</h3>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--ads-ink-tertiary)",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete the callout record for{" "}
              <strong>{deleteConfirmItem.name}</strong> on {selectedDate}? This will remove it from
              live attendance reports.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", width: "100%", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isDeleting}
                className="callout-cancel-btn"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="callout-delete-btn-danger"
                style={{ flex: 1 }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalloutManagementView;
