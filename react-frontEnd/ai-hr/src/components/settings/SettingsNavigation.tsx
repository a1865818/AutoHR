import {
  Bell,
  Building2,
  CreditCard,
  Settings,
  Shield,
  Users,
  Zap,
  LucideIcon,
} from "lucide-react";

interface Tab {
  id: string;
  name: string;
  icon: LucideIcon;
}

interface SettingsNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SettingsNavigation({
  activeTab,
  onTabChange,
}: SettingsNavigationProps) {
  const tabs: Tab[] = [
    { id: "company", name: "Company", icon: Building2 },
    { id: "users", name: "Team", icon: Users },
    { id: "recruitment", name: "Recruitment", icon: Settings },
    { id: "integrations", name: "Integrations", icon: Zap },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "security", name: "Security", icon: Shield },
    { id: "billing", name: "Billing", icon: CreditCard },
  ];

  return (
    <div className="lg:w-64">
      <div className="bg-white rounded-lg shadow">
        <nav className="space-y-1 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
