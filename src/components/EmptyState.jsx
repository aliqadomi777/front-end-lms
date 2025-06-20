import React from "react";

const EmptyState = ({
  icon = null,
  message,
  action = null,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center text-gray-500 py-12 ${className}`}
  >
    {icon && <div className="mb-4 text-5xl">{icon}</div>}
    <div className="mb-2 text-lg font-medium">{message}</div>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
