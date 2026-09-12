import React, { FC, useState, useRef, ReactNode } from "react";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delayMs?: number;
  className?: string;
}

export const Tooltip: FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  delayMs = 150,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delayMs);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  const getPlacementStyles = (): React.CSSProperties => {
    switch (placement) {
      case "bottom":
        return {
          top: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          top: "50%",
          right: "calc(100% + 6px)",
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          top: "50%",
          left: "calc(100% + 6px)",
          transform: "translateY(-50%)",
        };
      case "top":
      default:
        return {
          bottom: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
        };
    }
  };

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={`tooltip-trigger-wrap ${className}`}
    >
      {children}

      {visible && content && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 9999,
            background: "rgba(29, 29, 31, 0.92)",
            backdropFilter: "var(--ads-blur-sm)",
            WebkitBackdropFilter: "var(--ads-blur-sm)",
            color: "#FFFFFF",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "var(--ads-shadow-md)",
            borderRadius: "var(--ads-r-xs)",
            padding: "5px 10px",
            fontSize: "0.75rem",
            fontWeight: 550,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            letterSpacing: "-0.005em",
            maxWidth: "calc(100vw - 32px)",
            animation: "modalBackdropFadeIn var(--ads-dur-fast) var(--ads-ease)",
            ...getPlacementStyles(),
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
