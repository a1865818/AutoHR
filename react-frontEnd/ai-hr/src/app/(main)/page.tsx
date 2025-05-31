"use client";

import React from "react";
import {
  PlusCircle,
  Users,
  Briefcase,
  TrendingUp,
  User,
  Building,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-3xl font-semibold text-gray-800">
            Welcome to AI HR Recruitment Platform
          </h2>
          <p className="mt-2 text-gray-600">
            Please log in to access your dashboard
          </p>
        </div>
      </div>
    );
  }

  const isHiringUser = user.userCategory === "HiringUserProfile";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-gray-800">
              Welcome back, {user.firstName}!
            </h2>
            <p className="mt-1 text-gray-600 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{user.role}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {isHiringUser ? "Hiring User" : "Job Applicant"}
              </span>
            </p>
            {user.companyId && (
              <p className="mt-1 text-gray-500 flex items-center space-x-1">
                <Building className="w-4 h-4" />
                <span>Company ID: {user.companyId}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {isHiringUser ? (
        // Hiring User Dashboard
        <>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Create New Job
                  </h3>
                  <p className="mt-2 text-gray-600 text-sm">
                    Generate job descriptions and start accepting applications
                  </p>
                </div>
                <PlusCircle className="w-8 h-8 text-blue-600" />
              </div>
              <Link
                href="/create-job"
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Job
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Manage Candidates
                  </h3>
                  <p className="mt-2 text-gray-600 text-sm">
                    Review applications and select the best candidates
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <Link
                href="/candidates"
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
              >
                <Users className="mr-2 h-4 w-4" />
                View Candidates
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Active Jobs
                  </h3>
                  <p className="mt-2 text-gray-600 text-sm">
                    Monitor your current job postings and applications
                  </p>
                </div>
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
              <Link
                href="/jobs"
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                View Jobs
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Recent Hiring Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">
                    New applicant for Frontend Developer
                  </p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  New Application
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">
                    Job description generated for UX Designer
                  </p>
                  <p className="text-sm text-gray-500">Yesterday</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Job Created
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">
                    Interview scheduled with John Doe
                  </p>
                  <p className="text-sm text-gray-500">2 days ago</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Interview
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Job Applicant Dashboard
        <>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Browse Jobs
                  </h3>
                  <p className="mt-2 text-gray-600 text-sm">
                    Find and apply for positions that match your skills
                  </p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <Link
                href="/jobs"
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    My Applications
                  </h3>
                  <p className="mt-2 text-gray-600 text-sm">
                    Track the status of your job applications
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <Link
                href="/applications"
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View Applications
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Your Application Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">
                    Applied for Frontend Developer at TechCorp
                  </p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Applied
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">
                    Interview invitation for UX Designer role
                  </p>
                  <p className="text-sm text-gray-500">Yesterday</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Interview
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-700">
                    Application status updated for Backend Developer
                  </p>
                  <p className="text-sm text-gray-500">2 days ago</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  In Review
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
