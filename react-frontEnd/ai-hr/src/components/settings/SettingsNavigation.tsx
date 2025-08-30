import { Building2, CreditCard, Shield, Users, LucideIcon } from "lucide-react";

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
                    ? "bg-[#066046]/10 text-[#066046] border-l-4 border-[#066046] font-semibold"
                    : "text-gray-700 hover:bg-[#066046]/5 hover:text-[#066046]"
                }`}
              >
                <Icon
                  className={`h-5 w-5 mr-3 ${
                    activeTab === tab.id ? "text-[#066046]" : "text-gray-500"
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
