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
    // Variants map 1:1 onto the `.ads-btn--*` primitives so this kit and the
    // global stylesheet stay a single visual language.
    const adsVariant =
      variant === "outline" ? "secondary" : variant === "danger" ? "danger" : variant;

    const getSizeStyles = (): React.CSSProperties => {
      switch (size) {
        case "sm":
          return { padding: "6px 13px", fontSize: "0.75rem", gap: "var(--ads-s1)" };
        case "lg":
          return { padding: "12px 24px", fontSize: "0.875rem", gap: "var(--ads-s2)" };
        case "md":
        default:
          return { padding: "9px 18px", fontSize: "0.8125rem", gap: "var(--ads-s2)" };
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        style={{
          ...getSizeStyles(),
          ...style,
        }}
        className={`ads-btn ads-btn--${adsVariant} btn-base btn-${variant} ${className}`}
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
