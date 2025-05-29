"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    setIsLoading(true);

    // Check for stored user session
    try {
      const storedUser = localStorage.getItem("currentUser");
      const token = localStorage.getItem("authToken");

      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      // Clear invalid stored data
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
    }

    setIsLoading(false);
  };

  const login = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to backend
      // For now, using mock data for demo
      if (email === "admin@autohr.com" && password === "admin123") {
        const mockUser: User = {
          id: "1",
          email: "admin@autohr.com",
          name: "HR Admin",
          role: "Administrator",
          avatar: "/api/placeholder/32/32",
        };

        const mockToken = "mock-jwt-token-" + Date.now();

        setUser(mockUser);

        // Store in localStorage if remember me is checked
        if (rememberMe) {
          localStorage.setItem("currentUser", JSON.stringify(mockUser));
          localStorage.setItem("authToken", mockToken);
        } else {
          // Store in sessionStorage for session-only persistence
          sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
          sessionStorage.setItem("authToken", mockToken);
        }

        setIsLoading(false);
        return true;
      } else if (email === "user@autohr.com" && password === "user123") {
        const mockUser: User = {
          id: "2",
          email: "user@autohr.com",
          name: "HR User",
          role: "HR Manager",
          avatar: "/api/placeholder/32/32",
        };

        const mockToken = "mock-jwt-token-" + Date.now();

        setUser(mockUser);

        if (rememberMe) {
          localStorage.setItem("currentUser", JSON.stringify(mockUser));
          localStorage.setItem("authToken", mockToken);
        } else {
          sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
          sessionStorage.setItem("authToken", mockToken);
        }

        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);

    // Clear all stored auth data
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("authToken");

    // TODO: Call backend logout API if needed
    // await api.logout();
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);

      // Update stored user data
      const storedInLocal = localStorage.getItem("currentUser");
      const storedInSession = sessionStorage.getItem("currentUser");

      if (storedInLocal) {
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
      if (storedInSession) {
        sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
