import React, { FC, useState, useRef, useEffect, ReactNode, HTMLAttributes } from "react";

export type DropdownPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  placement?: DropdownPlacement;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  minWidth?: string;
  className?: string;
}

export const Dropdown: FC<DropdownProps> = ({
  trigger,
  children,
  placement = "bottom-start",
  isOpen: controlledOpen,
  onOpenChange,
  minWidth = "190px",
  className = "",
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const containerRef = useRef<HTMLDivElement>(null);

  const setOpen = (newVal: boolean) => {
    if (!isControlled) {
      setInternalOpen(newVal);
    }
    onOpenChange?.(newVal);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const getPlacementStyles = (): React.CSSProperties => {
    switch (placement) {
      case "bottom-end":
        return { top: "calc(100% + 6px)", right: 0 };
      case "top-start":
        return { bottom: "calc(100% + 6px)", left: 0 };
      case "top-end":
        return { bottom: "calc(100% + 6px)", right: 0 };
      case "bottom-start":
      default:
        return { top: "calc(100% + 6px)", left: 0 };
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }} className={`dropdown-container ${className}`}>
      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", display: "inline-flex" }}>
        {trigger}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            minWidth,
            backgroundColor: "var(--surface-bg-elevated)",
            backdropFilter: "var(--glass-blur-vercel-lg)",
            WebkitBackdropFilter: "var(--glass-blur-vercel-lg)",
            border: "1px solid var(--surface-border)",
            borderRadius: "14px",
            boxShadow: "var(--shadow-ambient-lg), var(--surface-bevel)",
            padding: "0.45rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            zIndex: 100,
            animation: "dropdownSpringMount 0.22s var(--ease-spring)",
            boxSizing: "border-box",
            ...getPlacementStyles(),
          }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export interface DropdownItemProps extends HTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export const DropdownItem: FC<DropdownItemProps> = ({
  children,
  icon,
  danger = false,
  disabled = false,
  style,
  className = "",
  onClick,
  ...rest
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "9px",
        fontSize: "0.8125rem",
        fontWeight: 600,
        color: danger ? "#EF4444" : "var(--text-primary)",
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        textDecoration: "none",
        width: "100%",
        textAlign: "left",
        userSelect: "none",
        boxSizing: "border-box",
        transition: "all 0.15s var(--ease-spring)",
        ...style,
      }}
      className={`dropdown-item ${danger ? "danger" : ""} ${className}`}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = danger ? "rgba(239, 68, 68, 0.1)" : "var(--surface-bg-hover)";
          e.currentTarget.style.color = danger ? "#DC2626" : "var(--color-glass-blue)";
          e.currentTarget.style.transform = "translateX(2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = danger ? "#EF4444" : "var(--text-primary)";
          e.currentTarget.style.transform = "none";
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = "none";
      }}
      {...rest}
    >
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
};

export const DropdownDivider: FC = () => (
  <div
    style={{
      height: "1px",
      backgroundColor: "var(--surface-border-subtle)",
      margin: "0.35rem 0",
      width: "100%",
    }}
  />
);

export default Dropdown;
