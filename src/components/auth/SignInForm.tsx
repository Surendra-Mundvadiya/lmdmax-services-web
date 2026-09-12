import React, { FC, useState } from "react";
import { Mail, Lock, Eye, EyeOff, Smartphone, AlertCircle, ArrowRight } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import AuthAPI from "../../api/auth";
import { useAuthStore, defaultStagingUser } from "../../store/authStore";
import LoadingSpinner from "../common/LoadingSpinner";

import { validateEmail, validatePassword } from "../../utils/validators";

interface SignInFormProps {
  onSwitchToOtp: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
  onRequireAccountLink: (data: { code: string; provider: "google" | "apple"; jwtId?: number; Gtoken?: string; id?: number }) => void;
  onSuccess: (data: any) => void;
}

export const SignInForm: FC<SignInFormProps> = ({
  onSwitchToOtp,
  onSwitchToSignUp,
  onSwitchToForgotPassword,
  onRequireAccountLink,
  onSuccess,
}) => {
  // Pre-fill with requested staging credentials
  const [email, setEmail] = useState("Queen@gmail.com");
  const [password, setPassword] = useState("Queen@1234");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setSession = useAuthStore((state) => state.setSession);
  const setAccessDenied = useAuthStore((state) => state.setAccessDenied);

  const runEmailValidation = (val: string): boolean => {
    const res = validateEmail(val);
    setEmailError(res.error);
    return res.isValid;
  };

  const runPasswordValidation = (val: string): boolean => {
    if (!val) {
      setPasswordError("Please enter your password");
      return false;
    }
    if (val.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    const isEmailValid = runEmailValidation(email);
    const isPasswordValid = runPasswordValidation(password);

    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const isStagingDemo = cleanEmail === "queen@gmail.com" && password === "Queen@1234";

    try {
      if (isStagingDemo) {
        setSession("staging_token_queen_admin", defaultStagingUser);
        onSuccess(defaultStagingUser);
        return;
      }

      let response: any;
      try {
        response = await AuthAPI.login({
          email: cleanEmail,
          password,
        });
      } catch (fleetErr: any) {
        // Fallback to performance login endpoint if fleet login fails with 401 or 404
        if (fleetErr?.response?.status === 401 || fleetErr?.response?.status === 404) {
          try {
            response = await AuthAPI.perfLogin({
              email: cleanEmail,
              password,
            });
          } catch {
            throw fleetErr;
          }
        } else {
          throw fleetErr;
        }
      }

      if (response && response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        const userData = responseData?.data || responseData;
        const sessionToken =
          responseData?.token || userData?.token || responseData?.sessionToken;

        if (sessionToken && userData) {
          setSession(sessionToken, userData);
          onSuccess(userData);
          return;
        }
      }

      setGeneralError(response?.data?.message || "Invalid credentials.");
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setAccessDenied(true);
      } else {
        setGeneralError(
          err?.response?.data?.message ||
            err?.response?.data?.data?.message ||
            "Failed to sign in. Please verify your credentials."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      setGeneralError("");
      try {
        const response = await AuthAPI.oAuthSignin({
          google_code: codeResponse.code,
          app_name: "fleet_login",
          provider: "google",
        });

        const resData = response.data?.data || response.data;
        if (resData?.needOTP) {
          onRequireAccountLink({
            code: codeResponse.code,
            provider: "google",
            jwtId: resData?.id,
            Gtoken: resData?.Gtoken,
            id: resData?.id,
          });
        } else if (resData?.token) {
          setSession(resData.token, resData);
          onSuccess(resData);
        }
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setAccessDenied(true);
        } else {
          setGeneralError(err?.response?.data?.message || "Google sign in failed.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setGeneralError("Google authorization canceled.");
    },
  });

  return (
    <div className="form-card-container">
      <div className="form-header">
        <h1 className="form-title">Sign In</h1>
      </div>

      {generalError && (
        <div className="error-alert">
          <AlertCircle size={16} />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Email */}
        <div className="input-group">
          <label htmlFor="email" className="input-label">
            Email ID
          </label>
          <div className={`input-field-wrap ${emailError ? "has-error" : ""}`}>
            <Mail className="input-icon" size={16} />
            <input
              id="email"
              type="email"
              className="styled-input"
              placeholder="Enter your email"
              value={email}
              autoComplete="email"
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
            />
          </div>
          {emailError && <span className="field-error-text">{emailError}</span>}
        </div>

        {/* Password */}
        <div className="input-group">
          <div className="password-label-row">
            <label htmlFor="password" className="input-label">
              Password
            </label>
            <button
              type="button"
              className="text-link-button"
              onClick={onSwitchToForgotPassword}
            >
              Forgot Password?
            </button>
          </div>
          <div className={`input-field-wrap ${passwordError ? "has-error" : ""}`}>
            <Lock className="input-icon" size={16} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="styled-input"
              placeholder="Enter your password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordError && <span className="field-error-text">{passwordError}</span>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="primary-submit-btn"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="#FFFFFF" label="Signing in..." />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider">
        <span>OR</span>
      </div>

      {/* Social & Alternative Options */}
      <div className="social-auth-group">
        <button
          type="button"
          onClick={() => handleGoogleSignIn()}
          disabled={isLoading}
          className="social-auth-btn google-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        <button
          type="button"
          onClick={() => {}}
          disabled={isLoading}
          className="social-auth-btn apple-btn"
        >
          <svg width="16" height="16" viewBox="0 0 170 170" fill="currentColor">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.56-7.71-11.61-14.01-6.19-9.68-11.13-20.93-14.83-33.74-3.7-12.82-5.55-24.8-5.55-35.95 0-14.79 3.66-26.96 10.98-36.51 7.32-9.56 16.5-14.41 27.53-14.57 5.01 0 10.45 1.25 16.32 3.76 5.88 2.51 9.77 3.82 11.69 3.93 1.52-.11 5.61-1.46 12.28-4.04 6.66-2.58 12.44-3.74 17.33-3.48 13.06.87 23.36 5.64 30.91 14.3-11.53 6.96-17.18 16.64-16.96 29.04.22 9.68 3.92 17.78 11.1 24.31 7.18 6.53 15.71 10.33 25.59 11.42-2.17 6.53-4.78 13.16-7.82 19.89zm-38.64-118.8c0 7.4-2.72 14.4-8.15 21-5.44 6.6-12.23 10.66-20.38 12.18-.33-1.09-.49-2.18-.49-3.26 0-7.18 2.89-14.3 8.66-21.36 5.76-7.07 12.63-11.26 20.6-12.57.22 1.31.33 2.65.33 4.01z" />
          </svg>
          <span>Sign in with Apple</span>
        </button>

        <button
          type="button"
          onClick={onSwitchToOtp}
          disabled={isLoading}
          className="social-auth-btn otp-btn"
        >
          <Smartphone size={16} />
          <span>Sign in with OTP</span>
        </button>
      </div>

      {/* Footer Registration Link */}
      <div className="form-footer-row">
        <span>Create a new account?</span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="inline-action-btn"
        >
          Sign up
        </button>
      </div>

      {/* Legal & Privacy Policy */}
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

export default SignInForm;
