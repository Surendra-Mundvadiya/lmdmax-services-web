import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled,
      className = "",
      style,
      ...rest
    },
    ref
  ) => {
    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case "primary":
          return {
            background: "linear-gradient(135deg, var(--color-glass-blue) 0%, var(--color-glass-blue-deep) 100%)",
            color: "#FFFFFF",
            border: "1px solid var(--color-glass-blue)",
            boxShadow: "0 4px 14px rgba(10, 132, 255, 0.28), inset 0 1px 0 0 rgba(255, 255, 255, 0.35)",
          };
        case "secondary":
          return {
            background: "var(--surface-bg-subtle)",
            color: "var(--text-primary)",
            border: "1px solid var(--surface-border)",
            boxShadow: "var(--shadow-ambient-sm), var(--surface-bevel-subtle)",
          };
        case "outline":
          return {
            background: "var(--surface-bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--surface-border-strong)",
            boxShadow: "var(--shadow-ambient-sm), var(--surface-bevel)",
          };
        case "ghost":
          return {
            background: "transparent",
            color: "var(--text-secondary)",
            border: "1px solid transparent",
          };
        case "danger":
          return {
            background: "rgba(239, 68, 68, 0.1)",
            color: "#EF4444",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.12)",
          };
      }
    };

    const getSizeStyles = (): React.CSSProperties => {
      switch (size) {
        case "sm":
          return {
            padding: "0.32rem 0.75rem",
            fontSize: "0.75rem",
            borderRadius: "8px",
            gap: "0.35rem",
          };
        case "lg":
          return {
            padding: "0.65rem 1.35rem",
            fontSize: "0.95rem",
            borderRadius: "12px",
            gap: "0.55rem",
          };
        case "md":
        default:
          return {
            padding: "0.45rem 1rem",
            fontSize: "0.8125rem",
            borderRadius: "10px",
            gap: "0.45rem",
          };
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          lineHeight: 1.2,
          fontFamily: "inherit",
          cursor: disabled || isLoading ? "not-allowed" : "pointer",
          opacity: disabled || isLoading ? 0.6 : 1,
          transition: "all 0.18s var(--ease-spring)",
          userSelect: "none",
          position: "relative",
          ...getVariantStyles(),
          ...getSizeStyles(),
          ...style,
        }}
        className={`btn-base btn-${variant} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <Loader2 size={size === "sm" ? 12 : size === "lg" ? 18 : 15} className="animate-spin" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
