import React from "react";

const LoadingSkeleton = ({ className = "", lines = 3 }) => (
  <div className={`space-y-2 animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded w-full" />
    ))}
  </div>
);

export default LoadingSkeleton;
