import { Eye, EyeOff, Mail } from "lucide-react";
import { IntegrationCard } from "./IntegrationCard";

interface IntegrationsSettingsProps {
  showApiKey: boolean;
  onToggleApiKey: () => void;
  onConfigureEmail: () => void;
  onConnectCalendar: () => void;
}

export function IntegrationsSettings({
  showApiKey,
  onToggleApiKey,
  onConfigureEmail,
  onConnectCalendar,
}: IntegrationsSettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Integrations</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IntegrationCard
          title="Email Service"
          description="Connect your email provider"
          status="connected"
          icon={Mail}
          onAction={onConfigureEmail}
          actionLabel="Configure"
        />

        <IntegrationCard
          title="Google Calendar"
          description="Schedule interviews"
          status="not-connected"
          iconElement={
            <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
          }
          onAction={onConnectCalendar}
          actionLabel="Connect"
        />
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h4 className="font-medium text-gray-900 mb-4">API Configuration</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="flex">
              <input
                type={showApiKey ? "text" : "password"}
                value="sk-proj-1234567890abcdef"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 focus:outline-none"
              />
              <button
                onClick={onToggleApiKey}
                className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
