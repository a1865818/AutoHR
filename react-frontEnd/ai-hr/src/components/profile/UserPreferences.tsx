import { Settings } from "lucide-react";
import { UserPreferences as UserPrefs } from "@/interfaces";

interface UserPreferencesProps {
  preferences: UserPrefs;
  onUpdate: (preferences: UserPrefs) => void;
  isLoading?: boolean;
}

export function UserPreferences({
  preferences,
  onUpdate,
  isLoading = false,
}: UserPreferencesProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Settings className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            User Preferences
          </h3>
          <p className="text-sm text-gray-600">
            Customize your experience and notification settings
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Theme & Display
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["light", "dark", "auto"].map((theme) => (
              <button
                key={theme}
                onClick={() =>
                  onUpdate({ ...preferences, theme: theme as any })
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences.theme === theme
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "🔄"}
                  </div>
                  <div className="font-medium text-gray-900 capitalize">
                    {theme}
                  </div>
                  <div className="text-sm text-gray-600">
                    {theme === "auto" ? "System default" : `${theme} mode`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Email Digest
          </h4>

          <select
            value={preferences.emailDigest}
            onChange={(e) =>
              onUpdate({ ...preferences, emailDigest: e.target.value as any })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="never">Never</option>
          </select>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            More preference options coming soon! This section will include
            detailed notification settings, language preferences, and
            accessibility options.
          </p>
        </div>
      </div>
    </div>
  );
}
