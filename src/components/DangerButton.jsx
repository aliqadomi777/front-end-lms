import React from "react";

const DangerButton = ({ children, className = "", ...props }) => (
  <button
    className={`px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 focus:outline-none focus:ring transition disabled:opacity-60 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default DangerButton;
