"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import {
  ProfileNavigation,
  ProfileLayout,
  ProfileHeader,
  PersonalInformation,
  AccountSecurity,
  UserPreferences,
  RolePermissions,
  ActivityUsage,
  ConnectedIntegrations,
  PrivacyData,
  Toast,
} from "@/components";
import {
  UserProfile,
  PersonalInfo,
  SecuritySettings,
  UserPreferences as UserPrefs,
  RoleInfo,
  ActivityData,
  ConnectedIntegration,
  PrivacySettings,
} from "@/interfaces";
import { Loader2, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Real user profile data from backend
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [rawUserData, setRawUserData] = useState<any>(null);

  // Fetch user profile data from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated || !user) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const token =
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken");

        if (!token) {
          setError("No authentication token found");
          logout();
          return;
        }

        // Fetch user data from appropriate endpoint based on user type
        const userData =
          user.userCategory === "ApplicationUser"
            ? await apiService.getCurrentApplicationUser(token)
            : await apiService.getCurrentUser(token);

        setRawUserData(userData);

        // Convert backend data to UserProfile format
        const profileData: UserProfile = {
          personalInfo: {
            firstName: userData.firstName || user.firstName,
            lastName: userData.lastName || user.lastName,
            email: userData.email || user.email,
            linkedinUrl: userData.linkedinUrl || "",
            jobTitle:
              userData.userType || user.role || user.userType || "Employee",
            department: userData.department || "Not specified",
            bio: userData.bio || "No bio available",
            profilePicture: userData.profilePicture || "",
            timezone: userData.timezone || "America/New_York",
            language: userData.language || "English",
            startDate: userData.createdAt
              ? new Date(userData.createdAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            employeeId: userData.id || user.id,
          },
          securitySettings: {
            passwordLastChanged: userData.passwordLastChanged
              ? new Date(userData.passwordLastChanged)
              : new Date(),
            twoFactorEnabled: userData.twoFactorEnabled || false,
            trustedDevices: [],
            loginHistory: [],
            activeSessions: [
              {
                id: "current",
                device: "Current Device",
                browser: navigator.userAgent.includes("Chrome")
                  ? "Chrome"
                  : "Unknown",
                location: "Current Location",
                startTime: new Date(),
                lastActivity: new Date(),
                current: true,
              },
            ],
            securityScore: 75,
          },
          preferences: {
            theme: userData.preferences?.theme || "light",
            notifications: userData.preferences?.notifications || [
              {
                id: "1",
                category: "Application Updates",
                title: "New Applications",
                description: "Receive notifications when new candidates apply",
                email: true,
                push: true,
                sms: false,
              },
              {
                id: "2",
                category: "Interview Scheduling",
                title: "Interview Reminders",
                description: "Get reminded about upcoming interviews",
                email: true,
                push: true,
                sms: true,
              },
            ],
            language: userData.preferences?.language || "en",
            timezone: userData.preferences?.timezone || "America/New_York",
            dateFormat: userData.preferences?.dateFormat || "MM/DD/YYYY",
            timeFormat: userData.preferences?.timeFormat || "12h",
            emailDigest: userData.preferences?.emailDigest || "weekly",
            autoSave: userData.preferences?.autoSave !== false,
          },
          roleInfo: {
            currentRole: userData.userType || user.role || "Employee",
            department: userData.department || "Not specified",
            manager: userData.manager || null,
            directReports: userData.directReports || [],
            permissions: userData.permissions || [
              {
                id: "1",
                name:
                  user.userCategory === "HiringUserProfile"
                    ? "View All Candidates"
                    : "Apply for Jobs",
                description:
                  user.userCategory === "HiringUserProfile"
                    ? "Access to view all candidate profiles"
                    : "Apply for open positions",
                granted: true,
                category:
                  user.userCategory === "HiringUserProfile"
                    ? "Candidates"
                    : "Applications",
              },
            ],
            accessLevel:
              userData.roles === "admin" || user.role === "admin"
                ? "admin"
                : "basic",
            roleDescription:
              user.userCategory === "HiringUserProfile"
                ? "Responsible for talent acquisition, employee management, and HR processes."
                : "Job applicant seeking new opportunities and career growth.",
          },
          activityData: {
            recentActions: [],
            loginStats: {
              totalLogins: userData.totalLogins || 0,
              lastWeek: 0,
              averageSessionDuration: 120,
              mostActiveDay: "Monday",
              mostActiveHour: 9,
            },
            featureUsage: [],
            timeSpent: {
              today: 0,
              thisWeek: 0,
              thisMonth: 0,
              averageDaily: 0,
            },
          },
          connectedIntegrations: userData.connectedIntegrations || [],
          privacySettings: {
            profileVisibility:
              userData.privacySettings?.profileVisibility || "team",
            activityVisibility:
              userData.privacySettings?.activityVisibility || "private",
            contactInfoVisibility:
              userData.privacySettings?.contactInfoVisibility || "team",
            dataRetention: userData.privacySettings?.dataRetention || 12,
            allowAnalytics: userData.privacySettings?.allowAnalytics !== false,
            allowMarketing: userData.privacySettings?.allowMarketing !== false,
            allowThirdParty: userData.privacySettings?.allowThirdParty || false,
          },
        };

        setUserProfile(profileData);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load user profile. Please try again.");

        // If there's an authentication error, logout
        if (error instanceof Error && error.message.includes("401")) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, user, logout]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Profile
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Failed to load user profile"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  // Toast helper
  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Event handlers
  const handlePersonalInfoUpdate = async (updatedInfo: PersonalInfo) => {
    setIsLoading(true);
    try {
      if (!user || !userProfile) {
        throw new Error("User or profile not available");
      }

      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      if (!token) {
        throw new Error("No authentication token found");
        return;
      }

      // Prepare the update data according to the backend contract
      const updateData = {
        FirstName: updatedInfo.firstName,
        LastName: updatedInfo.lastName,
        Email: updatedInfo.email,
        LinkedinUrl: updatedInfo.linkedinUrl,
        Bio: updatedInfo.bio,
        // Note: Other fields like timezone, language are stored in Preferences
        Preferences: {
          ...rawUserData?.preferences,
          timezone: updatedInfo.timezone,
          language: updatedInfo.language,
        },
        // Map other fields if needed
        UserType: updatedInfo.jobTitle,
      };

      console.log("[DEBUG] Updating profile with data:", updateData);

      // Call the real API endpoint
      if ((user.userCategory as string) === "HiringUserProfile") {
        await apiService.updateHiringUserProfile(user.id, updateData, token);
      } else if ((user.userCategory as string) === "ApplicationUser") {
        // For ApplicationUser, we'd need a similar endpoint
        console.log(
          "[DEBUG] ApplicationUser profile update not implemented yet"
        );
        throw new Error("Profile update not available for this user type");
      } else {
        throw new Error("Unknown user type");
      }

      // Update local state
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              personalInfo: updatedInfo,
            }
          : null
      );

      // Refresh user data from backend
      const userData =
        (user.userCategory as string) === "ApplicationUser"
          ? await apiService.getCurrentApplicationUser(token)
          : await apiService.getCurrentUser(token);

      setRawUserData(userData);

      showToast("Personal information updated successfully", "success");
    } catch (error) {
      console.error("Profile update error:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update personal information",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityUpdate = async (
    updatedSecurity: Partial<SecuritySettings>
  ) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (userProfile) {
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                securitySettings: {
                  ...prev.securitySettings,
                  ...updatedSecurity,
                },
              }
            : null
        );
        showToast("Security settings updated successfully", "success");
      }
    } catch (error) {
      showToast("Failed to update security settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async (updatedPrefs: UserPrefs) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (userProfile) {
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                preferences: updatedPrefs,
              }
            : null
        );
        showToast("Preferences updated successfully", "success");
      }
    } catch (error) {
      showToast("Failed to update preferences", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrationToggle = async (integrationId: string) => {
    if (!userProfile) return;

    const updatedIntegrations = userProfile.connectedIntegrations.map(
      (integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              connected: !integration.connected,
              connectedAt: !integration.connected ? new Date() : undefined,
              status: (!integration.connected ? "active" : "inactive") as
                | "active"
                | "inactive"
                | "error",
            }
          : integration
    );

    setUserProfile((prev) =>
      prev
        ? {
            ...prev,
            connectedIntegrations: updatedIntegrations,
          }
        : null
    );

    showToast(
      `Integration ${
        updatedIntegrations.find((i) => i.id === integrationId)?.connected
          ? "connected"
          : "disconnected"
      } successfully`,
      "success"
    );
  };

  const handlePrivacyUpdate = async (updatedPrivacy: PrivacySettings) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (userProfile) {
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                privacySettings: updatedPrivacy,
              }
            : null
        );
        showToast("Privacy settings updated successfully", "success");
      }
    } catch (error) {
      showToast("Failed to update privacy settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <PersonalInformation
            personalInfo={userProfile.personalInfo}
            onUpdate={handlePersonalInfoUpdate}
            isLoading={isLoading}
          />
        );
      case "security":
        return (
          <AccountSecurity
            securitySettings={userProfile.securitySettings}
            onUpdate={handleSecurityUpdate}
            isLoading={isLoading}
          />
        );
      case "preferences":
        return (
          <UserPreferences
            preferences={userProfile.preferences}
            onUpdate={handlePreferencesUpdate}
            isLoading={isLoading}
          />
        );
      case "role":
        return <RolePermissions roleInfo={userProfile.roleInfo} />;
      case "activity":
        return <ActivityUsage activityData={userProfile.activityData} />;
      case "integrations":
        return (
          <ConnectedIntegrations
            integrations={userProfile.connectedIntegrations}
            onToggle={handleIntegrationToggle}
            isLoading={isLoading}
          />
        );
      case "privacy":
        return (
          <PrivacyData
            privacySettings={userProfile.privacySettings}
            onUpdate={handlePrivacyUpdate}
            isLoading={isLoading}
          />
        );
      default:
        return (
          <PersonalInformation
            personalInfo={userProfile.personalInfo}
            onUpdate={handlePersonalInfoUpdate}
            isLoading={isLoading}
          />
        );
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <ProfileHeader personalInfo={userProfile.personalInfo} />

        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          <ProfileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <ProfileLayout>{renderTabContent()}</ProfileLayout>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}