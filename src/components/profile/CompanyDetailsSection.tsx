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
    <section className="profile-section-card">
      <div className="section-card-header">
        <div className="section-header-title-wrap">
          <div className="section-header-icon-box">
            <Building2 size={15} />
          </div>
          <h2 className="section-card-heading">Company Details</h2>
        </div>
      </div>

      {/* 2-Column Responsive Field Grid */}
      <div className="profile-fields-grid-2col">
        {/* Company Name */}
        <div className="profile-field-cell">
          <label htmlFor="comp_name_field" className="field-cell-label">
            Company Name {isEditing && isOwner && <span className="text-red-500">*</span>}
          </label>
          {isEditing && isOwner && formState ? (
            <div
              className={`field-cell-input-wrap ${
                formState.companyName.error ? "input-has-error" : ""
              }`}
            >
              <Building2 className="cell-icon text-blue-600" size={14} />
              <input
                id="comp_name_field"
                type="text"
                className="cell-text-input"
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
            <div className="field-cell-readonly">
              <Building2 className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">
                {company.company_name || "LMDmax Staging Operations"}
              </span>
            </div>
          )}
          {isEditing && formState?.companyName.error && (
            <span className="cell-error-feedback">
              {formState.companyName.helperText}
            </span>
          )}
        </div>

        {/* DSP Short Code */}
        <div className="profile-field-cell">
          <label className="field-cell-label">DSP Short Code</label>
          <div className="field-cell-readonly">
            <Hash className="cell-icon text-blue-600" size={14} />
            <span className="cell-value-text">
              {company.dsp_short_code || "—"}
            </span>
            <span className="pill-badge pill-slate">Read-Only</span>
          </div>
        </div>

        {/* Owner Name */}
        <div className="profile-field-cell">
          <label htmlFor="owner_name_field" className="field-cell-label">
            Owner Name {isEditing && isOwner && <span className="text-red-500">*</span>}
          </label>
          {isEditing && isOwner && formState ? (
            <div
              className={`field-cell-input-wrap ${
                formState.ownerName.error ? "input-has-error" : ""
              }`}
            >
              <User className="cell-icon text-blue-600" size={14} />
              <input
                id="owner_name_field"
                type="text"
                className="cell-text-input"
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
            <div className="field-cell-readonly">
              <User className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">
                {company.owner_name || "—"}
              </span>
            </div>
          )}
          {isEditing && formState?.ownerName.error && (
            <span className="cell-error-feedback">
              {formState.ownerName.helperText}
            </span>
          )}
        </div>

        {/* Delivery Station Code */}
        <div className="profile-field-cell">
          <label htmlFor="station_code_field" className="field-cell-label">
            Station Code
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap">
              <MapPin className="cell-icon text-blue-600" size={14} />
              <input
                id="station_code_field"
                type="text"
                className="cell-text-input uppercase"
                placeholder="e.g. DDF4"
                maxLength={6}
                value={formState.stationCode.value}
                onChange={(e) =>
                  onFieldChange("stationCode", e.target.value.toUpperCase())
                }
              />
            </div>
          ) : (
            <div className="field-cell-readonly">
              <MapPin className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">
                {company.station_code || "—"}
              </span>
              <span className="pill-badge pill-blue">Primary</span>
            </div>
          )}
        </div>

        {/* Street Address - Spans full width */}
        <div className="profile-field-cell col-span-2">
          <label htmlFor="address_field" className="field-cell-label">
            Station Address
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap">
              <MapPin className="cell-icon text-blue-600" size={14} />
              <input
                id="address_field"
                type="text"
                className="cell-text-input"
                placeholder="100 Express Way, Suite 400"
                value={formState.address.value}
                onChange={(e) => onFieldChange("address", e.target.value)}
              />
            </div>
          ) : (
            <div className="field-cell-readonly">
              <MapPin className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">
                {company.address || "—"}
              </span>
            </div>
          )}
        </div>

        {/* Postal Zip Code */}
        <div className="profile-field-cell">
          <label htmlFor="zipcode_field" className="field-cell-label">
            Zip Code
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap">
              <Hash className="cell-icon text-blue-600" size={14} />
              <input
                id="zipcode_field"
                type="text"
                className="cell-text-input"
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
            <div className="field-cell-readonly">
              <Hash className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">{company.zipcode || "—"}</span>
            </div>
          )}
        </div>

        {/* Operational Timezone */}
        <div className="profile-field-cell">
          <label className="field-cell-label">Timezone</label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap">
              <Clock className="cell-icon text-blue-600" size={14} />
              <select
                className="cell-text-input cursor-pointer"
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
            <div className="field-cell-readonly">
              <Clock className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">
                {company.timezone || "—"}
              </span>
            </div>
          )}
        </div>

        {/* Primary Twilio Number */}
        <div className="profile-field-cell">
          <label className="field-cell-label">Primary Twilio Number</label>
          <div className="field-cell-readonly">
            <Smartphone className="cell-icon text-blue-600" size={14} />
            <span className="cell-value-text">
              {company.performance_twilio_number || "—"}
            </span>
            <span className="pill-badge pill-green">Active</span>
          </div>
        </div>

        {/* Secondary Twilio Number */}
        <div className="profile-field-cell">
          <label className="field-cell-label">Secondary Twilio Number</label>
          <div className="field-cell-readonly">
            <Smartphone className="cell-icon text-blue-600" size={14} />
            <span className="cell-value-text">
              {company.secondary_twilio_number || "—"}
            </span>
            <span className="pill-badge pill-green">Active</span>
          </div>
        </div>

        {/* PAIR 1: Netradyne Code & Netradyne Messaging */}
        <div className="profile-field-cell">
          <label htmlFor="netradyne_field" className="field-cell-label">
            Netradyne Code
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-cell-input-wrap">
              <FileText className="cell-icon text-blue-600" size={14} />
              <input
                id="netradyne_field"
                type="text"
                className="cell-text-input"
                placeholder="e.g. LMD_NET_44"
                value={formState.netradyneCustomerName.value}
                onChange={(e) =>
                  onFieldChange("netradyneCustomerName", e.target.value)
                }
              />
            </div>
          ) : (
            <div className="field-cell-readonly">
              <FileText className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">
                {company.netradyne_customer_name || "—"}
              </span>
              <span className="pill-badge pill-blue">Synced</span>
            </div>
          )}
        </div>

        <div className="profile-field-cell">
          <label className="field-cell-label">Netradyne Messaging</label>
          <div className="field-cell-readonly flex-between">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Radio className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">Auto Coaching Messages</span>
            </div>
            {isEditing && isOwner && formState ? (
              <label className="custom-blue-switch" title="Toggle Netradyne Auto Coaching Messaging">
                <input
                  type="checkbox"
                  checked={formState.autoCoachingEnable.value}
                  onChange={(e) =>
                    onFieldChange("autoCoachingEnable", e.target.checked)
                  }
                />
                <span className="switch-slider" />
              </label>
            ) : (
              <span
                className={`pill-badge ${
                  company.auto_coaching_enable ? "pill-blue" : "pill-slate"
                }`}
              >
                {company.auto_coaching_enable ? "Active" : "Disabled"}
              </span>
            )}
          </div>
        </div>

        {/* PAIR 2: Call Forwarding Number & Enable Call */}
        <div className="profile-field-cell">
          <label htmlFor="call_forwarding_input" className="field-cell-label">
            Call Forwarding Number
          </label>
          {isEditing && isOwner && formState ? (
            <div className="field-composite-row">
              <select
                className="country-prefix-select"
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
              >
                <PhoneCall className="cell-icon text-blue-600" size={14} />
                <input
                  id="call_forwarding_input"
                  type="tel"
                  className="cell-text-input"
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
            <div className="field-cell-readonly">
              <PhoneCall className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">
                {company.forward_call_number || "—"}
              </span>
            </div>
          )}
          {isEditing && formState?.callForwardingNo.error && (
            <span className="cell-error-feedback">
              {formState.callForwardingNo.helperText}
            </span>
          )}
        </div>

        <div className="profile-field-cell">
          <label className="field-cell-label">Enable Call Forwarding</label>
          <div className="field-cell-readonly flex-between">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PhoneCall className="cell-icon text-blue-600" size={14} />
              <span className="cell-value-text">Forward Inbound Calls</span>
            </div>
            {isEditing && isOwner && formState ? (
              <label className="custom-blue-switch" title="Enable Inbound Call Forwarding">
                <input
                  type="checkbox"
                  checked={formState.callForwarding.value}
                  onChange={(e) =>
                    onFieldChange("callForwarding", e.target.checked)
                  }
                />
                <span className="switch-slider" />
              </label>
            ) : (
              <span
                className={`pill-badge ${
                  company.forward_call_enable ? "pill-blue" : "pill-slate"
                }`}
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
