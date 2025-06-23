"use client";

import { Bell, Search } from "lucide-react";
import UserDropdown from "./auth/UserDropdown";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 ">
      <div className="flex items-center justify-between px-4 py-[10px] pl-16 md:pl-14 lg:pl-4">
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
            className="hidden sm:block p-1 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          {/* User Dropdown */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
