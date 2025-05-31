"use client";

import { useState, useEffect } from "react";
import { Save, X, Edit3, User, Linkedin } from "lucide-react";
import { PersonalInfo } from "@/interfaces";

interface PersonalInformationProps {
  personalInfo: PersonalInfo;
  onUpdate: (info: PersonalInfo) => void;
  isLoading?: boolean;
}

export function PersonalInformation({
  personalInfo,
  onUpdate,
  isLoading = false,
}: PersonalInformationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempInfo, setTempInfo] = useState<PersonalInfo>(personalInfo);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTempInfo(personalInfo);
  }, [personalInfo]);

  useEffect(() => {
    if (isEditing) {
      const infoChanged =
        tempInfo.firstName !== personalInfo.firstName ||
        tempInfo.lastName !== personalInfo.lastName ||
        tempInfo.email !== personalInfo.email ||
        tempInfo.linkedinUrl !== personalInfo.linkedinUrl ||
        tempInfo.jobTitle !== personalInfo.jobTitle ||
        tempInfo.department !== personalInfo.department ||
        tempInfo.bio !== personalInfo.bio ||
        tempInfo.timezone !== personalInfo.timezone ||
        tempInfo.language !== personalInfo.language;
      setHasChanges(infoChanged);
    }
  }, [tempInfo, personalInfo, isEditing]);

  const handleTempChange = (field: keyof PersonalInfo, value: string) => {
    setTempInfo({ ...tempInfo, [field]: value });
  };

  const handleStartEdit = () => {
    setTempInfo(personalInfo);
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleSaveChanges = () => {
    onUpdate(tempInfo);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setTempInfo(personalInfo);
    setIsEditing(false);
    setHasChanges(false);
  };

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  ];

  const languages = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Chinese", label: "Chinese" },
    { value: "Japanese", label: "Japanese" },
  ];

  const departments = [
    "Human Resources",
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Finance",
    "Operations",
    "Legal",
    "Customer Success",
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Personal Information
          </h3>
          <p className="text-sm text-gray-600">
            Manage your basic profile information and contact details
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Basic Information
            </h4>
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Edit Information
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                value={isEditing ? tempInfo.firstName : personalInfo.firstName}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("firstName", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-blue-300 focus:ring-blue-500 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                value={isEditing ? tempInfo.lastName : personalInfo.lastName}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("lastName", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-blue-300 focus:ring-blue-500 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
                placeholder="Enter last name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={isEditing ? tempInfo.email : personalInfo.email}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("email", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-blue-300 focus:ring-blue-500 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-blue-600" />
                LinkedIn URL
              </label>
              <input
                type="text"
                value={
                  isEditing ? tempInfo.linkedinUrl : personalInfo.linkedinUrl
                }
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("linkedinUrl", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-blue-300 focus:ring-blue-500 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
                placeholder="https://www.linkedin.com/in/your-profile"
              />
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Regional Preferences
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                value={isEditing ? tempInfo.timezone : personalInfo.timezone}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("timezone", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-blue-300 focus:ring-blue-500 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <select
                value={isEditing ? tempInfo.language : personalInfo.language}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("language", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-blue-300 focus:ring-blue-500 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
            About Me
          </h4>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              rows={4}
              value={isEditing ? tempInfo.bio : personalInfo.bio}
              onChange={(e) => {
                if (isEditing) {
                  handleTempChange("bio", e.target.value);
                }
              }}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-none ${
                isEditing
                  ? "border-blue-300 focus:ring-blue-500 bg-white"
                  : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
              }`}
              placeholder="Tell us about yourself, your experience, and what motivates you..."
            />
            <p className="text-xs text-gray-500">
              Your bio will be visible to team members and may appear on your
              profile page.
            </p>
          </div>
        </div>

        {/* Edit Mode Controls */}
        {isEditing && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Unsaved changes
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
