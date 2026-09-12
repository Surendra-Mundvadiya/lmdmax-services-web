import React, { FC, useState } from "react";
import { X, KeyRound, Eye, EyeOff, Sparkles, Loader2, AlertCircle } from "lucide-react";
import type { AdminUser } from "../../../types/admin";
import { useAdminStore } from "../../../store/adminStore";

interface AdminPasswordModalProps {
  admin: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminName: string) => void;
}

export const AdminPasswordModal: FC<AdminPasswordModalProps> = ({
  admin,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const resetAdminPasswordApi = useAdminStore((state) => state.resetAdminPasswordApi);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !admin) return null;

  const handleGeneratePassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnpqrstuvwxyz";
    const numbers = "23456789";
    const specials = "!@#$%&*";
    
    let gen = "";
    gen += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    gen += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    gen += numbers.charAt(Math.floor(Math.random() * numbers.length));
    gen += specials.charAt(Math.floor(Math.random() * specials.length));
    
    const all = uppercase + lowercase + numbers + specials;
    for (let i = 0; i < 6; i++) {
      gen += all.charAt(Math.floor(Math.random() * all.length));
    }
    
    setPassword(gen);
    setConfirmPassword(gen);
    setShowPassword(true);
    setShowConfirmPassword(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await resetAdminPasswordApi(admin.id, password);
      if (res.success) {
        onSuccess(admin.name);
        onClose();
      } else {
        setError(res.message || "Failed to update password");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="custom-modal-overlay ads-admin-modal-overlay">
      <div className="custom-modal-dialog max-w-md ads-admin-modal">
        {/* Modal Header */}
        <div className="custom-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="custom-modal-title">Change Administrator Password</h3>
              <p className="text-xs text-slate-500">
                Set a new password for <strong className="text-slate-800">{admin.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="custom-modal-body flex flex-col gap-3.5 py-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                New Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                onClick={handleGeneratePassword}
              >
                <Sparkles size={11} />
                <span>Auto-Generate</span>
              </button>
            </div>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                maxLength={16}
                className="w-full h-10 pl-3 pr-9 text-sm text-slate-900 bg-white border border-slate-300 rounded-md outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Enter new password (8-16 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full">
              <input
                type={showConfirmPassword ? "text" : "password"}
                maxLength={16}
                className="w-full h-10 pl-3 pr-9 text-sm text-slate-900 bg-white border border-slate-300 rounded-md outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ display: "flex", gap: "var(--ads-s3)", justifyContent: "flex-end", marginTop: "var(--ads-s4)", paddingTop: "var(--ads-s4)", borderTop: "1px solid var(--ads-hairline)" }}>
            <button
              type="button"
              className="btn-outline-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-blue-primary"
              disabled={isSubmitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--ads-s2)",
                backgroundColor: "var(--ads-blue)",
                color: "#FFFFFF",
                border: "1px solid transparent",
                padding: "9px 18px",
                borderRadius: "var(--ads-r-pill)",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "-0.01em",
                cursor: "pointer",
                transition:
                  "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Saving...</span>
                </>
              ) : (
                <span style={{ color: "#FFFFFF" }}>Save Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPasswordModal;
