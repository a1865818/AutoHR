// Simple notification utility
// In a real app, you might want to use a library like react-hot-toast or similar

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

// Simple console-based notifications for now
// TODO: Replace with proper toast notifications
export const showNotification = (
  type: NotificationType,
  title: string,
  message?: string
) => {
  const emoji = {
    success: "✅",
    error: "❌", 
    info: "ℹ️",
    warning: "⚠️"
  }[type];

  console.log(`${emoji} ${title}${message ? `: ${message}` : ""}`);

  // For better UX, you could integrate with:
  // - react-hot-toast
  // - react-toastify  
  // - Custom modal/toast component
  
  // Simple browser alert for now (can be removed when proper toast is implemented)
  if (type === "error") {
    alert(`Error: ${title}${message ? `\n${message}` : ""}`);
  } else if (type === "success") {
    alert(`Success: ${title}${message ? `\n${message}` : ""}`);
  }
};

export const notifications = {
  success: (title: string, message?: string) => showNotification("success", title, message),
  error: (title: string, message?: string) => showNotification("error", title, message),
  info: (title: string, message?: string) => showNotification("info", title, message),
  warning: (title: string, message?: string) => showNotification("warning", title, message),
}; 