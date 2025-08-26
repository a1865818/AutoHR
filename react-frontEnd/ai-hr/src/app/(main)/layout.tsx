"use client";

import { HiringSidebar, Header, ProtectedRoute } from "@/components";
import { usePathname } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Determine if current route is /candidates or /jobs or their subroutes
  const isNoPadding = pathname.startsWith("/candidates") || pathname.startsWith("/jobs");
  return (
    <ProtectedRoute requiredUserCategory="HiringUser">
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-slate-50">
        <HiringSidebar />
        <div className="flex-1 flex flex-col overflow-hidden ">
          <Header />
          <main className={`flex-1 overflow-y-auto${isNoPadding ? "" : " pt-4 sm:pt-6"}`}>{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
