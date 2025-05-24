import { NotificationItem } from "./NotificationItem";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
}

interface NotificationSettingsProps {
  notifications: NotificationSetting[];
  onToggle: (id: string, type: "email" | "push") => void;
}

export function NotificationSettings({
  notifications,
  onToggle,
}: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Notification Preferences
      </h3>

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Notification Types</h4>
            <div className="flex space-x-4 text-sm text-gray-500">
              <span>Email</span>
              <span>Push</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              title={notification.title}
              description={notification.description}
              emailEnabled={notification.email}
              pushEnabled={notification.push}
              onEmailToggle={(enabled) => onToggle(notification.id, "email")}
              onPushToggle={(enabled) => onToggle(notification.id, "push")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
