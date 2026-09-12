import React, { FC } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
  label?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "#0071E3",
  className = "",
  label,
}) => {
  const sizePx = size === "sm" ? 18 : size === "lg" ? 36 : 24;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--ads-s2)",
        color: "var(--ads-ink-quaternary)",
      }}
      className={className}
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
    >
      <svg
        width={sizePx}
        height={sizePx}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: "spin 0.8s linear infinite",
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2C6.47715 2 2 6.47715 2 12C2 14.5 2.9 16.8 4.4 18.5"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span style={{ fontSize: "0.875rem", color: "var(--ads-ink-tertiary)" }}>{label}</span>}
    </div>
  );
};

export default LoadingSpinner;
