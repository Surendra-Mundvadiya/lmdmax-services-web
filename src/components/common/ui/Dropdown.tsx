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
          role="menu"
          style={{
            position: "absolute",
            minWidth,
            maxWidth: "calc(100vw - 32px)",
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-md)",
            boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
            padding: "var(--ads-s1)",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            zIndex: 100,
            animation: "dropdownSpringMount var(--ads-dur) var(--ads-ease)",
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
      role="menuitem"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--ads-s2)",
        padding: "8px 12px",
        borderRadius: "var(--ads-r-sm)",
        fontSize: "0.8125rem",
        fontWeight: 550,
        letterSpacing: "-0.005em",
        color: danger ? "var(--ads-red)" : "var(--ads-ink)",
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        textDecoration: "none",
        width: "100%",
        textAlign: "left",
        userSelect: "none",
        boxSizing: "border-box",
        transition:
          "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
        ...style,
      }}
      className={`dropdown-item ${danger ? "danger" : ""} ${className}`}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = danger
            ? "var(--ads-red-tint)"
            : "var(--ads-blue-tint)";
          e.currentTarget.style.color = danger ? "var(--ads-red)" : "var(--ads-blue)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = danger ? "var(--ads-red)" : "var(--ads-ink)";
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
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
    role="separator"
    style={{
      height: "1px",
      backgroundColor: "var(--ads-hairline)",
      margin: "var(--ads-s1) 0",
      width: "100%",
    }}
  />
);

export default Dropdown;
