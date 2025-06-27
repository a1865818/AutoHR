"use client";

import { SettingsLayout, Toast } from "@/components/settings";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationSetting } from "@/interfaces";
import { ApplicationUserData } from "@/interfaces/applicantProfile";
import { apiService } from "@/services/api";
import { useState } from "react";

// Applicant-specific settings components
import { ApplicantDataExportSettings } from "@/components/settings/applicants/ApplicantDataExportSettings";
import { ApplicantIntegrationsSettings } from "@/components/settings/applicants/ApplicantIntegrationsSettings";
import { ApplicantNotificationSettings } from "@/components/settings/applicants/ApplicantNotificationSettings";
import { ApplicantPersonalSettings } from "@/components/settings/applicants/ApplicantPersonalSettings";
import { ApplicantPreferencesSettings } from "@/components/settings/applicants/ApplicantPreferencesSettings";
import { ApplicantPrivacySettings } from "@/components/settings/applicants/ApplicantPrivacySettings";
import { ApplicantSecuritySettings } from "@/components/settings/applicants/ApplicantSecuritySettings";

export default function ApplicantSettingsPage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

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

  // Applicant data state
  const [applicantData, setApplicantData] =
    useState<ApplicationUserData | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "1",
      title: "Job Recommendations",
      description: "Get notified about jobs that match your profile",
      email: true,
      push: true,
    },
    {
      id: "2",
      title: "Application Status Updates",
      description: "Updates when your application status changes",
      email: true,
      push: true,
    },
    {
      id: "3",
      title: "Interview Invitations",
      description: "Alerts when you're invited for interviews",
      email: true,
      push: false,
    },
    {
      id: "4",
      title: "Profile Views",
      description: "Notifications when employers view your profile",
      email: false,
      push: true,
    },
    {
      id: "5",
      title: "Saved Job Alerts",
      description: "Reminders about your saved job opportunities",
      email: true,
      push: true,
    },
  ]);

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
  const handleNotificationToggle = (id: string, type: "email" | "push") => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, [type]: !notif[type] } : notif
      )
    );
  };

  const handlePersonalInfoUpdate = async (
    updatedData: Partial<ApplicationUserData>
  ) => {
    setIsLoading(true);
    try {
      await apiService.updateApplicationUserProfile(updatedData);
      setApplicantData((prev) => (prev ? { ...prev, ...updatedData } : null));
      showToast("Personal information updated successfully", "success");
    } catch (error) {
      console.error("Failed to update personal info:", error);
      showToast("Failed to update personal information", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityUpdate = async (updatedSecurity: {
    twoFactorEnabled?: boolean;
    passwordLastChanged?: string;
  }) => {
    setIsLoading(true);
    try {
      // Simulate API call for security settings
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setApplicantData((prev) =>
        prev ? { ...prev, ...updatedSecurity } : null
      );
      showToast("Security settings updated successfully", "success");
    } catch {
      showToast("Failed to update security settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async (updatedPreferences: {
    theme?: string;
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    emailDigest?: string;
    autoSave?: boolean;
  }) => {
    setIsLoading(true);
    try {
      await apiService.updateApplicationUserProfile({
        preferences: updatedPreferences,
      });
      setApplicantData((prev) =>
        prev
          ? {
              ...prev,
              preferences: { ...prev.preferences, ...updatedPreferences },
            }
          : null
      );
      showToast("Preferences updated successfully", "success");
    } catch {
      showToast("Failed to update preferences", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyUpdate = async (updatedPrivacy: {
    profileVisibility?: string;
    activityVisibility?: string;
    contactInfoVisibility?: string;
    dataRetention?: number;
    allowAnalytics?: boolean;
    allowMarketing?: boolean;
    allowThirdParty?: boolean;
  }) => {
    setIsLoading(true);
    try {
      await apiService.updateApplicationUserProfile({
        privacySettings: updatedPrivacy,
      });
      setApplicantData((prev) =>
        prev
          ? {
              ...prev,
              privacySettings: { ...prev.privacySettings, ...updatedPrivacy },
            }
          : null
      );
      showToast("Privacy settings updated successfully", "success");
    } catch {
      showToast("Failed to update privacy settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrationToggle = async (integrationId: string) => {
    if (!applicantData) return;

    const updatedIntegrations =
      applicantData.connectedIntegrations?.map((integration) =>
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
      ) || [];

    setApplicantData((prev) =>
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

  const handleDataExport = async () => {
    setIsLoading(true);
    try {
      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showToast(
        "Data export initiated. You'll receive an email when ready.",
        "success"
      );
    } catch {
      showToast("Failed to initiate data export", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    setIsLoading(true);
    try {
      // Simulate account deletion
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast("Account deletion request submitted", "success");
    } catch {
      showToast("Failed to submit deletion request", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <ApplicantPersonalSettings
            applicantData={applicantData}
            onUpdate={handlePersonalInfoUpdate}
            isLoading={isLoading}
          />
        );
      case "notifications":
        return (
          <ApplicantNotificationSettings
            notifications={notifications}
            onToggle={handleNotificationToggle}
          />
        );
      case "security":
        return (
          <ApplicantSecuritySettings
            securityData={applicantData}
            onUpdate={handleSecurityUpdate}
            isLoading={isLoading}
          />
        );
      case "preferences":
        return (
          <ApplicantPreferencesSettings
            preferences={applicantData?.preferences}
            onUpdate={handlePreferencesUpdate}
            isLoading={isLoading}
          />
        );
      case "privacy":
        return (
          <ApplicantPrivacySettings
            privacySettings={applicantData?.privacySettings}
            onUpdate={handlePrivacyUpdate}
            isLoading={isLoading}
          />
        );
      case "integrations":
        return (
          <ApplicantIntegrationsSettings
            integrations={applicantData?.connectedIntegrations || []}
            onToggle={handleIntegrationToggle}
            isLoading={isLoading}
          />
        );
      case "data":
        return (
          <ApplicantDataExportSettings
            onExport={handleDataExport}
            onDeleteAccount={handleAccountDeletion}
            isLoading={isLoading}
          />
        );
      default:
        return (
          <ApplicantPersonalSettings
            applicantData={applicantData}
            onUpdate={handlePersonalInfoUpdate}
            isLoading={isLoading}
          />
        );
    }
  };

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">Please log in to access your settings</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and job search preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <ApplicantSettingsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <SettingsLayout>{renderTabContent()}</SettingsLayout>
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
function ApplicantSettingsNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}) {
  const tabs = [
    { id: "personal", name: "Personal Info", icon: "👤" },
    { id: "notifications", name: "Notifications", icon: "🔔" },
    { id: "security", name: "Security", icon: "🛡️" },
    { id: "preferences", name: "Preferences", icon: "⚙️" },
    { id: "privacy", name: "Privacy", icon: "🔒" },
    { id: "integrations", name: "Integrations", icon: "⚡" },
    { id: "data", name: "Data & Export", icon: "📥" },
  ];

  return (
    <div className="lg:w-64">
      <div className="bg-white rounded-lg shadow">
        <nav className="space-y-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-3 text-lg">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
