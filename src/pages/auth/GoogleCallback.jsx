import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import Panel from "../../components/Panel";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import PrimaryButton from "../../components/PrimaryButton";
import axios from "axios";

const getDashboardRoute = (role) => {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instructor/dashboard";
  return "/student/dashboard";
};

const GoogleCallback = () => {
  const { setAuth } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = React.useState(null);

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
          setError("Google login failed. Please try again.");
          addToast("error", "Google login failed");
        });
    } else {
      setError("No Google token found in callback URL.");
    }
    // eslint-disable-next-line
  }, []);

  if (error) {
    return (
      <Panel className="max-w-md mx-auto mt-10 p-6 sm:p-8 flex flex-col gap-6 shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-2 text-red-600">
          Google Login Error
        </h2>
        <p className="mb-4 text-base">{error}</p>
        <PrimaryButton as="a" href="/auth/login" className="w-full">
          Back to Login
        </PrimaryButton>
      </Panel>
    );
  }
  return <LoadingSkeleton lines={6} className="mt-10 max-w-md mx-auto" />;
};

export default GoogleCallback;
