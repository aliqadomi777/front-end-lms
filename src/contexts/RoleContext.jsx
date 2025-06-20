import React, { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const RoleContext = createContext();

const menuConfig = {
  student: [
    { label: "Dashboard", path: "/student/dashboard" },
    { label: "Courses", path: "/student/courses" },
    { label: "Assignments", path: "/student/assignments" },
    { label: "Quizzes", path: "/student/quizzes" },
    { label: "Wishlist", path: "/student/wishlist" },
    { label: "Analytics", path: "/student/analytics" },
    { label: "Profile", path: "/student/profile" },
  ],
  instructor: [
    { label: "Dashboard", path: "/instructor/dashboard" },
    { label: "My Courses", path: "/instructor/my-courses" },
    { label: "Assignments", path: "/instructor/assignments" },
    { label: "Quizzes", path: "/instructor/quizzes" },
    { label: "Analytics", path: "/instructor/analytics" },
    { label: "Profile", path: "/instructor/profile" },
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Users", path: "/admin/users" },
    { label: "Courses", path: "/admin/courses" },
    { label: "Approvals", path: "/admin/approvals" },
    { label: "Analytics", path: "/admin/analytics" },
    { label: "System Health", path: "/admin/system-health" },
  ],
};

export const RoleProvider = ({ children }) => {
  const { role } = useAuth();
  const menu = menuConfig[role] || [];
  return (
    <RoleContext.Provider value={{ role, menu }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
