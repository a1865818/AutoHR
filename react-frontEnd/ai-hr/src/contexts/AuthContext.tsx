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
    rememberMe?: boolean
  ) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    company?: string;
    role?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Rebuild a User from a stored JSON blob (the shape written at login/register).
 * Used to keep a session alive when a transient `/auth/me` re-validation fails,
 * instead of logging the user out. The bearer token is re-validated server-side
 * on every real API call, so trusting the cached user here is safe. Returns null
 * when the blob is missing or unusable.
 */
function parseStoredUser(raw: string | null | undefined): User | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (!p || !p.id) return null;
    return {
      id: p.id,
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName,
      name: p.name || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
      role: p.role || p.userType || "HiringUser",
      userType: p.userType,
      userCategory: p.userCategory || p.userType,
      companyId: p.companyId,
      avatar: p.avatar,
    };
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only check auth status on client side
    if (typeof window !== "undefined") {
      checkAuthStatus();
    }
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    // Don't set up storage events on server side
    if (typeof window === "undefined") {
      return;
    }

    const cleanup = storageEvents.listen((event) => {
      if (event.type === "logout") {
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
      } else if (event.type === "login") {
        // Another tab logged in, refresh auth status
        checkAuthStatus();
      }
    });

    return cleanup;
  }, []);

  // Handle automatic navigation on auth state changes
  useEffect(() => {
    // Only handle navigation on client side
    if (typeof window === "undefined") {
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
          router.push("/dashboard");
        }
      }
    }
  }, [user, isLoading, router]);

  const checkAuthStatus = async () => {
    // Don't check auth status on server side
    if (typeof window === "undefined") {
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

      if (
        sessionData.authToken &&
        sessionData.userCategory &&
        sessionData.userData
      ) {
        try {
          // Verify token with backend using unified endpoint
          const userData = await apiService.getCurrentUser();

          console.log("🔍 AuthContext - Backend user data response:", userData);

          if (userData) {
            const user: User = {
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              name: `${userData.firstName} ${userData.lastName}`,
              role: userData.roles || "HiringUser",
              userType: userData.userType,
              userCategory: userData.userCategory || userData.userType || sessionData.userCategory,
              companyId: userData.companyId,
            };

            console.log("🔍 AuthContext - Constructed user object:", user);

            setUser(user);
          } else {
            // `/auth/me` transiently returned null. Don't log the user out —
            // restore the session from the stored user data. A genuinely invalid
            // token will be rejected (401) on the next real API call instead.
            const cached = parseStoredUser(sessionData.userData);
            if (cached) {
              console.warn(
                "🔍 AuthContext - /auth/me returned null; keeping cached session"
              );
              setUser(cached);
            } else {
              console.log("🔍 AuthContext - No user data and no cache, clearing session");
              sessionCookies.clearSessionData();
            }
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          // Transient verification failure — preserve the cached session rather
          // than forcing a logout on a flaky `/auth/me` response.
          const cached = parseStoredUser(sessionData.userData);
          if (cached) {
            setUser(cached);
          } else {
            sessionCookies.clearSessionData();
          }
        }
      } else {
        // Fallback to localStorage/sessionStorage for backward compatibility
        const token =
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken");
        const userCategory =
          localStorage.getItem("userCategory") ||
          sessionStorage.getItem("userCategory");

        console.log(
          "🔍 AuthContext: Fallback to localStorage/sessionStorage:",
          {
            hasToken: !!token,
            hasUserCategory: !!userCategory,
            userCategory: userCategory,
          }
        );

        if (token && userCategory) {
          // Cached user written at login — used to survive a transient
          // re-validation failure without dropping the (valid) token.
          const cachedUser = parseStoredUser(
            localStorage.getItem("currentUser") ||
              sessionStorage.getItem("currentUser")
          );
          try {
            // Verify token with backend using unified endpoint
            const userData = await apiService.getCurrentUser();

            console.log(
              "🔍 AuthContext (localStorage) - Backend user data response:",
              userData
            );

            if (userData) {
              const user: User = {
                id: userData.id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                name: `${userData.firstName} ${userData.lastName}`,
                role: userData.roles || userData.userType || "HiringUser",
                userType: userData.userType,
                userCategory: userData.userCategory || userData.userType || userCategory,
                companyId: userData.companyId,
              };

              console.log(
                "🔍 AuthContext (localStorage) - Constructed user object:",
                user
              );

              setUser(user);

              // Migrate to cookies for future sessions
              sessionCookies.setSessionData(
                {
                  authToken: token,
                  refreshToken:
                    localStorage.getItem("refreshToken") ||
                    sessionStorage.getItem("refreshToken") ||
                    "",
                  userCategory: user.userCategory,
                  userData: JSON.stringify(user),
                },
                true
              );
            } else if (cachedUser) {
              // `/auth/me` transiently returned null — keep the stored session
              // and the token (it is re-validated on every real API call) rather
              // than logging the user out mid-navigation.
              console.warn(
                "🔍 AuthContext (localStorage) - /auth/me returned null; keeping cached session"
              );
              setUser(cachedUser);
            }
          } catch (error) {
            console.error("Error verifying localStorage token:", error);
            if (cachedUser) {
              // Transient failure — preserve the session from cache instead of
              // wiping a token the backend will validate on the next call.
              setUser(cachedUser);
            } else {
              // No usable cached session — clear the stale data.
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
    rememberMe = false
  ): Promise<boolean> => {
    // Don't set global loading state during login to prevent double loading
    // The login form will handle its own loading state

    try {
      const response = await apiService.login({ email, password });

      console.log("🔍 AuthContext - Login response from backend:", response);

      if (!response) {
        console.log("🔍 AuthContext - No login response received");
        return false;
      }

      const user: User = {
        id: response.userId,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        name: `${response.firstName} ${response.lastName}`,
        role: (response as any).roles || (response as any).userType || "User",
        userType: (response as any).userType,
        userCategory: (response as any).userType || "ApplicationUser",
        companyId: (response as any).companyId,
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
      storageEvents.dispatch("login", { userCategory: user.userCategory });

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
  }): Promise<boolean> => {
    setIsLoading(true);

    try {
      const registerData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        userCategory: "ApplicationUser", // Default for new registrations
        userType: userData.role?.toLowerCase().replace(" ", "_") || "recruiter",
        bio: "",
        linkedinUrl: "",
        location: {},
        preferences: {},
      };

      const response = await apiService.register(registerData);

      if (!response) {
        console.log("🔍 AuthContext - No register response received");
        setIsLoading(false);
        return false;
      }

      const user: User = {
        id: response.userId,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        name: `${response.firstName} ${response.lastName}`,
        role: (response as any).roles || (response as any).userType || "User",
        userType: (response as any).userType,
        userCategory: (response as any).userType || "ApplicationUser",
        companyId: (response as any).companyId,
      };

      setUser(user);

      // Store session data in cookies for cross-tab persistence
      sessionCookies.setSessionData(
        {
          authToken: response.accessToken,
          refreshToken: response.refreshToken,
          userCategory: user.userCategory,
          userData: JSON.stringify(user),
        },
        false
      ); // Registration always uses session cookies (not remember me)

      // Also store in sessionStorage for backward compatibility
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      sessionStorage.setItem("authToken", response.accessToken);
      sessionStorage.setItem("refreshToken", response.refreshToken);
      sessionStorage.setItem("userCategory", user.userCategory);

      // Notify other tabs about the login
      storageEvents.dispatch("login", { userCategory: user.userCategory });

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
    storageEvents.dispatch("logout");

    // Make API call in background (don't await to avoid delays)
    if (token) {
      // Call unified logout endpoint in background - don't block the UI
      try {
        apiService.logout().catch(console.error);
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
        sessionCookies.setSessionData(
          {
            authToken: sessionData.authToken,
            refreshToken: sessionData.refreshToken || "",
            userCategory: updatedUser.userCategory,
            userData: JSON.stringify(updatedUser),
          },
          true
        ); // Preserve remember me setting
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
