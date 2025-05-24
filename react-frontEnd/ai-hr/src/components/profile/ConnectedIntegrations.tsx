import { Link, Check, X } from "lucide-react";
import { ConnectedIntegration } from "@/interfaces";
import { ToggleSwitch } from "@/components/settings";

interface ConnectedIntegrationsProps {
  integrations: ConnectedIntegration[];
  onToggle: (integrationId: string) => void;
  isLoading?: boolean;
}

export function ConnectedIntegrations({
  integrations,
  onToggle,
  isLoading = false,
}: ConnectedIntegrationsProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Link className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Connected Apps</h3>
          <p className="text-sm text-gray-600">
            Manage your third-party integrations and connected services
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {integration.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {integration.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span
                        className={`flex items-center gap-1 ${
                          integration.status === "active"
                            ? "text-green-600"
                            : integration.status === "error"
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {integration.status === "active" ? (
                          <Check className="h-3 w-3" />
                        ) : integration.status === "error" ? (
                          <X className="h-3 w-3" />
                        ) : (
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        )}
                        {integration.status.charAt(0).toUpperCase() +
                          integration.status.slice(1)}
                      </span>
                      {integration.connected && integration.lastSync && (
                        <span>
                          Last sync: {integration.lastSync.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={integration.connected}
                  onChange={() => onToggle(integration.id)}
                  disabled={isLoading}
                  size="lg"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
