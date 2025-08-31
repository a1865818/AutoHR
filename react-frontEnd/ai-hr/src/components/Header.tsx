"use client";

import { Bell } from "lucide-react";
import UserDropdown from "./auth/UserDropdown";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-end px-4 py-[10px] pl-16 md:pl-14 lg:pl-4">
        {/* Right-side Icons & Profile */}
        <div className="flex items-center">
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
