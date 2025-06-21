"use client";

import { ToggleSwitch } from "@/components/settings";
import { Zap, ExternalLink, CheckCircle } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon?: string;
  status?: "active" | "inactive" | "error";
}

interface ApplicantIntegrationsSettingsProps {
  integrations: Integration[];
  onToggle: (integrationId: string) => void;
  isLoading?: boolean;
}

export function ApplicantIntegrationsSettings({
  integrations,
  onToggle,
  isLoading = false,
}: ApplicantIntegrationsSettingsProps) {
  // Default integrations for applicants
  const defaultIntegrations: Integration[] = [
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "Import your professional profile and connections",
      connected: integrations.find(i => i.id === "linkedin")?.connected || false,
      icon: "🔗",
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync interview schedules and job-related events",
      connected: integrations.find(i => i.id === "google-calendar")?.connected || false,
      icon: "📅",
    },
    {
      id: "dropbox",
      name: "Dropbox",
      description: "Access and share your resume and portfolio files",
      connected: integrations.find(i => i.id === "dropbox")?.connected || false,
      icon: "📁",
    },
    {
      id: "github",
      name: "GitHub",
      description: "Showcase your code repositories and projects",
      connected: integrations.find(i => i.id === "github")?.connected || false,
      icon: "💻",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Receive job notifications in your Slack workspace",
      connected: integrations.find(i => i.id === "slack")?.connected || false,
      icon: "💬",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Integrations
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Connect your favorite tools and services to enhance your job search experience
        </p>
      </div>

      <div className="space-y-4">
        {defaultIntegrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                    {integration.icon}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {integration.name}
                    </h3>
                    {integration.connected && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {integration.description}
                  </p>
                  
                  {integration.connected && (
                    <div className="flex items-center space-x-2 text-xs text-green-600">
                      <span>Connected</span>
                      <span>•</span>
                      <span>Last synced: {new Date().toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {integration.connected && (
                  <button
                    onClick={() => onToggle(integration.id)}
                    disabled={isLoading}
                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                )}
                
                <ToggleSwitch
                  checked={integration.connected}
                  onChange={() => onToggle(integration.id)}
                />
              </div>
            </div>

            {integration.connected && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                      <ExternalLink className="h-3 w-3" />
                      <span>Manage Settings</span>
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                      View Data
                    </button>
                  </div>
                  <button className="text-sm text-gray-500 hover:text-gray-700">
                    Sync Now
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Integration Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Integration Benefits
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• LinkedIn: Import your professional network and experience</li>
              <li>• Google Calendar: Never miss an interview or deadline</li>
              <li>• GitHub: Showcase your technical skills to employers</li>
              <li>• Dropbox: Keep your documents organized and accessible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 