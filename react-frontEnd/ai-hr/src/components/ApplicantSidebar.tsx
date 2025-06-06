"use client";

import {
  Search,
  User,
  FileText,
  Settings,
  Menu,
  X,
  Heart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ApplicantSidebar() {
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
    { name: "Dashboard", href: "/applicant", icon: TrendingUp },
    { name: "Browse Jobs", href: "/applicant/jobs", icon: Search },
    {
      name: "My Applications",
      href: "/applicant/applications",
      icon: FileText,
    },
    { name: "Saved Jobs", href: "/applicant/saved-jobs", icon: Heart },
    { name: "Profile", href: "/applicant/profile", icon: User },
    { name: "Settings", href: "/applicant/settings", icon: Settings },
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
            className="lg:hidden p-2 rounded-md text-gray-600 bg-white hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        )}
        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          className="hidden lg:block p-2 rounded-md text-gray-600 bg-white hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
          <div
            className={`flex items-center px-4 py-5 border-b border-gray-200 ${
              isCollapsed ? "lg:justify-center" : "justify-between"
            }`}
          >
            <Link
              href="/applicant"
              prefetch={false}
              className="flex items-center"
              title={
                isCollapsed ? "JobSeeker Dashboard" : "JobSeeker Dashboard"
              }
            >
              <div
                className={`flex items-center justify-center h-8 w-8 rounded ${
                  isCollapsed ? "" : "bg-blue-600"
                }`}
              >
                <Search
                  className={`h-6 w-6 ${
                    isCollapsed ? "text-blue-600" : "text-white"
                  }`}
                />
              </div>
              <span
                className={`ml-2 text-lg font-semibold text-gray-900 ${
                  isCollapsed ? "lg:hidden" : ""
                }`}
              >
                JobSeeker
              </span>
            </Link>
            {isOpen && (
              <button
                type="button"
                className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setIsOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6" />
              </button>
            )}
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
                            ? "bg-blue-100 text-blue-700"
                            : "bg-blue-100 text-blue-700 border-l-4 border-blue-600"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"} ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                    <span className={`${isCollapsed ? "lg:hidden" : ""}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className={`${isCollapsed ? "lg:hidden" : ""} mb-2`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Quick Actions
                </p>
              </div>
              <div className="space-y-1">
                <Link
                  href="/applicant/jobs?recommended=true"
                  className={`flex items-center py-2 px-3 rounded-md text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors
                    ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Recommended Jobs" : undefined}
                >
                  <TrendingUp
                    className={`h-4 w-4 ${
                      isCollapsed ? "" : "mr-3"
                    } text-green-500`}
                  />
                  <span className={`${isCollapsed ? "lg:hidden" : ""}`}>
                    Recommended
                  </span>
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
