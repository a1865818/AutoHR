"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-4 pl-16 md:pl-14 lg:pl-4">
        {/* Search Bar - Full width on mobile, constrained on larger screens */}
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="Search..."
            aria-label="Search candidates and jobs"
          />
        </div>

        {/* Right-side Icons & Profile */}
        <div className="flex items-center ml-2 sm:ml-3 md:ml-4">
          {/* Hide notification bell on smallest screens */}
          <button
            type="button"
            className="hidden sm:block p-1 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          {/* Profile dropdown */}
          <div className="ml-2 sm:ml-3 relative">
            <div>
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">CR</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                  Caroline Robertson
                </span>
                <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu"
              >
                <div className="py-1" role="none">
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Your Profile
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Settings
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Sign out
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
