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
import { sessionCookies } from "../utils/cookieUtils";
import { storageEvents } from "../utils/storageEvents";

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
    // Only check auth status on client side
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    // Don't set up storage events on server side
    if (typeof window === 'undefined') {
      return;
    }

    const cleanup = storageEvents.listen((event) => {
      if (event.type === 'logout') {
        // Another tab logged out, clear auth state in this tab
        setUser(null);
        sessionCookies.clearSessionData();
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userCategory");
        sessionStorage.removeItem("currentUser");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("userCategory");
      } else if (event.type === 'login') {
        // Another tab logged in, refresh auth status
    checkAuthStatus();
      }
    });

    return cleanup;
  }, []);

  // Handle automatic navigation on auth state changes
  useEffect(() => {
    // Only handle navigation on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (!isLoading) {
      const currentPath = window.location.pathname;
      const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(
        currentPath
      );
      const isPublicPage =
        currentPath.startsWith("/jobs") ||
        currentPath === "/" ||
        currentPath.startsWith("/public/") ||
        currentPath.startsWith("/public");

      if (!user && !isAuthPage && !isPublicPage) {
        // User is not authenticated and not on auth page or public page - redirect to public
        router.replace("/public");
      } else if (user && isAuthPage) {
        // User is authenticated and on auth page - redirect to appropriate dashboard
        // Use push instead of replace to avoid navigation conflicts
        if (user.userCategory === "ApplicationUser") {
          router.push("/applicant");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, isLoading, router]);

  const checkAuthStatus = async () => {
    // Don't check auth status on server side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    console.log("🔄 AuthContext: Starting auth status check");
    setIsLoading(true);

    try {
      // First try to get session data from cookies
      const sessionData = sessionCookies.getSessionData();
      
      console.log("🔍 AuthContext: Session data from cookies:", {
        hasAuthToken: !!sessionData.authToken,
        hasUserCategory: !!sessionData.userCategory,
        hasUserData: !!sessionData.userData,
        userCategory: sessionData.userCategory,
      });
      
      if (sessionData.authToken && sessionData.userCategory && sessionData.userData) {
                  try {
            // Verify token with backend based on user category
            const userData =
              sessionData.userCategory === "ApplicationUser"
                ? await apiService.getCurrentApplicationUser()
                : await apiService.getCurrentUser();

            console.log("🔍 AuthContext - Backend user data response:", userData);

            const user: User = {
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              name: `${userData.firstName} ${userData.lastName}`,
              role: userData.userType || userData.roles,
              userType: userData.userType,
              userCategory: userData.userCategory || sessionData.userCategory,
              companyId: userData.companyId,
            };

            console.log("🔍 AuthContext - Constructed user object:", user);

          setUser(user);
        } catch (error) {
          console.error("Error verifying token:", error);
          // Token is invalid, clear cookies
          sessionCookies.clearSessionData();
        }
      } else {
        // Fallback to localStorage/sessionStorage for backward compatibility
        const token =
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken");
        const userCategory =
          localStorage.getItem("userCategory") ||
          sessionStorage.getItem("userCategory");

        console.log("🔍 AuthContext: Fallback to localStorage/sessionStorage:", {
          hasToken: !!token,
          hasUserCategory: !!userCategory,
          userCategory: userCategory,
        });

        if (token && userCategory) {
          try {
        // Verify token with backend based on user category
        const userData =
          userCategory === "ApplicationUser"
            ? await apiService.getCurrentApplicationUser()
            : await apiService.getCurrentUser();

            console.log("🔍 AuthContext (localStorage) - Backend user data response:", userData);

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

            console.log("🔍 AuthContext (localStorage) - Constructed user object:", user);

        setUser(user);
            
            // Migrate to cookies for future sessions
            sessionCookies.setSessionData({
              authToken: token,
              refreshToken: localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken") || "",
              userCategory: user.userCategory,
              userData: JSON.stringify(user),
            }, true);
          } catch (error) {
            console.error("Error verifying localStorage token:", error);
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
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      // Clear all stored auth data
      sessionCookies.clearSessionData();
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userCategory");
      sessionStorage.removeItem("currentUser");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userCategory");
    }

    console.log("✅ AuthContext: Auth status check complete", {
      hasUser: !!user,
      userCategory: user?.userCategory,
      isLoading: false,
    });
    setIsLoading(false);
  };

  const login = async (
    email: string,
    password: string,
    rememberMe = false,
    userType: "application" | "hiring" = "hiring"
  ): Promise<boolean> => {
    // Don't set global loading state during login to prevent double loading
    // The login form will handle its own loading state

    try {
      const response =
        userType === "application"
          ? await apiService.applicationUserLogin({ email, password })
          : await apiService.login({ email, password });

      console.log("🔍 AuthContext - Login response from backend:", response);

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

      console.log("🔍 AuthContext - Constructed user from login:", user);

      setUser(user);

      // Store session data in cookies for cross-tab persistence
      const sessionData = {
        authToken: response.accessToken,
        refreshToken: response.refreshToken,
        userCategory: user.userCategory,
        userData: JSON.stringify(user),
      };
      
      sessionCookies.setSessionData(sessionData, rememberMe);

      // Also store in localStorage/sessionStorage for backward compatibility
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("currentUser", JSON.stringify(user));
      storage.setItem("authToken", response.accessToken);
      storage.setItem("refreshToken", response.refreshToken);
      storage.setItem("userCategory", user.userCategory);

      // Notify other tabs about the login
      storageEvents.dispatch('login', { userCategory: user.userCategory });

      return true;
    } catch (error) {
      console.error("Login error:", error);
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

      // Store session data in cookies for cross-tab persistence
      sessionCookies.setSessionData({
        authToken: response.accessToken,
        refreshToken: response.refreshToken,
        userCategory: user.userCategory,
        userData: JSON.stringify(user),
      }, false); // Registration always uses session cookies (not remember me)

      // Also store in sessionStorage for backward compatibility
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      sessionStorage.setItem("authToken", response.accessToken);
      sessionStorage.setItem("refreshToken", response.refreshToken);
      sessionStorage.setItem("userCategory", user.userCategory);

      // Notify other tabs about the login
      storageEvents.dispatch('login', { userCategory: user.userCategory });

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
    sessionCookies.clearSessionData();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userCategory");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("userCategory");

    // Notify other tabs about the logout
    storageEvents.dispatch('logout');

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

      // Update stored user data in cookies
      const sessionData = sessionCookies.getSessionData();
      if (sessionData.authToken) {
        sessionCookies.setSessionData({
          authToken: sessionData.authToken,
          refreshToken: sessionData.refreshToken || "",
          userCategory: updatedUser.userCategory,
          userData: JSON.stringify(updatedUser),
        }, true); // Preserve remember me setting
      }

      // Update stored user data in localStorage/sessionStorage
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
