"use client";

import { useState } from "react";
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

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(false);

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

  // Mock user profile data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    personalInfo: {
      firstName: "Caroline",
      lastName: "Robertson",
      email: "caroline.robertson@techcorp.com",
      phone: "+1 (555) 123-4567",
      jobTitle: "Senior HR Manager",
      department: "Human Resources",
      bio: "Experienced HR professional with 8+ years in talent acquisition and employee development. Passionate about creating inclusive workplace cultures and driving organizational growth.",
      profilePicture: "",
      timezone: "America/New_York",
      language: "English",
      startDate: "2020-03-15",
      employeeId: "EMP-001",
    },
    securitySettings: {
      passwordLastChanged: new Date("2024-01-15"),
      twoFactorEnabled: true,
      trustedDevices: [
        {
          id: "1",
          name: "MacBook Pro",
          type: "desktop",
          lastUsed: new Date(),
          location: "New York, NY",
          browser: "Chrome",
          trusted: true,
        },
        {
          id: "2",
          name: "iPhone 15 Pro",
          type: "mobile",
          lastUsed: new Date(Date.now() - 86400000),
          location: "New York, NY",
          browser: "Safari",
          trusted: true,
        },
      ],
      loginHistory: [
        {
          id: "1",
          timestamp: new Date(),
          device: "MacBook Pro",
          location: "New York, NY",
          ipAddress: "192.168.1.100",
          success: true,
          browser: "Chrome",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 86400000),
          device: "iPhone 15 Pro",
          location: "New York, NY",
          ipAddress: "192.168.1.101",
          success: true,
          browser: "Safari",
        },
      ],
      activeSessions: [
        {
          id: "1",
          device: "MacBook Pro",
          browser: "Chrome",
          location: "New York, NY",
          startTime: new Date(Date.now() - 7200000),
          lastActivity: new Date(),
          current: true,
        },
      ],
      securityScore: 85,
    },
    preferences: {
      theme: "light",
      notifications: [
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
        {
          id: "3",
          category: "System Updates",
          title: "Feature Updates",
          description: "Learn about new features and improvements",
          email: false,
          push: false,
          sms: false,
        },
      ],
      language: "en",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      emailDigest: "weekly",
      autoSave: true,
    },
    roleInfo: {
      currentRole: "Senior HR Manager",
      department: "Human Resources",
      manager: {
        id: "mgr-1",
        name: "David Johnson",
        email: "david.johnson@techcorp.com",
        jobTitle: "VP of Human Resources",
        department: "Human Resources",
        profilePicture: "",
      },
      directReports: [
        {
          id: "dr-1",
          name: "Sarah Wilson",
          email: "sarah.wilson@techcorp.com",
          jobTitle: "HR Specialist",
          department: "Human Resources",
        },
        {
          id: "dr-2",
          name: "Michael Chen",
          email: "michael.chen@techcorp.com",
          jobTitle: "Recruiter",
          department: "Human Resources",
        },
      ],
      permissions: [
        {
          id: "1",
          name: "View All Candidates",
          description: "Access to view all candidate profiles",
          granted: true,
          category: "Candidates",
        },
        {
          id: "2",
          name: "Manage Job Postings",
          description: "Create and edit job postings",
          granted: true,
          category: "Jobs",
        },
        {
          id: "3",
          name: "Access Reports",
          description: "View and generate HR reports",
          granted: true,
          category: "Analytics",
        },
        {
          id: "4",
          name: "User Management",
          description: "Manage team members and permissions",
          granted: false,
          category: "Administration",
        },
      ],
      accessLevel: "advanced",
      roleDescription:
        "Responsible for talent acquisition, employee development, and HR policy implementation.",
    },
    activityData: {
      recentActions: [
        {
          id: "1",
          action: "Reviewed Application",
          description: "Reviewed application for Software Engineer position",
          timestamp: new Date(Date.now() - 3600000),
          category: "profile",
        },
        {
          id: "2",
          action: "Updated Job Posting",
          description: "Modified requirements for Senior Developer role",
          timestamp: new Date(Date.now() - 7200000),
          category: "data",
        },
        {
          id: "3",
          action: "Logged In",
          description: "Signed in from MacBook Pro",
          timestamp: new Date(Date.now() - 14400000),
          category: "login",
        },
      ],
      loginStats: {
        totalLogins: 156,
        lastWeek: 12,
        averageSessionDuration: 125, // minutes
        mostActiveDay: "Tuesday",
        mostActiveHour: 10,
      },
      featureUsage: [
        {
          feature: "Candidate Review",
          usageCount: 89,
          lastUsed: new Date(),
          timeSpent: 450,
        },
        {
          feature: "Job Management",
          usageCount: 34,
          lastUsed: new Date(Date.now() - 86400000),
          timeSpent: 180,
        },
      ],
      timeSpent: {
        today: 135,
        thisWeek: 620,
        thisMonth: 2850,
        averageDaily: 125,
      },
    },
    connectedIntegrations: [
      {
        id: "1",
        name: "Google Workspace",
        type: "email",
        connected: true,
        connectedAt: new Date("2024-01-01"),
        lastSync: new Date(),
        status: "active",
        icon: "📧",
        description: "Email and calendar integration",
      },
      {
        id: "2",
        name: "Slack",
        type: "productivity",
        connected: true,
        connectedAt: new Date("2024-01-15"),
        lastSync: new Date(Date.now() - 3600000),
        status: "active",
        icon: "💬",
        description: "Team communication and notifications",
      },
      {
        id: "3",
        name: "LinkedIn",
        type: "social",
        connected: false,
        status: "inactive",
        icon: "💼",
        description: "Professional network integration",
      },
    ],
    privacySettings: {
      profileVisibility: "team",
      activityVisibility: "private",
      contactInfoVisibility: "team",
      dataRetention: 24,
      allowAnalytics: true,
      allowMarketing: false,
      allowThirdParty: false,
    },
  });

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserProfile((prev) => ({
        ...prev,
        personalInfo: updatedInfo,
      }));
      showToast("Personal information updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update personal information.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityUpdate = async (
    updatedSecurity: Partial<SecuritySettings>
  ) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserProfile((prev) => ({
        ...prev,
        securitySettings: { ...prev.securitySettings, ...updatedSecurity },
      }));
      showToast("Security settings updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update security settings.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async (updatedPrefs: UserPrefs) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserProfile((prev) => ({
        ...prev,
        preferences: updatedPrefs,
      }));
      showToast("Preferences updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update preferences.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrationToggle = async (integrationId: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUserProfile((prev) => ({
        ...prev,
        connectedIntegrations: prev.connectedIntegrations.map((integration) =>
          integration.id === integrationId
            ? {
                ...integration,
                connected: !integration.connected,
                status: !integration.connected ? "active" : "inactive",
                connectedAt: !integration.connected
                  ? new Date()
                  : integration.connectedAt,
                lastSync: !integration.connected
                  ? new Date()
                  : integration.lastSync,
              }
            : integration
        ),
      }));
      const integration = userProfile.connectedIntegrations.find(
        (i) => i.id === integrationId
      );
      showToast(
        `${integration?.name} ${
          integration?.connected ? "disconnected" : "connected"
        } successfully!`,
        "success"
      );
    } catch (error) {
      showToast("Failed to update integration.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyUpdate = async (updatedPrivacy: PrivacySettings) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserProfile((prev) => ({
        ...prev,
        privacySettings: updatedPrivacy,
      }));
      showToast("Privacy settings updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update privacy settings.", "error");
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
