import React, { FC, useState } from "react";
import { X, Eye, EyeOff, Shield, Building, Phone, Mail, User } from "lucide-react";
import type { AdminRole, AdminFormValues } from "../../../types/admin";
import { useAdminStore } from "../../../store/adminStore";
import { AVAILABLE_STATIONS } from "../../../store/driverStore";
import { validateEmail, validatePhoneNumber } from "../../../utils/validators";

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminName: string) => void;
}

export const AddAdminModal: FC<AddAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const addAdmin = useAdminStore((state) => state.addAdmin);

  const [formValues, setFormValues] = useState<AdminFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "dispatcher",
    stations: ["DDF4"],
    password: "",
    confirmPassword: "",
    allow_login: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const handleStationToggle = (code: string) => {
    setFormValues((prev) => {
      const exists = prev.stations.includes(code);
      if (exists) {
        if (prev.stations.length === 1) return prev; // Keep at least one station
        return { ...prev, stations: prev.stations.filter((s) => s !== code) };
      }
      return { ...prev, stations: [...prev.stations, code] };
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formValues.firstName.trim()) errs.firstName = "First name is required";
    if (!formValues.lastName.trim()) errs.lastName = "Last name is required";

    if (!formValues.email.trim()) {
      errs.email = "Email address is required";
    } else if (!validateEmail(formValues.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    const cleanPhone = formValues.phone.replace(/\D/g, "");
    if (!cleanPhone) {
      errs.phone = "Phone number is required";
    } else if (!validatePhoneNumber(cleanPhone)) {
      errs.phone = "Please enter a valid 10-digit US phone number";
    }

    if (!formValues.password) {
      errs.password = "Password is required";
    } else if (formValues.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    if (formValues.password !== formValues.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (formValues.stations.length === 0) {
      errs.stations = "Please assign at least one delivery station";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newAdmin = addAdmin(formValues);
    onSuccess(newAdmin.name);
    onClose();
  };

  return (
    <div className="custom-modal-overlay ads-admin-modal-overlay">
      <div className="custom-modal-dialog max-w-xl ads-admin-modal">
        {/* Modal Header */}
        <div className="custom-modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="custom-modal-title">Add Administrator</h3>
              <p className="text-xs text-slate-500">
                Register a new dispatcher, station admin, or safety coordinator
              </p>
            </div>
          </div>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="custom-modal-body">
          {/* Row 1: Name */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="field-label">First Name *</label>
              <div className="field-input-wrap">
                <input
                  type="text"
                  className={`field-text-input ${errors.firstName ? "input-error" : ""}`}
                  placeholder="e.g. Marcus"
                  value={formValues.firstName}
                  onChange={(e) => {
                    setFormValues({ ...formValues, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: "" });
                  }}
                />
              </div>
              {errors.firstName && <span className="field-error-text">{errors.firstName}</span>}
            </div>

            <div className="form-field-group">
              <label className="field-label">Last Name *</label>
              <div className="field-input-wrap">
                <input
                  type="text"
                  className={`field-text-input ${errors.lastName ? "input-error" : ""}`}
                  placeholder="e.g. Sterling"
                  value={formValues.lastName}
                  onChange={(e) => {
                    setFormValues({ ...formValues, lastName: e.target.value });
                    if (errors.lastName) setErrors({ ...errors, lastName: "" });
                  }}
                />
              </div>
              {errors.lastName && <span className="field-error-text">{errors.lastName}</span>}
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="field-label">Email Address *</label>
              <div className="field-input-wrap">
                <input
                  type="email"
                  className={`field-text-input ${errors.email ? "input-error" : ""}`}
                  placeholder="dispatcher@lmdmaxops.com"
                  value={formValues.email}
                  onChange={(e) => {
                    setFormValues({ ...formValues, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                />
              </div>
              {errors.email && <span className="field-error-text">{errors.email}</span>}
            </div>

            <div className="form-field-group">
              <label className="field-label">Phone Number *</label>
              <div className="field-input-wrap">
                <input
                  type="tel"
                  className={`field-text-input ${errors.phone ? "input-error" : ""}`}
                  placeholder="(214) 555-0100"
                  value={formValues.phone}
                  onChange={(e) => {
                    setFormValues({ ...formValues, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: "" });
                  }}
                />
              </div>
              {errors.phone && <span className="field-error-text">{errors.phone}</span>}
            </div>
          </div>

          {/* Row 3: Role Selection */}
          <div className="form-field-group">
            <label className="field-label">Admin Role *</label>
            <select
              className="field-text-input cursor-pointer"
              value={formValues.role}
              onChange={(e) =>
                setFormValues({ ...formValues, role: e.target.value as AdminRole })
              }
            >
              <option value="dispatcher">Lead Dispatcher (RTS & Route Operations)</option>
              <option value="station_admin">Station Admin (Hub Level Management)</option>
              <option value="safety_coordinator">Safety Coordinator (DVIC & Audits)</option>
              <option value="manager">Operations Manager (Full DSP Scope)</option>
            </select>
          </div>

          {/* Row 4: Assigned Delivery Stations */}
          <div className="form-field-group">
            <label className="field-label">Assigned Delivery Stations *</label>
            <div className="station-checkboxes-row">
              {AVAILABLE_STATIONS.map((st) => {
                const isSelected = formValues.stations.includes(st.code);
                return (
                  <button
                    key={st.code}
                    type="button"
                    className={`station-select-chip-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => handleStationToggle(st.code)}
                  >
                    <Building size={13} />
                    <span>{st.code}</span>
                  </button>
                );
              })}
            </div>
            {errors.stations && <span className="field-error-text">{errors.stations}</span>}
          </div>

          {/* Row 5: Password & Confirm Password */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="field-label">Initial Password *</label>
              <div className="field-input-wrap relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`field-text-input pr-8 ${errors.password ? "input-error" : ""}`}
                  placeholder="Min 6 characters"
                  value={formValues.password}
                  onChange={(e) => {
                    setFormValues({ ...formValues, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <span className="field-error-text">{errors.password}</span>}
            </div>

            <div className="form-field-group">
              <label className="field-label">Confirm Password *</label>
              <div className="field-input-wrap relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`field-text-input pr-8 ${errors.confirmPassword ? "input-error" : ""}`}
                  placeholder="Repeat password"
                  value={formValues.confirmPassword}
                  onChange={(e) => {
                    setFormValues({ ...formValues, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="field-error-text">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Row 6: Allow Login Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Allow System Login Access
              </span>
              <span className="text-xs text-slate-500">
                Grants access to web portal and RTS dispatcher features
              </span>
            </div>
            <label className="custom-blue-switch">
              <input
                type="checkbox"
                checked={formValues.allow_login}
                onChange={(e) =>
                  setFormValues({ ...formValues, allow_login: e.target.checked })
                }
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Modal Footer with strict 0.85rem button gap */}
          <div className="modal-footer" style={{ display: "flex", gap: "var(--ads-s3)", justifyContent: "flex-end", marginTop: "var(--ads-s4)" }}>
            <button
              type="button"
              className="btn-outline-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-blue-primary"
            >
              Add Administrator
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdminModal;
