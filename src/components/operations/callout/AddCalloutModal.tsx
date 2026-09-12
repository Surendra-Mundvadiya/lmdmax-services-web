import React, { FC, useState, useEffect, useMemo } from "react";
import {
  X,
  User,
  Users,
  Search,
  Check,
  Calendar,
  AlertCircle,
  Clock,
  Loader2,
  FileText,
} from "lucide-react";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import {
  calloutRescueApi,
  type CalloutItem,
  type ExcusedType,
} from "../../../api/calloutRescueApi";
import type { Driver } from "../../../types/driver";

interface AddCalloutModalProps {
  isOpen: boolean;
  onClose: () => void;
  calloutTypes: string[];
  currentDate: string;
  existingDriverIds?: (string | number)[];
  onSuccess?: () => void;
  initialCallout?: CalloutItem | null;
  isEditMode?: boolean;
}

export const AddCalloutModal: FC<AddCalloutModalProps> = ({
  isOpen,
  onClose,
  calloutTypes = [],
  currentDate,
  existingDriverIds = [],
  onSuccess,
  initialCallout,
  isEditMode = false,
}) => {
  const drivers = useDriverStore((state) => state.drivers);
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  // Station drivers list
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

  // Multi-Driver Selection
  const [selectedDriverIds, setSelectedDriverIds] = useState<(string | number)[]>([]);
  const [driverSearch, setDriverSearch] = useState("");

  // Form fields
  const [calloutType, setCalloutType] = useState<string>("");
  const [excused, setExcused] = useState<ExcusedType>("No");
  const [date, setDate] = useState<string>(currentDate);
  const [reason, setReason] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset state
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setDriverSearch("");

    if (isEditMode && initialCallout) {
      setSelectedDriverIds([initialCallout.driver_id]);
      setCalloutType(initialCallout.callout_time || calloutTypes[0] || "Call Out - Same Day");
      setExcused(initialCallout.excused || "No");
      setDate(initialCallout.date || currentDate);
      setReason(initialCallout.reason || "");
    } else {
      setSelectedDriverIds([]);
      setCalloutType(calloutTypes[0] || "Call Out - Same Day");
      setExcused("No");
      setDate(currentDate);
      setReason("");
    }
  }, [isOpen, isEditMode, initialCallout, currentDate, calloutTypes]);

  // Auto-set excused = Yes for PTO / VTO / Standby
  const handleTypeChange = (newType: string) => {
    setCalloutType(newType);
    const lower = newType.toLowerCase();
    if (
      lower.includes("paid time off") ||
      lower.includes("voluntary time off") ||
      lower.includes("standby") ||
      lower === "vto" ||
      lower === "pto"
    ) {
      setExcused("Yes");
    } else {
      setExcused("No");
    }
  };

  // Filter drivers by search
  const filteredDrivers = useMemo(() => {
    const q = driverSearch.toLowerCase().trim();
    if (!q) return stationDrivers;
    return stationDrivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.transporter_id && d.transporter_id.toLowerCase().includes(q)) ||
        String(d.id).includes(q)
    );
  }, [stationDrivers, driverSearch]);

  const existingSet = useMemo(
    () => new Set(existingDriverIds.map(String)),
    [existingDriverIds]
  );

  const toggleDriver = (driverId: string | number) => {
    const sId = String(driverId);
    if (selectedDriverIds.some((id) => String(id) === sId)) {
      setSelectedDriverIds((prev) => prev.filter((id) => String(id) !== sId));
    } else {
      setSelectedDriverIds((prev) => [...prev, driverId]);
    }
  };

  const handleSelectAll = () => {
    const selectable = filteredDrivers
      .filter((d) => !existingSet.has(String(d.id)))
      .map((d) => d.id);
    setSelectedDriverIds(Array.from(new Set([...selectedDriverIds, ...selectable])));
  };

  const handleClearAll = () => {
    setSelectedDriverIds([]);
  };

  const selectedDrivers = useMemo(() => {
    return selectedDriverIds
      .map((id) => stationDrivers.find((d) => String(d.id) === String(id)))
      .filter((d): d is Driver => Boolean(d));
  }, [selectedDriverIds, stationDrivers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedDriverIds.length === 0) {
      setError("Please select at least one driver to record a callout.");
      return;
    }

    if (!calloutType) {
      setError("Please select a callout type.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditMode && initialCallout) {
        // Single Edit
        const singlePayload: CalloutItem[] = [
          {
            ...initialCallout,
            callout_time: calloutType,
            excused,
            date,
            reason: reason.trim() || null,
          },
        ];
        await calloutRescueApi.editCallouts(singlePayload);
      } else {
        // Multi-Driver Add Callouts
        const calloutsToSave: Partial<CalloutItem>[] = selectedDrivers.map((driver) => ({
          name: driver.name,
          driver_id: driver.id,
          callout_time: calloutType,
          excused,
          date: date || currentDate,
          reason: reason.trim() || null,
        }));

        await calloutRescueApi.saveCallouts(calloutsToSave);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error("Save callouts error:", err);
      setError(err?.message || "Failed to record callouts. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          borderRadius: "var(--ads-r-xl)",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          border: "1px solid var(--ads-hairline)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.1rem 1.4rem",
            borderBottom: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--ads-material-thick)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={19} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ads-ink)", margin: 0 }}>
                {isEditMode ? "Edit Driver Callout" : "Add Driver Callouts"}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", margin: "0.15rem 0 0 0" }}>
                {isEditMode
                  ? "Update callout details for the driver"
                  : "Select one or multiple drivers to batch record shift callouts"}
              </p>
            </div>
          </div>
          <button aria-label="Close" title="Close"
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--ads-ink-tertiary)",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "var(--ads-r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.25rem 1.4rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {error && (
            <div
              style={{
                padding: "0.75rem 0.9rem",
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: "var(--ads-red-tint)",
                border: "1px solid transparent",
                color: "var(--ads-red)",
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* DRIVER SELECTION (MULTI-SELECT) */}
          {!isEditMode && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                  Select Drivers <span style={{ color: "var(--ads-red)" }}>*</span>
                  {selectedDriverIds.length > 0 && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "var(--ads-r-pill)",
                        backgroundColor: "var(--ads-blue-tint)",
                        color: "var(--ads-blue)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {selectedDriverIds.length} Selected
                    </span>
                  )}
                </label>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{
                      border: "none",
                      background: "none",
                      color: "var(--ads-blue)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "0.1rem 0.35rem",
                    }}
                  >
                    Select All
                  </button>
                  <span style={{ color: "var(--ads-ink-quaternary)" }}>|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      border: "none",
                      background: "none",
                      color: "var(--ads-ink-tertiary)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "0.1rem 0.35rem",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Driver Search Input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.45rem 0.75rem",
                  borderRadius: "var(--ads-r-sm)",
                  border: "1px solid var(--ads-hairline)",
                  backgroundColor: "rgba(0, 0, 0, 0.025)",
                }}
              >
                <Search size={14} style={{ color: "var(--ads-ink-tertiary)", flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search driver by name or phone..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "0.8125rem",
                    width: "100%",
                    color: "var(--ads-ink)",
                  }}
                />
                {driverSearch && (
                  <button
                    type="button"
                    onClick={() => setDriverSearch("")}
                    aria-label="Clear driver search"
                    title="Clear search"
                    style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ads-ink-tertiary)" }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Selected Driver Chips Strip */}
              {selectedDrivers.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.35rem",
                    padding: "0.4rem 0.5rem",
                    backgroundColor: "var(--ads-blue-tint)",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid transparent",
                    maxHeight: "80px",
                    overflowY: "auto",
                  }}
                >
                  {selectedDrivers.map((d) => (
                    <span
                      key={d.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "var(--ads-r-xs)",
                        backgroundColor: "var(--ads-material-thick)",
                        border: "1px solid var(--ads-blue)",
                        color: "var(--ads-blue-active)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {d.name}
                      <button
                        type="button"
                        onClick={() => toggleDriver(d.id)}
                        aria-label={`Remove ${d.name}`}
                        title={`Remove ${d.name}`}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "var(--ads-blue-active)",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Drivers Checkbox List */}
              <div
                style={{
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-sm)",
                  maxHeight: "160px",
                  overflowY: "auto",
                  backgroundColor: "var(--ads-material-thick)",
                }}
              >
                {filteredDrivers.length === 0 ? (
                  <div style={{ padding: "1rem", textAlign: "center", color: "var(--ads-ink-tertiary)", fontSize: "0.8125rem" }}>
                    No drivers found matching your search.
                  </div>
                ) : (
                  filteredDrivers.map((d) => {
                    const isSelected = selectedDriverIds.some((id) => String(id) === String(d.id));
                    const isAlready = existingSet.has(String(d.id));

                    return (
                      <div
                        key={d.id}
                        onClick={() => toggleDriver(d.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.45rem 0.75rem",
                          borderBottom: "1px solid var(--ads-hairline)",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "var(--ads-blue-tint)" : "#FFFFFF",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: "pointer", accentColor: "var(--ads-blue)", width: "15px", height: "15px" }}
                          />
                          <div
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              backgroundColor: isSelected ? "var(--ads-blue)" : "rgba(0, 0, 0, 0.06)",
                              color: isSelected ? "#FFFFFF" : "var(--ads-ink-secondary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            {d.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                              {d.name}
                            </span>
                            {d.phone && (
                              <span style={{ fontSize: "0.7rem", color: "var(--ads-ink-tertiary)", marginLeft: "0.5rem" }}>
                                {d.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {isAlready && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              color: "var(--ads-amber)",
                              backgroundColor: "var(--ads-amber-tint)",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "var(--ads-r-pill)",
                            }}
                          >
                            Already on callout
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SINGLE DRIVER DISPLAY (EDIT MODE) */}
          {isEditMode && initialCallout && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.65rem 0.85rem",
                backgroundColor: "var(--ads-blue-tint)",
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid transparent",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--ads-blue)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {initialCallout.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                  {initialCallout.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", marginLeft: "0.5rem" }}>
                  (ID: {initialCallout.driver_id})
                </span>
              </div>
            </div>
          )}

          {/* CALLOUT DETAILS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {/* Date Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                Callout Date <span style={{ color: "var(--ads-red)" }}>*</span>
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--ads-r-sm)",
                  border: "1px solid var(--ads-hairline)",
                  backgroundColor: "var(--ads-material-thick)",
                }}
              >
                <Calendar size={15} style={{ color: "var(--ads-ink-tertiary)" }} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: "0.8125rem",
                    color: "var(--ads-ink)",
                    width: "100%",
                    background: "transparent",
                    fontFamily: "inherit",
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Callout Type Dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                Callout Type <span style={{ color: "var(--ads-red)" }}>*</span>
              </label>
              <select
                value={calloutType}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={{
                  padding: "0.55rem 0.75rem",
                  borderRadius: "var(--ads-r-sm)",
                  border: "1px solid var(--ads-hairline)",
                  backgroundColor: "var(--ads-material-thick)",
                  fontSize: "0.8125rem",
                  color: "var(--ads-ink)",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {calloutTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Excused Toggle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)" }}>
              Excused?
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setExcused("No")}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "var(--ads-r-sm)",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: excused === "No" ? "2px solid var(--ads-red)" : "1px solid var(--ads-hairline)",
                  backgroundColor: excused === "No" ? "var(--ads-red-tint)" : "#FFFFFF",
                  color: excused === "No" ? "var(--ads-red)" : "var(--ads-ink-tertiary)",
                  transition: "all 0.15s ease",
                }}
              >
                No (Unexcused)
              </button>
              <button
                type="button"
                onClick={() => setExcused("Yes")}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "var(--ads-r-sm)",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: excused === "Yes" ? "2px solid var(--ads-green)" : "1px solid var(--ads-hairline)",
                  backgroundColor: excused === "Yes" ? "var(--ads-green-tint)" : "#FFFFFF",
                  color: excused === "Yes" ? "var(--ads-green)" : "var(--ads-ink-tertiary)",
                  transition: "all 0.15s ease",
                }}
              >
                Yes (Excused)
              </button>
            </div>
          </div>

          {/* Reason / Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                Reason / Notes
              </label>
              <span style={{ fontSize: "0.7rem", color: reason.length >= 240 ? "var(--ads-red)" : "var(--ads-ink-tertiary)" }}>
                {reason.length}/250
              </span>
            </div>
            <textarea
              value={reason}
              maxLength={250}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason or operational notes for the callout..."
              rows={3}
              style={{
                padding: "0.55rem 0.75rem",
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid var(--ads-hairline)",
                backgroundColor: "var(--ads-material-thick)",
                fontSize: "0.8125rem",
                color: "var(--ads-ink)",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "0.85rem 1.4rem",
            borderTop: "1px solid var(--ads-hairline)",
            backgroundColor: "rgba(0, 0, 0, 0.025)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.65rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid var(--ads-hairline)",
              backgroundColor: "var(--ads-material-thick)",
              color: "var(--ads-ink)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              boxShadow: "var(--ads-bevel)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!isEditMode && selectedDriverIds.length === 0)}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid transparent",
              backgroundColor: "var(--ads-blue)",
              opacity: isSubmitting || (!isEditMode && selectedDriverIds.length === 0) ? 0.4 : 1,
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              transition: "background-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease)",
              cursor: isSubmitting || (!isEditMode && selectedDriverIds.length === 0) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              boxShadow: "0 1px 3px rgba(0, 113, 227, 0.24)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Saving...</span>
              </>
            ) : (
              <>
                <Check size={15} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>
                  {isEditMode
                    ? "Save Changes"
                    : selectedDriverIds.length > 1
                    ? `Add Callouts (${selectedDriverIds.length})`
                    : "Add Callout"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCalloutModal;
