"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
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
    { name: "Jobs", href: "/jobs", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  //   const isCategoryActive = (categoryHref: string) => {
  //     const [catPath, catQuery] = categoryHref.split("?");
  //     if (pathname !== catPath) return false;
  //     if (!catQuery) return searchParams.toString() === "";

  //     const categorySearchParams = new URLSearchParams(catQuery);
  //     for (const [key, value] of categorySearchParams.entries()) {
  //       if (searchParams.get(key) !== value) return false;
  //     }
  //     return true;
  //   };
  if (isCollapsed === null) return null;

  return (
    <>
      {" "}
      {/* Toggle Buttons */}
      <div className="fixed top-4 left-4 z-40">
        {/* Mobile Toggle Button - Only shown when sidebar is closed */}
        {!isOpen && (
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-600 bg-white hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        )}
        {/* Desktop Collapse Toggle */}{" "}
        <button
          type="button"
          className="hidden lg:block p-2 rounded-md text-gray-600 bg-white hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          onClick={() => {
            const newValue = !isCollapsed;
            setIsCollapsed(newValue);
            localStorage.setItem("sidebar-collapsed", newValue.toString());
          }}
        >
          <span className="sr-only">Toggle sidebar</span>
          {isCollapsed ? (
            <ChevronRight className="h-6 w-6" />
          ) : (
            <ChevronLeft className="h-6 w-6" />
          )}
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
          ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          lg:translate-x-0
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={`flex items-center px-4 py-5 border-b border-gray-200 ${
              isCollapsed ? "lg:justify-center" : "justify-between"
            }`}
          >
            {" "}
            <Link
              href="/"
              prefetch={false}
              className="flex items-center"
              title={isCollapsed ? "Dashboard" : "HR Recruit Dashboard"}
            >
              <div
                className={`flex items-center justify-center h-8 w-8 rounded ${
                  isCollapsed ? "" : "bg-primary"
                }`}
              >
                <Home
                  className={`h-6 w-6 ${
                    isCollapsed ? "text-primary" : "text-white"
                  }`}
                />
              </div>
              <span
                className={`ml-2 text-lg font-semibold text-gray-900 ${
                  isCollapsed ? "lg:hidden" : ""
                }`}
              >
                HR Recruit
              </span>
            </Link>
            {isOpen && (
              <button
                type="button"
                className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
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
                    className={`flex items-center py-2 rounded-md text-sm font-medium transition-colors duration-150
                      ${isCollapsed ? "px-2 justify-center" : "px-3"}
                      ${
                        isActive
                          ? isCollapsed
                            ? "bg-blue-100"
                            : "bg-gray-100 text-gray-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
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
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
