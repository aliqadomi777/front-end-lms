import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import LoadingSkeleton from "../components/LoadingSkeleton";

const AuthLayout = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
      <ErrorBoundary>
        <Suspense fallback={<LoadingSkeleton lines={6} className="mt-6" />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </div>
  </div>
);

export default AuthLayout;
