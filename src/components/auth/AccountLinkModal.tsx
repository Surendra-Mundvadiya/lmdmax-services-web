import React, { FC, useState } from "react";
import Modal from "../common/Modal";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import AuthAPI from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../common/LoadingSpinner";

interface AccountLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  authInfo: {
    code: string;
    provider: "google" | "apple";
    jwtId?: number;
    Gtoken?: string;
    id?: number;
  } | null;
  onSuccess: (data: any) => void;
}

export const AccountLinkModal: FC<AccountLinkModalProps> = ({
  isOpen,
  onClose,
  authInfo,
  onSuccess,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"PASSWORD" | "OTP">("PASSWORD");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  if (!authInfo) return null;

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your existing account email or phone number.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        token: authInfo.Gtoken || authInfo.code,
        identifier: identifier.trim(),
        provider_id: authInfo.provider,
        id: authInfo.id || authInfo.jwtId,
      };

      if (verificationMethod === "PASSWORD") {
        payload.password = password;
      } else {
        payload.otp = otpCode;
      }

      const response = await AuthAPI.linkAccountForOAuth(payload);

      if (response.status >= 200 && response.status < 300) {
        const data = response.data?.data || response.data;
        const sessionToken = data?.token || response.data?.token;

        if (sessionToken && data) {
          setSession(sessionToken, data);
          onSuccess(data);
          onClose();
        } else {
          setError("Linked successfully, but no session was returned.");
        }
      } else {
        setError(response.data?.message || "Failed to link account. Please verify credentials.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Account linking failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Social Account"
      maxWidth="460px"
    >
      <div className="account-link-content">
        <p className="account-link-desc">
          We found that you already have an LMDmax account. Please verify your identity using your password or OTP to link your {authInfo.provider === "google" ? "Google" : "Apple"} sign-in.
        </p>

        {error && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="link-tabs">
          <button
            type="button"
            className={`link-tab ${verificationMethod === "PASSWORD" ? "active" : ""}`}
            onClick={() => setVerificationMethod("PASSWORD")}
          >
            Verify with Password
          </button>
          <button
            type="button"
            className={`link-tab ${verificationMethod === "OTP" ? "active" : ""}`}
            onClick={() => setVerificationMethod("OTP")}
          >
            Verify with OTP
          </button>
        </div>

        <form onSubmit={handleLinkAccount} className="auth-form" style={{ marginTop: "1rem" }}>
          <div className="input-group">
            <label htmlFor="link-identifier" className="input-label">
              Existing Account Email or Phone
            </label>
            <div className="input-field-wrap">
              <Mail className="input-icon" size={16} />
              <input
                id="link-identifier"
                type="text"
                className="styled-input"
                placeholder="name@company.com"
                value={identifier}
                autoFocus
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          {verificationMethod === "PASSWORD" ? (
            <div className="input-group">
              <label htmlFor="link-password" className="input-label">
                Account Password
              </label>
              <div className="input-field-wrap">
                <Lock className="input-icon" size={16} />
                <input
                  id="link-password"
                  type="password"
                  className="styled-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="input-group">
              <label htmlFor="link-otp" className="input-label">
                Verification OTP
              </label>
              <div className="input-field-wrap">
                <input
                  id="link-otp"
                  type="text"
                  maxLength={6}
                  className="styled-input otp-code-input"
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="primary-submit-btn"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="#FFFFFF" label="Linking..." />
            ) : (
              <>
                <span>Link & Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default AccountLinkModal;
