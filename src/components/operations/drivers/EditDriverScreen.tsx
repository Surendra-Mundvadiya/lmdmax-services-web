import React, { FC, useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Check,
  AlertCircle,
} from "lucide-react";
import type { Driver } from "../../../types/driver";
import { useDriverStore, AVAILABLE_STATIONS } from "../../../store/driverStore";
import {
  validateDriverNamePart,
  validateTransporterId,
  validateDriverEmail,
  validateDriverPhone,
  validateDriverDob,
  validateDriverHireDate,
  validateDriverAnniversary,
  validateDriverStations,
  formatDriverPhone,
} from "../../../utils/driverValidators";
import LoadingSpinner from "../../common/LoadingSpinner";

interface EditDriverScreenProps {
  driver: Driver;
  onBack: () => void;
  onSuccess: (driver: Driver) => void;
}

export const EditDriverScreen: FC<EditDriverScreenProps> = ({
  driver,
  onBack,
  onSuccess,
}) => {
  const updateDriver = useDriverStore((state) => state.updateDriver);

  const [firstName, setFirstName] = useState(driver.first_name || "");
  const [lastName, setLastName] = useState(driver.last_name || "");
  const [transporterId, setTransporterId] = useState((driver.transporter_id || "").replace(/^#+/, ""));
  const [selectedStations, setSelectedStations] = useState<string[]>(
    driver.stations.map((s) => s.station_code)
  );
  const [email, setEmail] = useState((driver.email || "").replace(/^#+/, ""));
  const [phone, setPhone] = useState(driver.phone || "");
  const [allowSignin, setAllowSignin] = useState(driver.allow_signin);
  const [allowInspections, setAllowInspections] = useState(driver.allow_inspections);
  const [address, setAddress] = useState(driver.address || "");
  const [dateOfBirth, setDateOfBirth] = useState(driver.date_of_birth || "");
  const [hireDate, setHireDate] = useState(driver.hire_date || "");
  const [workAnniversary, setWorkAnniversary] = useState(driver.work_anniversary || "");
  const [sameAsHireDate, setSameAsHireDate] = useState(
    driver.work_anniversary === driver.hire_date
  );
  const [status, setStatus] = useState<"active" | "inactive">(driver.status);

  // Live years completed celebratory calculation from Fleet app
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
    if (sameAsHireDate) {
      setWorkAnniversary(val);
    }
  };

  const toggleStation = (code: string) => {
    if (selectedStations.includes(code)) {
      if (selectedStations.length === 1) {
        setErrors((prev) => ({ ...prev, stations: "At least one station is required" }));
        return;
      }
      setSelectedStations(selectedStations.filter((s) => s !== code));
    } else {
      setSelectedStations([...selectedStations, code]);
      setErrors((prev) => ({ ...prev, stations: "" }));
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fnRes = validateDriverNamePart(firstName, "First Name");
    const lnRes = validateDriverNamePart(lastName, "Last Name");
    const tidRes = validateTransporterId(transporterId);
    const emailRes = validateDriverEmail(email);
    const phoneRes = validateDriverPhone(phone);
    const dobRes = validateDriverDob(dateOfBirth);
    const hireRes = validateDriverHireDate(hireDate);
    const annivRes = validateDriverAnniversary(workAnniversary || hireDate, hireDate);
    const stationsRes = validateDriverStations(selectedStations);

    const newErrors: Record<string, string> = {};
    if (!fnRes.isValid) newErrors.firstName = fnRes.error;
    if (!lnRes.isValid) newErrors.lastName = lnRes.error;
    if (!tidRes.isValid) newErrors.transporterId = tidRes.error;
    if (!emailRes.isValid) newErrors.email = emailRes.error;
    if (!phoneRes.isValid) newErrors.phone = phoneRes.error;
    if (!dobRes.isValid) newErrors.dateOfBirth = dobRes.error;
    if (!hireRes.isValid) newErrors.hireDate = hireRes.error;
    if (!annivRes.isValid) newErrors.workAnniversary = annivRes.error;
    if (!stationsRes.isValid) newErrors.stations = stationsRes.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedFields: Partial<Driver> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        title: "",
        transporter_id: transporterId.replace(/^#+/, "").trim().toUpperCase(),
        email: email.replace(/^#+/, "").trim().toLowerCase(),
        phone: phone.replace(/\D/g, ""),
        address: address.trim(),
        hire_date: hireDate,
        date_of_birth: dateOfBirth,
        work_anniversary: workAnniversary || hireDate,
        stations: selectedStations.map((code) => ({ station_code: code })),
        allow_signin: allowSignin,
        allow_inspections: allowSignin ? allowInspections : false,
        status,
      };

      updateDriver(driver.id, updatedFields);
      onSuccess({ ...driver, ...updatedFields } as Driver);
    } catch {
      setErrors({ form: "Failed to update driver details. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-driver-screen-container">
      {/* Screen Header with Back Button and Quick Action Buttons */}
      <div className="screen-nav-header">
        <div className="screen-nav-left">
          <button
            type="button"
            className="back-btn"
            onClick={onBack}
            title="Back to All Drivers"
          >
            <ArrowLeft size={16} />
            <span>Back to Drivers</span>
          </button>
          <div className="screen-title-divider" />
          <h2 className="screen-heading">Edit Driver: {driver.name}</h2>
        </div>

        <div className="screen-nav-right" style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn-blue-outline btn-sm"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-blue-primary btn-sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Screen Card Body with Full Fleet App Details */}
      <div className="add-driver-card">
        <form onSubmit={handleSubmit} className="add-driver-form">
          {errors.form && (
            <div className="modal-error-alert">
              <AlertCircle size={15} />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Row 1: First Name & Last Name (Responsive 2-column grid, Title/Mr/Mrs removed) */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="input-label">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`styled-input ${errors.firstName ? "has-error" : ""}`}
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: "" }));
                }}
              />
              {errors.firstName && <span className="field-error-text">{errors.firstName}</span>}
            </div>

            <div className="form-field-group">
              <label className="input-label">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`styled-input ${errors.lastName ? "has-error" : ""}`}
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: "" }));
                }}
              />
              {errors.lastName && <span className="field-error-text">{errors.lastName}</span>}
            </div>
          </div>

          {/* Row 2: Transporter ID, Station Code */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="input-label">
                Transporter ID <span className="text-red-500">*</span>
              </label>
              <div className={`input-field-wrap ${errors.transporterId ? "has-error" : ""}`}>
                <CreditCard size={14} className="input-icon text-blue-600" />
                <input
                  type="text"
                  className="styled-input"
                  value={transporterId}
                  onChange={(e) => {
                    setTransporterId(e.target.value.replace(/^#+/, "").toUpperCase());
                    if (errors.transporterId) setErrors((prev) => ({ ...prev, transporterId: "" }));
                  }}
                />
              </div>
              {errors.transporterId && <span className="field-error-text">{errors.transporterId}</span>}
            </div>

            <div className="form-field-group">
              <label className="input-label">
                Station Code <span className="text-red-500">*</span>
              </label>
              <div className="station-checkboxes-row">
                {AVAILABLE_STATIONS.map((st) => {
                  const isChecked = selectedStations.includes(st.code);
                  return (
                    <button
                      key={st.code}
                      type="button"
                      className={`station-select-chip ${isChecked ? "active" : ""}`}
                      onClick={() => toggleStation(st.code)}
                    >
                      <div className="chip-check-icon">
                        {isChecked ? <Check size={12} /> : null}
                      </div>
                      <div className="chip-text-group">
                        <span className="chip-station-code">{st.code}</span>
                        <span className="chip-station-name">{st.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.stations && <span className="field-error-text">{errors.stations}</span>}
            </div>
          </div>

          {/* Row 3: Email ID, Phone Number */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="input-label">
                Email ID <span className="text-red-500">*</span>
              </label>
              <div className={`input-field-wrap ${errors.email ? "has-error" : ""}`}>
                <Mail size={14} className="input-icon text-blue-600" />
                <input
                  type="email"
                  className="styled-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.replace(/^#+/, ""));
                    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                />
              </div>
              {errors.email && <span className="field-error-text">{errors.email}</span>}
            </div>

            <div className="form-field-group">
              <label className="input-label">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className={`input-field-wrap ${errors.phone ? "has-error" : ""}`}>
                <Phone size={14} className="input-icon text-blue-600" />
                <span className="phone-prefix">US +1</span>
                <input
                  type="tel"
                  className="styled-input"
                  value={formatDriverPhone(phone)}
                  maxLength={14}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setPhone(digits);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                />
              </div>
              {errors.phone && <span className="field-error-text">{errors.phone}</span>}
            </div>
          </div>

          {/* Row 4: Driver Sign In & Driver Inspection toggles */}
          <div className="permissions-toggle-grid">
            <div className="perm-toggle-cell">
              <div className="perm-text-wrap">
                <span className="perm-title">Driver Sign In</span>
                <span className="perm-desc">Permit driver to login to mobile app</span>
              </div>
              <label className="custom-blue-switch">
                <input
                  type="checkbox"
                  checked={allowSignin}
                  onChange={handleAllowSigninToggle}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="perm-toggle-cell">
              <div className="perm-text-wrap">
                <span className="perm-title">Driver Inspection</span>
                <span className="perm-desc">
                  {!allowSignin ? "Enable Driver Sign-in to Access Inspection" : "Daily DVIC inspections access"}
                </span>
              </div>
              <label className="custom-blue-switch">
                <input
                  type="checkbox"
                  checked={allowInspections}
                  disabled={!allowSignin}
                  onChange={() => setAllowInspections(!allowInspections)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>

          {/* Row 5: Address */}
          <div className="form-field-group">
            <label className="input-label">Address</label>
            <div className="input-field-wrap text-area-wrap">
              <MapPin size={14} className="input-icon text-blue-600" style={{ marginTop: "0.6rem" }} />
              <textarea
                className="styled-input styled-textarea"
                rows={2}
                placeholder="Add address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: Birthdate & Hire Date */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="input-label">
                Birthdate <span className="text-red-500">*</span>
              </label>
              <div className={`input-field-wrap ${errors.dateOfBirth ? "has-error" : ""}`}>
                <Calendar size={14} className="input-icon text-blue-600" />
                <input
                  type="date"
                  className="styled-input date-input"
                  value={dateOfBirth}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
                  }}
                />
              </div>
              {errors.dateOfBirth && <span className="field-error-text">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-field-group">
              <label className="input-label">
                Hire Date <span className="text-red-500">*</span>
              </label>
              <div className={`input-field-wrap ${errors.hireDate ? "has-error" : ""}`}>
                <Calendar size={14} className="input-icon text-blue-600" />
                <input
                  type="date"
                  className="styled-input date-input"
                  value={hireDate}
                  onChange={(e) => {
                    handleHireDateChange(e.target.value);
                    if (errors.hireDate) setErrors((prev) => ({ ...prev, hireDate: "" }));
                  }}
                />
              </div>
              {errors.hireDate && <span className="field-error-text">{errors.hireDate}</span>}
            </div>
          </div>

          {/* Row 7: Work Anniversary Date with Same as Hire checkbox & Celebration Badge */}
          <div className="form-field-group">
            <div className="anniversary-label-row">
              <label className="input-label">Work Anniversary Date</label>
              <div className="anniversary-right-meta">
                <label className="same-hire-checkbox">
                  <input
                    type="checkbox"
                    checked={sameAsHireDate}
                    onChange={(e) => {
                      setSameAsHireDate(e.target.checked);
                      if (e.target.checked && hireDate) {
                        setWorkAnniversary(hireDate);
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
            <div className={`input-field-wrap ${errors.workAnniversary ? "has-error" : ""}`}>
              <Calendar size={14} className="input-icon text-blue-600" />
              <input
                type="date"
                className="styled-input date-input"
                disabled={sameAsHireDate}
                value={workAnniversary}
                onChange={(e) => {
                  setWorkAnniversary(e.target.value);
                  if (errors.workAnniversary) setErrors((prev) => ({ ...prev, workAnniversary: "" }));
                }}
              />
            </div>
            {errors.workAnniversary && <span className="field-error-text">{errors.workAnniversary}</span>}
          </div>

          {/* Row 8: Status */}
          <div className="form-field-group">
            <label className="input-label">Status</label>
            <select
              className="styled-input select-styled"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Screen Bottom Action Buttons */}
          <div className="form-actions-footer" style={{ display: "flex", gap: "0.85rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button
              type="button"
              className="btn-blue-outline btn-sm"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-blue-primary btn-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDriverScreen;
