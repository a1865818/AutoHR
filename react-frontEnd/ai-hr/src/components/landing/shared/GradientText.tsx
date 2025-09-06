"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  variant?: "primary" | "secondary";
}

export function GradientText({ 
  children, 
  className, 
  animate = false,
  variant = "primary"
}: GradientTextProps) {
  const gradientClass = variant === "primary" 
    ? "text-gradient-primary" 
    : "text-gradient-secondary";

  const content = (
    <span className={cn(gradientClass, "font-bold", className)}>
      {children}
    </span>
  );

  if (animate) {
    return (
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {content}
      </motion.span>
    );
  }

  return content;
}