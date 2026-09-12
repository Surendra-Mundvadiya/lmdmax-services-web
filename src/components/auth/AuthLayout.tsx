import React, { FC, ReactNode } from "react";
import Logo from "../../assets/Logo";
import "./auth-apple.css";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="company-auth-screen">
      {/* Background Image & Soft Blue-White Overlay */}
      <div className="company-auth-bg" />
      <div className="company-auth-overlay" />

      {/* Official LMDmax Brand Corner (Top-Left Corporate Placement) */}
      <header className="company-auth-brand-corner">
        <a href="/" className="brand-logo-link" title="LMDmax Home">
          <Logo variant="horizontal" width={160} height={42} />
        </a>
      </header>

      {/* Centered Glass Container */}
      <main className="company-auth-card-container">
        <div className="company-glass-card">
          <div className="card-form-body">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;

