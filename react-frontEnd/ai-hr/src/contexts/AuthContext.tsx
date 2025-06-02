"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiService } from "../services/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  userType?: string;
  userCategory: string;
  companyId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
    userType?: "application" | "hiring"
  ) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    company?: string;
    role?: string;
    userType?: "application" | "hiring";
  }) => Promise<boolean>;
  logout: () => Promise<void>;
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
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle automatic navigation on auth state changes
  useEffect(() => {
    if (!isLoading) {
      const currentPath = window.location.pathname;
      const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(
        currentPath
      );

      if (!user && !isAuthPage) {
        // User is not authenticated and not on auth page - redirect to login
        router.replace("/login");
      } else if (user && isAuthPage) {
        // User is authenticated and on auth page - redirect to appropriate dashboard
        if (user.userCategory === "ApplicationUser") {
          router.replace("/applicant");
        } else {
          router.replace("/");
        }
      }
    }
  }, [user, isLoading, router]);

  const checkAuthStatus = async () => {
    setIsLoading(true);

    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const userCategory =
        localStorage.getItem("userCategory") ||
        sessionStorage.getItem("userCategory");

      if (token && userCategory) {
        // Verify token with backend based on user category
        const userData =
          userCategory === "ApplicationUser"
            ? await apiService.getCurrentApplicationUser()
            : await apiService.getCurrentUser();

        const user: User = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          name: `${userData.firstName} ${userData.lastName}`,
          role: userData.userType || userData.roles,
          userType: userData.userType,
          userCategory: userData.userCategory || userCategory,
          companyId: userData.companyId,
        };

        setUser(user);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      // Clear invalid stored data
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userCategory");
      sessionStorage.removeItem("currentUser");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userCategory");
    }

    setIsLoading(false);
  };

  const login = async (
    email: string,
    password: string,
    rememberMe = false,
    userType: "application" | "hiring" = "hiring"
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response =
        userType === "application"
          ? await apiService.applicationUserLogin({ email, password })
          : await apiService.login({ email, password });

      const user: User = {
        id: response.userId,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        name: `${response.firstName} ${response.lastName}`,
        role:
          userType === "application"
            ? "User"
            : (response as any).userType || "User",
        userType:
          userType === "application" ? undefined : (response as any).userType,
        userCategory:
          userType === "application"
            ? "ApplicationUser"
            : (response as any).userCategory,
        companyId:
          userType === "application" ? undefined : (response as any).companyId,
      };

      setUser(user);

      // Store tokens and user data
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("currentUser", JSON.stringify(user));
      storage.setItem("authToken", response.accessToken);
      storage.setItem("refreshToken", response.refreshToken);
      storage.setItem("userCategory", user.userCategory);

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    company?: string;
    role?: string;
    userType?: "application" | "hiring";
  }): Promise<boolean> => {
    setIsLoading(true);

    try {
      const registerData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        userCategory:
          userData.userType === "application"
            ? "ApplicationUser"
            : "HiringUserProfile",
        userType: userData.role?.toLowerCase().replace(" ", "_") || "recruiter",
        bio: "",
        linkedinUrl: "",
        location: {},
        preferences: {},
      };

      const response =
        userData.userType === "application"
          ? await apiService.applicationUserRegister(registerData)
          : await apiService.register(registerData);

      const user: User = {
        id: response.userId,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        name: `${response.firstName} ${response.lastName}`,
        role:
          userData.userType === "application"
            ? "User"
            : (response as any).userType || "User",
        userType:
          userData.userType === "application"
            ? undefined
            : (response as any).userType,
        userCategory:
          userData.userType === "application"
            ? "ApplicationUser"
            : (response as any).userCategory,
        companyId:
          userData.userType === "application"
            ? undefined
            : (response as any).companyId,
      };

      setUser(user);

      // Store tokens and user data in session
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      sessionStorage.setItem("authToken", response.accessToken);
      sessionStorage.setItem("refreshToken", response.refreshToken);
      sessionStorage.setItem("userCategory", user.userCategory);

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    // Get token and userCategory before clearing storage
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const userCategory =
      localStorage.getItem("userCategory") ||
      sessionStorage.getItem("userCategory");

    // Immediately clear auth state and storage for smooth transition
    setUser(null);

    // Clear all stored auth data immediately
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userCategory");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("userCategory");

    // Make API call in background (don't await to avoid delays)
    if (token) {
      // Call appropriate logout endpoint in background - don't block the UI
      try {
        if (userCategory === "ApplicationUser") {
          apiService.applicationUserLogout().catch(console.error);
        } else {
          apiService.logout().catch(console.error);
        }
      } catch (error) {
        // Silently handle errors since user is already logged out locally
        console.error("Background logout error:", error);
      }
    }
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
    register,
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
