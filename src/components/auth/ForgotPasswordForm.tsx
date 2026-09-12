import React, { FC, useState, useEffect } from "react";
import { Mail, Smartphone, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, RotateCw, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthAPI from "../../api/auth";
import LoadingSpinner from "../common/LoadingSpinner";

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
  onSuccess: () => void;
}

export const ForgotPasswordForm: FC<ForgotPasswordFormProps> = ({
  onBackToSignIn,
  onSuccess,
}) => {
  const [step, setStep] = useState<"REQUEST" | "VERIFY_OTP" | "RESET_PASSWORD">("REQUEST");
  const [identifier, setIdentifier] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(59);

  const [identifierError, setIdentifierError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (step === "VERIFY_OTP" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessNotice("");

    if (!identifier.trim()) {
      setIdentifierError("Please enter your email or phone number");
      return;
    }
    setIdentifierError("");

    setIsLoading(true);
    try {
      const response = await AuthAPI.forgotPasswordRequest({
        identifier: identifier.trim(),
      });

      if (response.status >= 200 && response.status < 300) {
        const token = response.data?.data?.token || response.data?.token;
        if (token) setSessionToken(token);
        setStep("VERIFY_OTP");
        setCountdown(59);
        setSuccessNotice("Reset code sent successfully.");
      } else {
        setGeneralError(response.data?.message || "Account not found.");
      }
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || "Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessNotice("");

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setOtpError("Please enter the verification code");
      return;
    }
    setOtpError("");

    setIsLoading(true);
    try {
      const response = await AuthAPI.forgotPasswordVerify({
        token: sessionToken,
        otp: otpCode.trim(),
      });

      if (response.status >= 200 && response.status < 300) {
        setStep("RESET_PASSWORD");
        setSuccessNotice("Code verified. Please set your new password.");
      } else {
        setGeneralError(response.data?.message || "Invalid or expired code.");
      }
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");

    setIsLoading(true);
    try {
      const response = await AuthAPI.forgotPasswordReset({
        token: sessionToken,
        otp: otpCode.trim(),
        password: newPassword,
        new_password: newPassword,
      });

      if (response.status >= 200 && response.status < 300) {
        onSuccess();
      } else {
        setGeneralError(response.data?.message || "Password update failed.");
      }
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setGeneralError("");
    setSuccessNotice("");

    try {
      const response = await AuthAPI.forgotPasswordResend({
        token: sessionToken,
        identifier: identifier.trim(),
      });

      if (response.status >= 200 && response.status < 300) {
        const newToken = response.data?.data?.token || response.data?.token;
        if (newToken) setSessionToken(newToken);
        setCountdown(59);
        setSuccessNotice("New reset code sent.");
      } else {
        setGeneralError(response.data?.message || "Resend failed.");
      }
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || "Resend failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-card-container">
      <button type="button" onClick={onBackToSignIn} className="back-nav-btn">
        <ArrowLeft size={16} />
        <span>Back to Sign In</span>
      </button>

      <div className="form-header">
        <h1 className="form-title">
          {step === "REQUEST"
            ? "Reset Password"
            : step === "VERIFY_OTP"
            ? "Verify Code"
            : "New Password"}
        </h1>
      </div>

      {generalError && (
        <div className="error-alert">
          <AlertCircle size={16} />
          <span>{generalError}</span>
        </div>
      )}

      {successNotice && (
        <div className="success-alert">
          <CheckCircle2 size={16} />
          <span>{successNotice}</span>
        </div>
      )}

      {step === "REQUEST" && (
        <form onSubmit={handleRequestOtp} className="auth-form">
          <div className="input-group">
            <label htmlFor="reset-identifier" className="input-label">
              Email or Mobile Number
            </label>
            <div className={`input-field-wrap ${identifierError ? "has-error" : ""}`}>
              {identifier.includes("@") ? (
                <Mail className="input-icon" size={16} />
              ) : (
                <Smartphone className="input-icon" size={16} />
              )}
              <input
                id="reset-identifier"
                type="text"
                className="styled-input"
                placeholder="name@company.com"
                value={identifier}
                autoFocus
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (identifierError) setIdentifierError("");
                }}
              />
            </div>
            {identifierError && <span className="field-error-text">{identifierError}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="primary-submit-btn"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="#FFFFFF" label="Sending code..." />
            ) : (
              <>
                <span>Send Code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {step === "VERIFY_OTP" && (
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <div className="input-group">
            <label htmlFor="reset-otp" className="input-label">
              Verification Code
            </label>
            <div className={`input-field-wrap ${otpError ? "has-error" : ""}`}>
              <input
                id="reset-otp"
                type="text"
                maxLength={6}
                className="styled-input otp-code-input"
                placeholder="• • • • • •"
                value={otpCode}
                autoFocus
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ""));
                  if (otpError) setOtpError("");
                }}
              />
            </div>
            {otpError && <span className="field-error-text">{otpError}</span>}
          </div>

          <div className="resend-row">
            {countdown > 0 ? (
              <span className="countdown-text">
                Resend in <strong style={{ color: "var(--ads-blue)" }}>{countdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="resend-action-btn"
              >
                <RotateCw size={14} />
                <span>Resend Code</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="primary-submit-btn"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="#FFFFFF" label="Verifying..." />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {step === "RESET_PASSWORD" && (
        <form onSubmit={handleResetPassword} className="auth-form">
          <div className="input-group">
            <label htmlFor="new-password" className="input-label">
              New Password
            </label>
            <div className={`input-field-wrap ${passwordError ? "has-error" : ""}`}>
              <Lock className="input-icon" size={16} />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                className="styled-input"
                placeholder="••••••••"
                value={newPassword}
                autoFocus
                onChange={(e) => setNewPassword(e.target.value)}
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
          </div>

          <div className="input-group">
            <label htmlFor="confirm-new-password" className="input-label">
              Confirm New Password
            </label>
            <div className={`input-field-wrap ${passwordError ? "has-error" : ""}`}>
              <Lock className="input-icon" size={16} />
              <input
                id="confirm-new-password"
                type={showPassword ? "text" : "password"}
                className="styled-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {passwordError && <span className="field-error-text">{passwordError}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="primary-submit-btn"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="#FFFFFF" label="Saving password..." />
            ) : (
              <>
                <span>Save Password & Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

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

export default ForgotPasswordForm;
