import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleProvider } from "./contexts/RoleContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./components/ToastProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LoadingSkeleton from "./components/LoadingSkeleton";

// Lazy load layouts and pages
const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const StudentLayout = lazy(() => import("./layouts/StudentLayout"));
const InstructorLayout = lazy(() => import("./layouts/InstructorLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const NotFound = lazy(() => import("./pages/shared/NotFound"));

// Auth Pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const GoogleCallback = lazy(() => import("./pages/auth/GoogleCallback"));

// Route containers
const StudentRoutes = lazy(() => import("./pages/student"));
const InstructorRoutes = lazy(() => import("./pages/instructor"));
const AdminRoutes = lazy(() => import("./pages/admin")); // Changed from AdminIndex

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <ToastProvider>
              <Router>
                <Suspense
                  fallback={
                    <LoadingSkeleton
                      lines={8}
                      className="mt-10 mx-auto max-w-2xl"
                    />
                  }
                >
                  <Routes>
                    {/* Redirect root to login */}
                    <Route
                      path="/"
                      element={<Navigate to="/auth/login" replace />}
                    />
                    {/* Auth routes */}
                    <Route path="/auth" element={<AuthLayout />}>
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route
                        path="forgot-password"
                        element={<ForgotPassword />}
                      />
                      <Route
                        path="reset-password"
                        element={<ResetPassword />}
                      />
                      <Route
                        path="google/callback"
                        element={<GoogleCallback />}
                      />
                    </Route>
                    {/* Student routes */}
                    <Route path="/student/*" element={<StudentLayout />}>
                      <Route path="*" element={<StudentRoutes />} />
                    </Route>
                    {/* Instructor routes */}
                    <Route path="/instructor/*" element={<InstructorLayout />}>
                      <Route path="*" element={<InstructorRoutes />} />
                    </Route>
                    {/* Admin routes */}
                    <Route path="/admin/*" element={<AdminLayout />}>
                      <Route path="*" element={<AdminRoutes />} />
                    </Route>
                    {/* Shared/404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Router>
            </ToastProvider>
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
