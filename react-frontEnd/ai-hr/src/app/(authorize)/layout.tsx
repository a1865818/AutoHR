import React from "react";

export const metadata = {
  title: "Authentication - AI HR Recruitment Platform",
  description: "Access your AutoHR account",
};

export default function AuthorizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
