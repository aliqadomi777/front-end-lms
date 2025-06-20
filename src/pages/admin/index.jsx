import React, { lazy } from "react";
import { Link, useLocation, Routes, Route, Navigate } from "react-router-dom";
import Panel from "../../components/Panel";
import Button from "../../components/Button";

const Users = lazy(() => import("./Users"));
const UserProfile = lazy(() => import("./UserProfile"));
const Courses = lazy(() => import("./Courses"));
const CourseProfile = lazy(() => import("./CourseProfile"));
const Dashboard = lazy(() => import("./Dashboard"));
const Settings = lazy(() => import("./Settings"));

const nav = [
  { to: "/admin/dashboard", label: "Analytics" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/courses", label: "Courses" },
  { to: "/admin/settings", label: "Settings" },
];

const AdminIndex = () => {
  const { pathname } = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-500">
          Manage users, courses, and system settings.
        </p>
      </header>

      <Panel className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm">
        {nav.map((item) => (
          <Button
            key={item.to}
            as="Link"
            to={item.to}
            variant={pathname.startsWith(item.to) ? "primary" : "ghost"}
            className="font-medium"
          >
            {item.label}
          </Button>
        ))}
      </Panel>

      <Panel className="p-4 sm:p-6 bg-white rounded-xl shadow-sm">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserProfile />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseProfile />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </Panel>
    </div>
  );
};

export default AdminIndex;
