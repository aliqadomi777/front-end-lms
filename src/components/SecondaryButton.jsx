import React from "react";

const SecondaryButton = ({ children, className = "", ...props }) => (
  <button
    className={`px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 focus:outline-none focus:ring transition disabled:opacity-60 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default SecondaryButton;
