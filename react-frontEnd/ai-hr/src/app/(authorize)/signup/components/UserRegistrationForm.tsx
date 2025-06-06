import React from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Search,
  Briefcase,
  Building,
} from "lucide-react";
import {
  JobApplicantFormData,
  HiringUserFormData,
  CompanyRegistrationData,
  UserType,
} from "../types";

interface UserRegistrationFormProps {
  selectedUserType: UserType;
  jobApplicantData: JobApplicantFormData;
  hiringUserData: HiringUserFormData;
  companyData: CompanyRegistrationData;
  hasExistingCompany: boolean | null;
  onJobApplicantChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHiringUserChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoBack: () => void;
  errors: { [key: string]: string };
  showPassword: boolean;
  showConfirmPassword: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  isSubmitting: boolean;
  signupError: string;
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({
  selectedUserType,
  jobApplicantData,
  hiringUserData,
  companyData,
  hasExistingCompany,
  onJobApplicantChange,
  onHiringUserChange,
  onSubmit,
  onGoBack,
  errors,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
  isSubmitting,
  signupError,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            {selectedUserType === "application" ? (
              <Search className="h-6 w-6 text-white" />
            ) : (
              <Briefcase className="h-6 w-6 text-white" />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Your{" "}
            {selectedUserType === "application" ? "Job Seeker" : "Hiring"}{" "}
            Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {selectedUserType === "application"
              ? "Join thousands of job seekers finding their dream careers"
              : hasExistingCompany
              ? "Join HR professionals streamlining their recruitment process"
              : "Complete your hiring account setup"}
          </p>

          {/* Back button */}
          <button
            onClick={onGoBack}
            className="mt-4 flex items-center text-sm text-gray-500 hover:text-gray-700 mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {selectedUserType === "hiring"
              ? hasExistingCompany
                ? "Back to company check"
                : "Back"
              : "Change account type"}
          </button>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={onSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={
                    selectedUserType === "application"
                      ? jobApplicantData.firstName
                      : hiringUserData.firstName
                  }
                  onChange={
                    selectedUserType === "application"
                      ? onJobApplicantChange
                      : onHiringUserChange
                  }
                  className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.firstName
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.firstName}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={
                    selectedUserType === "application"
                      ? jobApplicantData.lastName
                      : hiringUserData.lastName
                  }
                  onChange={
                    selectedUserType === "application"
                      ? onJobApplicantChange
                      : onHiringUserChange
                  }
                  className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.lastName
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={
                    selectedUserType === "application"
                      ? jobApplicantData.email
                      : hiringUserData.email
                  }
                  onChange={
                    selectedUserType === "application"
                      ? onJobApplicantChange
                      : onHiringUserChange
                  }
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.email
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  placeholder={
                    selectedUserType === "application"
                      ? "john@email.com"
                      : "john@company.com"
                  }
                />
              </div>
              {errors.email && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Company and Role Fields (Hiring Users Only) */}
            {selectedUserType === "hiring" && (
              <>
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Company
                    {!hasExistingCompany && companyData.companyName && (
                      <span className="text-green-600 text-sm ml-2">
                        (Newly Registered)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={hiringUserData.company}
                      onChange={onHiringUserChange}
                      readOnly={
                        !hasExistingCompany && !!companyData.companyName
                      }
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.company
                          ? "border-red-300 bg-red-50"
                          : !hasExistingCompany && !!companyData.companyName
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                      placeholder={
                        hasExistingCompany
                          ? "Your Company Name"
                          : "Company name from registration"
                      }
                    />
                  </div>
                  {errors.company && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.company}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={hiringUserData.role}
                    onChange={onHiringUserChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                  >
                    <option value="HR Manager">HR Manager</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Director">Director</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
              </>
            )}

            {/* Password Fields */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={
                      selectedUserType === "application"
                        ? jobApplicantData.password
                        : hiringUserData.password
                    }
                    onChange={
                      selectedUserType === "application"
                        ? onJobApplicantChange
                        : onHiringUserChange
                    }
                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.password
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={onTogglePassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={
                      selectedUserType === "application"
                        ? jobApplicantData.confirmPassword
                        : hiringUserData.confirmPassword
                    }
                    onChange={
                      selectedUserType === "application"
                        ? onJobApplicantChange
                        : onHiringUserChange
                    }
                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.confirmPassword
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={onToggleConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={
                  selectedUserType === "application"
                    ? jobApplicantData.agreeToTerms
                    : hiringUserData.agreeToTerms
                }
                onChange={
                  selectedUserType === "application"
                    ? onJobApplicantChange
                    : onHiringUserChange
                }
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-gray-700"
              >
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.agreeToTerms}
              </div>
            )}

            {/* Signup Error */}
            {signupError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{signupError}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating account...
                </div>
              ) : (
                `Create ${
                  selectedUserType === "application" ? "Job Seeker" : "Hiring"
                } Account`
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
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
    </div>
  );
};

export default UserRegistrationForm;
