import { Lock, Download, Trash2 } from "lucide-react";
import { PrivacySettings } from "@/interfaces";
import { ToggleSwitch } from "@/components/settings";

interface PrivacyDataProps {
  privacySettings: PrivacySettings;
  onUpdate: (settings: PrivacySettings) => void;
  isLoading?: boolean;
}

export function PrivacyData({
  privacySettings,
  onUpdate,
  isLoading = false,
}: PrivacyDataProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <Lock className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Privacy & Data</h3>
          <p className="text-sm text-gray-600">
            Control your privacy settings and manage your data
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Privacy Controls */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
            Privacy Controls
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <p className="font-medium text-gray-900">Analytics Tracking</p>
                <p className="text-sm text-gray-600">
                  Allow usage analytics to improve the platform
                </p>
              </div>
              <ToggleSwitch
                checked={privacySettings.allowAnalytics}
                onChange={(checked) =>
                  onUpdate({ ...privacySettings, allowAnalytics: checked })
                }
                size="lg"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <p className="font-medium text-gray-900">
                  Marketing Communications
                </p>
                <p className="text-sm text-gray-600">
                  Receive marketing emails and product updates
                </p>
              </div>
              <ToggleSwitch
                checked={privacySettings.allowMarketing}
                onChange={(checked) =>
                  onUpdate({ ...privacySettings, allowMarketing: checked })
                }
                size="lg"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <p className="font-medium text-gray-900">
                  Third-party Data Sharing
                </p>
                <p className="text-sm text-gray-600">
                  Allow sharing data with integrated services
                </p>
              </div>
              <ToggleSwitch
                checked={privacySettings.allowThirdParty}
                onChange={(checked) =>
                  onUpdate({ ...privacySettings, allowThirdParty: checked })
                }
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Data Management
          </h4>

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Export Personal Data
                  </p>
                  <p className="text-sm text-gray-600">
                    Download a copy of all your personal data
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download className="h-4 w-4" />
                  Export Data
                </button>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Data Retention</p>
                  <p className="text-sm text-gray-600">
                    Data is kept for {privacySettings.dataRetention} months
                  </p>
                </div>
                <select
                  value={privacySettings.dataRetention}
                  onChange={(e) =>
                    onUpdate({
                      ...privacySettings,
                      dataRetention: parseInt(e.target.value),
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                  <option value={36}>36 months</option>
                  <option value={60}>5 years</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-900 mb-4 flex items-center">
            <Trash2 className="h-5 w-5 text-red-500 mr-2" />
            Danger Zone
          </h4>

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Delete Account</p>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-300 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
