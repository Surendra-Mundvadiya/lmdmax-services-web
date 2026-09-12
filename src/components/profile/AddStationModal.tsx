import React, { FC, useState } from "react";
import { Building2, MapPin, Hash, X, AlertCircle } from "lucide-react";
import AuthAPI from "../../api/auth";
import { validateStationCode, validateZipCode, validateRequired } from "../../utils/validators";
import LoadingSpinner from "../common/LoadingSpinner";

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
            <Building2 className="modal-icon" size={20} />
            <h3 className="modal-title">Request Station Addition</h3>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-notice-banner">
          <span>New station requests require Super Admin verification before activation.</span>
        </div>

        {generalError && (
          <div className="error-alert" style={{ margin: "0 1.5rem 1rem" }}>
            <AlertCircle size={16} />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Station Code */}
          <div className="input-group">
            <label htmlFor="modal_station_code" className="input-label">Station Code</label>
            <div className={`input-field-wrap ${errors.stationCode ? "has-error" : ""}`}>
              <Building2 className="input-icon" size={16} />
              <input
                id="modal_station_code"
                type="text"
                className="styled-input"
                placeholder="e.g. DDF4, DHO1"
                value={stationCode}
                maxLength={8}
                style={{ textTransform: "uppercase" }}
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
            <div className={`input-field-wrap ${errors.zipcode ? "has-error" : ""}`}>
              <Hash className="input-icon" size={16} />
              <input
                id="modal_zipcode"
                type="text"
                className="styled-input"
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
            <div className={`input-field-wrap ${errors.address ? "has-error" : ""}`}>
              <MapPin className="input-icon" size={16} />
              <input
                id="modal_address"
                type="text"
                className="styled-input"
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
