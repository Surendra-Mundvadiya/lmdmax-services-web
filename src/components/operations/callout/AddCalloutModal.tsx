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
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(3px)",
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
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.2)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.1rem 1.4rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={19} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                {isEditMode ? "Edit Driver Callout" : "Add Driver Callouts"}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0.15rem 0 0 0" }}>
                {isEditMode
                  ? "Update callout details for the driver"
                  : "Select one or multiple drivers to batch record shift callouts"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#64748B",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "8px",
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
                borderRadius: "10px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#991B1B",
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
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B" }}>
                  Select Drivers <span style={{ color: "#EF4444" }}>*</span>
                  {selectedDriverIds.length > 0 && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "9999px",
                        backgroundColor: "#EFF6FF",
                        color: "#2563EB",
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
                      color: "#2563EB",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "0.1rem 0.35rem",
                    }}
                  >
                    Select All
                  </button>
                  <span style={{ color: "#CBD5E1" }}>|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#64748B",
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
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#F8FAFC",
                }}
              >
                <Search size={14} style={{ color: "#64748B", flexShrink: 0 }} />
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
                    color: "#1E293B",
                  }}
                />
                {driverSearch && (
                  <button
                    type="button"
                    onClick={() => setDriverSearch("")}
                    style={{ border: "none", background: "none", cursor: "pointer", color: "#64748B" }}
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
                    backgroundColor: "#F0F6FF",
                    borderRadius: "8px",
                    border: "1px solid #BFDBFE",
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
                        borderRadius: "6px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #93C5FD",
                        color: "#1E40AF",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {d.name}
                      <button
                        type="button"
                        onClick={() => toggleDriver(d.id)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "#1E40AF",
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
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  maxHeight: "160px",
                  overflowY: "auto",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {filteredDrivers.length === 0 ? (
                  <div style={{ padding: "1rem", textAlign: "center", color: "#94A3B8", fontSize: "0.8125rem" }}>
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
                          borderBottom: "1px solid #F1F5F9",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: "pointer", accentColor: "#2563EB", width: "15px", height: "15px" }}
                          />
                          <div
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              backgroundColor: isSelected ? "#2563EB" : "#E2E8F0",
                              color: isSelected ? "#FFFFFF" : "#475569",
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
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                              {d.name}
                            </span>
                            {d.phone && (
                              <span style={{ fontSize: "0.7rem", color: "#64748B", marginLeft: "0.5rem" }}>
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
                              color: "#F59E0B",
                              backgroundColor: "#FEF3C7",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "9999px",
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
                backgroundColor: "#EFF6FF",
                borderRadius: "8px",
                border: "1px solid #BFDBFE",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#2563EB",
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
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                  {initialCallout.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748B", marginLeft: "0.5rem" }}>
                  (ID: {initialCallout.driver_id})
                </span>
              </div>
            </div>
          )}

          {/* CALLOUT DETAILS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {/* Date Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B" }}>
                Callout Date <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Calendar size={15} style={{ color: "#64748B" }} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: "0.8125rem",
                    color: "#1E293B",
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
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B" }}>
                Callout Type <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                value={calloutType}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={{
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.8125rem",
                  color: "#1E293B",
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
            <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B" }}>
              Excused?
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setExcused("No")}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: excused === "No" ? "2px solid #F43F5E" : "1px solid #E2E8F0",
                  backgroundColor: excused === "No" ? "#FFF1F2" : "#FFFFFF",
                  color: excused === "No" ? "#BE123C" : "#64748B",
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
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: excused === "Yes" ? "2px solid #10B981" : "1px solid #E2E8F0",
                  backgroundColor: excused === "Yes" ? "#ECFDF5" : "#FFFFFF",
                  color: excused === "Yes" ? "#047857" : "#64748B",
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
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B" }}>
                Reason / Notes
              </label>
              <span style={{ fontSize: "0.7rem", color: reason.length >= 240 ? "#EF4444" : "#94A3B8" }}>
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
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                fontSize: "0.8125rem",
                color: "#1E293B",
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
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
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
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              fontSize: "0.8125rem",
              fontWeight: 600,
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
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: isSubmitting || (!isEditMode && selectedDriverIds.length === 0) ? "#93C5FD" : "#2563EB",
              color: "#FFFFFF !important",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: isSubmitting || (!isEditMode && selectedDriverIds.length === 0) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
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
