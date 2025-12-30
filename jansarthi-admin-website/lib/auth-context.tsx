"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAccessToken, clearAccessToken, setAccessToken } from "@/lib/api";

interface User {
  id: number;
  name: string;
  role: "user" | "parshad" | "pwd_worker";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = getAccessToken();
    if (token) {
      // Try to get user from localStorage
      const storedUser = localStorage.getItem("pwd_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === "pwd_worker") {
            setUser(parsedUser);
          } else {
            clearAccessToken();
            localStorage.removeItem("pwd_user");
          }
        } catch {
          clearAccessToken();
          localStorage.removeItem("pwd_user");
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    if (userData.role !== "pwd_worker") {
      throw new Error("Only PWD Workers can access this dashboard");
    }
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem("pwd_user", JSON.stringify(userData));
  };

  const logout = () => {
    clearAccessToken();
    localStorage.removeItem("pwd_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
