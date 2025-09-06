"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, User, LogIn } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/public" className="flex items-center space-x-2">
              <div className="bg-primary p-2 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                AI HR Jobs
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/public"
                className="text-foreground/80 hover:text-primary font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/public/browse-jobs"
                className="text-foreground/80 hover:text-primary font-medium transition-colors"
              >
                Browse Jobs
              </Link>
              <Link
                href="/public/companies"
                className="text-foreground/80 hover:text-primary font-medium transition-colors"
              >
                Companies
              </Link>
              <Link
                href="/public/profile"
                className="text-foreground/80 hover:text-primary font-medium transition-colors"
              >
                Why Create Profile
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-foreground/70">
                    Welcome, {user.firstName}
                  </span>
                  <Link
                    href={
                      user.userCategory === "ApplicationUser"
                        ? "/applicant"
                        : "/dashboard"
                    }
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="flex items-center px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                  <Link
                    href="/signup/select-type"
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-primary p-2 rounded-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  AI HR Jobs
                </span>
              </div>
              <p className="text-foreground/70 max-w-md">
                Find your next opportunity with our AI-powered job matching
                platform. Connect with top companies and advance your career.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">
                For Job Seekers
              </h3>
              <ul className="space-y-2 text-foreground/70">
                <li>
                  <Link href="/public" className="hover:text-primary">
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/public/profile" className="hover:text-primary">
                    Why Create Profile
                  </Link>
                </li>
                <li>
                  <Link href="/signup/applicant" className="hover:text-primary">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/applicant" className="hover:text-primary">
                    My Applications
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">
                For Employers
              </h3>
              <ul className="space-y-2 text-foreground/70">
                <li>
                  <Link href="/login" className="hover:text-primary">
                    Employer Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup/hiring" className="hover:text-primary">
                    Post Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Hire Talent
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-foreground/70">
            <p>&copy; 2024 AI HR Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
