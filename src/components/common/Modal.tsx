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
        background: "rgba(0, 0, 0, 0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: "var(--ads-s4)",
        animation: "modalBackdropFadeIn var(--ads-dur) var(--ads-ease)",
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth,
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          border: "1px solid var(--ads-hairline)",
          borderRadius: "var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          padding: "var(--ads-s6)",
          position: "relative",
          animation: "modalSpringScaleUp var(--ads-dur) var(--ads-ease)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "var(--ads-s5)",
            right: "var(--ads-s5)",
            background: "transparent",
            border: "1px solid transparent",
            color: "var(--ads-ink-tertiary)",
            cursor: "pointer",
            padding: "0.35rem",
            borderRadius: "var(--ads-r-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition:
              "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--ads-ink)";
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
            e.currentTarget.style.borderColor = "var(--ads-hairline)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--ads-ink-tertiary)";
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.97)";
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
              fontSize: "1.375rem",
              fontWeight: 650,
              color: "var(--ads-ink)",
              marginBottom: "var(--ads-s4)",
              paddingRight: "var(--ads-s8)",
              letterSpacing: "-0.019em",
            }}
          >
            {title}
          </h3>
        )}

        <div style={{ color: "var(--ads-ink-secondary)" }}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
