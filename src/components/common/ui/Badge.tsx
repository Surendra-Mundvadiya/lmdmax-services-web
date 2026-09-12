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
    // Variants map onto the `.ads-badge--*` primitives; the tint/ink pairs
    // below come straight from the design system's semantic tokens.
    const ADS_VARIANT: Record<BadgeVariant, string> = {
      primary: "blue",
      info: "blue",
      success: "green",
      warning: "amber",
      error: "red",
      neutral: "neutral",
    };

    const DOT_COLOR: Record<BadgeVariant, string> = {
      primary: "var(--ads-blue)",
      info: "var(--ads-blue)",
      success: "var(--ads-green)",
      warning: "var(--ads-amber)",
      error: "var(--ads-red)",
      neutral: "var(--ads-ink-quaternary)",
    };

    return (
      <span
        ref={ref}
        style={{
          gap: "var(--ads-s1)",
          padding: size === "sm" ? "2px 8px" : "3px 9px",
          fontSize: size === "sm" ? "0.6875rem" : "0.75rem",
          userSelect: "none",
          transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease)",
          ...style,
        }}
        className={`ads-badge ads-badge--${ADS_VARIANT[variant]} badge badge-${variant} ${className}`}
        {...rest}
      >
        {dot && (
          <span
            aria-hidden="true"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "var(--ads-r-pill)",
              backgroundColor: DOT_COLOR[variant],
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
