"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Plus,
  Search,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function HiringSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Building className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join as HR Professional
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Are you joining an existing company or creating a new one?
          </p>

          {/* Back button */}
          <Link
            href="/signup/select-type"
            className="mt-4 flex items-center text-sm text-gray-500 hover:text-gray-700 mx-auto w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Change account type
          </Link>
        </div>

        {/* Company Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Existing Company Card */}
          <Link
            href="/signup/hiring/existing-company"
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-200 flex flex-col h-full"
          >
            <div className="text-center flex-1 flex flex-col">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Join Existing Company
              </h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                I'm joining a company that's already using the platform
              </p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Search company directory
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Access existing job posts
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Join existing team
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-center text-blue-600 font-medium">
                Search Companies
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          </Link>

          {/* New Company Card */}
          <Link
            href="/signup/hiring/new-company"
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-200 flex flex-col h-full"
          >
            <div className="text-center flex-1 flex flex-col">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Create New Company
              </h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                I'm setting up a new company profile on the platform
              </p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Company profile setup
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Custom branding
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Standard templates included
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-center text-blue-600 font-medium">
                Create Company
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Don't worry, you can always change these settings later in your
            company profile
          </p>
        </div>

        {/* Back to login */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
