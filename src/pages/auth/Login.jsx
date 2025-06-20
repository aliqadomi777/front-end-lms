import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import axios from "axios";

const schema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const getDashboardRoute = (role) => {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instructor/dashboard";
  return "/student/dashboard";
};

const Login = () => {
  const { login, loading, setAuth } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle Google OAuth callback
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleToken = params.get("google_token");
    if (googleToken) {
      axios
        .get("/api/users/me", {
          headers: { Authorization: `Bearer ${googleToken}` },
        })
        .then((res) => {
          setAuth({ user: res.data.data, token: googleToken });
          navigate(getDashboardRoute(res.data.data.role));
        })
        .catch(() => {
          addToast("error", "Google login failed");
        });
    }
    // eslint-disable-next-line
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password);
      navigate(getDashboardRoute(result.user.role));
    } catch (err) {
      setError("password", { message: err.message || "Login failed" });
      addToast("error", err.message || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <Panel className="max-w-md mx-auto mt-10 p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <h2 className="text-3xl font-bold text-center mb-2">Sign In</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>
        <PrimaryButton
          type="submit"
          className="w-full py-2 font-semibold text-base mt-2"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </PrimaryButton>
        <div className="relative flex items-center my-2">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2 font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_17_40)">
              <path
                d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24V29H37.1C36.5 32.1 34.4 34.7 31.5 36.3V42H39C43.4 38.1 47.5 31.9 47.5 24.5Z"
                fill="#4285F4"
              />
              <path
                d="M24 48C30.6 48 36.2 45.7 39.9 42.1L32.1 36.3C30.1 37.6 27.3 38.4 24 38.4C17.7 38.4 12.2 34.2 10.3 28.7H2.3V34.7C6 42.1 14.3 48 24 48Z"
                fill="#34A853"
              />
              <path
                d="M10.3 28.7C9.7 27.4 9.4 25.9 9.4 24.4C9.4 22.9 9.7 21.4 10.3 20.1V14.1H2.3C0.8 17.1 0 20.4 0 24.4C0 28.4 0.8 31.7 2.3 34.7L10.3 28.7Z"
                fill="#FBBC05"
              />
              <path
                d="M24 9.6C27.7 9.6 30.7 10.9 32.8 12.8L39.9 6.1C36.2 2.6 30.6 0.4 24 0.4C14.3 0.4 6 6.3 2.3 13.7L10.3 19.7C12.2 14.2 17.7 9.6 24 9.6Z"
                fill="#EA4335"
              />
            </g>
            <defs>
              <clipPath id="clip0_17_40">
                <rect width="48" height="48" fill="white" />
              </clipPath>
            </defs>
          </svg>
          Sign in with Google
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4 text-sm">
          <Link
            to="/auth/forgot-password"
            className="text-blue-600 hover:underline"
          >
            Forgot Password?
          </Link>
          <Link to="/auth/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </div>
      </form>
    </Panel>
  );
};

export default Login;
