import React, { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthAPI from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../common/LoadingSpinner";
import Logo from "../../assets/Logo";

export const ControlTowerSSO: FC = () => {
  const { login_id, company_id } = useParams<{ login_id: string; company_id: string }>();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const setAccessDenied = useAuthStore((state) => state.setAccessDenied);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const executeSSO = async () => {
      if (!login_id || !company_id) {
        setError("Missing login ID or company ID parameters in SSO link.");
        return;
      }

      try {
        const response = await AuthAPI.signInByLoginId({
          login_id,
          company_id,
          app_name: "fleet_login",
        });

        if (response.status >= 200 && response.status < 300) {
          const data = response.data?.data || response.data;
          const token = data?.token || response.data?.token;

          if (token && data) {
            setSession(token, data);
            navigate("/services", { replace: true });
          } else {
            setError("Authentication token not received.");
          }
        } else {
          setError(response.data?.message || "Control Tower sign in rejected.");
        }
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setAccessDenied(true);
          navigate("/", { replace: true });
        } else {
          setError(err?.response?.data?.message || "Failed to authenticate via Control Tower.");
        }
      }
    };

    executeSSO();
  }, [login_id, company_id, navigate, setSession, setAccessDenied]);

  return (
    <div
      className="ads-ambient"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ads-ink)",
        padding: "var(--ads-s8)",
      }}
    >
      <div
        className="ads-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--ads-s6)",
          width: "100%",
          maxWidth: "420px",
          padding: "var(--ads-s10) var(--ads-s8)",
          borderRadius: "var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          textAlign: "center",
        }}
      >
        <Logo width={160} height={90} />

        {error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ads-s5)" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                lineHeight: 1.5,
                color: "var(--ads-red)",
              }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="ads-btn ads-btn--primary ads-btn--lg"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <LoadingSpinner
            size="lg"
            color="#0071E3"
            label="Authenticating via Control Tower..."
          />
        )}
      </div>
    </div>
  );
};

export default ControlTowerSSO;
