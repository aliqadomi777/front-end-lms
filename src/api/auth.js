import axios from "axios";

const API_URL = "/api/users";

export const login = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    if (res.data.success && res.data.token && res.data.user) {
      return { token: res.data.token, user: res.data.user };
    }
    throw new Error(res.data.message || "Login failed");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Login failed"
    );
  }
};

export const getProfile = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.user) {
      return { user: res.data.user };
    }
    throw new Error(res.data.message || "Failed to fetch profile");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch profile"
    );
  }
};

export const logout = () => {
  // No backend call needed, just clear token on frontend
  return true;
};

export const startGoogleLogin = () => {
  window.location.href = "/api/auth/google";
};

export const fetchGoogleUser = async (token) => {
  return axios.get("/api/users/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const registerUser = async (data) => {
  try {
    const res = await axios.post("/api/users/register", data);
    if (res.data.success && res.data.user) {
      return { user: res.data.user };
    }
    throw new Error(res.data.message || "Registration failed");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Registration failed"
    );
  }
};
