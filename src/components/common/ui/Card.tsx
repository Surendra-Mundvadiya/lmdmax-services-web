import React, { forwardRef, HTMLAttributes, ReactNode } from "react";

export type CardVariant = "frosted" | "elevated" | "subtle";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverLift?: boolean;
  padding?: CardPadding;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "frosted",
      hoverLift = false,
      padding = "md",
      className = "",
      style,
      ...rest
    },
    ref
  ) => {
    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case "elevated":
          return {
            background: "var(--surface-bg-elevated)",
            backdropFilter: "var(--glass-blur-vercel-lg)",
            WebkitBackdropFilter: "var(--glass-blur-vercel-lg)",
            border: "1px solid var(--surface-border)",
            boxShadow: "var(--shadow-ambient-md), var(--surface-bevel)",
          };
        case "subtle":
          return {
            background: "var(--surface-bg-subtle)",
            border: "1px solid var(--surface-border-subtle)",
            boxShadow: "none",
          };
        case "frosted":
        default:
          return {
            background: "var(--surface-bg-card)",
            backdropFilter: "var(--glass-blur-vercel)",
            WebkitBackdropFilter: "var(--glass-blur-vercel)",
            border: "1px solid var(--surface-border)",
            boxShadow: "var(--shadow-ambient-sm), var(--surface-bevel)",
          };
      }
    };

    const getPaddingStyles = (): string => {
      switch (padding) {
        case "none":
          return "0";
        case "sm":
          return "0.85rem";
        case "lg":
          return "1.75rem";
        case "md":
        default:
          return "1.25rem";
      }
    };

    return (
      <div
        ref={ref}
        style={{
          borderRadius: "var(--radius-xl)",
          padding: getPaddingStyles(),
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.22s var(--ease-spring), box-shadow 0.22s var(--ease-spring), border-color 0.22s var(--ease-spring)",
          ...getVariantStyles(),
          ...style,
        }}
        className={`surface-card ${hoverLift ? "hover-lift" : ""} ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  style,
  children,
  ...rest
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      marginBottom: "0.85rem",
      ...style,
    }}
    className={`card-header ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className = "",
  style,
  children,
  ...rest
}) => (
  <h3
    style={{
      fontSize: "1rem",
      fontWeight: 800,
      color: "var(--text-primary)",
      letterSpacing: "-0.01em",
      margin: 0,
      ...style,
    }}
    className={`card-title ${className}`}
    {...rest}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className = "",
  style,
  children,
  ...rest
}) => (
  <p
    style={{
      fontSize: "0.8125rem",
      color: "var(--text-secondary)",
      margin: 0,
      lineHeight: 1.45,
      ...style,
    }}
    className={`card-description ${className}`}
    {...rest}
  >
    {children}
  </p>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  style,
  children,
  ...rest
}) => (
  <div style={{ ...style }} className={`card-content ${className}`} {...rest}>
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  style,
  children,
  ...rest
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: "1rem",
      paddingTop: "0.85rem",
      borderTop: "1px solid var(--surface-border-subtle)",
      ...style,
    }}
    className={`card-footer ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
