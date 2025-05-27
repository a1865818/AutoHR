import {
  User,
  Shield,
  Settings,
  Users,
  Activity,
  Link,
  Lock,
} from "lucide-react";

interface ProfileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProfileNavigation({
  activeTab,
  onTabChange,
}: ProfileNavigationProps) {
  const navigationItems = [
    {
      id: "personal",
      label: "Personal Information",
      icon: User,
      description: "Basic profile details",
    },
    {
      id: "security",
      label: "Account Security",
      icon: Shield,
      description: "Password & 2FA",
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: Settings,
      description: "Notifications & settings",
    },
    {
      id: "role",
      label: "Role & Permissions",
      icon: Users,
      description: "Access & team info",
    },
    {
      id: "activity",
      label: "Activity & Usage",
      icon: Activity,
      description: "Login history & stats",
    },
    {
      id: "integrations",
      label: "Connected Apps",
      icon: Link,
      description: "Third-party integrations",
    },
    {
      id: "privacy",
      label: "Privacy & Data",
      icon: Lock,
      description: "Data settings & export",
    },
  ];

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Profile Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your account and preferences
          </p>
        </div>
        <nav className="p-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-medium ${
                      isActive ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Completion Card */}
      <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h4 className="font-medium text-green-900">Profile Complete</h4>
        </div>
        <div className="w-full bg-green-200 rounded-full h-2 mb-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: "85%" }}
          ></div>
        </div>
        <p className="text-sm text-green-700">
          Your profile is 85% complete. Add a profile picture to reach 100%!
        </p>
      </div>
    </div>
  );
}
