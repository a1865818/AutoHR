"use client";

import { HiringSidebar, Header, ProtectedRoute } from "@/components";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsedLocal, setIsCollapsedLocal] = useState(false);
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    setIsCollapsedLocal(savedCollapsed === "true");
  }, []);
  const toggleSidebar = () => {
    const newValue = !isCollapsedLocal;
    setIsCollapsedLocal(newValue);
    try {
      localStorage.setItem("sidebar-collapsed", newValue.toString());
    } catch {}
    // notify sidebar
    window.dispatchEvent(new Event("toggle-sidebar"));
  };
  // Determine if current route is /candidates or /jobs or their subroutes
  const isNoPadding =
    pathname.startsWith("/candidates") || pathname.startsWith("/jobs");
  return (
    <ProtectedRoute requiredUserCategory="HiringUser">
      <div className="flex h-screen bg-background">
        <HiringSidebar />
        <div className="relative flex-1 flex flex-col overflow-hidden lg:m-2 lg:rounded-2xl lg:shadow-sm bg-background">
          {/* Main-side toggle handle (desktop) */}
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center absolute left-2 top-6 h-8 w-8 rounded-xl bg-background shadow-sm hover:shadow-lg hover:ring-2 hover:ring-primary/20 transition-all duration-200 z-[70]"
          >
            {isCollapsedLocal ? (
              <PanelLeftOpen className="h-4 w-4 text-foreground/80" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-foreground/80" />
            )}
          </button>
          <Header />
          <main
            className={`flex-1 overflow-y-auto${
              isNoPadding ? "" : " pt-4 sm:pt-6"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
