"use client";

import { Download, Trash2, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface ApplicantDataExportSettingsProps {
  onExport: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  isLoading?: boolean;
}

export function ApplicantDataExportSettings({
  onExport,
  onDeleteAccount,
  isLoading = false,
}: ApplicantDataExportSettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleDeleteAccount = async () => {
    if (deleteConfirmation === "DELETE") {
      await onDeleteAccount();
      setShowDeleteConfirm(false);
      setDeleteConfirmation("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Data & Export
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Export your data or manage your account
        </p>
      </div>

      {/* Data Export */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Export Your Data
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Download a copy of all your data including profile information, applications, and preferences
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">What's included:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Personal profile information</li>
                <li>• Job applications and status</li>
                <li>• Saved jobs and preferences</li>
                <li>• Resume and document uploads</li>
                <li>• Account settings and preferences</li>
              </ul>
            </div>

            <button
              onClick={onExport}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Preparing Export..." : "Export My Data"}
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Delete Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-1">
                        Warning: This action is irreversible
                      </h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• All your data will be permanently deleted</li>
                        <li>• Your job applications will be removed</li>
                        <li>• You will lose access to all saved jobs</li>
                        <li>• This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type "DELETE" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== "DELETE" || isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Permanently Delete Account"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmation("");
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Retention Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Data Retention Policy
            </h4>
            <p className="text-sm text-gray-600">
              We retain your data for up to 12 months after account deletion for legal and compliance purposes. 
              After this period, all data is permanently removed from our systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 