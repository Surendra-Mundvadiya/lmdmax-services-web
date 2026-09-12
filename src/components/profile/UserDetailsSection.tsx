import React, { FC } from "react";
import { Mail, Phone, ShieldCheck, User, Lock, Edit3, Save, X } from "lucide-react";
import type { ProfileFormState, ProfileData } from "../../types/profile";
import { validatePhoneNumber, formatPhoneNumber } from "../../utils/validators";
import LoadingSpinner from "../common/LoadingSpinner";

interface UserDetailsSectionProps {
  isEditing: boolean;
  profileData: ProfileData;
  formState: ProfileFormState | null;
  onFieldChange: (field: keyof ProfileFormState, value: string | boolean) => void;
  onFieldError: (field: keyof ProfileFormState, error: string) => void;
  onChangePassword: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveChanges: () => void;
  isSaving: boolean;
}

export const UserDetailsSection: FC<UserDetailsSectionProps> = ({
  isEditing,
  profileData,
  formState,
  onFieldChange,
  onFieldError,
  onChangePassword,
  onStartEdit,
  onCancelEdit,
  onSaveChanges,
  isSaving,
}) => {
  const email = profileData?.email || "—";
  const role = (profileData?.role || "owner").toUpperCase();

  return (
    <section className="profile-section-card">
      <div className="section-card-header flex-between">
        <div className="section-header-title-wrap">
          <div className="section-header-icon-box">
            <User size={15} />
          </div>
          <h2 className="section-card-heading">User Details</h2>
        </div>

        <div className="section-header-actions">
          <button
            type="button"
            className="btn-blue-outline btn-sm"
            onClick={onChangePassword}
            title="Change Account Password"
          >
            <Lock size={13} />
            <span>Change Password</span>
          </button>

          {isEditing ? (
            <div className="edit-btn-group">
              <button
                type="button"
                className="btn-blue-outline btn-sm"
                onClick={onCancelEdit}
                disabled={isSaving}
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="btn-blue-primary btn-sm"
                onClick={onSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <Save size={14} />
                )}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-blue-primary btn-sm"
              onClick={onStartEdit}
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <div className="profile-fields-grid-3col">
        {/* Email Address */}
        <div className="profile-field-cell">
          <label className="field-cell-label">Email Address</label>
          <div className="field-cell-readonly">
            <Mail className="cell-icon text-blue-600" size={14} />
            <span className="cell-value-text">{email}</span>
            <span className="pill-badge pill-blue">Primary</span>
          </div>
        </div>

        {/* Mobile Number */}
        <div className="profile-field-cell">
          <label htmlFor="user_phone_input" className="field-cell-label">
            Mobile Number {isEditing && <span className="text-red-500">*</span>}
          </label>
          {isEditing && formState ? (
            <div
              className={`field-cell-input-wrap ${
                formState.phoneNumber.error ? "input-has-error" : ""
              }`}
            >
              <Phone className="cell-icon text-blue-600" size={14} />
              <input
                id="user_phone_input"
                type="tel"
                className="cell-text-input"
                placeholder="10-digit phone"
                value={formState.phoneNumber.value}
                maxLength={10}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  onFieldChange("phoneNumber", digits);
                  const result = validatePhoneNumber(digits);
                  onFieldError("phoneNumber", result.isValid ? "" : result.error);
                }}
              />
            </div>
          ) : (
            <div className="field-cell-readonly">
              <Phone className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">
                {profileData.phone ? formatPhoneNumber(profileData.phone) : "Not provided"}
              </span>
            </div>
          )}
          {isEditing && formState?.phoneNumber.error && (
            <span className="cell-error-feedback">{formState.phoneNumber.helperText}</span>
          )}
        </div>

        {/* Account Role */}
        <div className="profile-field-cell">
          <label className="field-cell-label">Account Role</label>
          <div className="field-cell-readonly">
            <ShieldCheck className="cell-icon text-blue-600" size={14} />
            <span className="cell-value-text">{role}</span>
            <span className="pill-badge pill-gold">{role}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserDetailsSection;
