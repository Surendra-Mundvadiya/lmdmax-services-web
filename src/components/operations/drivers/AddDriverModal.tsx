import React, { FC, useState } from "react";
import {
  X,
  UserPlus,
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

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (driver: Driver) => void;
}

export const AddDriverModal: FC<AddDriverModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const addDriver = useDriverStore((state) => state.addDriver);
  const selectedStationFilter = useDriverStore((state) => state.selectedStationFilter);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [workAnniversary, setWorkAnniversary] = useState("");
  const [sameAsHireDate, setSameAsHireDate] = useState(true);

  // Initial station selection: default to active filter or DDF4
  const defaultStation = selectedStationFilter !== "ALL" ? selectedStationFilter : "DDF4";
  const [selectedStations, setSelectedStations] = useState<string[]>([defaultStation]);

  const [allowSignin, setAllowSignin] = useState(true);
  const [allowInspections, setAllowInspections] = useState(true);
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // Field errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Standard field validations
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
      const created = addDriver({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
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
      });

      onSuccess(created);
      onClose();
    } catch {
      setErrors({ form: "Failed to create driver record. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="modal-dialog driver-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Simple & Clean */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="section-header-icon-box">
              <UserPlus size={16} />
            </div>
            <h3 className="modal-title">Add Driver</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body - Compact & Clean */}
        <form onSubmit={handleSubmit} className="modal-form driver-modal-form">
          {errors.form && (
            <div className="modal-error-alert">
              <AlertCircle size={15} />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Row 1: First Name, Last Name */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="input-label">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`styled-input ${errors.firstName ? "has-error" : ""}`}
                placeholder="First name"
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
                placeholder="Last name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: "" }));
                }}
              />
              {errors.lastName && <span className="field-error-text">{errors.lastName}</span>}
            </div>
          </div>

          {/* Row 2: Transporter ID, Email, Phone */}
          <div className="form-grid-3">
            <div className="form-field-group">
              <label className="input-label">
                Transporter ID <span className="text-red-500">*</span>
              </label>
              <div className={`input-field-wrap ${errors.transporterId ? "has-error" : ""}`}>
                <CreditCard size={14} className="input-icon text-blue-600" />
                <input
                  type="text"
                  className="styled-input"
                  placeholder="XXXXXXXXXXXXXX"
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
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className={`input-field-wrap ${errors.email ? "has-error" : ""}`}>
                <Mail size={14} className="input-icon text-blue-600" />
                <input
                  type="email"
                  className="styled-input"
                  placeholder="abc@xyz.com"
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
                <span className="phone-prefix">+1</span>
                <input
                  type="tel"
                  className="styled-input"
                  placeholder="(555) 000-0000"
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

          {/* Row 3: Residential Address, Date of Birth, Hire Date */}
          <div className="form-grid-3">
            <div className="form-field-group">
              <label className="input-label">Residential Address</label>
              <div className="input-field-wrap">
                <MapPin size={14} className="input-icon text-blue-600" />
                <input
                  type="text"
                  className="styled-input"
                  placeholder="Address, City, State ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="input-label">
                Date of Birth (18+) <span className="text-red-500">*</span>
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

          {/* Row 4: Work Anniversary & Status */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <div className="anniversary-label-row">
                <label className="input-label">Work Anniversary</label>
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
                  <span>Same as Hire</span>
                </label>
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
          </div>

          {/* Row 5: Stations Selection */}
          <div className="form-field-group">
            <label className="input-label">
              Stations <span className="text-red-500">*</span>
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

          {/* Row 6: App Permissions */}
          <div className="permissions-toggle-grid">
            <div className="perm-toggle-cell">
              <span className="perm-title">Driver Sign-in</span>
              <label className="custom-blue-switch">
                <input
                  type="checkbox"
                  checked={allowSignin}
                  onChange={(e) => {
                    setAllowSignin(e.target.checked);
                    if (!e.target.checked) setAllowInspections(false);
                  }}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="perm-toggle-cell">
              <span className="perm-title">Driver Inspection</span>
              <label className="custom-blue-switch">
                <input
                  type="checkbox"
                  checked={allowInspections}
                  disabled={!allowSignin}
                  onChange={(e) => setAllowInspections(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>

          {/* Modal Footer with Strict Button Spacing */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-blue-outline btn-sm"
              onClick={onClose}
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
                  <span>Adding Driver...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Add Driver</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDriverModal;
