import React, { Suspense } from "react";
import { Outlet, Link } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import LoadingSkeleton from "../components/LoadingSkeleton";

const InstructorLayout = () => {
  const { menu } = useRole();
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col p-4">
        <div className="font-bold text-xl mb-6">LMS</div>
        <nav className="flex-1 space-y-2">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between">
          <div className="font-semibold text-lg">Instructor Dashboard</div>
          {/* Add user avatar, notifications, etc. here */}
        </header>
        <main className="flex-1 p-4">
          <ErrorBoundary>
            <Suspense
              fallback={
                <LoadingSkeleton
                  lines={8}
                  className="mt-10 mx-auto max-w-2xl"
                />
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default InstructorLayout;
