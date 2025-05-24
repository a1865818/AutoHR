import { useState, useEffect } from "react";
import { Save, X, Edit3, Settings } from "lucide-react";
import { ToggleSwitch } from "./ToggleSwitch";

interface RecruitmentConfig {
  autoScreening: boolean;
  emailConfirmations: boolean;
  minimumScore: number;
  autoRejectBelow: number;
}

interface RecruitmentSettingsProps {
  config: RecruitmentConfig;
  onChange: (config: RecruitmentConfig) => void;
}

export function RecruitmentSettings({
  config,
  onChange,
}: RecruitmentSettingsProps) {
  const [isEditingCriteria, setIsEditingCriteria] = useState(false);
  const [tempConfig, setTempConfig] = useState<RecruitmentConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  useEffect(() => {
    if (isEditingCriteria) {
      const configChanged =
        tempConfig.minimumScore !== config.minimumScore ||
        tempConfig.autoRejectBelow !== config.autoRejectBelow;
      setHasChanges(configChanged);
    }
  }, [tempConfig, config, isEditingCriteria]);

  const handleToggle = (field: keyof RecruitmentConfig, value: boolean) => {
    onChange({ ...config, [field]: value });
  };

  const handleTempNumberChange = (
    field: keyof RecruitmentConfig,
    value: string
  ) => {
    // Remove leading zeros but keep single 0
    const cleanValue = value.replace(/^0+(?=\d)/, "");

    // Convert to number and validate range
    const numValue = parseInt(cleanValue) || 0;

    // Ensure value is within 0-100 range
    const validatedValue = Math.min(Math.max(numValue, 0), 100);

    setTempConfig({ ...tempConfig, [field]: validatedValue });
  };

  const handleInputChange = (
    field: keyof RecruitmentConfig,
    inputValue: string
  ) => {
    // Allow empty string for better UX while typing
    if (inputValue === "") {
      setTempConfig({ ...tempConfig, [field]: 0 });
      return;
    }

    // Only allow numeric characters
    const numericValue = inputValue.replace(/[^0-9]/g, "");

    // Limit to 3 digits max (to prevent values over 100)
    const limitedValue = numericValue.slice(0, 3);

    // Convert to number and validate
    const num = parseInt(limitedValue);

    // If the number is valid and within range, update temp config
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setTempConfig({ ...tempConfig, [field]: num });
    }
  };

  const handleStartEdit = () => {
    setTempConfig(config);
    setIsEditingCriteria(true);
    setHasChanges(false);
  };

  const handleSaveChanges = () => {
    onChange(tempConfig);
    setIsEditingCriteria(false);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setTempConfig(config);
    setIsEditingCriteria(false);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Recruitment Configuration
            </h3>
            <p className="text-sm text-gray-600">
              Manage your application process and screening settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Application Process Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Application Process
            </h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      Auto-screening
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        config.autoScreening
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {config.autoScreening ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Automatically screen applications using AI to save time
                  </p>
                </div>
                <ToggleSwitch
                  checked={config.autoScreening}
                  onChange={(checked) => handleToggle("autoScreening", checked)}
                  size="lg"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      Email confirmations
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        config.emailConfirmations
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {config.emailConfirmations ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Send automatic confirmation emails to applicants
                  </p>
                </div>
                <ToggleSwitch
                  checked={config.emailConfirmations}
                  onChange={(checked) =>
                    handleToggle("emailConfirmations", checked)
                  }
                  size="lg"
                />
              </div>
            </div>
          </div>

          {/* Assessment Criteria Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                Assessment Criteria
              </h4>
              {!isEditingCriteria && (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Settings
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Score Threshold
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="100"
                    value={
                      isEditingCriteria
                        ? tempConfig.minimumScore
                        : config.minimumScore
                    }
                    onChange={(e) => {
                      if (isEditingCriteria) {
                        handleInputChange("minimumScore", e.target.value);
                      }
                    }}
                    onBlur={(e) => {
                      if (isEditingCriteria) {
                        handleTempNumberChange("minimumScore", e.target.value);
                      }
                    }}
                    disabled={!isEditingCriteria}
                    placeholder="0-100"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      isEditingCriteria
                        ? "border-blue-300 focus:ring-blue-500 bg-white"
                        : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                    }`}
                  />
                  <div className="absolute right-3 top-3 text-sm text-gray-500">
                    %
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Applications scoring above this threshold will be prioritized
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Auto-reject below
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="100"
                    value={
                      isEditingCriteria
                        ? tempConfig.autoRejectBelow
                        : config.autoRejectBelow
                    }
                    onChange={(e) => {
                      if (isEditingCriteria) {
                        handleInputChange("autoRejectBelow", e.target.value);
                      }
                    }}
                    onBlur={(e) => {
                      if (isEditingCriteria) {
                        handleTempNumberChange(
                          "autoRejectBelow",
                          e.target.value
                        );
                      }
                    }}
                    disabled={!isEditingCriteria}
                    placeholder="0-100"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      isEditingCriteria
                        ? "border-blue-300 focus:ring-blue-500 bg-white"
                        : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                    }`}
                  />
                  <div className="absolute right-3 top-3 text-sm text-gray-500">
                    %
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Applications scoring below this will be automatically rejected
                </p>
              </div>
            </div>

            {/* Edit Mode Controls */}
            {isEditingCriteria && (
              <div className="mt-6 pt-4 border-t border-gray-200">
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
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={!hasChanges}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">
              Current Configuration Summary
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-blue-600 font-medium">
                  Auto-screening
                </span>
                <span
                  className={
                    config.autoScreening
                      ? "text-green-700 font-semibold"
                      : "text-gray-600"
                  }
                >
                  {config.autoScreening ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-blue-600 font-medium">
                  Email Confirmations
                </span>
                <span
                  className={
                    config.emailConfirmations
                      ? "text-green-700 font-semibold"
                      : "text-gray-600"
                  }
                >
                  {config.emailConfirmations ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-blue-600 font-medium">
                  Min. Threshold
                </span>
                <span className="text-gray-900 font-semibold">
                  {config.minimumScore}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-blue-600 font-medium">
                  Auto-reject Below
                </span>
                <span className="text-gray-900 font-semibold">
                  {config.autoRejectBelow}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
