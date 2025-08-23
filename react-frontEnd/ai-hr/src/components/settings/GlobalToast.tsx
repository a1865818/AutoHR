"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast } from "./Toast";
import { subscribe, ToastEvent } from "@/utils/toast";

export function GlobalToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error">("success");
  const [duration, setDuration] = useState<number>(3000);

  const handleClose = useCallback(() => setIsVisible(false), []);

  useEffect(() => {
    const unsubscribe = subscribe((event: ToastEvent) => {
      setMessage(event.message);
      setType(event.type);
      setDuration(event.duration ?? 3000);
      setIsVisible(true);
    });

    return unsubscribe;
  }, []);

  return (
    <Toast
      message={message}
      type={type}
      isVisible={isVisible}
      onClose={handleClose}
      duration={duration}
    />
  );
}
