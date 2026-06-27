import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("doorvision_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("doorvision_token");
  });

  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(token && user);

  async function login(email, password) {
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("doorvision_token", data.access_token);
      localStorage.setItem("doorvision_user", JSON.stringify(data.user));

      setToken(data.access_token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.detail || "Login failed. Please try again.";

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("doorvision_token");
    localStorage.removeItem("doorvision_user");
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    async function validateUser() {
      if (!token) return;

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        localStorage.setItem("doorvision_user", JSON.stringify(currentUser));
      } catch {
        logout();
      }
    }

    validateUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}