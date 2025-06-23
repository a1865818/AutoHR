"use client";

import {
  BarChart3,
  Building,
  Calendar,
  FileText,
  GitBranch,
  Home,
  Menu,
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

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
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
            className="lg:hidden p-2 rounded-md text-gray-600 bg-white hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        )}
        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          className="hidden lg:block p-2 rounded-md text-gray-600 bg-white hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          onClick={() => {
            const newValue = !isCollapsed;
            setIsCollapsed(newValue);
            localStorage.setItem("sidebar-collapsed", newValue.toString());
          }}
        >
          <span className="sr-only">Toggle sidebar</span>
          <Menu className="h-6 w-4" />
        </button>
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
        className={`fixed inset-y-0 left-0 z-30 bg-white shadow-lg transition-all duration-300 ease-in-out
          lg:static lg:h-screen lg:overflow-y-auto
          ${isOpen ? "translate-x-0 w-sidebar" : "-translate-x-full w-sidebar"}
          lg:translate-x-0
          ${isCollapsed ? "lg:w-sidebar-collapsed" : "lg:w-sidebar"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative">
            <div
              className={`flex items-center py-5 ${
                isCollapsed ? "lg:justify-center" : "justify-between"
              } ${isCollapsed ? "px-4" : "px-4"}`}
            >
              <Link
                href="/"
                prefetch={false}
                className="flex items-center"
                title={
                  isCollapsed ? "AutoHire Dashboard" : "AutoHire Dashboard"
                }
              >
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded ${
                    isCollapsed ? "" : "bg-indigo-600"
                  }`}
                >
                  <Building
                    className={`h-6 w-6 ${
                      isCollapsed ? "text-indigo-600" : "text-white"
                    }`}
                  />
                </div>
                <span
                  className={`ml-2 text-lg font-semibold text-gray-900 ${
                    isCollapsed ? "lg:hidden" : ""
                  }`}
                >
                  AutoHire
                </span>
              </Link>
              {isOpen && (
                <button
                  type="button"
                  className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
            {/* Custom divider */}
            <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200" />
          </div>

          {/* Navigation */}
          <nav
            className={`flex-1 mt-4 space-y-6 overflow-y-auto ${
              isCollapsed ? "px-2" : "px-4"
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
                    className={`flex items-center py-2 rounded-md text-sm font-medium transition-colors duration-150 relative
                      ${isCollapsed ? "px-2 justify-center" : "px-3"}
                      ${
                        isActive
                          ? isCollapsed
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600"
                          : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"} ${
                        isActive ? "text-indigo-600" : "text-gray-500"
                      }`}
                    />
                    <span className={`${isCollapsed ? "lg:hidden" : ""}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-gray-200 pt-6">
              <div className={`${isCollapsed ? "lg:hidden" : ""} mb-4`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                  <span className="h-1 w-6 bg-indigo-600 rounded-full mr-2"></span>
                  Quick Actions
                </p>
              </div>

              <div className="space-y-3">
                {/* Create Job Button */}
                <Link
                  href="/create-job"
                  className={`group relative flex items-center py-3 px-4 rounded-xl text-sm font-medium text-white 
                  bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 
                  shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                  transition-all duration-200 ease-out
                  ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Create Job" : undefined}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-1 rounded-lg bg-white/20 ${
                        isCollapsed ? "" : "mr-3"
                      }`}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </div>
                    <span
                      className={`${
                        isCollapsed ? "lg:hidden" : ""
                      } font-semibold`}
                    >
                      Create Job
                    </span>
                  </div>
                </Link>

                {/* Create Interview Template Button */}
                <Link
                  href="/interviews/create"
                  className={`group relative flex items-center py-3 px-4 rounded-xl text-sm font-medium text-gray-700
                  bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200
                  border border-gray-200 hover:border-gray-300
                  shadow-sm hover:shadow-md transform hover:-translate-y-0.5
                  transition-all duration-200 ease-out
                  ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Create Interview Template" : undefined}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-1 rounded-lg bg-indigo-100 text-indigo-600 ${
                        isCollapsed ? "" : "mr-3"
                      }`}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </div>
                    <span
                      className={`${
                        isCollapsed ? "lg:hidden" : ""
                      } font-semibold`}
                    >
                      Create Interview Template
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
