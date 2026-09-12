import React, { FC } from "react";
import {
  Building2,
  User,
  PhoneCall,
  Radio,
  FileText,
  Hash,
  MapPin,
  Smartphone,
  Globe,
  Clock,
} from "lucide-react";
import type { ProfileFormState, ProfileData } from "../../types/profile";
import {
  validateName,
  validatePhoneNumber,
  validateZipCode,
  validateStationCode,
  formatPhoneNumber,
} from "../../utils/validators";

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

const errorTextStyle: React.CSSProperties = {
  color: "var(--ads-red)",
};

const pillBlueStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-blue-tint)",
  color: "var(--ads-blue)",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-pill)",
};

const pillGreenStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-green-tint)",
  color: "var(--ads-green)",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-pill)",
};

const pillSlateStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-canvas)",
  color: "var(--ads-ink-tertiary)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-pill)",
};

const countrySelectStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-material-thick)",
  borderRadius: "var(--ads-r-sm)",
  color: "var(--ads-ink)",
};

interface CompanyDetailsSectionProps {
  isEditing: boolean;
  isOwner: boolean;
  profileData: ProfileData;
  formState: ProfileFormState | null;
  onFieldChange: (
    field: keyof ProfileFormState,
    value: string | boolean
  ) => void;
  onFieldError: (field: keyof ProfileFormState, error: string) => void;
}

export const CompanyDetailsSection: FC<CompanyDetailsSectionProps> = ({
  isEditing,
  isOwner,
  profileData,
  formState,
  onFieldChange,
  onFieldError,
}) => {
  const company = profileData.company || {};

  return (
    <section className="profile-section-card" style={sectionCardStyle}>
      <div className="section-card-header" style={sectionHeaderStyle}>
        <div className="section-header-title-wrap">
          <div className="section-header-icon-box" style={sectionIconBoxStyle}>
            <Building2 size={15} style={{ color: "var(--ads-blue)" }} />
          </div>
          <h2 className="section-card-heading" style={sectionHeadingStyle}>
            Company Details
          </h2>
        </div>
      </div>

      {/* 2-Column Responsive Field Grid */}
      <div className="profile-fields-grid-2col">
        {/* Company Name */}
        <div className="profile-field-cell">
          <label htmlFor="comp_name_field" className="field-cell-label" style={fieldLabelStyle}>
            Company Name {isEditing && isOwner && <span className="text-red-500" style={{ color: "var(--ads-red)" }}>*</span>}
          </label>
          {isEditing && isOwner && formState ? (
            <div
              className={`field-cell-input-wrap ${
                formState.companyName.error ? "input-has-error" : ""
              }`}
              style={inputWrapStyle}
            >
              <Building2 className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <input
                id="comp_name_field"
                type="text"
                className="cell-text-input"
                style={cellInputStyle}
                placeholder="DSP Company Name"
                value={formState.companyName.value}
                onChange={(e) => {
                  onFieldChange("companyName", e.target.value);
                  const res = validateName(e.target.value, "Company Name", 2, 60);
                  onFieldError("companyName", res.isValid ? "" : res.error);
                }}
              />
            </div>
          ) : (
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <Building2 className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>
                {company.company_name || "LMDmax Staging Operations"}
              </span>
            </div>
          )}
          {isEditing && formState?.companyName.error && (
            <span className="cell-error-feedback" style={errorTextStyle}>
              {formState.companyName.helperText}
            </span>
          )}
        </div>

        {/* DSP Short Code */}
        <div className="profile-field-cell">
          <label className="field-cell-label" style={fieldLabelStyle}>DSP Short Code</label>
          <div className="field-cell-readonly" style={readonlyCellStyle}>
            <Hash className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
            <span className="cell-value-text" style={cellValueStyle}>
              {company.dsp_short_code || "—"}
            </span>
            <span className="pill-badge pill-slate" style={pillSlateStyle}>Read-Only</span>
          </div>
        </div>

        {/* Owner Name */}
        <div className="profile-field-cell">
          <label htmlFor="owner_name_field" className="field-cell-label" style={fieldLabelStyle}>
            Owner Name {isEditing && isOwner && <span className="text-red-500" style={{ color: "var(--ads-red)" }}>*</span>}
          </label>
          {isEditing && isOwner && formState ? (
            <div
              className={`field-cell-input-wrap ${
                formState.ownerName.error ? "input-has-error" : ""
              }`}
              style={inputWrapStyle}
            >
              <User className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <input
                id="owner_name_field"
                type="text"
                className="cell-text-input"
                style={cellInputStyle}
                placeholder="Owner Full Name"
                value={formState.ownerName.value}
                onChange={(e) => {
                  onFieldChange("ownerName", e.target.value);
                  const res = validateName(e.target.value, "Owner Name", 2, 50);
                  onFieldError("ownerName", res.isValid ? "" : res.error);
                }}
              />
            </div>
          ) : (
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <User className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>
                {company.owner_name || "—"}
              </span>
            </div>
          )}
          {isEditing && formState?.ownerName.error && (
            <span className="cell-error-feedback" style={errorTextStyle}>
              {formState.ownerName.helperText}
            </span>
          )}
        </div>

        {/* Delivery Station Code */}
        <div className="profile-field-cell">
          <label htmlFor="station_code_field" className="field-cell-label" style={fieldLabelStyle}>
            Station Code
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap" style={inputWrapStyle}>
              <MapPin className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <input
                id="station_code_field"
                type="text"
                className="cell-text-input uppercase"
                style={{ ...cellInputStyle, textTransform: "uppercase" }}
                placeholder="e.g. DDF4"
                maxLength={6}
                value={formState.stationCode.value}
                onChange={(e) =>
                  onFieldChange("stationCode", e.target.value.toUpperCase())
                }
              />
            </div>
          ) : (
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <MapPin className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>
                {company.station_code || "—"}
              </span>
              <span className="pill-badge pill-blue" style={pillBlueStyle}>Primary</span>
            </div>
          )}
        </div>

        {/* Street Address - Spans full width */}
        <div className="profile-field-cell col-span-2">
          <label htmlFor="address_field" className="field-cell-label" style={fieldLabelStyle}>
            Station Address
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap" style={inputWrapStyle}>
              <MapPin className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <input
                id="address_field"
                type="text"
                className="cell-text-input"
                style={cellInputStyle}
                placeholder="100 Express Way, Suite 400"
                value={formState.address.value}
                onChange={(e) => onFieldChange("address", e.target.value)}
              />
            </div>
          ) : (
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <MapPin className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>
                {company.address || "—"}
              </span>
            </div>
          )}
        </div>

        {/* Postal Zip Code */}
        <div className="profile-field-cell">
          <label htmlFor="zipcode_field" className="field-cell-label" style={fieldLabelStyle}>
            Zip Code
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap" style={inputWrapStyle}>
              <Hash className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <input
                id="zipcode_field"
                type="text"
                className="cell-text-input"
                style={cellInputStyle}
                placeholder="75001"
                maxLength={5}
                value={formState.zipCode.value}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 5);
                  onFieldChange("zipCode", digits);
                }}
              />
            </div>
          ) : (
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <Hash className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>{company.zipcode || "—"}</span>
            </div>
          )}
        </div>

        {/* Operational Timezone */}
        <div className="profile-field-cell">
          <label
            htmlFor="timezone_field"
            className="field-cell-label"
            style={fieldLabelStyle}
          >
            Timezone
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap" style={inputWrapStyle}>
              <Clock className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <select
                id="timezone_field"
                className="cell-text-input cursor-pointer"
                style={{ ...cellInputStyle, cursor: "pointer" }}
                value={formState.timezone.value}
                onChange={(e) => onFieldChange("timezone", e.target.value)}
              >
                <option value="America/Chicago (CST)">America/Chicago (Central)</option>
                <option value="America/New_York (EST)">America/New_York (Eastern)</option>
                <option value="America/Denver (MST)">America/Denver (Mountain)</option>
                <option value="America/Los_Angeles (PST)">America/Los_Angeles (Pacific)</option>
                <option value="America/Phoenix (MST)">America/Phoenix (Arizona)</option>
              </select>
            </div>
          ) : (
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <Clock className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>
                {company.timezone || "—"}
              </span>
            </div>
          )}
        </div>

        {/* Primary Twilio Number */}
        <div className="profile-field-cell">
          <label className="field-cell-label" style={fieldLabelStyle}>Primary Twilio Number</label>
          <div className="field-cell-readonly" style={readonlyCellStyle}>
            <Smartphone className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
            <span className="cell-value-text" style={cellValueStyle}>
              {company.performance_twilio_number || "—"}
            </span>
            <span className="pill-badge pill-green" style={pillGreenStyle}>Active</span>
          </div>
        </div>

        {/* Secondary Twilio Number */}
        <div className="profile-field-cell">
          <label className="field-cell-label" style={fieldLabelStyle}>Secondary Twilio Number</label>
          <div className="field-cell-readonly" style={readonlyCellStyle}>
            <Smartphone className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
            <span className="cell-value-text" style={cellValueStyle}>
              {company.secondary_twilio_number || "—"}
            </span>
            <span className="pill-badge pill-green" style={pillGreenStyle}>Active</span>
          </div>
        </div>

        {/* PAIR 1: Netradyne Code & Netradyne Messaging */}
        <div className="profile-field-cell">
          <label htmlFor="netradyne_field" className="field-cell-label" style={fieldLabelStyle}>
            Netradyne Code
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap" style={inputWrapStyle}>
              <FileText className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <input
                id="netradyne_field"
                type="text"
                className="cell-text-input"
                style={cellInputStyle}
                placeholder="e.g. LMD_NET_44"
                value={formState.netradyneCustomerName.value}
                onChange={(e) =>
                  onFieldChange("netradyneCustomerName", e.target.value)
                }
              />
            </div>
          ) : (
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <FileText className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>
                {company.netradyne_customer_name || "—"}
              </span>
              <span className="pill-badge pill-blue" style={pillBlueStyle}>Synced</span>
            </div>
          )}
        </div>

        <div className="profile-field-cell">
          <label className="field-cell-label" style={fieldLabelStyle}>Netradyne Messaging</label>
          <div className="field-cell-readonly flex-between" style={readonlyCellStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Radio className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>Auto Coaching Messages</span>
            </div>
            {isEditing && isOwner && formState ? (
              <label className="custom-blue-switch" title="Toggle Netradyne Auto Coaching Messaging">
                <input
                  type="checkbox"
                  aria-label="Toggle Netradyne auto coaching messaging"
                  checked={formState.autoCoachingEnable.value}
                  onChange={(e) =>
                    onFieldChange("autoCoachingEnable", e.target.checked)
                  }
                />
                <span
                  className="switch-slider"
                  style={{
                    backgroundColor: formState.autoCoachingEnable.value
                      ? "var(--ads-blue)"
                      : "var(--ads-hairline-strong)",
                    borderRadius: "var(--ads-r-pill)",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease)",
                  }}
                />
              </label>
            ) : (
              <span
                className={`pill-badge ${
                  company.auto_coaching_enable ? "pill-blue" : "pill-slate"
                }`}
                style={
                  company.auto_coaching_enable ? pillBlueStyle : pillSlateStyle
                }
              >
                {company.auto_coaching_enable ? "Active" : "Disabled"}
              </span>
            )}
          </div>
        </div>

        {/* PAIR 2: Call Forwarding Number & Enable Call */}
        <div className="profile-field-cell">
          <label htmlFor="call_forwarding_input" className="field-cell-label" style={fieldLabelStyle}>
            Call Forwarding Number
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-composite-row">
              <select
                className="country-prefix-select"
                style={countrySelectStyle}
                aria-label="Call forwarding country code"
                value={formState.callForwardingCountryCode.value}
                onChange={(e) =>
                  onFieldChange("callForwardingCountryCode", e.target.value)
                }
              >
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (CA)</option>
              </select>
              <div
                className={`field-cell-input-wrap flex-1 ${
                  formState.callForwardingNo.error ? "input-has-error" : ""
                }`}
                style={inputWrapStyle}
              >
                <PhoneCall className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
                <input
                  id="call_forwarding_input"
                  type="tel"
                    className="cell-text-input"
                  style={cellInputStyle}
                  placeholder="10-digit number"
                  value={formState.callForwardingNo.value}
                  maxLength={10}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    onFieldChange("callForwardingNo", digits);
                    if (digits.length > 0 && digits.length !== 10) {
                      onFieldError("callForwardingNo", "Must be 10 digits");
                    } else {
                      onFieldError("callForwardingNo", "");
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="field-cell-readonly" style={readonlyCellStyle}>
              <PhoneCall className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>
                {company.forward_call_number || "—"}
              </span>
            </div>
          )}
          {isEditing && formState?.callForwardingNo.error && (
            <span className="cell-error-feedback" style={errorTextStyle}>
              {formState.callForwardingNo.helperText}
            </span>
          )}
        </div>

        <div className="profile-field-cell">
          <label className="field-cell-label" style={fieldLabelStyle}>Enable Call Forwarding</label>
          <div className="field-cell-readonly flex-between" style={readonlyCellStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PhoneCall className="cell-icon text-blue-600" size={14} style={cellIconStyle} />
              <span className="cell-value-text" style={cellValueStyle}>Forward Inbound Calls</span>
            </div>
            {isEditing && isOwner && formState ? (
              <label className="custom-blue-switch" title="Enable Inbound Call Forwarding">
                <input
                  type="checkbox"
                  aria-label="Enable inbound call forwarding"
                  checked={formState.callForwarding.value}
                  onChange={(e) =>
                    onFieldChange("callForwarding", e.target.checked)
                  }
                />
                <span
                  className="switch-slider"
                  style={{
                    backgroundColor: formState.callForwarding.value
                      ? "var(--ads-blue)"
                      : "var(--ads-hairline-strong)",
                    borderRadius: "var(--ads-r-pill)",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease)",
                  }}
                />
              </label>
            ) : (
              <span
                className={`pill-badge ${
                  company.forward_call_enable ? "pill-blue" : "pill-slate"
                }`}
                style={
                  company.forward_call_enable ? pillBlueStyle : pillSlateStyle
                }
              >
                {company.forward_call_enable ? "Active" : "Disabled"}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyDetailsSection;
