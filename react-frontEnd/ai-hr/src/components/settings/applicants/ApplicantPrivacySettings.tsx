"use client";

import { ToggleSwitch } from "@/components/settings";
import { Eye, EyeOff, Globe, Lock, Save, Loader2 } from "lucide-react";
import { useState } from "react";

interface ApplicantPrivacySettingsProps {
  privacySettings?: {
    profileVisibility?: string;
    activityVisibility?: string;
    contactInfoVisibility?: string;
    dataRetention?: number;
    allowAnalytics?: boolean;
    allowMarketing?: boolean;
    allowThirdParty?: boolean;
  };
  onUpdate: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function ApplicantPrivacySettings({
  privacySettings,
  onUpdate,
  isLoading = false,
}: ApplicantPrivacySettingsProps) {
  const [settings, setSettings] = useState({
    profileVisibility: privacySettings?.profileVisibility || "public",
    activityVisibility: privacySettings?.activityVisibility || "private",
    contactInfoVisibility: privacySettings?.contactInfoVisibility || "public",
    dataRetention: privacySettings?.dataRetention || 12,
    allowAnalytics: privacySettings?.allowAnalytics !== false,
    allowMarketing: privacySettings?.allowMarketing !== false,
    allowThirdParty: privacySettings?.allowThirdParty || false,
  });

  const handleSave = async () => {
    await onUpdate(settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Privacy Settings
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Control how your information is shared and used
        </p>
      </div>

      {/* Profile Visibility */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Profile Visibility</h3>
            <p className="text-sm text-gray-600">
              Control who can see your profile information
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Profile Visibility</span>
              <p className="text-xs text-gray-500">Make your profile visible to employers</p>
            </div>
            <select
              value={settings.profileVisibility}
              onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="employers">Employers Only</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Activity Visibility</span>
              <p className="text-xs text-gray-500">Show your job search activity</p>
            </div>
            <select
              value={settings.activityVisibility}
              onChange={(e) => setSettings(prev => ({ ...prev, activityVisibility: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Contact Information</span>
              <p className="text-xs text-gray-500">Share contact details with employers</p>
            </div>
            <select
              value={settings.contactInfoVisibility}
              onChange={(e) => setSettings(prev => ({ ...prev, contactInfoVisibility: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="employers">Employers Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Usage */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Data Usage</h3>
            <p className="text-sm text-gray-600">
              Control how your data is used and shared
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Analytics</span>
              <p className="text-xs text-gray-500">Help us improve by sharing usage data</p>
            </div>
            <ToggleSwitch
              checked={settings.allowAnalytics}
              onChange={(checked) => setSettings(prev => ({ ...prev, allowAnalytics: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Marketing Communications</span>
              <p className="text-xs text-gray-500">Receive job alerts and promotional emails</p>
            </div>
            <ToggleSwitch
              checked={settings.allowMarketing}
              onChange={(checked) => setSettings(prev => ({ ...prev, allowMarketing: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Third-Party Sharing</span>
              <p className="text-xs text-gray-500">Allow data sharing with trusted partners</p>
            </div>
            <ToggleSwitch
              checked={settings.allowThirdParty}
              onChange={(checked) => setSettings(prev => ({ ...prev, allowThirdParty: checked }))}
            />
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Eye className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Data Retention</h3>
            <p className="text-sm text-gray-600">
              How long we keep your data
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700">Data Retention Period</span>
            <p className="text-xs text-gray-500">Choose how long your data is stored</p>
          </div>
          <select
            value={settings.dataRetention}
            onChange={(e) => setSettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={6}>6 months</option>
            <option value={12}>1 year</option>
            <option value={24}>2 years</option>
            <option value={36}>3 years</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Saving..." : "Save Privacy Settings"}
        </button>
      </div>
    </div>
  );
} 