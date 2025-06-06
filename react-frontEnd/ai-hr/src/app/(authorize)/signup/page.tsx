"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  UserPlus,
  Building,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Search,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

// Types for form data
interface JobApplicantFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface HiringUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  role: string;
  agreeToTerms: boolean;
}

const SignupPage: React.FC = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState<"selection" | "form">(
    "selection"
  );
  const [selectedUserType, setSelectedUserType] = useState<
    "application" | "hiring" | null
  >(null);

  // Form data for different user types
  const [jobApplicantData, setJobApplicantData] =
    useState<JobApplicantFormData>({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    });

  const [hiringUserData, setHiringUserData] = useState<HiringUserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    role: "HR Manager",
    agreeToTerms: false,
  });

  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { isAuthenticated, isLoading, register } = useAuth();
  const router = useRouter();

  // Auth state is now handled by AuthContext - no manual redirects needed

  // Account type selection handlers
  const handleUserTypeSelection = (type: "application" | "hiring") => {
    setSelectedUserType(type);
    setCurrentStep("form");
  };

  const goBackToSelection = () => {
    setCurrentStep("selection");
    setSelectedUserType(null);
    setErrors({});
    setSignupError("");
  };

  // Validation functions
  const validateJobApplicantForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!jobApplicantData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!jobApplicantData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!jobApplicantData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(jobApplicantData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!jobApplicantData.password) {
      newErrors.password = "Password is required";
    } else if (jobApplicantData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(jobApplicantData.password)
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!jobApplicantData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (jobApplicantData.password !== jobApplicantData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!jobApplicantData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateHiringUserForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!hiringUserData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!hiringUserData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!hiringUserData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(hiringUserData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!hiringUserData.password) {
      newErrors.password = "Password is required";
    } else if (hiringUserData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(hiringUserData.password)
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!hiringUserData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (hiringUserData.password !== hiringUserData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!hiringUserData.company.trim()) {
      newErrors.company = "Company name is required";
    }

    if (!hiringUserData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Input change handlers
  const handleJobApplicantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setJobApplicantData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleHiringUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = "checked" in e.target ? e.target.checked : false;

    setHiringUserData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    const isValid =
      selectedUserType === "application"
        ? validateJobApplicantForm()
        : validateHiringUserForm();

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      let registrationData;

      if (selectedUserType === "application") {
        registrationData = {
          firstName: jobApplicantData.firstName,
          lastName: jobApplicantData.lastName,
          email: jobApplicantData.email,
          password: jobApplicantData.password,
          userType: "application" as const,
        };
      } else {
        registrationData = {
          firstName: hiringUserData.firstName,
          lastName: hiringUserData.lastName,
          email: hiringUserData.email,
          password: hiringUserData.password,
          company: hiringUserData.company,
          role: hiringUserData.role,
          userType: "hiring" as const,
        };
      }

      const success = await register(registrationData);

      if (success) {
        setSignupSuccess(true);
        // AuthContext will handle navigation automatically after successful registration
      } else {
        setSignupError(
          "Registration failed. Please check your information and try again."
        );
      }
    } catch (error) {
      setSignupError("An unexpected error occurred. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Created!
            </h2>
            <p className="text-gray-600 mb-4">
              Welcome to AutoHR! Your{" "}
              {selectedUserType === "application" ? "job seeker" : "hiring"}{" "}
              account has been successfully created. You'll be redirected to
              your dashboard shortly.
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-500">
                Redirecting to your dashboard...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Account Type Selection
  if (currentStep === "selection") {
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
              onClick={() => handleUserTypeSelection("application")}
              className="bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-200"
            >
              <div className="text-center">
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
                <div className="text-left space-y-2 mb-6">
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
                <div className="flex items-center justify-center text-blue-600 font-medium">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            </div>

            {/* Hiring User Card */}
            <div
              onClick={() => handleUserTypeSelection("hiring")}
              className="bg-white rounded-lg shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-200"
            >
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Hiring User
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  I'm an HR professional, recruiter, or hiring manager looking
                  to find talent
                </p>
                <div className="text-left space-y-2 mb-6">
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
                <div className="flex items-center justify-center text-blue-600 font-medium">
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
  }

  // Step 2: Registration Form
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
              : "Join HR professionals streamlining their recruitment process"}
          </p>

          {/* Back button */}
          <button
            onClick={goBackToSelection}
            className="mt-4 flex items-center text-sm text-gray-500 hover:text-gray-700 mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Change account type
          </button>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                      ? handleJobApplicantChange
                      : handleHiringUserChange
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
                      ? handleJobApplicantChange
                      : handleHiringUserChange
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
                      ? handleJobApplicantChange
                      : handleHiringUserChange
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
                      onChange={handleHiringUserChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.company
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                      placeholder="Your Company Name"
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
                    onChange={handleHiringUserChange}
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
                        ? handleJobApplicantChange
                        : handleHiringUserChange
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
                    onClick={() => setShowPassword(!showPassword)}
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
                        ? handleJobApplicantChange
                        : handleHiringUserChange
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    ? handleJobApplicantChange
                    : handleHiringUserChange
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

export default SignupPage;
