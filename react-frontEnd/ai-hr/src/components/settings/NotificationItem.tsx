import { ToggleSwitch } from "./ToggleSwitch";

interface NotificationItemProps {
  title: string;
  description: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  onEmailToggle: (enabled: boolean) => void;
  onPushToggle: (enabled: boolean) => void;
}

export function NotificationItem({
  title,
  description,
  emailEnabled,
  pushEnabled,
  onEmailToggle,
  onPushToggle,
}: NotificationItemProps) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900">{title}</h5>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-4 ml-4">
          <ToggleSwitch checked={emailEnabled} onChange={onEmailToggle} />
          <ToggleSwitch checked={pushEnabled} onChange={onPushToggle} />
        </div>
      </div>
    </div>
  );
}
