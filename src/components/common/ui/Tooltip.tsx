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
            backgroundColor: "oklch(18% 0.02 255)",
            color: "#FFFFFF",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
            borderRadius: "7px",
            padding: "0.3rem 0.6rem",
            fontSize: "0.725rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            letterSpacing: "0.01em",
            animation: "modalBackdropFadeIn 0.15s var(--ease-spring)",
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
