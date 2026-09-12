import React, { FC, useState, useEffect } from "react";
import { Smartphone, Mail, ArrowLeft, ArrowRight, RotateCw, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthAPI from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../common/LoadingSpinner";

interface OtpSignInFormProps {
  onBackToEmail: () => void;
  onSuccess: (data: any) => void;
}

export const OtpSignInForm: FC<OtpSignInFormProps> = ({
  onBackToEmail,
  onSuccess,
}) => {
  const [step, setStep] = useState<"REQUEST_OTP" | "VERIFY_OTP">("REQUEST_OTP");
  const [identifier, setIdentifier] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(59);

  const [identifierError, setIdentifierError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let timer: any;
    if (step === "VERIFY_OTP" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatIdentifier = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes("@")) return trimmed.toLowerCase();
    const cleaned = trimmed.replace(/\D/g, "");
    if (cleaned.length === 10) return `+1${cleaned}`;
    if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
    return trimmed;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessNotice("");

    if (!identifier.trim()) {
      setIdentifierError("Please enter your registered email or phone");
      return;
    }
    setIdentifierError("");

    setIsLoading(true);
    try {
      const formatted = formatIdentifier(identifier);
      const response = await AuthAPI.otpLogin({ field: formatted });

      if (response.status >= 200 && response.status < 300) {
        const data = response.data?.data || response.data;
        const receivedToken = data?.token || response.data?.token;

        if (receivedToken) {
          setOtpToken(receivedToken);
          setStep("VERIFY_OTP");
          setCountdown(59);
          setSuccessNotice(
            formatted.includes("@")
              ? "Verification OTP sent to your email."
              : "Verification OTP sent to your phone."
          );
        } else {
          setGeneralError("Failed to generate OTP session token.");
        }
      } else {
        setGeneralError(response.data?.message || "User not found.");
      }
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessNotice("");

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setOtpError("Please enter the complete OTP code");
      return;
    }
    setOtpError("");

    setIsLoading(true);
    try {
      const formatted = formatIdentifier(identifier);
      const response = await AuthAPI.otpVerify({
        token: otpToken,
        identifier: formatted,
        otp: otpCode.trim(),
      });

      if (response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        const userData = responseData?.data || responseData;
        const sessionToken = responseData?.token || userData?.token;

        if (sessionToken && userData) {
          setSession(sessionToken, userData);
          onSuccess(userData);
        } else {
          setGeneralError("Invalid verification payload received.");
        }
      } else {
        setGeneralError(response.data?.message || "Invalid or expired OTP code.");
      }
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setGeneralError("");
    setSuccessNotice("");

    try {
      const formatted = formatIdentifier(identifier);
      const response = await AuthAPI.otpResend({
        token: otpToken,
        identifier: formatted,
      });

      if (response.status >= 200 && response.status < 300) {
        const newToken = response.data?.data?.token || response.data?.token;
        if (newToken) setOtpToken(newToken);
        setCountdown(59);
        setSuccessNotice("A new OTP has been sent.");
      } else {
        setGeneralError(response.data?.message || "Unable to resend OTP.");
      }
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || "Resend OTP failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-card-container">
      <button
        type="button"
        onClick={() => (step === "VERIFY_OTP" ? setStep("REQUEST_OTP") : onBackToEmail())}
        className="back-nav-btn"
      >
        <ArrowLeft size={16} />
        <span>{step === "VERIFY_OTP" ? "Change phone/email" : "Back to Sign In"}</span>
      </button>

      <div className="form-header">
        <h1 className="form-title">
          {step === "REQUEST_OTP" ? "Sign in with OTP" : "Verify Code"}
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

      {step === "REQUEST_OTP" ? (
        <form onSubmit={handleSendOtp} className="auth-form">
          <div className="input-group">
            <label htmlFor="identifier" className="input-label">
              Email or Mobile Number
            </label>
            <div className={`input-field-wrap ${identifierError ? "has-error" : ""}`}>
              {identifier.includes("@") ? (
                <Mail className="input-icon" size={16} />
              ) : (
                <Smartphone className="input-icon" size={16} />
              )}
              <input
                id="identifier"
                type="text"
                className="styled-input"
                placeholder="Enter email or phone number"
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
                <span>Send Verification Code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <div className="input-group">
            <label htmlFor="otp" className="input-label">
              Enter 6-Digit Code
            </label>
            <div className={`input-field-wrap ${otpError ? "has-error" : ""}`}>
              <input
                id="otp"
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
                onClick={handleResendOtp}
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
                <span>Verify & Sign In</span>
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

export default OtpSignInForm;
