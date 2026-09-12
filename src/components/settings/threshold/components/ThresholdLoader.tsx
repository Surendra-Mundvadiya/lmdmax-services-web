import React, { FC } from "react";

export const ThresholdLoader: FC<{ title?: string }> = ({
  title = "Loading threshold configuration...",
}) => {
  return (
    <div className="threshold-loader-container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--ads-s3)",
          marginBottom: "var(--ads-s6)",
        }}
      >
        <div className="threshold-skeleton" style={{ width: "12rem", height: "24px" }} />
        <div
          className="threshold-skeleton"
          style={{ width: "7rem", height: "32px", marginLeft: "auto" }}
        />
      </div>
      <div
        className="threshold-skeleton"
        style={{ width: "100%", height: "40px", marginBottom: "var(--ads-s4)" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s3)" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="threshold-skeleton"
            style={{ width: "100%", height: "64px" }}
          />
        ))}
      </div>
      <p
        style={{
          margin: "var(--ads-s6) 0 0",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "var(--ads-ink-tertiary)",
        }}
      >
        {title}
      </p>
    </div>
  );
};

export default ThresholdLoader;
