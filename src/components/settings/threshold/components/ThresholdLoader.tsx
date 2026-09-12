import React, { FC } from "react";

export const ThresholdLoader: FC<{ title?: string }> = ({
  title = "Loading threshold configuration...",
}) => {
  return (
    <div className="threshold-loader-container">
      <div className="flex items-center gap-3 mb-6">
        <div className="threshold-skeleton w-48 h-6 rounded" />
        <div className="threshold-skeleton w-28 h-8 rounded ml-auto" />
      </div>
      <div className="threshold-skeleton w-full h-10 rounded-lg mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="threshold-skeleton w-full h-16 rounded-lg" />
        ))}
      </div>
      <p className="text-center text-xs text-slate-400 mt-6 animate-pulse">{title}</p>
    </div>
  );
};

export default ThresholdLoader;
