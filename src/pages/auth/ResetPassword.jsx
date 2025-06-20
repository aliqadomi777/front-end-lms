import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import { startGoogleLogin } from "../../api/auth";

const schema = Yup.object().shape({
  newPassword: Yup.string().min(8).required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
    .required("Confirm your new password"),
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await axios.post("/api/users/reset-password", {
        email,
        token,
        newPassword: data.newPassword,
      });
      setSubmitted(true);
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch (err) {
      setError("newPassword", {
        message: err.response?.data?.message || "Reset failed",
      });
    }
  };

  return (
    <Panel className="max-w-md mx-auto mt-10 p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
      {submitted ? (
        <div className="text-center text-green-700 font-semibold text-lg py-8">
          Password reset successful! Redirecting to login...
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <h2 className="text-3xl font-bold text-center mb-2">
            Reset Password
          </h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="newPassword" className="font-medium">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base ${
                errors.newPassword ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="font-medium">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <PrimaryButton
            type="submit"
            className="w-full py-2 font-semibold text-base mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </PrimaryButton>
          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-3 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2 font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={startGoogleLogin}
            disabled={isSubmitting}
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
            <Link to="/auth/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </Panel>
  );
};

export default ResetPassword;
