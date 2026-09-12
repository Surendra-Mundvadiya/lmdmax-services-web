import React, { FC } from "react";
import Modal from "./Modal";
import { ShieldAlert, Mail } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export const AccessDeniedModal: FC = () => {
  const isOpen = useAuthStore((state) => state.accessDeniedModalOpen);
  const setAccessDenied = useAuthStore((state) => state.setAccessDenied);
  const logout = useAuthStore((state) => state.logout);

  const handleClose = () => {
    setAccessDenied(false);
    logout();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="420px">
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--ads-red-tint)",
            color: "var(--ads-red)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <h3
          style={{
            fontSize: "1.375rem",
            fontWeight: 650,
            letterSpacing: "-0.019em",
            color: "var(--ads-ink)",
            marginBottom: "var(--ads-s2)",
          }}
        >
          Access Restricted
        </h3>

        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--ads-ink-secondary)",
            lineHeight: 1.5,
            marginBottom: "var(--ads-s6)",
          }}
        >
          Your account does not currently have permissions enabled to access this LMDmax application. Please contact your company administrator or dispatch manager to request access.
        </p>

        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-md)",
            padding: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textAlign: "left",
            marginBottom: "1.5rem",
          }}
        >
          <Mail size={18} style={{ color: "var(--ads-blue)" }} />
          <div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
              Need help?
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
              Contact support at support@lmdmax.com
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="ads-btn ads-btn--primary"
          style={{ width: "100%", padding: "12px 24px", fontSize: "0.875rem" }}
        >
          Acknowledge &amp; Close
        </button>
      </div>
    </Modal>
  );
};

export default AccessDeniedModal;
