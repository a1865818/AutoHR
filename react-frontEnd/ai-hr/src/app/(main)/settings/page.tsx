"use client";

import {
  BillingSettings,
  CompanySettings,
  IntegrationsSettings,
  NotificationSettings,
  RecruitmentSettings,
  SecuritySettings,
  SettingsLayout,
  SettingsNavigation,
  TeamManagement,
  Toast,
} from "@/components/settings";
import {
  CompanyData,
  NotificationSetting,
  RecruitmentConfig,
  User,
} from "@/interfaces";
import { useState, useEffect } from "react";
import { teamService } from "@/services/teamService";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("company");
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

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

  // Company data state
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    website: "",
    industry: "",
    size: "",
    description: "",
    logo: "",
  });
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Recruitment config state
  const [recruitmentConfig, setRecruitmentConfig] = useState<RecruitmentConfig>(
    {
      autoScreening: true,
      emailConfirmations: true,
      minimumScore: 70,
      autoRejectBelow: 30,
    }
  );

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "1",
      title: "New Application Received",
      description: "Get notified when a candidate applies to your job postings",
      email: true,
      push: true,
    },
    {
      id: "2",
      title: "Interview Scheduled",
      description: "Alerts when interviews are scheduled or rescheduled",
      email: true,
      push: false,
    },
    {
      id: "3",
      title: "Application Status Updates",
      description: "Updates when candidate status changes",
      email: false,
      push: true,
    },
    {
      id: "4",
      title: "Job Posting Expiry",
      description: "Reminder before job postings expire",
      email: true,
      push: true,
    },
  ]);

  // Security state
  const [dataRetentionMonths, setDataRetentionMonths] = useState(24);

  // Billing state
  const [currentPlan, setCurrentPlan] = useState("professional");

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

  // Load company data
  const loadCompanyData = async () => {
    if (!user?.companyId) {
      console.log("⚠️ No company ID found for user");
      return;
    }

    setIsLoadingCompany(true);
    try {
      console.log("🏢 Loading company data for company ID:", user.companyId);
      const company = await apiService.getCompanyById(user.companyId);

      setCompanyData({
        name: company.name || "",
        website: company.website || "",
        industry: company.industry || "",
        size: company.companySize || "",
        description: company.description || "",
        logo: company.logoUrl || "",
      });

      console.log("✅ Company data loaded successfully:", company);
    } catch (error) {
      console.error("❌ Failed to load company data:", error);
      showToast("Failed to load company data. Please try again.", "error");
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Load team data when component mounts and authentication is confirmed
  useEffect(() => {
    console.log("🔍 Settings - useEffect triggered:", {
      isAuthenticated,
      authLoading,
      user: user
        ? {
            id: user.id,
            email: user.email,
            companyId: user.companyId,
            userCategory: user.userCategory,
          }
        : null,
    });

    if (isAuthenticated && !authLoading) {
      loadTeamData();
      loadCompanyData();
    }
  }, [isAuthenticated, authLoading, user]);

  const loadTeamData = async () => {
    // Don't load data if not authenticated
    if (!isAuthenticated) {
      console.log("⚠️ Skipping team data load - user not authenticated");
      return;
    }

    console.log("🔍 Settings - loadTeamData called with user:", {
      id: user?.id,
      email: user?.email,
      companyId: user?.companyId,
      userCategory: user?.userCategory,
      role: user?.role,
      userType: user?.userType,
      fullUser: user,
    });

    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const teamMembers = await teamService.getTeamMembers();
      setUsers(teamMembers);
      console.log("✅ Team data loaded successfully:", teamMembers);
    } catch (error) {
      console.error("❌ Failed to load team data:", error);
      setUsersError(
        error instanceof Error ? error.message : "Failed to load team data"
      );
      showToast("Failed to load team data. Please try again.", "error");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Event handlers

  const handleNotificationToggle = (id: string, type: "email" | "push") => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, [type]: !notif[type] } : notif
      )
    );
  };

  // Team management handlers
  const handleInviteUser = async (userData: {
    email: string;
    role: string;
    message?: string;
  }) => {
    if (!isAuthenticated) {
      showToast("Authentication required to invite team members.", "error");
      return;
    }

    if (authLoading) {
      showToast("Please wait while user data is loading.", "error");
      return;
    }

    // Check if user is admin
    const currentUserRole = user?.role || "HiringUser";
    console.log("🔍 Settings - currentUserRole:", currentUserRole);
    if (currentUserRole !== "Admin") {
      showToast("Only administrators can invite team members.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const invitationResult = await teamService.inviteTeamMember(userData);

      if (invitationResult.success) {
        console.log("Invitation sent successfully:", invitationResult);
        showToast(
          `Invitation sent to ${userData.email} successfully!`,
          "success"
        );

        // Refresh the team members list to show any pending invitations
        await loadTeamData();
      } else {
        throw new Error(invitationResult.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      showToast("Failed to send invitation. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!isAuthenticated) {
      showToast("Authentication required to update team members.", "error");
      return;
    }

    if (authLoading) {
      showToast("Please wait while user data is loading.", "error");
      return;
    }

    // Check if user is admin
    const currentUserRole = user?.role || "HiringUser";
    console.log("🔍 Settings - currentUserRole (update):", currentUserRole);
    if (currentUserRole !== "Admin") {
      showToast("Only administrators can update team members.", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare the data for the backend
      const updateData = {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        userType: updatedUser.userType,
        bio: updatedUser.bio,
        linkedinUrl: updatedUser.linkedinUrl,
        location: updatedUser.location,
        preferences: updatedUser.preferences,
        isActive: updatedUser.isActive,
      };

      await teamService.updateTeamMember(updatedUser.id, updateData);

      // Update the local state
      setUsers((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );

      console.log("User updated:", updatedUser);
      showToast("Team member updated successfully!", "success");
    } catch (error) {
      console.error("Failed to update user:", error);
      showToast("Failed to update team member. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAuthenticated) {
      showToast("Authentication required to delete team members.", "error");
      return;
    }

    if (authLoading) {
      showToast("Please wait while user data is loading.", "error");
      return;
    }

    // Check if user is admin
    const currentUserRole = user?.role || "HiringUser";
    console.log("🔍 Settings - currentUserRole (delete):", currentUserRole);
    if (currentUserRole !== "Admin") {
      showToast("Only administrators can delete team members.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await teamService.deleteTeamMember(userId);

      setUsers((prev) => prev.filter((user) => user.id !== userId));
      console.log("Delete user:", userId);
      showToast("Team member deleted successfully!", "success");
    } catch (error) {
      console.error("Failed to delete user:", error);
      showToast("Failed to delete team member. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Integration handlers
  const handleConfigureEmail = () => {
    console.log("Configure email integration");
  };

  const handleConnectCalendar = () => {
    console.log("Connect calendar");
  };

  // Security handlers
  const handleEnable2FA = () => {
    console.log("Enable 2FA");
  };

  // Billing handlers
  const handleChangePlan = async (
    planId: string,
    billingCycle: "monthly" | "yearly"
  ) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentPlan(planId);
      console.log("Plan changed to:", planId, "with", billingCycle, "billing");
      showToast(
        `Successfully upgraded to ${
          planId.charAt(0).toUpperCase() + planId.slice(1)
        } plan!`,
        "success"
      );
    } catch (error) {
      console.error("Failed to change plan:", error);
      showToast("Failed to change plan. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePayment = () => {
    console.log("Update payment method");
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log("Download invoice:", invoiceId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "company":
        return (
          <CompanySettings
            companyData={companyData}
            onChange={setCompanyData}
          />
        );
      case "users":
        return (
          <TeamManagement
            users={users}
            onInviteUser={handleInviteUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            isLoading={
              isLoading || isLoadingUsers || authLoading || isLoadingCompany
            }
            currentUserRole={
              authLoading ? undefined : user?.role || "HiringUser"
            }
            companyId={user?.companyId}
            companyName={isLoadingCompany ? "Loading..." : companyData.name}
            inviterName={
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              user?.email
            }
          />
        );
      case "recruitment":
        return (
          <RecruitmentSettings
            config={recruitmentConfig}
            onChange={setRecruitmentConfig}
          />
        );
      case "integrations":
        return (
          <IntegrationsSettings
            showApiKey={showApiKey}
            onToggleApiKey={() => setShowApiKey(!showApiKey)}
            onConfigureEmail={handleConfigureEmail}
            onConnectCalendar={handleConnectCalendar}
          />
        );
      case "notifications":
        return (
          <NotificationSettings
            notifications={notifications}
            onToggle={handleNotificationToggle}
          />
        );
      case "security":
        return (
          <SecuritySettings
            onEnable2FA={handleEnable2FA}
            onDataRetentionChange={setDataRetentionMonths}
            dataRetentionMonths={dataRetentionMonths}
          />
        );
      case "billing":
        return (
          <BillingSettings
            onChangePlan={handleChangePlan}
            onUpdatePayment={handleUpdatePayment}
            onDownloadInvoice={handleDownloadInvoice}
            currentPlan={currentPlan}
            isLoading={isLoading}
          />
        );
      default:
        return (
          <CompanySettings
            companyData={companyData}
            onChange={setCompanyData}
          />
        );
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <SettingsNavigation
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
