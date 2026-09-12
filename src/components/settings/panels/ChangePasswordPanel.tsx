import React, { FC, useState } from "react";
import { KeyRound, Eye, EyeOff, Save, ShieldCheck, AlertCircle } from "lucide-react";
import AuthAPI from "../../../api/auth";

interface ChangePasswordPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_+={}[\]|\\;:"<>,./?])[A-Za-z\d!@#$%^&*()\-_+={}[\]|\\;:"<>,./?]{8,16}$/;

export const ChangePasswordPanel: FC<ChangePasswordPanelProps> = ({ onNotification }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword.trim()) {
      setErrorMessage("Current password is required.");
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setErrorMessage(
        "New password must be 8-16 characters long and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AuthAPI.changePassword({
        current_password: currentPassword,
        confirm_password: confirmPassword,
        password: newPassword,
      });

      if ((res as any)?.data?.success !== false) {
        onNotification({
          text: "Password updated successfully!",
          type: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMessage((res as any)?.data?.message || "Failed to alter password.");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || "Unable to update password. Please verify current password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-panel-scroll">
      {/* Header */}
      <div className="settings-panel-header-block">
        <div>
          <h2 className="settings-panel-heading flex items-center gap-2">
            <KeyRound size={20} className="text-blue-600" />
            <span>Change Password</span>
          </h2>
          <p className="settings-panel-subheading">
            Update your account password and enforce credentials security
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-card max-w-xl">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <ShieldCheck size={17} className="text-blue-600" />
            <span>Security Credentials</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Ensure your password contains at least 8 characters with upper and lower case letters, numbers, and symbols.
        </p>

        {/* Current Password */}
        <div className="settings-form-field">
          <label className="settings-form-label">
            Current Password <span className="text-red-500">*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showCurrent ? "text" : "password"}
              className="settings-form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              style={{
                position: "absolute",
                right: "0.6rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#64748B",
                cursor: "pointer",
                padding: "0.2rem",
              }}
              title={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="settings-form-field">
          <label className="settings-form-label">
            New Password <span className="text-red-500">*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showNew ? "text" : "password"}
              className="settings-form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (8-16 characters)"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              style={{
                position: "absolute",
                right: "0.6rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#64748B",
                cursor: "pointer",
                padding: "0.2rem",
              }}
              title={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="settings-form-field">
          <label className="settings-form-label">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              className="settings-form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                right: "0.6rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#64748B",
                cursor: "pointer",
                padding: "0.2rem",
              }}
              title={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="settings-footer-actions">
          <button
            type="submit"
            className="btn-blue-primary"
            disabled={isSubmitting}
            style={{ color: "#FFFFFF" }}
          >
            <Save size={15} style={{ color: "#FFFFFF" }} />
            <span style={{ color: "#FFFFFF" }}>
              {isSubmitting ? "Updating..." : "Update Password"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordPanel;
