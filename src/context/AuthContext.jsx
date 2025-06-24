

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authAPI } from "@/lib/api";

// Create and export the context directly
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('accessToken'));
  
  // Listen for localStorage changes
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('accessToken');
      setHasToken(!!token);
    };
    
    // Check immediately
    checkToken();
    
    // Listen for storage events (when localStorage changes in other tabs/windows)
    window.addEventListener('storage', checkToken);
    
    // Custom event for same-tab localStorage changes
    window.addEventListener('localStorageChange', checkToken);
    
    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('localStorageChange', checkToken);
    };
  }, []);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const res = await authAPI.getProfile();

      return res.data.user;
    },
    retry: false,
    enabled: hasToken, // Only run if we have a token
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (data) {  // ✅ data is already the user object
      setUser(data);
    } else if (error || !hasToken) {
      setUser(null);
    }
  }, [data, error, hasToken]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: hasToken ? isLoading : false, 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the hook directly
export const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;