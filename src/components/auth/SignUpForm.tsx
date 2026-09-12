import React, { FC, useState } from "react";
import { User, Mail, Phone, Lock, KeyRound, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle, HelpCircle, Check, X } from "lucide-react";
import AuthAPI from "../../api/auth";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  validateEmail,
  validateName,
  validatePhoneNumber,
  validatePasswordCriteria,
  validateConfirmPassword,
  validateRequired,
} from "../../utils/validators";

interface SignUpFormProps {
  onBackToSignIn: () => void;
  onSuccess: () => void;
}

export const SignUpForm: FC<SignUpFormProps> = ({
  onBackToSignIn,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accessCode: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAccessTooltip, setShowAccessTooltip] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password requirement indicators
  const passwordCriteria = validatePasswordCriteria(formData.password);
  const { minLength: hasMinLength, hasNumber: hasDigit, hasSpecial, hasLetter, isValid: isPasswordValid } = passwordCriteria;

  const validateAll = (): boolean => {
    const errs: Record<string, string> = {};

    const nameResult = validateName(formData.name, "Full Name", 3, 35);
    if (!nameResult.isValid) errs.name = nameResult.error;

    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) errs.email = emailResult.error;

    const phoneResult = validatePhoneNumber(formData.phone);
    if (!phoneResult.isValid) errs.phone = phoneResult.error;

    if (!formData.password) {
      errs.password = "Create a password";
    } else if (!isPasswordValid) {
      errs.password = "Password does not meet all criteria";
    }

    const confirmResult = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmResult.isValid) errs.confirmPassword = confirmResult.error;

    const accessResult = validateRequired(formData.accessCode, "Company access code");
    if (!accessResult.isValid) errs.accessCode = accessResult.error;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateAll()) return;

    setIsLoading(true);
    try {
      const response = await AuthAPI.signup({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        access_code: formData.accessCode.trim(),
      });

      if (response.status >= 200 && response.status < 300) {
        onSuccess();
      } else {
        setGeneralError(response.data?.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setGeneralError(
        err?.response?.data?.message ||
          err?.response?.data?.data?.message ||
          "Registration failed. Email or access code might be invalid."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-card-container">
      <div className="form-header">
        <h1 className="form-title">Get Started</h1>
      </div>

      {generalError && (
        <div className="error-alert">
          <AlertCircle size={16} />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Row 1: Name & Email */}
        <div className="form-row-2col">
          <div className="input-group">
            <label htmlFor="name" className="input-label">
              Full Name
            </label>
            <div className={`input-field-wrap ${errors.name ? "has-error" : ""}`}>
              <User className="input-icon" size={16} />
              <input
                id="name"
                type="text"
                className="styled-input"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            {errors.name && <span className="field-error-text">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="signup-email" className="input-label">
              Email Address
            </label>
            <div className={`input-field-wrap ${errors.email ? "has-error" : ""}`}>
              <Mail className="input-icon" size={16} />
              <input
                id="signup-email"
                type="email"
                className="styled-input"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            {errors.email && <span className="field-error-text">{errors.email}</span>}
          </div>
        </div>

        {/* Row 2: Phone & Access Code */}
        <div className="form-row-2col">
          <div className="input-group">
            <label htmlFor="phone" className="input-label">
              Mobile Number
            </label>
            <div className={`input-field-wrap ${errors.phone ? "has-error" : ""}`}>
              <Phone className="input-icon" size={16} />
              <input
                id="phone"
                type="tel"
                className="styled-input"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            {errors.phone && <span className="field-error-text">{errors.phone}</span>}
          </div>

          <div className="input-group">
            <div className="password-label-row">
              <label htmlFor="accessCode" className="input-label">
                Access Code
              </label>
              <div className="tooltip-container">
                <button
                  type="button"
                  className="tooltip-trigger-btn"
                  aria-label="What is an access code?"
                  title="What is an access code?"
                  onMouseEnter={() => setShowAccessTooltip(true)}
                  onMouseLeave={() => setShowAccessTooltip(false)}
                  onClick={() => setShowAccessTooltip(!showAccessTooltip)}
                >
                  <HelpCircle size={13} />
                </button>
                {showAccessTooltip && (
                  <div className="tooltip-popover">
                    Provided by your company administrator to link your account.
                  </div>
                )}
              </div>
            </div>
            <div className={`input-field-wrap ${errors.accessCode ? "has-error" : ""}`}>
              <KeyRound className="input-icon" size={16} />
              <input
                id="accessCode"
                type="text"
                className="styled-input"
                placeholder="Company Access Code"
                value={formData.accessCode}
                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
              />
            </div>
            {errors.accessCode && <span className="field-error-text">{errors.accessCode}</span>}
          </div>
        </div>

        {/* Row 3: Password & Confirm Password */}
        <div className="form-row-2col">
          <div className="input-group">
            <label htmlFor="signup-password" className="input-label">
              Password
            </label>
            <div className={`input-field-wrap ${errors.password ? "has-error" : ""}`}>
              <Lock className="input-icon" size={16} />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                className="styled-input"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="field-error-text">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword" className="input-label">
              Confirm Password
            </label>
            <div className={`input-field-wrap ${errors.confirmPassword ? "has-error" : ""}`}>
              <Lock className="input-icon" size={16} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="styled-input"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                title={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="field-error-text">{errors.confirmPassword}</span>
            )}
          </div>
        </div>

        {/* Password requirement checklist - compact 1 line */}
        <div className="password-checklist-compact">
          <span className={`pill-check ${hasMinLength ? "active" : ""}`}>
            {hasMinLength ? <Check size={11} /> : <X size={11} />} 6+ chars
          </span>
          <span className={`pill-check ${hasDigit ? "active" : ""}`}>
            {hasDigit ? <Check size={11} /> : <X size={11} />} 1 number
          </span>
          <span className={`pill-check ${hasLetter ? "active" : ""}`}>
            {hasLetter ? <Check size={11} /> : <X size={11} />} letters
          </span>
          <span className={`pill-check ${hasSpecial ? "active" : ""}`}>
            {hasSpecial ? <Check size={11} /> : <X size={11} />} special char
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="primary-submit-btn"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="#FFFFFF" label="Creating account..." />
          ) : (
            <>
              <span>Sign Up</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Footer Sign in link */}
      <div className="form-footer-row">
        <span>Already have an account?</span>
        <button
          type="button"
          onClick={onBackToSignIn}
          className="inline-action-btn"
        >
          Sign in
        </button>
      </div>

      {/* Legal Links */}
      <div className="legal-links-footer">
        <a
          href="https://fleet.lmdmax.com/privacy-policy"
          target="_blank"
          rel="noreferrer"
          className="legal-link"
        >
          Privacy Policy
        </a>
        <span className="bullet-sep">•</span>
        <a
          href="https://fleet.lmdmax.com/terms-and-conditions"
          target="_blank"
          rel="noreferrer"
          className="legal-link"
        >
          Terms of Service
        </a>
      </div>
    </div>
  );
};

export default SignUpForm;
