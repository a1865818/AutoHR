"use client";

import React from "react";
import Link from "next/link";
import {
  UserPlus,
  Search,
  Briefcase,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function SelectTypePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#066046]/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[#066046] rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Choose Your Account Type
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select the type of account that best describes you
          </p>
        </div>

        {/* Account Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Job Applicant Card */}
          <Link
            href="/signup/applicant"
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-[#066046]/20 flex flex-col h-full"
          >
            <div className="text-center flex-1 flex flex-col">
              <div className="mx-auto h-16 w-16 bg-[#066046]/10 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-[#066046]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Job Applicant
              </h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                I'm looking for job opportunities and want to apply for
                positions
              </p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-[#066046] mr-2" />
                  Apply to jobs instantly
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-[#066046] mr-2" />
                  Track your applications
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-[#066046] mr-2" />
                  AI-powered job matching
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-center text-[#066046] font-medium">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          </Link>

          {/* Hiring User Card */}
          <Link
            href="/signup/hiring"
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-[#066046]/20 flex flex-col h-full"
          >
            <div className="text-center flex-1 flex flex-col">
              <div className="mx-auto h-16 w-16 bg-[#066046]/10 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-[#066046]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                HR Professional
              </h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                I'm a recruiter or HR professional looking to hire talent
              </p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-[#066046] mr-2" />
                  Post job openings
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-[#066046] mr-2" />
                  AI candidate ranking
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-[#066046] mr-2" />
                  Interview management
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-center text-[#066046] font-medium">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          </Link>
        </div>

        {/* Back to login */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#066046] hover:text-[#267a54] transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
