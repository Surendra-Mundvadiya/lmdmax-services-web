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
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
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
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#0F172A",
            marginBottom: "0.5rem",
          }}
        >
          Access Restricted
        </h3>

        <p
          style={{
            fontSize: "0.875rem",
            color: "#64748B",
            lineHeight: 1.5,
            marginBottom: "1.5rem",
          }}
        >
          Your account does not currently have permissions enabled to access this LMDmax application. Please contact your company administrator or dispatch manager to request access.
        </p>

        <div
          style={{
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "0.75rem",
            padding: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textAlign: "left",
            marginBottom: "1.5rem",
          }}
        >
          <Mail size={18} style={{ color: "#4F8BFF" }} />
          <div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
              Need help?
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
              Contact support at support@lmdmax.com
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            backgroundColor: "#4F8BFF",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3B82F6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4F8BFF")}
        >
          Acknowledge & Close
        </button>
      </div>
    </Modal>
  );
};

export default AccessDeniedModal;
