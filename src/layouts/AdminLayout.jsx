import React, { Suspense, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import LoadingSkeleton from "../components/LoadingSkeleton";
import {
  ShieldCheckIcon,
  UsersIcon,
  BookOpenIcon,
  CogIcon,
  LogoutIcon,
  MenuIcon,
  XIcon,
} from "@heroicons/react/outline";

const AdminLayout = () => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menu = [
    { to: "/admin/dashboard", label: "Analytics", icon: ShieldCheckIcon },
    { to: "/admin/users", label: "Users", icon: UsersIcon },
    { to: "/admin/courses", label: "Courses", icon: BookOpenIcon },
    { to: "/admin/settings", label: "Settings", icon: CogIcon },
  ];

  const NavItem = ({ to, icon, children }) => {
    const Icon = icon;
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isActive
              ? "bg-gray-900 text-white"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }`
        }
      >
        <Icon className="w-6 h-6 mr-3" />
        {children}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button onClick={() => setSidebarOpen(true)}>
          <MenuIcon className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 p-4 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-10 flex flex-col`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">LMS Admin</h1>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 space-y-2">
          {menu.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon}>
              {item.label}
            </NavItem>
          ))}
        </nav>
        <div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <LogoutIcon className="w-6 h-6 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSkeleton lines={8} />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
