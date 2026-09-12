import React, { forwardRef, HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "primary" | "success" | "warning" | "error" | "neutral" | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = "neutral",
      size = "md",
      dot = false,
      icon,
      className = "",
      style,
      ...rest
    },
    ref
  ) => {
    const getVariantStyles = (): {
      container: React.CSSProperties;
      dotColor: string;
    } => {
      switch (variant) {
        case "primary":
          return {
            container: {
              backgroundColor: "rgba(37, 99, 235, 0.15)",
              color: "#2563EB",
              border: "1px solid rgba(37, 99, 235, 0.3)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.25)",
            },
            dotColor: "#2563EB",
          };
        case "success":
          return {
            container: {
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.25)",
            },
            dotColor: "#10B981",
          };
        case "warning":
          return {
            container: {
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              color: "#D97706",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.25)",
            },
            dotColor: "#F59E0B",
          };
        case "error":
          return {
            container: {
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: "#DC2626",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.25)",
            },
            dotColor: "#EF4444",
          };
        case "info":
          return {
            container: {
              backgroundColor: "rgba(14, 165, 233, 0.12)",
              color: "#0284C7",
              border: "1px solid rgba(14, 165, 233, 0.25)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.25)",
            },
            dotColor: "#0EA5E9",
          };
        case "neutral":
        default:
          return {
            container: {
              backgroundColor: "var(--surface-bg-subtle)",
              color: "var(--text-secondary)",
              border: "1px solid var(--surface-border)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
            },
            dotColor: "var(--text-muted)",
          };
      }
    };

    const { container, dotColor } = getVariantStyles();

    return (
      <span
        ref={ref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: size === "sm" ? "0.15rem 0.45rem" : "0.22rem 0.6rem",
          borderRadius: "9999px",
          fontSize: size === "sm" ? "0.6875rem" : "0.75rem",
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: "0.01em",
          userSelect: "none",
          transition: "all 0.15s var(--ease-spring)",
          ...container,
          ...style,
        }}
        className={`badge badge-${variant} ${className}`}
        {...rest}
      >
        {dot && (
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: dotColor,
              boxShadow: `0 0 0 2px ${dotColor}33`,
              flexShrink: 0,
            }}
          />
        )}
        {icon}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = "Badge";
export default Badge;
