import { Shield, Key, Smartphone, Clock, MapPin } from "lucide-react";
import { SecuritySettings } from "@/interfaces";
import { ToggleSwitch } from "@/components/settings";

interface AccountSecurityProps {
  securitySettings: SecuritySettings;
  onUpdate: (settings: Partial<SecuritySettings>) => void;
  isLoading?: boolean;
}

export function AccountSecurity({
  securitySettings,
  onUpdate,
  isLoading = false,
}: AccountSecurityProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 80)
      return {
        level: "Excellent",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (score >= 60)
      return { level: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 40)
      return { level: "Fair", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "Poor", color: "text-red-600", bg: "bg-red-100" };
  };

  const security = getSecurityLevel(securitySettings.securityScore);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <Shield className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Account Security
          </h3>
          <p className="text-sm text-gray-600">
            Manage your password, two-factor authentication, and security
            settings
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Security Score */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            Security Score
          </h4>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-gray-900">
                {securitySettings.securityScore}/100
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${security.bg} ${security.color}`}
                >
                  {security.level}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Your account security is {security.level.toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                securitySettings.securityScore >= 80
                  ? "bg-green-500"
                  : securitySettings.securityScore >= 60
                  ? "bg-blue-500"
                  : securitySettings.securityScore >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${securitySettings.securityScore}%` }}
            ></div>
          </div>
        </div>

        {/* Password Settings */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Password & Authentication
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600">
                    Last changed{" "}
                    {formatDate(securitySettings.passwordLastChanged)}
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                Change Password
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-gray-600">
                    {securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}{" "}
                    - Add an extra layer of security
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={securitySettings.twoFactorEnabled}
                onChange={(enabled) => onUpdate({ twoFactorEnabled: enabled })}
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Trusted Devices */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Trusted Devices ({securitySettings.trustedDevices.length})
          </h4>

          <div className="space-y-3">
            {securitySettings.trustedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {device.type === "desktop"
                      ? "💻"
                      : device.type === "mobile"
                      ? "📱"
                      : "📺"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{device.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(device.lastUsed)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {device.location}
                      </span>
                      <span>{device.browser}</span>
                    </div>
                  </div>
                </div>
                <button className="text-sm text-red-600 hover:text-red-700">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Login Activity */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
            Recent Login Activity
          </h4>

          <div className="space-y-3">
            {securitySettings.loginHistory.slice(0, 5).map((login) => (
              <div
                key={login.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      login.success ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {login.success
                        ? "Successful login"
                        : "Failed login attempt"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatDate(login.timestamp)}</span>
                      <span>{login.device}</span>
                      <span>{login.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 text-sm text-blue-600 hover:text-blue-700">
            View all login activity
          </button>
        </div>
      </div>
    </div>
  );
}
