"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { UserTable } from "./UserTable";
import { UserEditModal } from "./UserEditModal";
import { InviteUserModal } from "./InviteUserModal";
import { ConfirmationModal } from "./ConfirmationModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "inactive";
  avatar?: string;
  // Additional fields from backend
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles?: string;
  userType?: string;
  companyId?: string;
  bio?: string;
  linkedinUrl?: string;
  location?: any;
  preferences?: any;
  createdAt?: string;
}

interface InviteUserData {
  email: string;
  role: string;
  message?: string;
}

interface TeamManagementProps {
  users: User[];
  onInviteUser: (userData: InviteUserData) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  isLoading?: boolean;
  currentUserRole?: string | undefined;
  companyId?: string;
  companyName?: string;
  inviterName?: string;
}

export function TeamManagement({
  users,
  onInviteUser,
  onUpdateUser,
  onDeleteUser,
  isLoading = false,
  currentUserRole,
  companyId,
  companyName,
  inviterName,
}: TeamManagementProps) {
  console.log("🔍 TeamManagement - currentUserRole:", currentUserRole);

  // If currentUserRole is undefined, it means we're still loading user data
  const isAdmin = currentUserRole === "Admin";
  const isUserDataLoading = currentUserRole === undefined;
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
  }>({
    isOpen: false,
    userId: null,
    userName: "",
  });

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditingUser(user);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (updatedUser: User) => {
    await onUpdateUser(updatedUser);
    handleCloseEditModal();
  };

  const handleDeleteUserClick = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setDeleteConfirmation({
        isOpen: true,
        userId: userId,
        userName: user.name,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.userId) {
      onDeleteUser(deleteConfirmation.userId);
      setDeleteConfirmation({
        isOpen: false,
        userId: null,
        userName: "",
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      userId: null,
      userName: "",
    });
  };

  const handleInviteUserClick = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteUser = async (userData: InviteUserData) => {
    await onInviteUser(userData);
    setIsInviteModalOpen(false);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
        {isUserDataLoading ? (
          <div className="text-sm text-gray-500">
            Loading user permissions...
          </div>
        ) : isAdmin ? (
          <button
            onClick={handleInviteUserClick}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            Only administrators can manage team members
          </div>
        )}
      </div>

      {isLoading && users.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading team members...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No team members found.</p>
          <p className="text-sm text-gray-400 mt-1">
            {isUserDataLoading
              ? "Loading..."
              : isAdmin
              ? "Invite team members to get started."
              : "Contact an administrator to add team members."}
          </p>
        </div>
      ) : (
        <UserTable
          users={users}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUserClick}
          currentUserRole={currentUserRole}
        />
      )}

      <UserEditModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveUser}
        isLoading={isLoading}
      />

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        onInvite={handleInviteUser}
        isLoading={isLoading}
        companyId={companyId}
        companyName={companyName}
        inviterName={inviterName}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Team Member"
        message={`Are you sure you want to delete ${deleteConfirmation.userName}? This action cannot be undone and will permanently remove them from your team.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isLoading}
      />
    </div>
  );
}
