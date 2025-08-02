interface GoogleCalendarAuthResponse {
  success: boolean;
  data?: {
    authorizationUrl: string;
    isAuthorized: boolean;
  };
  message?: string;
}

interface ConfigurationResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class GoogleCalendarService {
  private baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189") + "/api";

  private getAuthHeaders() {
    // Get auth token from localStorage or sessionStorage
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken")
        : null;

    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  /**
   * Get Google Calendar authorization URL
   */
  async getAuthorizationUrl(redirectUri: string): Promise<GoogleCalendarAuthResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/google-calendar/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Google Calendar authorization URL:', error);
      throw error;
    }
  }

  /**
   * Open Google Calendar authorization in a popup window
   */
  async authorizeWithPopup(): Promise<Promise<boolean>> {
    return new Promise((resolve) => {
      const redirectUri = `${window.location.origin}/google-calendar/callback`;
      
      console.log('Google Calendar authorization - using redirect URI:', redirectUri);
      
      this.getAuthorizationUrl(redirectUri)
        .then((response) => {
          if (response.success && response.data) {
            console.log('Google Calendar authorization URL received:', response.data.authorizationUrl);
            
            // Open popup window for authorization
            const popup = window.open(
              response.data.authorizationUrl,
              "google-calendar-auth",
              "width=500,height=600,scrollbars=yes,resizable=yes"
            );

            if (!popup) {
              console.error('Failed to open popup window');
              resolve(false);
              return;
            }

            // Listen for popup completion
            const checkClosed = setInterval(() => {
              if (popup?.closed) {
                clearInterval(checkClosed);
                // Check auth status again after popup closes
                setTimeout(() => {
                  this.isAuthorized()
                    .then((authResponse) => {
                      resolve(authResponse.success && authResponse.data?.isAuthorized || false);
                    })
                    .catch(() => {
                      resolve(false);
                    });
                }, 1000);
              }
            }, 1000);
          } else {
            console.error('Failed to get authorization URL:', response);
            resolve(false);
          }
        })
        .catch((error) => {
          console.error('Error getting authorization URL:', error);
          resolve(false);
        });
    });
  }

  /**
   * Handle Google Calendar OAuth callback
   */
  async handleCallback(code: string, state: string, redirectUri: string): Promise<GoogleCalendarAuthResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/google-calendar/callback?code=${code}&state=${state}&redirectUri=${encodeURIComponent(redirectUri)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error handling Google Calendar callback:', error);
      throw error;
    }
  }

  /**
   * Check if user is authorized for Google Calendar
   */
  async isAuthorized(): Promise<ConfigurationResponse<{ isAuthorized: boolean }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/google-calendar/is-authorized`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking Google Calendar authorization:', error);
      throw error;
    }
  }

  /**
   * Revoke Google Calendar authorization
   */
  async revokeAuthorization(): Promise<ConfigurationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/google-calendar/revoke`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error revoking Google Calendar authorization:', error);
      throw error;
    }
  }

  /**
   * Create a Google Calendar event with meeting details
   */
  async createEvent(
    title: string,
    date: string,
    time: string,
    duration: number,
    meetLink?: string
  ): Promise<ConfigurationResponse<{ eventId: string; meetLink: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/google-calendar/create-event`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            title,
            date,
            time,
            duration,
            meetLink,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing Google Calendar event
   */
  async updateEvent(
    eventId: string,
    date: string,
    time: string,
    duration: number,
    meetLink?: string
  ): Promise<ConfigurationResponse<{ eventId: string; meetLink: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/google-calendar/update-event`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            eventId,
            date,
            time,
            duration,
            meetLink,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
