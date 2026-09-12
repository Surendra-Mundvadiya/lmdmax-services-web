import React, { FC, useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  User,
  Calendar,
  AlertCircle,
  ChevronDown,
  Check,
  Search,
  X,
  Package,
  MapPin,
  Loader2,
} from "lucide-react";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import type { RescueItem, RescueStatus } from "../../../api/calloutRescueApi";

interface AddRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (rescue: Partial<RescueItem>, isEdit: boolean) => Promise<void>;
  onAdd?: (rescue: Partial<RescueItem>) => Promise<void>;
  currentDate: string;
  initialRescue?: RescueItem | null;
  isEditMode?: boolean;
  embedded?: boolean;
}

export const AddRescueModal: FC<AddRescueModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAdd,
  currentDate,
  initialRescue,
  isEditMode = false,
  embedded = true,
}) => {
  const drivers = useDriverStore((state) => state.drivers);
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  // Form States
  const [selectedRescuerId, setSelectedRescuerId] = useState<string | number>(() => {
    return initialRescue?.rescuer_id ?? "";
  });
  const [selectedRescuerName, setSelectedRescuerName] = useState<string>(() => {
    return initialRescue?.rescuer_name ?? "";
  });

  const [selectedReceiverId, setSelectedReceiverId] = useState<string | number>(() => {
    return initialRescue?.caller_id ?? "";
  });
  const [selectedReceiverName, setSelectedReceiverName] = useState<string>(() => {
    return initialRescue?.caller_name ?? "";
  });

  const [date, setDate] = useState<string>(() => {
    return initialRescue?.date || currentDate;
  });
  const [status, setStatus] = useState<RescueStatus>(() => {
    return initialRescue?.status || "Completed";
  });
  const [numberOfPackages, setNumberOfPackages] = useState<string>(() => {
    return initialRescue?.number_of_packages != null ? String(initialRescue.number_of_packages) : "";
  });
  const [numberOfStops, setNumberOfStops] = useState<string>(() => {
    return initialRescue?.number_of_stops != null ? String(initialRescue.number_of_stops) : "";
  });
  const [reason, setReason] = useState<string>(() => {
    return initialRescue?.reason || "";
  });

  // UI Dropdown States
  const [rescuerDropdownOpen, setRescuerDropdownOpen] = useState(false);
  const [rescuerSearch, setRescuerSearch] = useState("");
  const rescuerDropdownRef = useRef<HTMLDivElement>(null);

  const [receiverDropdownOpen, setReceiverDropdownOpen] = useState(false);
  const [receiverSearch, setReceiverSearch] = useState("");
  const receiverDropdownRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    rescuer?: string;
    receiver?: string;
    general?: string;
  }>({});

  // Sync or reset when initialRescue or isEditMode changes
  useEffect(() => {
    if (initialRescue && isEditMode) {
      setSelectedRescuerId(initialRescue.rescuer_id ?? "");
      setSelectedRescuerName(initialRescue.rescuer_name ?? "");
      setSelectedReceiverId(initialRescue.caller_id ?? "");
      setSelectedReceiverName(initialRescue.caller_name ?? "");
      setDate(initialRescue.date || currentDate);
      setStatus(initialRescue.status || "Completed");
      setNumberOfPackages(initialRescue.number_of_packages != null ? String(initialRescue.number_of_packages) : "");
      setNumberOfStops(initialRescue.number_of_stops != null ? String(initialRescue.number_of_stops) : "");
      setReason(initialRescue.reason || "");
    } else {
      setSelectedRescuerId("");
      setSelectedRescuerName("");
      setSelectedReceiverId("");
      setSelectedReceiverName("");
      setDate(currentDate);
      setStatus("Completed");
      setNumberOfPackages("");
      setNumberOfStops("");
      setReason("");
    }
    setErrors({});
    setRescuerDropdownOpen(false);
    setReceiverDropdownOpen(false);
    setRescuerSearch("");
    setReceiverSearch("");
  }, [initialRescue, isEditMode, currentDate]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        rescuerDropdownRef.current &&
        !rescuerDropdownRef.current.contains(e.target as Node)
      ) {
        setRescuerDropdownOpen(false);
      }
      if (
        receiverDropdownRef.current &&
        !receiverDropdownRef.current.contains(e.target as Node)
      ) {
        setReceiverDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter available drivers by current station
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

  // Auto-sync names if IDs exist
  useEffect(() => {
    if (selectedRescuerId && !selectedRescuerName) {
      const found = stationDrivers.find((d) => String(d.id) === String(selectedRescuerId));
      if (found) setSelectedRescuerName(found.name);
    }
    if (selectedReceiverId && !selectedReceiverName) {
      const found = stationDrivers.find((d) => String(d.id) === String(selectedReceiverId));
      if (found) setSelectedReceiverName(found.name);
    }
  }, [selectedRescuerId, selectedRescuerName, selectedReceiverId, selectedReceiverName, stationDrivers]);

  // Filter drivers for Rescuer search
  const filteredRescuers = useMemo(() => {
    if (!rescuerSearch.trim()) return stationDrivers;
    const q = rescuerSearch.toLowerCase().trim();
    return stationDrivers.filter(
      (d) => d.name.toLowerCase().includes(q) || String(d.id).includes(q)
    );
  }, [stationDrivers, rescuerSearch]);

  // Filter drivers for Receiver search
  const filteredReceivers = useMemo(() => {
    if (!receiverSearch.trim()) return stationDrivers;
    const q = receiverSearch.toLowerCase().trim();
    return stationDrivers.filter(
      (d) => d.name.toLowerCase().includes(q) || String(d.id).includes(q)
    );
  }, [stationDrivers, receiverSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { rescuer?: string; receiver?: string; general?: string } = {};

    if (!selectedRescuerId) {
      newErrors.rescuer = "Please select a Rescuer driver (Assisting)";
    }
    if (!selectedReceiverId) {
      newErrors.receiver = "Please select a Receiver driver (Assisted)";
    }
    if (
      selectedRescuerId &&
      selectedReceiverId &&
      String(selectedRescuerId) === String(selectedReceiverId)
    ) {
      newErrors.receiver = "Rescuer and Receiver cannot be the same driver";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const rescuer = stationDrivers.find((d) => String(d.id) === String(selectedRescuerId));
    const receiver = stationDrivers.find((d) => String(d.id) === String(selectedReceiverId));

    try {
      setIsSubmitting(true);
      setErrors({});

      const payload: Partial<RescueItem> = {
        rescuer_id: rescuer ? rescuer.id : selectedRescuerId,
        rescuer_name: rescuer?.name || selectedRescuerName,
        caller_id: receiver ? receiver.id : selectedReceiverId,
        caller_name: receiver?.name || selectedReceiverName,
        date: date || currentDate,
        status,
        number_of_packages: numberOfPackages ? Number(numberOfPackages) : null,
        number_of_stops: numberOfStops ? Number(numberOfStops) : null,
        reason: reason.trim() || "",
      };

      if (onSave) {
        await onSave(payload, isEditMode);
      } else if (onAdd) {
        await onAdd(payload);
      }
      onClose();
    } catch (err: any) {
      setErrors({ general: err?.message || "Failed to save rescue record" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const formContent = (
    <form id="rescue-form" onSubmit={handleSubmit} className="add-driver-form" noValidate>
      {errors.general && (
        <div className="modal-error-alert" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={16} className="text-red-500" style={{ flexShrink: 0 }} />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Row 1: Rescuer Driver & Receiver Driver (Uniform 2-Column Grid) */}
      <div className="add-driver-grid-2">
        {/* Rescuer Driver Field */}
        <div className="add-driver-field-group" ref={rescuerDropdownRef}>
          <label className="add-driver-label">
            Rescuer Driver (Assisting) <span className="text-red-500">*</span>
          </label>
          <div
            className={`add-driver-input-wrap ${errors.rescuer ? "has-error" : ""}`}
            style={{ cursor: "pointer", justifyContent: "space-between", userSelect: "none" }}
            onClick={() => {
              setRescuerDropdownOpen(!rescuerDropdownOpen);
              setReceiverDropdownOpen(false);
            }}
          >
            <div style={{ display: "flex", alignItems: "center", minWidth: 0, gap: "0.5rem" }}>
              <User size={15} className="add-driver-input-icon" />
              <span
                style={{
                  fontSize: "0.875rem",
                  color: selectedRescuerName ? "#0F172A" : "#94A3B8",
                  fontWeight: selectedRescuerName ? 600 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedRescuerName || "Select Rescuer Driver..."}
              </span>
            </div>
            <ChevronDown
              size={15}
              className="text-slate-400"
              style={{
                transform: rescuerDropdownOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease",
                flexShrink: 0,
              }}
            />
          </div>

          {errors.rescuer && (
            <span className="add-driver-error-text">
              <AlertCircle size={12} />
              {errors.rescuer}
            </span>
          )}

          {/* Floating Searchable Popover for Rescuer */}
          {rescuerDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                zIndex: 1000,
                maxHeight: "260px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#F8FAFC",
                }}
              >
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search rescuer by name..."
                  value={rescuerSearch}
                  onChange={(e) => setRescuerSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "0.8125rem",
                    color: "#0F172A",
                    background: "transparent",
                    fontFamily: "inherit",
                  }}
                />
                {rescuerSearch && (
                  <button
                    type="button"
                    onClick={() => setRescuerSearch("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ overflowY: "auto", flex: 1, maxHeight: "200px" }}>
                {filteredRescuers.length === 0 ? (
                  <div style={{ padding: "0.85rem", textAlign: "center", fontSize: "0.8125rem", color: "#94A3B8" }}>
                    No drivers found
                  </div>
                ) : (
                  filteredRescuers.map((d) => {
                    const isSelected = String(d.id) === String(selectedRescuerId);
                    const isSameAsReceiver = String(d.id) === String(selectedReceiverId);
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          if (!isSameAsReceiver) {
                            setSelectedRescuerId(d.id);
                            setSelectedRescuerName(d.name);
                            setRescuerDropdownOpen(false);
                            setErrors((prev) => ({ ...prev, rescuer: undefined }));
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.55rem 0.85rem",
                          cursor: isSameAsReceiver ? "not-allowed" : "pointer",
                          backgroundColor: isSelected ? "#EFF6FF" : "transparent",
                          color: isSameAsReceiver ? "#94A3B8" : isSelected ? "#1D4ED8" : "#1E293B",
                          fontSize: "0.8125rem",
                          transition: "background 0.1s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && !isSameAsReceiver) e.currentTarget.style.backgroundColor = "#F8FAFC";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && !isSameAsReceiver) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              backgroundColor: isSelected ? "#BFDBFE" : "#F1F5F9",
                              color: isSelected ? "#1D4ED8" : "#64748B",
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
                            <div style={{ fontWeight: isSelected ? 600 : 500 }}>{d.name}</div>
                          </div>
                        </div>
                        {isSameAsReceiver ? (
                          <span style={{ fontSize: "0.6875rem", color: "#EF4444" }}>Selected as Receiver</span>
                        ) : isSelected ? (
                          <Check size={14} style={{ color: "#2563EB" }} />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Receiver Driver Field */}
        <div className="add-driver-field-group" ref={receiverDropdownRef}>
          <label className="add-driver-label">
            Receiver Driver (Assisted) <span className="text-red-500">*</span>
          </label>
          <div
            className={`add-driver-input-wrap ${errors.receiver ? "has-error" : ""}`}
            style={{ cursor: "pointer", justifyContent: "space-between", userSelect: "none" }}
            onClick={() => {
              setReceiverDropdownOpen(!receiverDropdownOpen);
              setRescuerDropdownOpen(false);
            }}
          >
            <div style={{ display: "flex", alignItems: "center", minWidth: 0, gap: "0.5rem" }}>
              <User size={15} className="add-driver-input-icon" />
              <span
                style={{
                  fontSize: "0.875rem",
                  color: selectedReceiverName ? "#0F172A" : "#94A3B8",
                  fontWeight: selectedReceiverName ? 600 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedReceiverName || "Select Receiver Driver..."}
              </span>
            </div>
            <ChevronDown
              size={15}
              className="text-slate-400"
              style={{
                transform: receiverDropdownOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease",
                flexShrink: 0,
              }}
            />
          </div>

          {errors.receiver && (
            <span className="add-driver-error-text">
              <AlertCircle size={12} />
              {errors.receiver}
            </span>
          )}

          {/* Floating Searchable Popover for Receiver */}
          {receiverDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                zIndex: 1000,
                maxHeight: "260px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#F8FAFC",
                }}
              >
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receiver by name..."
                  value={receiverSearch}
                  onChange={(e) => setReceiverSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "0.8125rem",
                    color: "#0F172A",
                    background: "transparent",
                    fontFamily: "inherit",
                  }}
                />
                {receiverSearch && (
                  <button
                    type="button"
                    onClick={() => setReceiverSearch("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ overflowY: "auto", flex: 1, maxHeight: "200px" }}>
                {filteredReceivers.length === 0 ? (
                  <div style={{ padding: "0.85rem", textAlign: "center", fontSize: "0.8125rem", color: "#94A3B8" }}>
                    No drivers found
                  </div>
                ) : (
                  filteredReceivers.map((d) => {
                    const isSelected = String(d.id) === String(selectedReceiverId);
                    const isSameAsRescuer = String(d.id) === String(selectedRescuerId);
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          if (!isSameAsRescuer) {
                            setSelectedReceiverId(d.id);
                            setSelectedReceiverName(d.name);
                            setReceiverDropdownOpen(false);
                            setErrors((prev) => ({ ...prev, receiver: undefined }));
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.55rem 0.85rem",
                          cursor: isSameAsRescuer ? "not-allowed" : "pointer",
                          backgroundColor: isSelected ? "#EFF6FF" : "transparent",
                          color: isSameAsRescuer ? "#94A3B8" : isSelected ? "#1D4ED8" : "#1E293B",
                          fontSize: "0.8125rem",
                          transition: "background 0.1s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && !isSameAsRescuer) e.currentTarget.style.backgroundColor = "#F8FAFC";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && !isSameAsRescuer) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              backgroundColor: isSelected ? "#BFDBFE" : "#F1F5F9",
                              color: isSelected ? "#1D4ED8" : "#64748B",
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
                            <div style={{ fontWeight: isSelected ? 600 : 500 }}>{d.name}</div>
                          </div>
                        </div>
                        {isSameAsRescuer ? (
                          <span style={{ fontSize: "0.6875rem", color: "#EF4444" }}>Selected as Rescuer</span>
                        ) : isSelected ? (
                          <Check size={14} style={{ color: "#2563EB" }} />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Shift Date & Rescue Status (Uniform 2-Column Grid) */}
      <div className="add-driver-grid-2">
        {/* Shift Date */}
        <div className="add-driver-field-group">
          <label className="add-driver-label">
            Shift Date <span className="text-red-500">*</span>
          </label>
          <div className="add-driver-input-wrap">
            <Calendar size={15} className="add-driver-input-icon" />
            <input
              type="date"
              className="add-driver-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Rescue Status */}
        <div className="add-driver-field-group">
          <label className="add-driver-label">
            Rescue Status <span className="text-red-500">*</span>
          </label>
          <div className="add-driver-input-wrap">
            <select
              className="add-driver-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as RescueStatus)}
              disabled={isSubmitting}
              style={{ cursor: "pointer" }}
            >
              <option value="Completed">Completed</option>
              <option value="Refuse">Refuse</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 3: Packages & Stops (Uniform 2-Column Grid) */}
      <div className="add-driver-grid-2">
        {/* Number of Packages */}
        <div className="add-driver-field-group">
          <label className="add-driver-label">Packages Count</label>
          <div className="add-driver-input-wrap">
            <Package size={15} className="add-driver-input-icon" />
            <input
              type="text"
              inputMode="numeric"
              className="add-driver-input"
              placeholder="e.g. 25"
              value={numberOfPackages}
              onChange={(e) => setNumberOfPackages(e.target.value.replace(/\D/g, ""))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Number of Stops */}
        <div className="add-driver-field-group">
          <label className="add-driver-label">Stops Count</label>
          <div className="add-driver-input-wrap">
            <MapPin size={15} className="add-driver-input-icon" />
            <input
              type="text"
              inputMode="numeric"
              className="add-driver-input"
              placeholder="e.g. 18"
              value={numberOfStops}
              onChange={(e) => setNumberOfStops(e.target.value.replace(/\D/g, ""))}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Row 4: Reason / Notes */}
      <div className="add-driver-field-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className="add-driver-label">Reason / Operational Notes</label>
          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{reason.length}/250</span>
        </div>
        <textarea
          rows={3}
          maxLength={250}
          className="add-driver-textarea"
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1.5px solid #CBD5E1",
            fontSize: "0.875rem",
            color: "#0F172A",
            resize: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            outline: "none",
          }}
          placeholder="e.g. Route sweep assistance, package transfer, driver fell behind on route..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );

  if (embedded) {
    return (
      <div className="add-driver-screen-container">
        {/* 1. Header: Back + Title on Left, Cancel & Submit Button on Right */}
        <div className="add-driver-header">
          <div className="add-driver-header-left">
            <button
              type="button"
              className="back-btn"
              onClick={onClose}
              title="Back to Rescues"
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              <span>Back to Rescues</span>
            </button>
            <div className="screen-title-divider" />
            <h2 className="screen-heading">
              {isEditMode ? "Edit Rescue" : "Add Rescue"}
            </h2>
          </div>

          <div className="add-driver-header-right">
            <button
              type="button"
              className="btn-outline-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="rescue-form"
              className="btn-blue-primary"
              disabled={isSubmitting}
              style={{ color: "#FFFFFF" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Saving...</span>
                </>
              ) : isEditMode ? (
                <>
                  <Save size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Save Rescue</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Main Form Card */}
        <div className="add-driver-card">
          {formContent}
        </div>
      </div>
    );
  }

  // Floating modal fallback (if ever called outside embedded view)
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #E2E8F0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>
            {isEditMode ? "Edit Rescue" : "Add Rescue"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "1.5rem", overflowY: "auto" }}>
          {formContent}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            padding: "1rem 1.5rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
          }}
        >
          <button type="button" onClick={onClose} className="btn-outline-cancel">
            Cancel
          </button>
          <button
            type="submit"
            form="rescue-form"
            className="btn-blue-primary"
            disabled={isSubmitting}
            style={{ color: "#FFFFFF" }}
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Save Rescue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRescueModal;
