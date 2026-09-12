import React, { FC } from "react";

interface LogoProps {
  width?: string | number;
  height?: string | number;
  size?: string | number;
  color?: string;
  className?: string;
  variant?: "full" | "horizontal" | "iconOnly";
}

export const Logo: FC<LogoProps> = ({
  width,
  height,
  size,
  color,
  className = "",
  variant = "horizontal",
}) => {
  const resolvedWidth = width ?? size ?? (variant === "iconOnly" ? 44 : 140);
  const resolvedHeight = height ?? (typeof size === "number" ? size * 0.7 : undefined) ?? (variant === "iconOnly" ? 30 : 32);

  // 1. Clean 3-Pills Emblem Icon
  if (variant === "iconOnly") {
    return (
      <svg
        width={resolvedWidth}
        height={resolvedHeight}
        viewBox="0 0 80 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0 }}
      >
        <rect
          width="15.6389"
          height="43.9609"
          rx="7.81947"
          transform="matrix(0.862097 -0.506743 0.493287 0.869867 42.8306 7.92578)"
          fill="#8EB1F7"
        />
        <rect
          width="15.6561"
          height="43.9134"
          rx="7.82805"
          transform="matrix(0.825603 0.564251 -0.550464 0.834859 27.1728 0)"
          fill="#2563EB"
        />
        <rect
          width="15.6561"
          height="43.9134"
          rx="7.82805"
          transform="matrix(0.825603 0.564251 -0.550464 0.834859 51.0695 0)"
          fill="#2563EB"
        />
      </svg>
    );
  }

  // 2. Modern horizontal lockup: [3-Pills Icon Mark] + [LMDmax Text]
  return (
    <div
      className={`lmdmax-brand-lockup ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.55rem",
        userSelect: "none",
      }}
    >
      <svg
        width={typeof resolvedWidth === "number" ? Math.round(resolvedWidth * 0.3) : "38"}
        height={resolvedHeight}
        viewBox="0 0 80 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect
          width="15.6389"
          height="43.9609"
          rx="7.81947"
          transform="matrix(0.862097 -0.506743 0.493287 0.869867 42.8306 7.92578)"
          fill="#8EB1F7"
        />
        <rect
          width="15.6561"
          height="43.9134"
          rx="7.82805"
          transform="matrix(0.825603 0.564251 -0.550464 0.834859 27.1728 0)"
          fill="#2563EB"
        />
        <rect
          width="15.6561"
          height="43.9134"
          rx="7.82805"
          transform="matrix(0.825603 0.564251 -0.550464 0.834859 51.0695 0)"
          fill="#2563EB"
        />
      </svg>
      <div style={{ display: "flex", alignItems: "baseline", lineHeight: 1 }}>
        <span
          style={{
            fontSize: "1.35rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: color || "#0F172A",
            fontFamily: "var(--font-sans, Inter, sans-serif)",
          }}
        >
          LMD<span style={{ color: "#2563EB" }}>max</span>
        </span>
      </div>
    </div>
  );
};

export default Logo;
