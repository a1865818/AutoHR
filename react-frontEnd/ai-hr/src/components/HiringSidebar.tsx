"use client";

import {
  BarChart3,
  Command,
  Calendar,
  FileText,
  GitBranch,
  Home,
  PanelLeftOpen,
  PanelLeftClose,
  PlusCircle,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function HiringSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);

  // Handle localStorage entirely in useEffect to avoid hydration mismatch
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === "true");
    } else {
      setIsCollapsed(false); // default to not collapsed
    }
  }, []);

  // Allow external toggle via a custom window event from layout
  useEffect(() => {
    const handleToggle = () => {
      const newValue = !(isCollapsed ?? false);
      setIsCollapsed(newValue);
      localStorage.setItem("sidebar-collapsed", newValue.toString());
    };
    // Casting to any to satisfy TypeScript for custom event name
    window.addEventListener("toggle-sidebar" as any, handleToggle as any);
    return () =>
      window.removeEventListener("toggle-sidebar" as any, handleToggle as any);
  }, [isCollapsed]);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Candidates", href: "/candidates", icon: Users },
    {
      name: "Interview Pipeline",
      href: "/interview-pipeline",
      icon: GitBranch,
    },
    { name: "Jobs", href: "/jobs", icon: FileText },
    {
      name: "Interview Templates",
      href: "/interview-templates",
      icon: Calendar,
    },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  if (isCollapsed === null) return null;

  return (
    <>
      {/* Toggle Buttons */}
      <div className="fixed top-4 left-4 z-40">
        {/* Mobile Toggle Button - Only shown when sidebar is closed */}
        {!isOpen && (
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-600 bg-white hover:text-gray-900 hover:bg-[#066046]/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <PanelLeftOpen className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-card/95 transition-all duration-300 ease-in-out relative
          lg:relative lg:z-30 lg:h-screen lg:m-2 lg:rounded-2xl lg:shadow-sm
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          w-[280px]
          lg:translate-x-0
          ${
            isCollapsed
              ? "lg:w-[72px] lg:overflow-visible"
              : "lg:w-[280px] lg:overflow-y-auto"
          }`}
      >
        {/* Main-page edge click zone for easy toggling */}
        <button
          type="button"
          aria-label="Toggle sidebar"
          className="hidden lg:block absolute -right-2 top-0 h-full w-3 opacity-0 hover:opacity-100 cursor-ew-resize z-[55] hover:shadow-lg hover:shadow-gray-400/50 hover:bg-gradient-to-r hover:from-transparent hover:to-gray-200/30 transition-all duration-200"
          onClick={() => {
            const newValue = !isCollapsed;
            setIsCollapsed(newValue);
            localStorage.setItem("sidebar-collapsed", newValue.toString());
          }}
        />
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative">
            <div
              className={`flex items-center py-5 ${
                isCollapsed ? "lg:justify-center" : "justify-between"
              } ${isCollapsed ? "px-4" : "px-4"}`}
            >
              <Link
                href="/dashboard"
                prefetch={false}
                className="flex items-center"
                title={
                  isCollapsed ? "AutoHR Dashboard" : "AutoHR Dashboard"
                }
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg ring-2 ring-[#064e3b] bg-[#064e3b]/10">
                  <Command className="h-5 w-5 text-[#064e3b]" />
                </div>
                <span
                  className={`ml-2 text-lg font-semibold text-gray-900 ${
                    isCollapsed ? "lg:hidden" : ""
                  }`}
                >
                  AutoHR
                </span>
              </Link>
              {isOpen && (
                <button
                  type="button"
                  className="lg:hidden p-1 rounded-md text-gray-500 hover:text-[#066046] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={`flex-1 mt-4 space-y-6 ${
              isCollapsed ? "px-2 overflow-visible" : "px-4 overflow-y-auto"
            }`}
          >
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href && searchParams.toString() === "";
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center py-2 rounded-md text-sm font-medium transition-colors duration-150 relative group
                      ${isCollapsed ? "px-2 justify-center" : "px-3"}
                      ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-[#066046]/10"
                      }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"} ${
                        isActive ? "text-primary" : "text-gray-500"
                      }`}
                    />
                    <span className={`${isCollapsed ? "lg:hidden" : ""}`}>
                      {item.name}
                    </span>
                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[9999] pointer-events-none shadow-lg top-1/2 -translate-y-1/2">
                        {item.name}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="pt-6">
              <div className={`${isCollapsed ? "lg:hidden" : ""} mb-4`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                  <span className="h-1 w-6 bg-primary rounded-full mr-2"></span>
                  Quick Actions
                </p>
              </div>

              <div className="space-y-3">
                {/* Create Job Button */}
                <Link
                  href="/create-job"
                  className={`group relative flex items-center py-3 px-4 rounded-xl text-sm font-medium transition-colors
                  bg-[#066046]/10 text-[#066046] hover:bg-[#066046] hover:text-white
                  border border-[#066046]/20 hover:border-[#066046]
                  shadow-sm hover:shadow-md transform hover:-translate-y-0.5
                  transition-all duration-200 ease-out
                  ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Create Job" : undefined}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-1 rounded-lg transition-colors ${
                        isCollapsed ? "" : "mr-3"
                      } group-hover:bg-white/20 bg-[#066046]/20`}
                    >
                      <PlusCircle className="h-4 w-4 transition-colors group-hover:text-white text-[#066046]" />
                    </div>
                    <span
                      className={`${
                        isCollapsed ? "lg:hidden" : ""
                      } font-semibold`}
                    >
                      Create Job
                    </span>
                  </div>
                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[9999] pointer-events-none shadow-lg top-1/2 -translate-y-1/2">
                      Create Job
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </Link>

                {/* Create Interview Template Button */}
                <Link
                  href="/interview-templates/create"
                  className={`group relative flex items-center py-3 px-4 rounded-xl text-sm font-medium transition-colors
                  bg-[#066046]/10 text-[#066046] hover:bg-[#066046] hover:text-white
                  border border-[#066046]/20 hover:border-[#066046]
                  shadow-sm hover:shadow-md transform hover:-translate-y-0.5
                  transition-all duration-200 ease-out
                  ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Create Interview Template" : undefined}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-1 rounded-lg transition-colors ${
                        isCollapsed ? "" : "mr-3"
                      } group-hover:bg-white/20 bg-[#066046]/20`}
                    >
                      <PlusCircle className="h-4 w-4 transition-colors group-hover:text-white text-[#066046]" />
                    </div>
                    <span
                      className={`${
                        isCollapsed ? "lg:hidden" : ""
                      } font-semibold`}
                    >
                      Create Interview Template
                    </span>
                  </div>
                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[9999] pointer-events-none shadow-lg top-1/2 -translate-y-1/2">
                      Create Interview Template
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
