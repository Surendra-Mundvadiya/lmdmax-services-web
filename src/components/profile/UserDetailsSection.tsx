import React, { FC } from "react";
import { Mail, Phone, ShieldCheck, User, Lock, Edit3, Save, X } from "lucide-react";
import type { ProfileFormState, ProfileData } from "../../types/profile";
import { validatePhoneNumber, formatPhoneNumber } from "../../utils/validators";
import LoadingSpinner from "../common/LoadingSpinner";

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-material-thick)",
  backdropFilter: "var(--ads-blur-md)",
  WebkitBackdropFilter: "var(--ads-blur-md)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-lg)",
  boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
};

const sectionHeaderStyle: React.CSSProperties = {
  borderBottom: "1px solid var(--ads-hairline)",
};

const sectionIconBoxStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-blue-tint)",
  border: "1px solid transparent",
  color: "var(--ads-blue)",
  borderRadius: "var(--ads-r-sm)",
};

const sectionHeadingStyle: React.CSSProperties = {
  color: "var(--ads-ink)",
  letterSpacing: "-0.015em",
};

const fieldLabelStyle: React.CSSProperties = {
  color: "var(--ads-ink-secondary)",
};

const readonlyCellStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-canvas)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-sm)",
  color: "var(--ads-ink)",
};

const inputWrapStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-material-thick)",
  borderRadius: "var(--ads-r-sm)",
};

const cellInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  boxShadow: "none",
  color: "var(--ads-ink)",
  borderRadius: 0,
};

const cellIconStyle: React.CSSProperties = {
  color: "var(--ads-blue)",
  flexShrink: 0,
};

const cellValueStyle: React.CSSProperties = {
  color: "var(--ads-ink)",
  letterSpacing: "-0.01em",
};

const pillBlueStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-blue-tint)",
  color: "var(--ads-blue)",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-pill)",
};

const pillGoldStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-amber-tint)",
  color: "var(--ads-amber)",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-pill)",
};

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
    <section className="profile-section-card" style={sectionCardStyle}>
      <div className="section-card-header flex-between" style={sectionHeaderStyle}>
        <div className="section-header-title-wrap">
          <div className="section-header-icon-box" style={sectionIconBoxStyle}>
            <User size={15} style={{ color: "var(--ads-blue)" }} />
          </div>
          <h2 className="section-card-heading" style={sectionHeadingStyle}>
            User Details
          </h2>
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
          <label className="field-cell-label" style={fieldLabelStyle}>
            Email Address
          </label>
          <div className="field-cell-readonly" style={readonlyCellStyle}>
            <Mail className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
            <span className="cell-value-text" style={cellValueStyle}>
              {email}
            </span>
            <span className="pill-badge pill-blue" style={pillBlueStyle}>
              Primary
            </span>
          </div>
        </div>

        {/* Mobile Number */}
        <div className="profile-field-cell">
          <label
            htmlFor="user_phone_input"
            className="field-cell-label"
            style={fieldLabelStyle}
          >
            Mobile Number{" "}
            {isEditing && (
              <span className="text-red-500" style={{ color: "var(--ads-red)" }}>
                *
              </span>
            )}
          </label>
          {isEditing && formState ? (
            <div
              className={`field-cell-input-wrap ${
                formState.phoneNumber.error ? "input-has-error" : ""
              }`}
              style={inputWrapStyle}
            >
              <Phone className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <input
                id="user_phone_input"
                type="tel"
                className="cell-text-input"
                style={cellInputStyle}
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
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <Phone className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>
                {profileData.phone ? formatPhoneNumber(profileData.phone) : "Not provided"}
              </span>
            </div>
          )}
          {isEditing && formState?.phoneNumber.error && (
            <span
              className="cell-error-feedback"
              style={{ color: "var(--ads-red)" }}
            >
              {formState.phoneNumber.helperText}
            </span>
          )}
        </div>

        {/* Account Role */}
        <div className="profile-field-cell">
          <label className="field-cell-label" style={fieldLabelStyle}>
            Account Role
          </label>
          <div className="field-cell-readonly" style={readonlyCellStyle}>
            <ShieldCheck className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
            <span className="cell-value-text" style={cellValueStyle}>
              {role}
            </span>
            <span className="pill-badge pill-gold" style={pillGoldStyle}>
              {role}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserDetailsSection;
