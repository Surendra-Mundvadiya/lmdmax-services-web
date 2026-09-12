import React, { FC, useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  UserPlus,
  Save,
  User,
  Mail,
  Phone,
  Building,
  Check,
  ChevronDown,
  X,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import type { AdminUser } from "../../../types/admin";
import { useAdminStore } from "../../../store/adminStore";
import { useAuthStore } from "../../../store/authStore";
import { formatDriverPhone } from "../../../utils/driverValidators";
import LoadingSpinner from "../../common/LoadingSpinner";

interface AddAdminScreenProps {
  onBack: () => void;
  onSuccess: (adminName: string) => void;
  initialAdmin?: AdminUser | null;
  isEditMode?: boolean;
}

const digit = /\d+/;
const words = /[a-zA-Z]+/;
const specialChars = /[\\`~/,?<>:;"'{}!@#$%^&*|)(+=_-]{1,}/;
const hasValidNameChars = (val: string) =>
  !digit.test(val) && !specialChars.test(val) && words.test(val);

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_+={}[\]|\\;:"<>,./?])[A-Za-z\d!@#$%^&*()\-_+={}[\]|\\;:"<>,./?]{8,16}$/;

const emailRegex =
  /^(?=.{1,254}$)(?=.{1,64}@)(?:("[^"\\\r\n]+")|((?!\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*))@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}|(?:\[)?(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\]?)$/;

export const AddAdminScreen: FC<AddAdminScreenProps> = ({
  onBack,
  onSuccess,
  initialAdmin,
  isEditMode = false,
}) => {
  const createAdminApi = useAdminStore((state) => state.createAdminApi);
  const updateAdminApi = useAdminStore((state) => state.updateAdminApi);
  const stations = useAuthStore((state) => state.stations);
  const allStations = useAuthStore((state) => state.allStations);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  // Fetch real-time active stations on mount from backend
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Derive consolidated list of ONLY STRICTLY ACTIVE stations from Queen account
  const realStations = useMemo(() => {
    const list = stations.length > 0 ? stations : allStations;
    return list
      .filter((st) => st.active === true && !st.pending)
      .map((st) => ({
        code: st.station_code,
        name: `${st.station_code} Hub`,
        companyId: String(st.company_id),
      }))
      .filter((st, idx, arr) => arr.findIndex((x) => x.code === st.code) === idx);
  }, [stations, allStations]);

  const defaultStation = useMemo(() => {
    return realStations[0]?.code || "QUE2";
  }, [realStations]);

  // Form State initialized with initialAdmin if in edit mode
  const [name, setName] = useState(() => {
    if (initialAdmin) {
      return (
        initialAdmin.name ||
        `${initialAdmin.first_name || ""} ${initialAdmin.last_name || ""}`.trim()
      );
    }
    return "";
  });

  const [email, setEmail] = useState(() => {
    if (initialAdmin?.email && initialAdmin.email !== "—" && initialAdmin.email !== "*****") {
      return initialAdmin.email;
    }
    return "";
  });

  const [phone, setPhone] = useState(() => {
    if (!initialAdmin?.phone || initialAdmin.phone === "—") return "";
    return initialAdmin.phone.replace(/\D/g, "");
  });

  const [selectedStations, setSelectedStations] = useState<string[]>(() => {
    if (initialAdmin && initialAdmin.stations && initialAdmin.stations.length > 0) {
      return initialAdmin.stations;
    }
    return [defaultStation];
  });

  // Sync default station once realStations loads if fresh creation
  useEffect(() => {
    if (!initialAdmin && selectedStations.length === 0 && realStations.length > 0) {
      setSelectedStations([realStations[0].code]);
    }
  }, [realStations, selectedStations.length, initialAdmin]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Real-time Name Validation
  const handleNameChange = (val: string) => {
    setName(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, name: "Admin name is required" }));
      return;
    }
    if (!hasValidNameChars(val) || trimmed[0] === ".") {
      setErrors((prev) => ({ ...prev, name: "Please enter a valid name (letters only)" }));
      return;
    }
    if (trimmed.length < 2) {
      setErrors((prev) => ({ ...prev, name: "Name should be at least 2 characters long" }));
      return;
    }
    if (trimmed.length > 50) {
      setErrors((prev) => ({ ...prev, name: "Name should be at most 50 characters long" }));
      return;
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.name;
      return copy;
    });
  };

  // Real-time Phone Validation
  const handlePhoneChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    setPhone(cleaned);
    if (!cleaned) {
      setErrors((prev) => ({ ...prev, phone: "Phone number is required" }));
      return;
    }
    if (cleaned.length !== 10) {
      setErrors((prev) => ({ ...prev, phone: "Please enter a 10-digit phone number" }));
      return;
    }
    if (cleaned[0] === "0" || cleaned[0] === "1") {
      setErrors((prev) => ({ ...prev, phone: "Area code cannot start with 0 or 1" }));
      return;
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.phone;
      return copy;
    });
  };

  // Real-time Email Validation
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (trimmed.length > 320) {
      setErrors((prev) => ({ ...prev, email: "Email must be at most 320 characters long" }));
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
      return;
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.email;
      return copy;
    });
  };

  // Real-time Password Validation (only in create mode)
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (!val) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }
    if (!passwordRegex.test(val)) {
      setErrors((prev) => ({
        ...prev,
        password:
          "Password must be 8-16 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      }));
      return;
    }
    if (confirmPassword && confirmPassword !== val) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.confirmPassword;
        return copy;
      });
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.password;
      return copy;
    });
  };

  // Real-time Confirm Password Validation
  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (!val) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Confirm password is required" }));
      return;
    }
    if (password && val !== password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return;
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.confirmPassword;
      return copy;
    });
  };

  // Toggle Station selection
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
    } else {
      const updated = [...selectedStations, code];
      setSelectedStations(updated);
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.stations;
      return copy;
    });
  };

  const handleSelectAllStations = () => {
    const allCodes = realStations.map((s) => s.code);
    setSelectedStations(allCodes);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.stations;
      return copy;
    });
  };

  const handleClearAllStations = () => {
    if (realStations.length > 0) {
      const single = [realStations[0].code];
      setSelectedStations(single);
    }
  };

  // Filtered station list for dropdown search
  const filteredStations = useMemo(() => {
    if (!stationSearchQuery.trim()) return realStations;
    const q = stationSearchQuery.toLowerCase().trim();
    return realStations.filter(
      (st) =>
        st.code.toLowerCase().includes(q) || st.name.toLowerCase().includes(q)
    );
  }, [realStations, stationSearchQuery]);

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = "Admin name is required";
    } else if (!hasValidNameChars(name) || trimmedName.length < 2 || trimmedName.length > 50) {
      newErrors.name = "Please enter a valid name (letters only, 2-50 chars)";
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (phone.length !== 10) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    } else if (phone[0] === "0" || phone[0] === "1") {
      newErrors.phone = "Area code cannot start with 0 or 1";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!isEditMode) {
      if (!password) {
        newErrors.password = "Password is required";
      } else if (!passwordRegex.test(password)) {
        newErrors.password =
          "Password must be 8-16 characters with uppercase, lowercase, number, and special character";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Confirm password is required";
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (selectedStations.length === 0) {
      newErrors.stations = "Please select at least one delivery station";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      // Find company_ids or station codes
      const targetCompanyIds = selectedStations.map((code) => {
        const found = realStations.find((s) => s.code === code);
        return found ? found.companyId : code;
      });

      if (isEditMode && initialAdmin) {
        const res = await updateAdminApi(initialAdmin.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ""),
          station_code: targetCompanyIds,
        });

        if (res.success) {
          onSuccess(name.trim());
          onBack();
        } else {
          setServerError(res.message || "Failed to update administrator");
        }
      } else {
        const res = await createAdminApi({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ""),
          password: password,
          station_code: targetCompanyIds,
        });

        if (res.success) {
          onSuccess(name.trim());
          onBack();
        } else {
          setServerError(res.message || "Failed to add administrator");
        }
      }
    } catch (err: any) {
      setServerError(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-driver-screen-container">
      {/* 1. Header: Back + Title on Left, Cancel & Save on Right (matching Add Driver Screen) */}
      <div
        className="add-driver-header"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          paddingBottom: "var(--ads-s4)",
          borderBottom: "1px solid var(--ads-hairline)",
          marginBottom: "var(--ads-s1)",
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
            title="Back to All Administrators"
            aria-label="Back to all administrators"
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            <span>Back to Admins</span>
          </button>
          <div
            className="screen-title-divider"
            style={{ width: "1px", height: "20px", backgroundColor: "var(--ads-hairline-strong)" }}
          />
          <h2
            className="screen-heading"
            style={{
              margin: 0,
              fontSize: "1.0625rem",
              fontWeight: 600,
              letterSpacing: "-0.014em",
              color: "var(--ads-ink)",
            }}
          >
            {isEditMode ? "Edit Admin" : "Add Admin"}
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
            form="add-admin-form"
            className="btn-blue-primary"
            disabled={isSubmitting || selectedStations.length === 0}
            style={{ color: "#FFFFFF" }}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span style={{ color: "#FFFFFF" }}>
                  {isEditMode ? "Saving Changes..." : "Adding Admin..."}
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
                <span style={{ color: "#FFFFFF" }}>Add Admin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Form Card */}
      <div className="add-driver-card">
        {serverError && (
          <div className="modal-error-alert" style={{ marginBottom: "1rem" }}>
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form
          id="add-admin-form"
          onSubmit={handleSubmit}
          className="add-driver-form"
          noValidate
        >
          {/* Row 1: Admin Name & Email ID (Uniform 2-Column Grid) */}
          <div className="add-driver-grid-2">
            <div className="add-driver-field-group">
              <label className="add-driver-label">
                Admin Name <span className="text-red-500">*</span>
              </label>
              <div
                className={`add-driver-input-wrap ${
                  errors.name ? "has-error" : ""
                }`}
              >
                <User size={15} className="add-driver-input-icon" />
                <input
                  type="text"
                  className="add-driver-input"
                  placeholder="Enter Admin Name"
                  value={name}
                  disabled={isSubmitting}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              {errors.name && (
                <span className="add-driver-error-text">
                  <AlertCircle size={12} />
                  {errors.name}
                </span>
              )}
            </div>

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
                  placeholder="admin@lmdmaxops.com"
                  value={email}
                  disabled={isSubmitting}
                  onChange={(e) => handleEmailChange(e.target.value)}
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

          {/* Row 2: Phone Number & Station Code */}
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
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
              </div>
              {errors.phone && (
                <span className="add-driver-error-text">
                  <AlertCircle size={12} />
                  {errors.phone}
                </span>
              )}
            </div>

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
                      transition: "transform var(--ads-dur-fast) var(--ads-ease)",
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
                            padding: "var(--ads-s3)",
                            textAlign: "center",
                            fontSize: "0.75rem",
                            color: "var(--ads-ink-quaternary)",
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
          </div>

          {/* Row 3: Password & Confirm Password (Only for new Admin Creation) */}
          {!isEditMode && (
            <div className="add-driver-grid-2">
              <div className="add-driver-field-group">
                <label className="add-driver-label">
                  Password <span className="text-red-500">*</span>
                </label>
                <div
                  className={`add-driver-input-wrap ${
                    errors.password ? "has-error" : ""
                  }`}
                  style={{ position: "relative" }}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    maxLength={16}
                    className="add-driver-input"
                    placeholder="Enter password (8-16 characters)"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--ads-ink-tertiary)",
                      padding: 0,
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="add-driver-error-text">
                    <AlertCircle size={12} />
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="add-driver-field-group">
                <label className="add-driver-label">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div
                  className={`add-driver-input-wrap ${
                    errors.confirmPassword ? "has-error" : ""
                  }`}
                  style={{ position: "relative" }}
                >
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    maxLength={16}
                    className="add-driver-input"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    disabled={isSubmitting}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--ads-ink-tertiary)",
                      padding: 0,
                    }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="add-driver-error-text">
                    <AlertCircle size={12} />
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddAdminScreen;
