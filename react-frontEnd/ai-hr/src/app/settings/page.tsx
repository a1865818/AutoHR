"use client";

import { useState } from "react";
import {
  SettingsNavigation,
  SettingsLayout,
  CompanySettings,
  TeamManagement,
  RecruitmentSettings,
  IntegrationsSettings,
  NotificationSettings,
  SecuritySettings,
  BillingSettings,
  Toast,
} from "@/components/settings";
import {
  CompanyData,
  User,
  RecruitmentConfig,
  NotificationSetting,
} from "@/interfaces";

export default function SettingsPage() {
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
    name: "TechCorp Solutions",
    website: "https://techcorp.com",
    industry: "Technology",
    size: "51-200",
    description: "Leading technology solutions provider",
    logo: "",
  });

  // Users state
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Caroline Robertson",
      email: "caroline@techcorp.com",
      role: "admin",
      status: "active",
    },
    {
      id: "2",
      name: "John Smith",
      email: "john@techcorp.com",
      role: "recruiter",
      status: "active",
    },
    {
      id: "3",
      name: "Sarah Johnson",
      email: "sarah@techcorp.com",
      role: "manager",
      status: "pending",
    },
  ]);

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
    setIsLoading(true);
    try {
      // Simulate API call to send invitation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a new user with pending status
      const newUser = {
        id: Date.now().toString(), // In real app, this would come from API
        name: userData.email.split("@")[0], // Temporary name until they join
        email: userData.email,
        role: userData.role,
        status: "pending" as const,
      };

      setUsers((prev) => [...prev, newUser]);
      console.log("Invitation sent:", userData);
      showToast(
        `Invitation sent to ${userData.email} successfully!`,
        "success"
      );
    } catch (error) {
      console.error("Failed to send invitation:", error);
      showToast("Failed to send invitation. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

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

  const handleDeleteUser = (userId: string) => {
    console.log("Delete user:", userId);
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    showToast("Team member deleted successfully!", "success");
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
            isLoading={isLoading}
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
