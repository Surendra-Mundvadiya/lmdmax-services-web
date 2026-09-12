import React, { FC, useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  UserPlus,
  Save,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Building,
  Check,
  ChevronDown,
  X,
  Search,
  Shield,
  AlertCircle,
} from "lucide-react";
import type { Driver } from "../../../types/driver";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import { curationApi } from "../../../api/curationApi";
import { useCurationStore } from "../../../store/curationStore";
import {
  validateDriverFullName,
  validateTransporterId,
  validateDriverEmail,
  validateDriverPhone,
  validateDriverDob,
  validateDriverHireDate,
  validateDriverAnniversary,
  validateDriverStations,
  formatDriverPhone,
} from "../../../utils/driverValidators";
import CustomDatePicker from "../../common/CustomDatePicker";
import LoadingSpinner from "../../common/LoadingSpinner";

interface AddDriverScreenProps {
  onBack: () => void;
  onSuccess: (driver: Driver) => void;
  initialDriver?: Driver | null;
  isEditMode?: boolean;
  from?: string;
  returnUrl?: string | null;
}

// Helper to format date strings to MM/DD/YYYY
function formatDateString(val?: string | null): string {
  if (!val || !val.trim()) return "";
  const trimmed = val.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [m, d, y] = trimmed.split("/").map(Number);
    return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.slice(0, 10).split("-").map(Number);
    return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
  }
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${date.getFullYear()}`;
  }
  return trimmed;
}

export const AddDriverScreen: FC<AddDriverScreenProps> = ({
  onBack,
  onSuccess,
  initialDriver,
  isEditMode = false,
  from,
  returnUrl,
}) => {
  const createDriverAsync = useDriverStore((state) => state.createDriverAsync);
  const updateDriver = useDriverStore((state) => state.updateDriver);
  const selectedStationFilter = useDriverStore((state) => state.selectedStationFilter);

  // Real-time Auth Store integration
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const authStations = useAuthStore((state) => state.stations);
  const allStations = useAuthStore((state) => state.allStations);

  // Fetch real-time active stations on mount from backend
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Derive consolidated list of ONLY STRICTLY ACTIVE stations (real-time GET API)
  const availableStations = useMemo(() => {
    const stationMap = new Map<string, { code: string; name: string }>();

    const stationSource = (authStations && authStations.length > 0 ? authStations : allStations) || [];
    stationSource
      .filter((st) => st.active === true && !st.pending)
      .forEach((st) => {
        if (st.station_code && !stationMap.has(st.station_code)) {
          stationMap.set(st.station_code, {
            code: st.station_code,
            name: `${st.station_code} Hub`,
          });
        }
      });

    // Safe fallback if not yet loaded
    if (stationMap.size === 0) {
      ["QUE2", "QUE4"].forEach((code) => {
        stationMap.set(code, { code, name: `${code} Hub` });
      });
    }

    return Array.from(stationMap.values());
  }, [authStations, allStations]);

  const defaultStation = useMemo(() => {
    if (selectedStationFilter && selectedStationFilter !== "ALL") {
      const match = availableStations.find((s) => s.code === selectedStationFilter);
      if (match) return match.code;
    }
    return availableStations[0]?.code || "QUE4";
  }, [selectedStationFilter, availableStations]);

  // Form states initialized with initialDriver if in edit mode
  const [driverName, setDriverName] = useState(() => {
    if (initialDriver) {
      return (
        initialDriver.name ||
        `${initialDriver.first_name || ""} ${initialDriver.last_name || ""}`.trim()
      );
    }
    return "";
  });

  const [transporterId, setTransporterId] = useState(
    (initialDriver?.transporter_id || "").replace(/^#+/, "")
  );

  const [selectedStations, setSelectedStations] = useState<string[]>(() => {
    if (initialDriver && initialDriver.stations?.length > 0) {
      return initialDriver.stations.map((s) => s.station_code);
    }
    return [defaultStation];
  });

  // Sync initialDriver updates if navigated with state
  useEffect(() => {
    if (initialDriver) {
      const name =
        initialDriver.name ||
        `${initialDriver.first_name || ""} ${initialDriver.last_name || ""}`.trim();
      if (name) setDriverName(name);
      if (initialDriver.transporter_id) {
        setTransporterId(initialDriver.transporter_id.replace(/^#+/, ""));
      }
      if (initialDriver.email) {
        setEmail(initialDriver.email.replace(/^#+/, ""));
      }
      if (initialDriver.phone) {
        setPhone(initialDriver.phone);
      }
      if (initialDriver.stations && initialDriver.stations.length > 0) {
        setSelectedStations(initialDriver.stations.map((s) => s.station_code));
      }
    }
  }, [initialDriver]);

  // Sync default station once availableStations loads if adding fresh
  useEffect(() => {
    if (!initialDriver && selectedStations.length === 0 && availableStations.length > 0) {
      setSelectedStations([availableStations[0].code]);
    }
  }, [availableStations, selectedStations.length, initialDriver]);

  const [email, setEmail] = useState((initialDriver?.email || "").replace(/^#+/, ""));
  const [phone, setPhone] = useState(initialDriver?.phone || "");
  const [allowSignin, setAllowSignin] = useState(
    initialDriver !== undefined && initialDriver !== null ? initialDriver.allow_signin : true
  );
  const [allowInspections, setAllowInspections] = useState(
    initialDriver !== undefined && initialDriver !== null ? initialDriver.allow_inspections : true
  );
  const [address, setAddress] = useState(initialDriver?.address || "");
  const [dateOfBirth, setDateOfBirth] = useState(() => formatDateString(initialDriver?.date_of_birth));
  const [hireDate, setHireDate] = useState(() => formatDateString(initialDriver?.hire_date));
  const [workAnniversary, setWorkAnniversary] = useState(() => formatDateString(initialDriver?.work_anniversary));
  const [sameAsHireDate, setSameAsHireDate] = useState(() => {
    if (!initialDriver) return true;
    return (
      Boolean(initialDriver.work_anniversary && initialDriver.work_anniversary === initialDriver.hire_date) ||
      !initialDriver.work_anniversary
    );
  });
  const [status] = useState<"active" | "inactive">(initialDriver?.status || "active");

  // Station Dropdown Popover State
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const [stationSearchQuery, setStationSearchQuery] = useState("");
  const stationDropdownRef = useRef<HTMLDivElement>(null);

  // Close station dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        stationDropdownRef.current &&
        !stationDropdownRef.current.contains(e.target as Node)
      ) {
        setStationDropdownOpen(false);
      }
    };
    if (stationDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [stationDropdownOpen]);

  // Celebratory years completed calculation
  const [yearsCompleted, setYearsCompleted] = useState<number | null>(null);

  useEffect(() => {
    if (workAnniversary) {
      const anniv = new Date(workAnniversary);
      const now = new Date();
      let years = now.getFullYear() - anniv.getFullYear();
      const m = now.getMonth() - anniv.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < anniv.getDate())) {
        years--;
      }
      setYearsCompleted(years > 0 ? years : null);
    } else {
      setYearsCompleted(null);
    }
  }, [workAnniversary]);

  // Handle Driver Sign In toggle sync
  const handleAllowSigninToggle = () => {
    const nextState = !allowSignin;
    setAllowSignin(nextState);
    if (!nextState) {
      setAllowInspections(false);
    } else {
      setAllowInspections(true);
    }
  };

  const handleHireDateChange = (val: string) => {
    setHireDate(val);
    validateField("hireDate", val);
    if (sameAsHireDate) {
      setWorkAnniversary(val);
      validateField("workAnniversary", val);
    }
  };

  const toggleStation = (code: string) => {
    if (selectedStations.includes(code)) {
      if (selectedStations.length === 1) {
        setErrors((prev) => ({
          ...prev,
          stations: "At least one active station is required",
        }));
        return;
      }
      const updated = selectedStations.filter((s) => s !== code);
      setSelectedStations(updated);
      validateField("stations", updated);
    } else {
      const updated = [...selectedStations, code];
      setSelectedStations(updated);
      validateField("stations", updated);
    }
  };

  const handleSelectAllStations = () => {
    const allCodes = availableStations.map((s) => s.code);
    setSelectedStations(allCodes);
    validateField("stations", allCodes);
  };

  const handleClearAllStations = () => {
    if (availableStations.length > 0) {
      const single = [availableStations[0].code];
      setSelectedStations(single);
      validateField("stations", single);
    }
  };

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time validator helper
  const validateField = (fieldName: string, value?: any) => {
    let err = "";
    switch (fieldName) {
      case "driverName": {
        const val = value !== undefined ? value : driverName;
        const res = validateDriverFullName(val);
        if (!res.isValid) err = res.error;
        break;
      }
      case "transporterId": {
        const val = value !== undefined ? value : transporterId;
        const res = validateTransporterId(val);
        if (!res.isValid) err = res.error;
        break;
      }
      case "email": {
        const val = value !== undefined ? value : email;
        const res = validateDriverEmail(val);
        if (!res.isValid) err = res.error;
        break;
      }
      case "phone": {
        const val = value !== undefined ? value : phone;
        const res = validateDriverPhone(val);
        if (!res.isValid) err = res.error;
        break;
      }
      case "dateOfBirth": {
        const val = value !== undefined ? value : dateOfBirth;
        const res = validateDriverDob(val, false); // optional
        if (!res.isValid) err = res.error;
        break;
      }
      case "hireDate": {
        const val = value !== undefined ? value : hireDate;
        const res = validateDriverHireDate(val, false); // optional
        if (!res.isValid) err = res.error;
        break;
      }
      case "workAnniversary": {
        const val = value !== undefined ? value : workAnniversary || hireDate;
        const res = validateDriverAnniversary(val, hireDate);
        if (!res.isValid) err = res.error;
        break;
      }
      case "stations": {
        const val = value !== undefined ? value : selectedStations;
        const res = validateDriverStations(val);
        if (!res.isValid) err = res.error;
        break;
      }
    }
    setErrors((prev) => ({ ...prev, [fieldName]: err }));
    return err === "";
  };

  const validateAll = (): boolean => {
    const nameRes = validateDriverFullName(driverName);
    const tidRes = validateTransporterId(transporterId);
    const emailRes = validateDriverEmail(email);
    const phoneRes = validateDriverPhone(phone);
    const dobRes = validateDriverDob(dateOfBirth, false); // optional
    const hireRes = validateDriverHireDate(hireDate, false); // optional
    const annivRes = validateDriverAnniversary(workAnniversary || hireDate, hireDate);
    const stationsRes = validateDriverStations(selectedStations);

    const newErrors: Record<string, string> = {};
    if (!nameRes.isValid) newErrors.driverName = nameRes.error;
    if (!tidRes.isValid) newErrors.transporterId = tidRes.error;
    if (!emailRes.isValid) newErrors.email = emailRes.error;
    if (!phoneRes.isValid) newErrors.phone = phoneRes.error;
    if (!dobRes.isValid) newErrors.dateOfBirth = dobRes.error;
    if (!hireRes.isValid) newErrors.hireDate = hireRes.error;
    if (!annivRes.isValid) newErrors.workAnniversary = annivRes.error;
    if (!stationsRes.isValid) newErrors.stations = stationsRes.error;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateAll()) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, form: "" }));

    const trimmedName = driverName.trim();
    const parts = trimmedName.split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    try {
      if (isEditMode && initialDriver) {
        const updatedFields: Partial<Driver> = {
          name: trimmedName,
          first_name: firstName,
          last_name: lastName,
          transporter_id: transporterId.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ""),
          address: address.trim(),
          hire_date: hireDate || "",
          date_of_birth: dateOfBirth || "",
          work_anniversary: workAnniversary || hireDate || "",
          stations: selectedStations.map((code) => ({ station_code: code })),
          allow_signin: allowSignin,
          allow_inspections: allowSignin ? allowInspections : false,
          status,
        };

        updateDriver(initialDriver.id, updatedFields);
        onSuccess({ ...initialDriver, ...updatedFields } as Driver);
      } else {
        const created = await createDriverAsync({
          first_name: firstName,
          last_name: lastName,
          title: "",
          transporter_id: transporterId.trim().toUpperCase(),
          netradyne_id: (initialDriver as any)?.netradyne_id || undefined,
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ""),
          address: address.trim(),
          hire_date: hireDate,
          date_of_birth: dateOfBirth,
          work_anniversary: workAnniversary || hireDate,
          stations: selectedStations.map((code) => ({ station_code: code })),
          allow_signin: allowSignin,
          allow_inspections: allowSignin ? allowInspections : false,
          status,
        });

        // If coming from curation, automatically associate names in performance backend and resolve curation
        if ((initialDriver as any)?.curation_id) {
          try {
            await curationApi.addAssociatedNames(trimmedName, created.id);
            if ((initialDriver as any).curation_type === "ementor") {
              await curationApi.updateEmentor([
                {
                  _id: (initialDriver as any).curation_id,
                  name: trimmedName,
                  driver_id: String(created.id),
                },
              ]);
            } else {
              await curationApi.deleteCuration(
                (initialDriver as any).curation_id,
                (initialDriver as any).curation_type === "unified" ? "transporter_id" : "netradyne_id"
              );
            }
            await useCurationStore.getState().fetchCurationCount(true);
          } catch (cErr) {
            console.warn("curation sync note:", cErr);
          }
        }

        onSuccess(created);
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        form: isEditMode
          ? "Failed to update driver details. Please try again."
          : "Failed to register driver. Please verify details and try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered station list for dropdown search
  const filteredStations = useMemo(() => {
    if (!stationSearchQuery.trim()) return availableStations;
    const q = stationSearchQuery.toLowerCase().trim();
    return availableStations.filter(
      (st) =>
        st.code.toLowerCase().includes(q) || st.name.toLowerCase().includes(q)
    );
  }, [availableStations, stationSearchQuery]);

  return (
    <div className="add-driver-screen-container">
      {/* 1. Header: Back + Title on Left, Cancel & Submit Button on Right */}
      <div
        className="add-driver-header"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          paddingBottom: "0.85rem",
          borderBottom: "1px solid #E2E8F0",
          marginBottom: "0.25rem",
        }}
      >
        <div
          className="add-driver-header-left"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <button
            type="button"
            className="back-btn"
            onClick={onBack}
            title={from === "curations" ? "Back to Curations" : "Back to All Drivers"}
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            <span>{from === "curations" ? "Back to Curations" : "Back to Drivers"}</span>
          </button>
          <div
            className="screen-title-divider"
            style={{ width: "1px", height: "20px", backgroundColor: "#CBD5E1" }}
          />
          <h2
            className="screen-heading"
            style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0F172A" }}
          >
            {isEditMode ? "Edit Driver" : "Add Driver"}
          </h2>
        </div>

        <div
          className="add-driver-header-right"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.85rem",
            marginLeft: "auto",
          }}
        >
          <button
            type="button"
            className="btn-outline-cancel"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-driver-form"
            className="btn-blue-primary"
            disabled={isSubmitting}
            style={{ color: "#FFFFFF" }}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span style={{ color: "#FFFFFF" }}>
                  {isEditMode ? "Saving Changes..." : "Adding Driver..."}
                </span>
              </>
            ) : isEditMode ? (
              <>
                <Save size={15} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Save Changes</span>
              </>
            ) : (
              <>
                <UserPlus size={15} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Add Driver</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Form Card */}
      <div className="add-driver-card">
        <form
          id="add-driver-form"
          onSubmit={handleSubmit}
          className="add-driver-form"
          noValidate
        >
          {errors.form && (
            <div className="modal-error-alert">
              <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Row 1: Driver Name & Transporter ID (Uniform 2-Column Grid) */}
          <div className="add-driver-grid-2">
            <div className="add-driver-field-group">
              <label className="add-driver-label">
                Driver Name <span className="text-red-500">*</span>
              </label>
              <div
                className={`add-driver-input-wrap ${
                  errors.driverName ? "has-error" : ""
                }`}
              >
                <User size={15} className="add-driver-input-icon" />
                <input
                  type="text"
                  className="add-driver-input"
                  placeholder="Enter Driver Name"
                  value={driverName}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setDriverName(e.target.value);
                    if (errors.driverName) validateField("driverName", e.target.value);
                  }}
                  onBlur={() => validateField("driverName")}
                />
              </div>
              {errors.driverName && (
                <span className="add-driver-error-text">
                  <AlertCircle size={12} />
                  {errors.driverName}
                </span>
              )}
            </div>

            <div className="add-driver-field-group">
              <label className="add-driver-label">
                Transporter ID <span className="text-red-500">*</span>
              </label>
              <div
                className={`add-driver-input-wrap ${
                  errors.transporterId ? "has-error" : ""
                }`}
              >
                <CreditCard size={15} className="add-driver-input-icon" />
                <input
                  type="text"
                  className="add-driver-input"
                  placeholder="XXXXXXXXXXXXXX"
                  value={transporterId}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const upper = e.target.value.replace(/^#+/, "").toUpperCase();
                    setTransporterId(upper);
                    if (errors.transporterId) validateField("transporterId", upper);
                  }}
                  onBlur={() => validateField("transporterId")}
                />
              </div>
              {errors.transporterId && (
                <span className="add-driver-error-text">
                  <AlertCircle size={12} />
                  {errors.transporterId}
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Station Code & Email ID */}
          <div className="add-driver-grid-2">
            {/* Station Code: Clean Multi-Select Tag Dropdown (ONLY ACTIVE STATIONS) */}
            <div className="add-driver-field-group" ref={stationDropdownRef}>
              <label className="add-driver-label">
                Station Code <span className="text-red-500">*</span>
              </label>
              <div className="station-multiselect-container">
                <button
                  type="button"
                  className={`station-multiselect-trigger ${
                    stationDropdownOpen ? "is-open" : ""
                  } ${errors.stations ? "has-error" : ""}`}
                  onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
                  disabled={isSubmitting}
                >
                  <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
                    <Building size={15} className="add-driver-input-icon" />
                    <div className="station-tags-wrap">
                      {selectedStations.length === 0 ? (
                        <span className="station-multiselect-placeholder">
                          Select active delivery stations...
                        </span>
                      ) : (
                        selectedStations.map((code) => (
                          <span key={code} className="station-tag-chip">
                            {code}
                            <span
                              className="station-tag-remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStation(code);
                              }}
                              title={`Remove ${code}`}
                            >
                              <X size={12} />
                            </span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={15}
                    className="text-slate-400 flex-shrink-0"
                    style={{
                      transform: stationDropdownOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  />
                </button>

                {/* Dropdown Popover */}
                {stationDropdownOpen && (
                  <div className="station-multiselect-popover">
                    <div className="station-popover-search">
                      <Search size={13} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search active stations..."
                        value={stationSearchQuery}
                        onChange={(e) => setStationSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="station-popover-actions">
                      <button
                        type="button"
                        className="station-popover-action-btn"
                        onClick={handleSelectAllStations}
                      >
                        Select All Active
                      </button>
                      <button
                        type="button"
                        className="station-popover-action-btn"
                        onClick={handleClearAllStations}
                      >
                        Reset
                      </button>
                    </div>
                    <div className="station-popover-list">
                      {filteredStations.map((st) => {
                        const isChecked = selectedStations.includes(st.code);
                        return (
                          <div
                            key={st.code}
                            className={`station-popover-item ${
                              isChecked ? "is-checked" : ""
                            }`}
                            onClick={() => toggleStation(st.code)}
                          >
                            <div className="station-item-checkbox">
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="station-item-code">{st.code}</span>
                            <span className="station-item-name">{st.name}</span>
                          </div>
                        );
                      })}
                      {filteredStations.length === 0 && (
                        <div
                          style={{
                            padding: "0.6rem",
                            textAlign: "center",
                            fontSize: "0.75rem",
                            color: "#94A3B8",
                          }}
                        >
                          No active stations found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.stations && (
                <span className="add-driver-error-text">
                  <AlertCircle size={12} />
                  {errors.stations}
                </span>
              )}
            </div>

            {/* Email ID */}
            <div className="add-driver-field-group">
              <label className="add-driver-label">
                Email ID <span className="text-red-500">*</span>
              </label>
              <div
                className={`add-driver-input-wrap ${
                  errors.email ? "has-error" : ""
                }`}
              >
                <Mail size={15} className="add-driver-input-icon" />
                <input
                  type="email"
                  className="add-driver-input"
                  placeholder="abc@xyz.com"
                  value={email}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/^#+/, "");
                    setEmail(cleaned);
                    if (errors.email) validateField("email", cleaned);
                  }}
                  onBlur={() => validateField("email")}
                />
              </div>
              {errors.email && (
                <span className="add-driver-error-text">
                  <AlertCircle size={12} />
                  {errors.email}
                </span>
              )}
            </div>
          </div>

          {/* Row 3: Phone Number & Birthdate (Birthdate is NOT mandatory) */}
          <div className="add-driver-grid-2">
            <div className="add-driver-field-group">
              <label className="add-driver-label">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div
                className={`add-driver-input-wrap ${
                  errors.phone ? "has-error" : ""
                }`}
              >
                <Phone size={15} className="add-driver-input-icon" />
                <span className="add-driver-phone-prefix">US +1</span>
                <input
                  type="tel"
                  className="add-driver-input"
                  placeholder="(555) 000-0000"
                  value={formatDriverPhone(phone)}
                  maxLength={14}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setPhone(digits);
                    if (errors.phone) validateField("phone", digits);
                  }}
                  onBlur={() => validateField("phone")}
                />
              </div>
              {errors.phone && (
                <span className="add-driver-error-text">
                  <AlertCircle size={12} />
                  {errors.phone}
                </span>
              )}
            </div>

            {/* Birthdate: Beautiful Calendar Picker (Optional, format MM/DD/YYYY) */}
            <div className="add-driver-field-group">
              <CustomDatePicker
                label="Birthdate"
                required={false}
                value={dateOfBirth}
                onChange={(val) => {
                  setDateOfBirth(val);
                  validateField("dateOfBirth", val);
                }}
                error={errors.dateOfBirth}
                placeholder="MM/DD/YYYY"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Row 4: Hire Date & Work Anniversary Date (Both Optional, format MM/DD/YYYY) */}
          <div className="add-driver-grid-2">
            <div className="add-driver-field-group">
              <CustomDatePicker
                label="Hire Date"
                required={false}
                value={hireDate}
                onChange={handleHireDateChange}
                error={errors.hireDate}
                placeholder="MM/DD/YYYY"
                disabled={isSubmitting}
              />
            </div>

            <div className="add-driver-field-group">
              <div className="anniversary-label-row" style={{ marginBottom: "0.35rem" }}>
                <label className="add-driver-label" style={{ margin: 0 }}>
                  Work Anniversary Date
                </label>
                <div className="anniversary-right-meta">
                  <label className="same-hire-checkbox">
                    <input
                      type="checkbox"
                      checked={sameAsHireDate}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsHireDate(checked);
                        if (checked && hireDate) {
                          setWorkAnniversary(hireDate);
                          validateField("workAnniversary", hireDate);
                        }
                      }}
                    />
                    <span>Same as Hire Date</span>
                  </label>
                  {yearsCompleted !== null && (
                    <span className="celebration-badge">
                      🎉 Completed {yearsCompleted} year{yearsCompleted > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <CustomDatePicker
                value={workAnniversary}
                onChange={(val) => {
                  setWorkAnniversary(val);
                  validateField("workAnniversary", val);
                }}
                error={errors.workAnniversary}
                placeholder="MM/DD/YYYY"
                disabled={sameAsHireDate || isSubmitting}
              />
            </div>
          </div>

          {/* Row 5: Address (Full Width) */}
          <div className="add-driver-field-group col-span-2">
            <label className="add-driver-label">Address</label>
            <div className="add-driver-input-wrap add-driver-textarea-wrap">
              <MapPin
                size={15}
                className="add-driver-input-icon"
                style={{ marginTop: "0.25rem" }}
              />
              <textarea
                className="add-driver-textarea"
                rows={2}
                placeholder="Enter street address, city, state, zip code"
                value={address}
                disabled={isSubmitting}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Section: Driver Permissions / App Access (Dedicated 2-Column Subsection) */}
          <div className="driver-permissions-section">
            <div className="driver-permissions-title">
              <Shield size={16} />
              <span>Driver Permissions / App Access</span>
            </div>

            <div className="driver-permissions-grid">
              {/* Card 1: Driver Sign In */}
              <div className="permission-toggle-card">
                <div className="permission-card-info">
                  <span className="permission-card-title">Driver Sign In</span>
                  <span className="permission-card-desc">
                    Permit driver to log into the mobile app
                  </span>
                </div>
                <label className="custom-blue-switch" title={allowSignin ? "Active" : "Inactive"}>
                  <input
                    type="checkbox"
                    checked={allowSignin}
                    onChange={handleAllowSigninToggle}
                    disabled={isSubmitting}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {/* Card 2: Driver Inspection */}
              <div className="permission-toggle-card">
                <div className="permission-card-info">
                  <span className="permission-card-title">Driver Inspection</span>
                  <span className="permission-card-desc">
                    {!allowSignin
                      ? "Enable Driver Sign-In to allow inspections"
                      : "Daily DVIC inspections access"}
                  </span>
                </div>
                <label className="custom-blue-switch" title={allowInspections ? "Active" : "Inactive"}>
                  <input
                    type="checkbox"
                    checked={allowInspections}
                    disabled={!allowSignin || isSubmitting}
                    onChange={() => setAllowInspections(!allowInspections)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDriverScreen;
