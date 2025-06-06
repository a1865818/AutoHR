"use client";

import { HiringSidebar, Header, ProtectedRoute } from "@/components";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredUserCategory="HiringUserProfile">
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-slate-50">
        <HiringSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
