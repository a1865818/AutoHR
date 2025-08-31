"use client";

import {
  BillingSettings,
  CompanySettings,
  SettingsLayout,
  SettingsNavigation,
  TeamManagement,
  Toast,
} from "@/components/settings";
import { CompanyData, User } from "@/interfaces";
import { useState, useEffect } from "react";
import { teamService } from "@/services/teamService";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("company");
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

  // Billing state
  const [currentPlan, setCurrentPlan] = useState("professional");

  // Toast helper - replace inline with global
  const showToast = (message: string, type: "success" | "error") => {
    import("@/utils/toast").then(({ toast }) => {
      if (type === "success") toast.success(message);
      else toast.error(message);
    });
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
    try {
      const teamMembers = await teamService.getTeamMembers();
      setUsers(teamMembers);
      console.log("✅ Team data loaded successfully:", teamMembers);
    } catch (error) {
      console.error("❌ Failed to load team data:", error);
      showToast("Failed to load team data. Please try again.", "error");
    } finally {
      setIsLoadingUsers(false);
    }
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
          <div className="bg-gradient-to-r from-[#066046]/5 to-[#267a54]/5 border border-[#066046]/10 rounded-xl p-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#066046]/10 rounded-lg">
                <svg
                  className="w-8 h-8 text-[#066046]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Settings
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>
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
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </>
  );
}
