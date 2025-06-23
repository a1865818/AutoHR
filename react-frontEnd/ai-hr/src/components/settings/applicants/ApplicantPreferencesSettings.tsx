"use client";

import { ToggleSwitch } from "@/components/settings";
import { Settings, Globe, Clock, Palette, Save, Loader2 } from "lucide-react";
import { useState } from "react";

interface ApplicantPreferencesSettingsProps {
  preferences?: {
    theme?: string;
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    emailDigest?: string;
    autoSave?: boolean;
  };
  onUpdate: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function ApplicantPreferencesSettings({
  preferences,
  onUpdate,
  isLoading = false,
}: ApplicantPreferencesSettingsProps) {
  const [settings, setSettings] = useState({
    theme: preferences?.theme || "light",
    language: preferences?.language || "en",
    timezone: preferences?.timezone || "America/New_York",
    dateFormat: preferences?.dateFormat || "MM/DD/YYYY",
    timeFormat: preferences?.timeFormat || "12h",
    emailDigest: preferences?.emailDigest || "weekly",
    autoSave: preferences?.autoSave !== false,
  });

  const handleSave = async () => {
    await onUpdate(settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Preferences
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Customize your experience and display preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Palette className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Appearance</h3>
            <p className="text-sm text-gray-600">
              Customize how the platform looks
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Theme</span>
              <p className="text-xs text-gray-500">Choose your preferred theme</p>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Language</span>
              <p className="text-xs text-gray-500">Select your preferred language</p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Date & Time</h3>
            <p className="text-sm text-gray-600">
              Configure date and time display preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Date Format</span>
              <p className="text-xs text-gray-500">How dates are displayed</p>
            </div>
            <select
              value={settings.dateFormat}
              onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Time Format</span>
              <p className="text-xs text-gray-500">12-hour or 24-hour format</p>
            </div>
            <select
              value={settings.timeFormat}
              onChange={(e) => setSettings(prev => ({ ...prev, timeFormat: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Email Preferences</h3>
            <p className="text-sm text-gray-600">
              Control your email notification frequency
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Email Digest</span>
              <p className="text-xs text-gray-500">How often to receive email summaries</p>
            </div>
            <select
              value={settings.emailDigest}
              onChange={(e) => setSettings(prev => ({ ...prev, emailDigest: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auto-Save */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Application Settings</h3>
            <p className="text-sm text-gray-600">
              Configure application behavior
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700">Auto-Save</span>
            <p className="text-xs text-gray-500">Automatically save your progress while filling forms</p>
          </div>
          <ToggleSwitch
            checked={settings.autoSave}
            onChange={(checked) => setSettings(prev => ({ ...prev, autoSave: checked }))}
          />
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
          {isLoading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
} 