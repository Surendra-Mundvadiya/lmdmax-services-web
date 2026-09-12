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
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0F172A",
        color: "#F8FAFC",
        padding: "2rem",
      }}
    >
      <Logo width={160} height={90} />
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        {error ? (
          <div style={{ color: "#EF4444", fontSize: "1rem" }}>
            <p>{error}</p>
            <button
              onClick={() => navigate("/")}
              style={{
                marginTop: "1.5rem",
                padding: "0.5rem 1.25rem",
                backgroundColor: "#4F8BFF",
                border: "none",
                borderRadius: "0.5rem",
                color: "#FFFFFF",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Return to Login
            </button>
          </div>
        ) : (
          <LoadingSpinner size="lg" color="#4F8BFF" label="Authenticating via Control Tower..." />
        )}
      </div>
    </div>
  );
};

export default ControlTowerSSO;
