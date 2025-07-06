// Cookie utility functions for session management across tabs

interface CookieOptions {
  expires?: number; // days
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export const cookieUtils = {
  /**
   * Set a cookie with the given name, value, and options
   */
  set(name: string, value: string, options: CookieOptions = {}): void {
    // Don't set cookies on server side
    if (typeof window === "undefined") {
      return;
    }

    const {
      expires = 7, // Default to 7 days
      path = "/",
      domain,
      secure = window.location.protocol === "https:",
      sameSite = "Lax",
    } = options;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}`;

    if (expires) {
      const date = new Date();
      date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    }

    if (path) {
      cookieString += `; path=${path}`;
    }

    if (domain) {
      cookieString += `; domain=${domain}`;
    }

    if (secure) {
      cookieString += "; secure";
    }

    if (sameSite) {
      cookieString += `; samesite=${sameSite}`;
    }

    document.cookie = cookieString;
  },

  /**
   * Get a cookie value by name
   */
  get(name: string): string | null {
    // Don't get cookies on server side
    if (typeof window === "undefined") {
      return null;
    }

    const nameEQ = encodeURIComponent(name) + "=";
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(
          cookie.substring(nameEQ.length, cookie.length)
        );
      }
    }
    return null;
  },

  /**
   * Remove a cookie by setting its expiration date to the past
   */
  remove(name: string, options: CookieOptions = {}): void {
    // Don't remove cookies on server side
    if (typeof window === "undefined") {
      return;
    }

    const { path = "/", domain } = options;

    let cookieString = `${encodeURIComponent(
      name
    )}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    if (path) {
      cookieString += `; path=${path}`;
    }

    if (domain) {
      cookieString += `; domain=${domain}`;
    }

    document.cookie = cookieString;
  },

  /**
   * Check if cookies are enabled in the browser
   */
  isEnabled(): boolean {
    // Don't check on server side
    if (typeof window === "undefined") {
      return false;
    }

    try {
      this.set("test", "test");
      const result = this.get("test") === "test";
      this.remove("test");
      return result;
    } catch {
      return false;
    }
  },
};

// Session-specific cookie functions
export const sessionCookies = {
  /**
   * Set session data in cookies
   */
  setSessionData(
    data: {
      authToken: string;
      refreshToken: string;
      userCategory: string;
      userData: string; // JSON stringified user data
    },
    rememberMe: boolean = false
  ): void {
    const expires = rememberMe ? 30 : 1; // 30 days for remember me, 1 day for session
    const isSecure = window.location.protocol === "https:";

    cookieUtils.set("authToken", data.authToken, { expires, secure: isSecure });
    cookieUtils.set("refreshToken", data.refreshToken, {
      expires,
      secure: isSecure,
    });
    cookieUtils.set("userCategory", data.userCategory, {
      expires,
      secure: isSecure,
    });
    cookieUtils.set("userData", data.userData, { expires, secure: isSecure });
  },

  /**
   * Get session data from cookies
   */
  getSessionData(): {
    authToken: string | null;
    refreshToken: string | null;
    userCategory: string | null;
    userData: string | null;
  } {
    return {
      authToken: cookieUtils.get("authToken"),
      refreshToken: cookieUtils.get("refreshToken"),
      userCategory: cookieUtils.get("userCategory"),
      userData: cookieUtils.get("userData"),
    };
  },

  /**
   * Clear all session cookies
   */
  clearSessionData(): void {
    cookieUtils.remove("authToken");
    cookieUtils.remove("refreshToken");
    cookieUtils.remove("userCategory");
    cookieUtils.remove("userData");
  },

  /**
   * Check if session data exists in cookies
   */
  hasSessionData(): boolean {
    const data = this.getSessionData();
    return !!(data.authToken && data.userCategory);
  },
};
