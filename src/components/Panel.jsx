import React from "react";

const Panel = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded shadow p-6 ${className}`} {...props}>
    {children}
  </div>
);

export default Panel;
