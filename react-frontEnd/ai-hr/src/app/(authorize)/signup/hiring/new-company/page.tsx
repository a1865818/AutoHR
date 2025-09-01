"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Loader2,
  AlertCircle,
  Mail,
  Globe,
  MapPin,
  Users,
  FileText,
  Image,
  Eye,
  EyeOff,
  Briefcase,
  User,
} from "lucide-react";
import {
  apiService,
  CompanyRegisterRequest,
  HiringUserRegisterRequest,
} from "@/services/api";
import {
  CompanyRegistrationData,
  HiringUserFormData,
  COMPANY_SIZE_OPTIONS,
} from "../../types";
import { validateCompanyForm, validateHiringUserForm } from "../../validation";

// Industry options
const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Consulting",
  "Real Estate",
  "Media & Entertainment",
  "Non-profit",
  "Government",
  "Other",
];

type Step = "company" | "user";

export default function NewCompanyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("company");

  const [companyData, setCompanyData] = useState<CompanyRegistrationData>({
    companyName: "",
    industry: "",
    companySize: "",
    website: "",
    headquartersCity: "",
    headquartersState: "",
    headquartersCountry: "",
    email: "",
    description: "",
    logoUrl: "",
    agreeToTerms: false,
  });

  const [userData, setUserData] = useState<HiringUserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    role: "HR Manager",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleCompanyChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCompanyData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCompanyAgreeToTermsChange = (checked: boolean) => {
    setCompanyData((prev) => ({
      ...prev,
      agreeToTerms: checked,
    }));

    if (errors.agreeToTerms) {
      setErrors((prev) => ({ ...prev, agreeToTerms: "" }));
    }
  };

  const handleUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = "checked" in e.target ? e.target.checked : false;

    setUserData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    const validationErrors = validateCompanyForm(companyData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Update user data with company name and proceed to user step
    setUserData((prev) => ({
      ...prev,
      company: companyData.companyName,
    }));
    setCurrentStep("user");
    setErrors({});
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    const validationErrors = validateHiringUserForm(userData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // First, register the company
      console.log("🏗️ Creating company request object");
      const companyRequest: CompanyRegisterRequest = {
        name: companyData.companyName,
        industry: companyData.industry,
        companySize: companyData.companySize,
        website: companyData.website,
        headquarters: {
          city: companyData.headquartersCity,
          state: companyData.headquartersState,
          country: companyData.headquartersCountry,
        },
        email: companyData.email.trim(),
        description: companyData.description,
        logoUrl: companyData.logoUrl || undefined,
        // NEW: Include creator email for admin role assignment
        creatorEmail: userData.email.trim(),
      };

      console.log("📤 Company data being sent:", companyRequest);
      const createdCompany = await apiService.registerCompany(companyRequest);
      console.log("✅ Company created successfully:", createdCompany);

      // Then register the hiring user with the new company ID
      const hiringUserRequest: HiringUserRegisterRequest = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        company: userData.company,
        role: userData.role,
        userType: "hiring",
        companyId: createdCompany.id,
        companyData: {
          name: companyData.companyName,
          industry: companyData.industry,
          companySize: companyData.companySize,
          website: companyData.website,
          headquarters: {
            city: companyData.headquartersCity,
            state: companyData.headquartersState,
            country: companyData.headquartersCountry,
          },
          email: companyData.email,
          description: companyData.description,
          logoUrl: companyData.logoUrl || undefined,
          creatorEmail: userData.email.trim(),
        },
      };

      console.log("Final hiring user request:", hiringUserRequest);
      const response = await apiService.registerHiringUser(hiringUserRequest);
      console.log("Hiring user registered successfully:", response);

      // Store authentication tokens
      if (response.accessToken) {
        localStorage.setItem("authToken", response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }

        // Store user info
        localStorage.setItem("userType", "hiring");
        localStorage.setItem("userId", response.userId);
        localStorage.setItem("userEmail", response.email);
        if (response.companyId) {
          localStorage.setItem("companyId", response.companyId);
        }

        // Show success briefly then redirect
        setSignupSuccess(true);

        // Copy standard templates
        console.log("🔄 Starting template copy process...");
        if (createdCompany.id) {
          try {
            const templateResult = await apiService.copyStandardTemplates(
              createdCompany.id
            );
            console.log("✅ Template copy completed:", templateResult);
          } catch (templateError) {
            console.warn(
              "⚠️ Template copy failed (non-critical):",
              templateError
            );
          }
        }

        // Redirect to login page
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setSignupSuccess(true);
      }
    } catch (error) {
      setSignupError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please check your information and try again."
      );
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToCompany = () => {
    setCurrentStep("company");
    setErrors({});
    setSignupError("");
  };

  // Success state
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#066046]/20">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-12 w-12 bg-[#066046]/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-[#066046]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to AI HR Platform!
          </h2>
          <p className="text-gray-600 mb-4">
            Your company "{companyData.companyName}" and HR account have been
            created successfully. You'll be redirected to login shortly.
          </p>
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-gray-500">Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  // Company registration step
  if (currentStep === "company") {
    return (
      <div className="min-h-screen bg-[#066046]/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              href="/signup/hiring"
              className="inline-flex items-center text-[#066046] hover:text-[#267a54] mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to hiring options
            </Link>
            <div className="mx-auto h-12 w-12 bg-[#066046] rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Register Your Company
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Step 1 of 2: Create your company profile
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              {/* Error Display */}
              {signupError && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Registration Error
                      </h3>
                      <p className="mt-1 text-sm text-red-700">{signupError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Name */}
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={companyData.companyName}
                    onChange={handleCompanyChange}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                      errors.companyName ? "border-red-300" : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                    style={{
                      backgroundColor: errors.companyName ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                      WebkitBoxShadow: 'none',
                      boxShadow: 'none'
                    }}
                    placeholder="Enter your company name"
                  />
                </div>
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.companyName}
                  </p>
                )}
              </div>

              {/* Industry and Company Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="industry"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Industry *
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={companyData.industry}
                    onChange={handleCompanyChange}
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      errors.industry ? "border-red-300" : "border-gray-300"
                    } text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                    style={{
                      backgroundColor: errors.industry ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                      WebkitBoxShadow: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.industry}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="companySize"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Company Size *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="companySize"
                      name="companySize"
                      value={companyData.companySize}
                      onChange={handleCompanyChange}
                      className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                        errors.companySize
                          ? "border-red-300"
                          : "border-gray-300"
                      } text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                      style={{
                        backgroundColor: errors.companySize ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                        WebkitBoxShadow: 'none',
                        boxShadow: 'none'
                      }}
                    >
                      <option value="">Select size</option>
                      {COMPANY_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size} employees
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.companySize && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.companySize}
                    </p>
                  )}
                </div>
              </div>

              {/* Website and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Website
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={companyData.website}
                      onChange={handleCompanyChange}
                      className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                        errors.website ? "border-red-300" : "border-gray-300"
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                      style={{
                        backgroundColor: errors.website ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                        WebkitBoxShadow: 'none',
                        boxShadow: 'none'
                      }}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.website}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Company Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={companyData.email}
                      onChange={handleCompanyChange}
                      className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                        errors.email ? "border-red-300" : "border-gray-300"
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                      style={{
                        backgroundColor: errors.email ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                        WebkitBoxShadow: 'none',
                        boxShadow: 'none'
                      }}
                      placeholder="info@yourcompany.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Headquarters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headquarters *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="headquartersCity"
                        type="text"
                        value={companyData.headquartersCity}
                        onChange={handleCompanyChange}
                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                          errors.headquartersCity
                            ? "border-red-300"
                            : "border-gray-300"
                        } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                        style={{
                          backgroundColor: errors.headquartersCity ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                          WebkitBoxShadow: 'none',
                          boxShadow: 'none'
                        }}
                        placeholder="City"
                      />
                    </div>
                    {errors.headquartersCity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.headquartersCity}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      name="headquartersState"
                      type="text"
                      value={companyData.headquartersState}
                      onChange={handleCompanyChange}
                      className={`appearance-none relative block w-full px-3 py-3 border ${
                        errors.headquartersState
                          ? "border-red-300"
                          : "border-gray-300"
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                      style={{
                        backgroundColor: errors.headquartersState ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                        WebkitBoxShadow: 'none',
                        boxShadow: 'none'
                      }}
                      placeholder="State/Province"
                    />
                    {errors.headquartersState && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.headquartersState}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      name="headquartersCountry"
                      type="text"
                      value={companyData.headquartersCountry}
                      onChange={handleCompanyChange}
                      className={`appearance-none relative block w-full px-3 py-3 border ${
                        errors.headquartersCountry
                          ? "border-red-300"
                          : "border-gray-300"
                      } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                      style={{
                        backgroundColor: errors.headquartersCountry ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                        WebkitBoxShadow: 'none',
                        boxShadow: 'none'
                      }}
                      placeholder="Country"
                    />
                    {errors.headquartersCountry && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.headquartersCountry}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Description
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={companyData.description}
                    onChange={handleCompanyChange}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                      errors.description ? "border-red-300" : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm resize-none`}
                    style={{
                      backgroundColor: errors.description ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                      WebkitBoxShadow: 'none',
                      boxShadow: 'none'
                    }}
                    placeholder="Tell us about your company..."
                  />
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Logo URL */}
              <div>
                <label
                  htmlFor="logoUrl"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Logo URL (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Image className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={companyData.logoUrl}
                    onChange={handleCompanyChange}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                      errors.logoUrl ? "border-red-300" : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] sm:text-sm`}
                    style={{
                      backgroundColor: errors.logoUrl ? '#fef2f2' : 'rgba(6, 96, 70, 0.2)',
                      WebkitBoxShadow: 'none',
                      boxShadow: 'none'
                    }}
                    placeholder="https://yourcompany.com/logo.png"
                  />
                </div>
                {errors.logoUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.logoUrl}</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div>
                <div className="flex items-start">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={companyData.agreeToTerms}
                    onChange={(e) =>
                      handleCompanyAgreeToTermsChange(e.target.checked)
                    }
                    className="h-4 w-4 text-[#066046] focus:ring-[#066046] border-gray-300 rounded mt-1"
                  />
                  <label
                    htmlFor="agreeToTerms"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    I agree to the{" "}
                    <a href="#" className="text-[#066046] hover:text-[#267a54]">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-[#066046] hover:text-[#267a54]">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#066046] hover:bg-[#267a54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#066046] transition-colors"
                >
                  Continue to User Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // User registration step
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#066046]/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Your HR Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Step 2 of 2: Set up your user account for {companyData.companyName}
          </p>

          {/* Back button */}
          <button
            onClick={goBackToCompany}
            className="mt-4 flex items-center text-sm text-gray-500 hover:text-gray-700 mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to company details
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleUserSubmit}>
            {/* Error Display */}
            {signupError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Registration Error
                    </h3>
                    <p className="mt-1 text-sm text-red-700">{signupError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={userData.firstName}
                    onChange={handleUserChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.firstName ? "border-red-300" : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] focus:z-10 sm:text-sm`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={userData.lastName}
                    onChange={handleUserChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.lastName ? "border-red-300" : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] focus:z-10 sm:text-sm`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Work Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={userData.email}
                  onChange={handleUserChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] focus:z-10 sm:text-sm`}
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={userData.role}
                  onChange={handleUserChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.role ? "border-red-300" : "border-gray-300"
                  } text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] focus:z-10 sm:text-sm`}
                >
                  <option value="HR Manager">HR Manager</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Talent Acquisition">Talent Acquisition</option>
                  <option value="HR Director">HR Director</option>
                  <option value="HR Assistant">HR Assistant</option>
                  <option value="Other">Other</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={userData.password}
                    onChange={handleUserChange}
                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                      errors.password ? "border-red-300" : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] focus:z-10 sm:text-sm`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={userData.confirmPassword}
                    onChange={handleUserChange}
                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                      errors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#066046] focus:border-[#066046] focus:z-10 sm:text-sm`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms Agreement */}
              <div>
                <div className="flex items-start">
                  <input
                    id="userAgreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={userData.agreeToTerms}
                    onChange={handleUserChange}
                    className="h-4 w-4 text-[#066046] focus:ring-[#066046] border-gray-300 rounded mt-1"
                  />
                  <label
                    htmlFor="userAgreeToTerms"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    I agree to the{" "}
                    <a href="#" className="text-[#066046] hover:text-[#267a54]">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-[#066046] hover:text-[#267a54]">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#066046] hover:bg-[#267a54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#066046] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </div>
                ) : (
                  `Complete Registration`
                )}
              </button>
            </div>

            {/* Sign In Link */}
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
          </form>
        </div>
      </div>
    </div>
  );
}
