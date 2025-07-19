class TeamService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
  }


  private getAuthData() {
    // NOTE: We intentionally check cookies first so that authentication works
    // across browser tabs. Only if a value is missing do we fall back to
    // localStorage / sessionStorage so that the old logic still works.

    if (typeof window === "undefined") {
      return {
        token: null,
        userId: null,
        userCategory: null,
        companyId: null,
      };
    }

    let token: string | null = null;
    let userId: string | null = null;
    let userCategory: string | null = null;
    let companyId: string | null = null;

    // ----------------------
    // 1) Try to read cookies
    // ----------------------
    const rawCookies = document.cookie ? document.cookie.split(";") : [];
    rawCookies.forEach((rawCookie) => {
      const cookie = rawCookie.trim();

      if (cookie.startsWith("authToken=")) {
        token = decodeURIComponent(cookie.substring("authToken=".length));
      } else if (cookie.startsWith("userData=")) {
        try {
          const userData = JSON.parse(
            decodeURIComponent(cookie.substring("userData=".length))
          );
          userId = userData.id ?? userData.userId ?? null;
          companyId = userData.companyId ?? null;
          userCategory = userData.userCategory ?? userData.role ?? null;
        } catch (err) {
          console.warn(
            "CandidateRankingService: failed to parse userData from cookie",
            err
          );
        }
      }
    });

    // ----------------------------------------------------
    // 2) Fallback to localStorage / sessionStorage if needed
    // ----------------------------------------------------
    if (!token) {
      token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
    }

    if (!userCategory) {
      userCategory =
        localStorage.getItem("userCategory") ||
        sessionStorage.getItem("userCategory");
    }

    if (!userId || !companyId) {
      const currentUserStr =
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          userId = userId || currentUser.id || null;
          companyId = companyId || currentUser.companyId || null;
        } catch (error) {
          console.warn(
            "CandidateRankingService: failed to parse currentUser from storage",
            error
          );
        }
      }
    }

    // Debug output so we can trace where the token was sourced from
    console.log("🔍 CandidateRankingService.getAuthData()", {
      fromCookie:
        !!token && !!rawCookies.find((c) => c.trim().startsWith("authToken=")),
      fromStorage:
        !!token && !rawCookies.find((c) => c.trim().startsWith("authToken=")),
      hasToken: !!token,
      userId,
      companyId,
    });

    return { token, userId, userCategory, companyId };
  }

  private getHeaders(): HeadersInit {
    const { token } = this.getAuthData();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }
  private isAuthenticated(): boolean {
    const { token, userId, userCategory, companyId } = this.getAuthData();
    return !!(token && userId && companyId && userCategory !== "ApplicationUser");
  }

  // Get team members for the current user's company
  async getTeamMembers(): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view team members");
    }

    const authData = this.getAuthData();
    const { companyId, token, userId, userCategory } = authData;
    
    console.log("🔍 TeamService - Auth data:", {
      hasToken: !!token,
      hasUserId: !!userId,
      hasUserCategory: !!userCategory,
      hasCompanyId: !!companyId,
      companyId: companyId,
      userCategory: userCategory
    });
    
    if (!companyId) {
      throw new Error("Company ID not found - user may not be associated with a company");
    }

    console.log("📤 Fetching team members for company:", companyId);

    try {
      const response = await fetch(
        `${this.baseUrl}/hiring-user-profiles/filter?companyId=${companyId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        const error = await response.text();
        throw new Error(`Failed to fetch team members: ${error}`);
      }

      const data = await response.json();
      console.log("✅ Team members fetched successfully:", data);

      // Transform the data to match the frontend User interface
      const transformedData = data.map((user: any) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.userType || user.roles || "User",
        status: user.isActive ? "active" : "inactive",
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roles: user.roles,
        userType: user.userType,
        companyId: user.companyId,
        bio: user.bio,
        linkedinUrl: user.linkedinUrl,
        location: user.location,
        preferences: user.preferences,
        createdAt: user.createdAt,
      }));

      return transformedData;
    } catch (error) {
      console.error("❌ Failed to fetch team members:", error);
      throw error;
    }
  }

  // Update team member
  async updateTeamMember(userId: string, userData: any): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to update team members");
    }

    console.log("📤 Updating team member:", userId, userData);

    try {
      const response = await fetch(
        `${this.baseUrl}/hiring-user-profiles/${userId}`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update team member: ${error}`);
      }

      const data = await response.json();
      console.log("✅ Team member updated successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Failed to update team member:", error);
      throw error;
    }
  }

  // Delete team member
  async deleteTeamMember(userId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to delete team members");
    }

    console.log("📤 Deleting team member:", userId);

    try {
      const response = await fetch(
        `${this.baseUrl}/hiring-user-profiles/${userId}`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete team member: ${error}`);
      }

      console.log("✅ Team member deleted successfully");
    } catch (error) {
      console.error("❌ Failed to delete team member:", error);
      throw error;
    }
  }

  // Invite new team member
  async inviteTeamMember(inviteData: {
    email: string;
    role: string;
    message?: string;
  }): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to invite team members");
    }

    const { companyId, userId } = this.getAuthData();
    
    if (!companyId) {
      throw new Error("Company ID not found - user may not be associated with a company");
    }

    console.log("📤 Inviting team member:", inviteData);

    try {
      // Get company name for the invitation email
      const companyResponse = await fetch(
        `${this.baseUrl}/companies/${companyId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!companyResponse.ok) {
        throw new Error("Failed to fetch company information");
      }

      const companyData = await companyResponse.json();
      const companyName = companyData.name || "Your Company";

      // Get inviter name from current user profile
      let inviterName = "Team Member";
      if (userId) {
        try {
          const userResponse = await fetch(
            `${this.baseUrl}/hiring-user-profiles/${userId}`,
            {
              method: "GET",
              headers: this.getHeaders(),
            }
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            inviterName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.email || "Team Member";
          }
        } catch (error) {
          console.warn("Failed to fetch inviter details, using default name:", error);
        }
      }

      // Send team invitation email
      const emailResult = await this.sendTeamInvitationEmail({
        email: inviteData.email,
        role: inviteData.role,
        companyId: companyId,
        inviterName: inviterName,
        companyName: companyName,
        customSubject: `You're invited to join ${companyName} as ${inviteData.role}`,
        customBody: inviteData.message || `You've been invited to join ${companyName} as a ${inviteData.role}. Click the link in this email to accept the invitation and set up your account.`,
      });

      if (emailResult.success) {
        console.log("✅ Team invitation sent successfully");
        return {
          success: true,
          message: `Invitation sent to ${inviteData.email}`,
          email: inviteData.email,
          role: inviteData.role,
          companyId: companyId,
          companyName: companyName,
          inviterName: inviterName,
        };
      } else {
        throw new Error(`Failed to send invitation email: ${emailResult.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Failed to invite team member:", error);
      throw error;
    }
  }

  // Send team invitation email
  async sendTeamInvitationEmail(data: {
    email: string;
    role: string;
    companyId: string;
    inviterName: string;
    companyName: string;
    templateId?: string;
    customSubject?: string;
    customBody?: string;
  }): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to send team invitation emails");
    }

    console.log("📧 Sending team invitation email:", data);

    try {
      // Generate invitation URL
      const invitationUrl = `http://localhost:3000/signup/hiring/existing-company/${data.companyId}`;

      // Replace placeholders in subject and body
      const replacePlaceholders = (text: string) => {
        return text
          .replace(/\{\{inviteeEmail\}\}/g, data.email)
          .replace(/\{\{inviterName\}\}/g, data.inviterName)
          .replace(/\{\{companyName\}\}/g, data.companyName)
          .replace(/\{\{role\}\}/g, data.role)
          .replace(/\{\{invitationUrl\}\}/g, invitationUrl);
      };

      const personalizedSubject = data.customSubject ? replacePlaceholders(data.customSubject) : "";
      const personalizedBody = data.customBody ? replacePlaceholders(data.customBody) : "";

      // Send email using the new team invitation endpoint
      const emailRequestData = {
        email: data.email,
        subject: personalizedSubject,
        body: personalizedBody
      };

      const response = await fetch(
        `${this.baseUrl}/api/emails/team-invitation`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(emailRequestData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send team invitation email: ${error}`);
      }

      const result = await response.json();
      console.log("✅ Team invitation email sent successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to send team invitation email:", error);
      throw error;
    }
  }
}

export const teamService = new TeamService(); 