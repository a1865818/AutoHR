// Simple global toast event bus for non-React callers

export type ToastType = "success" | "error";

interface ToastEvent {
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (event: ToastEvent) => void;

const listeners = new Set<ToastListener>();

export function subscribe(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: ToastEvent): void {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // ignore listener errors
    }
  });
}

export const toast = {
  success(message: string, duration?: number): void {
    emit({ type: "success", message, duration });
  },
  error(message: string, duration?: number): void {
    emit({ type: "error", message, duration });
  },
};

export type { ToastEvent, ToastListener };


