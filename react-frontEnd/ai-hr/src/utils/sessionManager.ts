class SessionManager {
  private static instance: SessionManager;
  private sessionId: string | null = null;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public getOrCreateSessionId(): string {
    // Return cached session ID if available
    if (this.sessionId) {
      console.log(`📱 Using cached session ID: ${this.sessionId}`);
      return this.sessionId;
    }

    // Check sessionStorage first
    if (typeof window !== "undefined") {
      const storedSessionId = sessionStorage.getItem("viewSessionId");
      if (storedSessionId) {
        this.sessionId = storedSessionId;
        console.log(`📱 Found existing session ID: ${this.sessionId}`);
        return this.sessionId;
      }

      // Generate new session ID
      this.sessionId = this.generateSessionId();
      sessionStorage.setItem("viewSessionId", this.sessionId);
      console.log(`📱 Generated new session ID: ${this.sessionId}`);
      return this.sessionId;
    }

    // Fallback for server-side rendering
    return "ssr-session";
  }

  private generateSessionId(): string {
    return "view_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
  }

  public clearSessionId(): void {
    this.sessionId = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("viewSessionId");
    }
    console.log("📱 Session ID cleared");
  }
}

export const sessionManager = SessionManager.getInstance();
