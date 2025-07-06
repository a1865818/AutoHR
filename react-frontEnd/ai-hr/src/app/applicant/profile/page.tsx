"use client";

import {
  AccountSecurity,
  ActivityUsage,
  ConnectedIntegrations,
  PersonalInformation,
  PrivacyData,
  ProfileHeader,
  ProfileLayout,
  Toast,
  UserPreferences,
} from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import {
  PersonalInfo,
  PrivacySettings,
  SecuritySettings,
  UserPreferences as UserPrefs,
  UserProfile,
} from "@/interfaces";
import { apiService } from "@/services/api";
import {
  Activity,
  AlertCircle,
  AppWindowMac,
  Briefcase,
  FileText,
  FileUser,
  GlobeLock,
  GraduationCap,
  List,
  Loader2,
  Shield,
  Target,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ApplicationsSection } from "@/components/profile/applicants/ApplicationsSection";
import { EducationSection } from "@/components/profile/applicants/EducationSection";
import { ExperienceSection } from "@/components/profile/applicants/ExperienceSection";
import { ResumeSection } from "@/components/profile/applicants/ResumeSection";
import { SkillsSection } from "@/components/profile/applicants/SkillsSection";
import { ApplicationUserData } from "@/interfaces/applicantProfile";

export default function ApplicantProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();

  console.log("🔄 ApplicantProfilePage: Auth state", {
    authLoading,
    isAuthenticated,
    hasUser: !!user,
    userId: user?.id,
  });

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
  const [rawUserData, setRawUserData] = useState<ApplicationUserData | null>(
    null
  );

  // Fetch user profile data from backend
  useEffect(() => {
    console.log("🔄 ApplicantProfilePage: useEffect triggered", {
      authLoading,
      isAuthenticated,
      hasUser: !!user,
    });

    // Wait for authentication to be fully loaded
    if (authLoading) {
      console.log("⏳ ApplicantProfilePage: Waiting for authentication to load...");
      return;
    }

    const fetchUserProfile = async () => {
      if (!isAuthenticated || !user) {
        console.log("❌ ApplicantProfilePage: Not authenticated or no user");
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Use the AuthContext's authentication state instead of manually checking tokens
        // The AuthContext already handles cookies and session persistence
        console.log("✅ ApplicantProfilePage: Using AuthContext authentication state");

        // Fetch ApplicationUser data
        const userData =
          (await apiService.getCurrentApplicationUser()) as ApplicationUserData;
        setRawUserData(userData);

        // Convert backend data to UserProfile format for applicants
        const profileData: UserProfile = {
          personalInfo: {
            firstName: userData.firstName || user.firstName,
            lastName: userData.lastName || user.lastName,
            email: userData.email || user.email,
            linkedinUrl: userData.socialLink?.linkedin || "",
            jobTitle: "Job Seeker",
            department: "Not specified",
            bio:
              userData.bio ||
              "Passionate professional seeking new opportunities",
            profilePicture: userData.profilePicture || "",
            timezone: userData.location?.timezone || "America/New_York",
            language: "English",
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
            notifications: [
              {
                id: "1",
                category: "Job Alerts",
                title: "New Job Matches",
                description: "Get notified about jobs that match your profile",
                email: true,
                push: true,
                sms: false,
              },
              {
                id: "2",
                category: "Application Updates",
                title: "Application Status",
                description: "Updates on your job applications",
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
            currentRole: "Job Seeker",
            department: "Not specified",
            manager: null,
            directReports: [],
            permissions: [
              {
                id: "1",
                name: "Apply for Jobs",
                description: "Submit applications for open positions",
                granted: true,
                category: "Applications",
              },
              {
                id: "2",
                name: "View Job Recommendations",
                description: "Access personalized job recommendations",
                granted: true,
                category: "Jobs",
              },
            ],
            accessLevel: "basic",
            roleDescription:
              "Job applicant seeking new opportunities and career growth.",
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
              userData.privacySettings?.profileVisibility || "public",
            activityVisibility:
              userData.privacySettings?.activityVisibility || "private",
            contactInfoVisibility:
              userData.privacySettings?.contactInfoVisibility || "public",
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
  }, [isAuthenticated, user, logout, authLoading]);

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
      }

      // Prepare the update data according to the backend contract
      const updateData = {
        // For ApplicationUser, we update basic info through the profile endpoint
        // Additional fields like social links are handled separately
      };

      console.log(
        "[DEBUG] Updating ApplicationUser profile with data:",
        updateData
      );

      // Call the real API endpoint for ApplicationUser
      await apiService.updateApplicationUserProfile(updateData);

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
        (await apiService.getCurrentApplicationUser()) as ApplicationUserData;
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
      case "education":
        return (
          <EducationSection
            education={rawUserData?.education || []}
            onUpdate={async (education) => {
              try {
                await apiService.updateApplicationUserProfile({ education });
                setRawUserData((prev) =>
                  prev ? { ...prev, education } : null
                );
                showToast("Education updated successfully", "success");
              } catch (error) {
                showToast("Failed to update education", "error");
              }
            }}
            isLoading={isLoading}
          />
        );
      case "experience":
        return (
          <ExperienceSection
            experience={rawUserData?.experiences || []}
            onUpdate={async (experiences) => {
              try {
                await apiService.updateApplicationUserProfile({
                  experience: experiences,
                });
                setRawUserData((prev) =>
                  prev ? { ...prev, experiences } : null
                );
                showToast("Experience updated successfully", "success");
              } catch (error) {
                showToast("Failed to update experience", "error");
              }
            }}
            isLoading={isLoading}
          />
        );
      case "skills":
        return (
          <SkillsSection
            skills={rawUserData?.skills || []}
            onUpdate={async (skills) => {
              try {
                // Update skills through preferences
                const updatedPreferences = {
                  ...rawUserData?.preferences,
                  skills,
                };
                await apiService.updateApplicationUserProfile({
                  preferences: updatedPreferences,
                });
                setRawUserData((prev) =>
                  prev
                    ? {
                        ...prev,
                        preferences: updatedPreferences,
                        skills, // Also update the skills field directly
                      }
                    : null
                );
                showToast("Skills updated successfully", "success");
              } catch (error) {
                showToast("Failed to update skills", "error");
              }
            }}
            isLoading={isLoading}
          />
        );
      case "resume":
        return (
          <ResumeSection
            resumeList={rawUserData?.resumeList || []}
            onUpdate={async (resumeList) => {
              try {
                await apiService.updateApplicationUserProfile({ resumeList });
                setRawUserData((prev) =>
                  prev ? { ...prev, resumeList } : null
                );
                showToast("Resume updated successfully", "success");
              } catch (error) {
                showToast("Failed to update resume", "error");
              }
            }}
            isLoading={isLoading}
          />
        );
      case "applications":
        return (
          <ApplicationsSection
            applications={[]} // This would be fetched from applications endpoint
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
          <ApplicantProfileNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

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

// Applicant-specific navigation component
function ApplicantProfileNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const navigationItems = [
    {
      id: "personal",
      label: "Personal Information",
      icon: User,
      description: "Basic profile details",
    },
    {
      id: "education",
      label: "Education",
      icon: GraduationCap,
      description: "Academic background",
    },
    {
      id: "experience",
      label: "Work Experience",
      icon: Briefcase,
      description: "Professional history",
    },
    {
      id: "skills",
      label: "Skills & Expertise",
      icon: Target,
      description: "Technical & soft skills",
    },
    {
      id: "resume",
      label: "Resume & Documents",
      icon: FileUser,
      description: "Upload & manage resumes",
    },
    {
      id: "applications",
      label: "My Applications",
      icon: FileText,
      description: "Track job applications",
    },
    {
      id: "security",
      label: "Account Security",
      icon: Shield,
      description: "Password & 2FA",
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: List,
      description: "Notifications & settings",
    },
    {
      id: "activity",
      label: "Activity & Usage",
      icon: Activity,
      description: "Login history & stats",
    },
    {
      id: "integrations",
      label: "Connected Apps",
      icon: AppWindowMac,
      description: "Third-party integrations",
    },
    {
      id: "privacy",
      label: "Privacy & Data",
      icon: GlobeLock,
      description: "Data settings & export",
    },
  ];

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Profile Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your job seeker profile
          </p>
        </div>
        <nav className="p-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={`nav-item-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-medium ${
                      isActive ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Completion Card */}
      <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h4 className="font-medium text-green-900">Profile Complete</h4>
        </div>
        <div className="w-full bg-green-200 rounded-full h-2 mb-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: "75%" }}
          ></div>
        </div>
        <p className="text-sm text-green-700">
          Your profile is 75% complete. Add education and experience to reach
          100%!
        </p>
      </div>
    </div>
  );
}
