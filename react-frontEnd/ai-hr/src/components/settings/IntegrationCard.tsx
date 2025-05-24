import { LucideIcon } from "lucide-react";

interface IntegrationCardProps {
  title: string;
  description: string;
  status: "connected" | "not-connected";
  icon?: LucideIcon;
  iconElement?: React.ReactNode;
  onAction: () => void;
  actionLabel: string;
}

export function IntegrationCard({
  title,
  description,
  status,
  icon: Icon,
  iconElement,
  onAction,
  actionLabel,
}: IntegrationCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {Icon ? <Icon className="h-8 w-8 text-blue-600" /> : iconElement}
          <div className="ml-3">
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <button
          onClick={onAction}
          className={`px-4 py-2 rounded-md transition-colors ${
            status === "connected"
              ? "bg-primary text-white hover:bg-blue-600"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {actionLabel}
        </button>
      </div>
      <p className="text-sm text-gray-600">
        Status:{" "}
        <span
          className={
            status === "connected"
              ? "text-green-600 font-medium"
              : "text-gray-500"
          }
        >
          {status === "connected" ? "Connected" : "Not connected"}
        </span>
      </p>
    </div>
  );
}
