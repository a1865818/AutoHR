"use client";

import { NotificationSetting } from "@/interfaces";
import { ToggleSwitch } from "@/components/settings";
import { Bell, Mail, Smartphone } from "lucide-react";

interface ApplicantNotificationSettingsProps {
  notifications: NotificationSetting[];
  onToggle: (id: string, type: "email" | "push") => void;
}

export function ApplicantNotificationSettings({
  notifications,
  onToggle,
}: ApplicantNotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Choose how you want to be notified about job opportunities and updates
        </p>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {notification.description}
                </p>
                
                <div className="flex items-center space-x-6">
                  {/* Email Toggle */}
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Email</span>
                    <ToggleSwitch
                      checked={notification.email}
                      onChange={() => onToggle(notification.id, "email")}
                    />
                  </div>

                  {/* Push Toggle */}
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Push</span>
                    <ToggleSwitch
                      checked={notification.push}
                      onChange={() => onToggle(notification.id, "push")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Notification Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enable email notifications for important updates like interview invitations</li>
              <li>• Use push notifications for real-time job recommendations</li>
              <li>• You can customize these settings anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 