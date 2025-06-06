import React from "react";
import Link from "next/link";
import {
  UserPlus,
  Search,
  Briefcase,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { UserType } from "../types";

interface AccountTypeSelectionProps {
  onUserTypeSelection: (type: UserType) => void;
}

const AccountTypeSelection: React.FC<AccountTypeSelectionProps> = ({
  onUserTypeSelection,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
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
          <div
            onClick={() => onUserTypeSelection("application")}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-200 flex flex-col h-full"
          >
            <div className="text-center flex-1 flex flex-col">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Job Applicant
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                I'm looking for job opportunities and want to apply for
                positions
              </p>
              <div className="text-left space-y-2 mb-6 flex-1">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Browse and search for jobs
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Apply to positions
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Track application status
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Build professional profile
                </div>
              </div>
              <div className="flex items-center justify-center text-blue-600 font-medium mt-auto">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          </div>

          {/* Hiring User Card */}
          <div
            onClick={() => onUserTypeSelection("hiring")}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-200 flex flex-col h-full"
          >
            <div className="text-center flex-1 flex flex-col">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Hiring User
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                I'm an HR professional, recruiter, or hiring manager looking to
                find talent
              </p>
              <div className="text-left space-y-2 mb-6 flex-1">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Post and manage job listings
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Review candidates and applications
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  AI-powered recruitment tools
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Analytics and reporting
                </div>
              </div>
              <div className="flex items-center justify-center text-blue-600 font-medium mt-auto">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Login Link */}
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
};

export default AccountTypeSelection;
