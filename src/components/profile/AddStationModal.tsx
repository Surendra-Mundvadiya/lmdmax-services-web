import React, { FC, useState } from "react";
import { Building2, MapPin, Hash, X, AlertCircle } from "lucide-react";
import AuthAPI from "../../api/auth";
import { validateStationCode, validateZipCode, validateRequired } from "../../utils/validators";
import LoadingSpinner from "../common/LoadingSpinner";

const fieldWrapStyle = (
  isFocused: boolean,
  hasError: boolean
): React.CSSProperties => ({
  backgroundColor: "var(--ads-material-thick)",
  border: `1px solid ${
    hasError
      ? "var(--ads-red)"
      : isFocused
      ? "var(--ads-blue)"
      : "var(--ads-hairline)"
  }`,
  borderRadius: "var(--ads-r-sm)",
  boxShadow: isFocused ? "var(--ads-shadow-focus)" : "var(--ads-bevel)",
  transition:
    "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
});

const fieldInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  boxShadow: "none",
  borderRadius: 0,
  color: "var(--ads-ink)",
};

const fieldIconStyle: React.CSSProperties = {
  color: "var(--ads-ink-tertiary)",
};

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStation: any) => void;
}

export const AddStationModal: FC<AddStationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [stationCode, setStationCode] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string>("");

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const stationResult = validateStationCode(stationCode);
    if (!stationResult.isValid) errs.stationCode = stationResult.error;

    const zipResult = validateZipCode(zipcode);
    if (!zipResult.isValid) errs.zipcode = zipResult.error;

    const addrResult = validateRequired(address, "Station address");
    if (!addrResult.isValid) errs.address = addrResult.error;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        station_code: stationCode.trim().toUpperCase(),
        zipcode: zipcode.trim(),
        address: address.trim(),
      };

      const res = await AuthAPI.stationAdditionRequest(payload);
      if (res.status >= 200 && res.status < 300) {
        onSuccess(res.data?.data || payload);
        onClose();
      } else {
        setGeneralError(res.data?.message || "Failed to submit station request");
      }
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || "Failed to submit station addition request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Building2
              className="modal-icon"
              size={20}
              style={{ color: "var(--ads-blue)" }}
            />
            <h3
              className="modal-title"
              style={{ color: "var(--ads-ink)", letterSpacing: "-0.02em" }}
            >
              Request Station Addition
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
            title="Close"
            style={{
              color: "var(--ads-ink-tertiary)",
              borderRadius: "var(--ads-r-pill)",
              transition:
                "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="modal-notice-banner"
          style={{
            backgroundColor: "var(--ads-blue-tint)",
            borderBottom: "1px solid var(--ads-hairline)",
            color: "var(--ads-ink-secondary)",
          }}
        >
          <span>New station requests require Super Admin verification before activation.</span>
        </div>

        {generalError && (
          <div
            className="error-alert"
            role="alert"
            style={{
              margin: "0 1.5rem 1rem",
              backgroundColor: "var(--ads-red-tint)",
              border: "1px solid transparent",
              borderRadius: "var(--ads-r-sm)",
              color: "var(--ads-red)",
            }}
          >
            <AlertCircle size={16} style={{ color: "var(--ads-red)", flexShrink: 0 }} />
            <span style={{ color: "var(--ads-red)" }}>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Station Code */}
          <div className="input-group">
            <label htmlFor="modal_station_code" className="input-label">Station Code</label>
            <div
              className={`input-field-wrap ${errors.stationCode ? "has-error" : ""}`}
              style={fieldWrapStyle(
                focusedField === "stationCode",
                Boolean(errors.stationCode)
              )}
              onFocus={() => setFocusedField("stationCode")}
              onBlur={() => setFocusedField("")}
            >
              <Building2 className="input-icon" size={16} style={fieldIconStyle} />
              <input
                id="modal_station_code"
                type="text"
                className="styled-input"
                placeholder="e.g. DDF4, DHO1"
                value={stationCode}
                maxLength={8}
                style={{ ...fieldInputStyle, textTransform: "uppercase" }}
                onChange={(e) => {
                  setStationCode(e.target.value.toUpperCase());
                  if (errors.stationCode) setErrors({ ...errors, stationCode: "" });
                }}
              />
            </div>
            {errors.stationCode && <span className="field-error-text">{errors.stationCode}</span>}
          </div>

          {/* Zipcode */}
          <div className="input-group">
            <label htmlFor="modal_zipcode" className="input-label">Zip Code</label>
            <div
              className={`input-field-wrap ${errors.zipcode ? "has-error" : ""}`}
              style={fieldWrapStyle(
                focusedField === "zipcode",
                Boolean(errors.zipcode)
              )}
              onFocus={() => setFocusedField("zipcode")}
              onBlur={() => setFocusedField("")}
            >
              <Hash className="input-icon" size={16} style={fieldIconStyle} />
              <input
                id="modal_zipcode"
                type="text"
                className="styled-input"
                style={fieldInputStyle}
                placeholder="e.g. 75001"
                value={zipcode}
                maxLength={10}
                onChange={(e) => {
                  setZipcode(e.target.value);
                  if (errors.zipcode) setErrors({ ...errors, zipcode: "" });
                }}
              />
            </div>
            {errors.zipcode && <span className="field-error-text">{errors.zipcode}</span>}
          </div>

          {/* Address */}
          <div className="input-group">
            <label htmlFor="modal_address" className="input-label">Station Address</label>
            <div
              className={`input-field-wrap ${errors.address ? "has-error" : ""}`}
              style={fieldWrapStyle(
                focusedField === "address",
                Boolean(errors.address)
              )}
              onFocus={() => setFocusedField("address")}
              onBlur={() => setFocusedField("")}
            >
              <MapPin className="input-icon" size={16} style={fieldIconStyle} />
              <input
                id="modal_address"
                type="text"
                className="styled-input"
                style={fieldInputStyle}
                placeholder="e.g. 1200 Logistics Blvd, Suite 100"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors({ ...errors, address: "" });
                }}
              />
            </div>
            {errors.address && <span className="field-error-text">{errors.address}</span>}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-blue-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-blue-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStationModal;
