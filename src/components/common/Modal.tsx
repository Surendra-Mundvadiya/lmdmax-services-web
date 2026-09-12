import React, { FC, ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "480px",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "var(--glass-blur-vercel)",
        WebkitBackdropFilter: "var(--glass-blur-vercel)",
        padding: "1rem",
        animation: "modalBackdropFadeIn 0.2s var(--ease-spring)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          backgroundColor: "var(--surface-bg-elevated)",
          backdropFilter: "var(--glass-blur-vercel-lg)",
          WebkitBackdropFilter: "var(--glass-blur-vercel-lg)",
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "var(--shadow-ambient-lg), var(--surface-bevel)",
          padding: "1.75rem",
          position: "relative",
          animation: "modalSpringScaleUp 0.25s var(--ease-spring)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "transparent",
            border: "1px solid transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "0.35rem",
            borderRadius: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.18s var(--ease-spring)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.backgroundColor = "var(--surface-bg-hover)";
            e.currentTarget.style.borderColor = "var(--surface-border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.92)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {title && (
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "1rem",
              paddingRight: "2rem",
              letterSpacing: "-0.015em",
            }}
          >
            {title}
          </h3>
        )}

        <div style={{ color: "var(--text-primary)" }}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
