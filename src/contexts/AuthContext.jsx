import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getProfile,
  login as apiLogin,
  logout as apiLogout,
} from "../api/auth";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      getProfile(token)
        .then((res) => {
          setUser(res.user);
          setRole(res.user.role);
        })
        .catch(() => {
          setUser(null);
          setRole(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("/api/users/login", { email, password });
      setUser(res.data.data.user);
      setToken(res.data.data.token);
      localStorage.setItem("token", res.data.data.token);
      setRole(res.data.data.user.role);
      setLoading(false);
      return { user: res.data.data.user, token: res.data.data.token };
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const setAuth = ({ user, token }) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("token", token);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, token, login, logout, loading, error, setAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
