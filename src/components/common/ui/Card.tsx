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
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            border: "1px solid var(--ads-hairline)",
            boxShadow: "var(--ads-shadow-md), var(--ads-bevel)",
          };
        case "subtle":
          return {
            background: "rgba(0, 0, 0, 0.04)",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            border: "1px solid var(--ads-hairline)",
            boxShadow: "none",
          };
        case "frosted":
        default:
          return {
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-md)",
            WebkitBackdropFilter: "var(--ads-blur-md)",
            border: "1px solid var(--ads-hairline)",
            boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
          };
      }
    };

    const getPaddingStyles = (): string => {
      switch (padding) {
        case "none":
          return "0";
        case "sm":
          return "var(--ads-s3)";
        case "lg":
          return "var(--ads-s8)";
        case "md":
        default:
          return "var(--ads-s5)";
      }
    };

    return (
      <div
        ref={ref}
        style={{
          borderRadius: "var(--ads-r-lg)",
          padding: getPaddingStyles(),
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          transition:
            "transform var(--ads-dur) var(--ads-ease), box-shadow var(--ads-dur) var(--ads-ease), border-color var(--ads-dur) var(--ads-ease)",
          ...getVariantStyles(),
          ...style,
        }}
        className={`ads-card ${hoverLift ? "ads-card--interactive hover-lift" : ""} surface-card ${className}`}
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
      gap: "var(--ads-s1)",
      marginBottom: "var(--ads-s3)",
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
      fontSize: "1.0625rem",
      fontWeight: 600,
      color: "var(--ads-ink)",
      letterSpacing: "-0.014em",
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
      color: "var(--ads-ink-secondary)",
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
      marginTop: "var(--ads-s4)",
      paddingTop: "var(--ads-s3)",
      borderTop: "1px solid var(--ads-hairline)",
      ...style,
    }}
    className={`card-footer ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
