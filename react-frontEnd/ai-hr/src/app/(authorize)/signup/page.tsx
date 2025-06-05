"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  apiService,
  CompanyRegisterRequest,
  HiringUserRegisterRequest,
  ApplicationUserRegisterRequestEnhanced,
} from "@/services/api";

// Import types and utils
import {
  JobApplicantFormData,
  HiringUserFormData,
  CompanyRegistrationData,
  UserType,
  SignupStep,
} from "./types";
import {
  validateJobApplicantForm,
  validateCompanyForm,
  validateHiringUserForm,
} from "./validation";

// Import components
import AccountTypeSelection from "./components/AccountTypeSelection";
import CompanyCheck from "./components/CompanyCheck";
import CompanyRegistrationForm from "./components/CompanyRegistrationForm";
import UserRegistrationForm from "./components/UserRegistrationForm";
import SuccessScreen from "./components/SuccessScreen";

const SignupPage: React.FC = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState<SignupStep>("selection");
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(
    null
  );
  const [hasExistingCompany, setHasExistingCompany] = useState<boolean | null>(
    null
  );

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

  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Navigation handlers
  const handleUserTypeSelection = (type: UserType) => {
    setSelectedUserType(type);
    if (type === "hiring") {
      setCurrentStep("companyCheck");
    } else {
      setCurrentStep("form");
    }
  };

  const goBackToSelection = () => {
    setCurrentStep("selection");
    setSelectedUserType(null);
    setHasExistingCompany(null);
    setErrors({});
    setSignupError("");
  };

  const goBackToCompanyCheck = () => {
    setCurrentStep("companyCheck");
    setHasExistingCompany(null);
    setErrors({});
    setSignupError("");
  };

  const handleCompanyCheckResponse = (
    hasCompany: boolean,
    selectedCompany?: any
  ) => {
    setHasExistingCompany(hasCompany);

    if (hasCompany && selectedCompany) {
      // User selected an existing company
      console.log("Selected existing company:", selectedCompany);

      // Store the selected company info
      setCompanyData((prev) => ({
        ...prev,
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        industry: selectedCompany.industry,
        companySize: selectedCompany.companySize,
        website: selectedCompany.website || "",
        email: selectedCompany.email || "",
        description: selectedCompany.description || "",
        logoUrl: selectedCompany.logoUrl || "",
        headquartersCity: selectedCompany.headquarters?.city || "",
        headquartersState: selectedCompany.headquarters?.state || "",
        headquartersCountry: selectedCompany.headquarters?.country || "",
      }));

      // Immediately set the company name in hiring user data as well
      setHiringUserData((prev) => ({
        ...prev,
        company: selectedCompany.name,
      }));

      console.log("Company name set in hiringUserData:", selectedCompany.name);

      // Skip company registration and go directly to user form
      proceedToUserForm();
    } else if (hasCompany && !selectedCompany) {
      // This shouldn't happen with the new flow, but handle it
      setCurrentStep("companyRegistration");
    } else {
      // User doesn't have an existing company, go to registration
      setCurrentStep("companyRegistration");
    }
  };

  const proceedToUserForm = () => {
    setCurrentStep("form");
    // Set the company name in hiring user data if we have a company (either new or existing)
    if (companyData.companyName) {
      setHiringUserData((prev) => ({
        ...prev,
        company: companyData.companyName,
      }));
    }
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

  const handleCompanyChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    console.log(`Company field updated: ${name} = ${value}`);

    // Special logging for email field
    if (name === "email") {
      console.log(`EMAIL FIELD UPDATE: "${value}" (length: ${value.length})`);
    }

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

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    console.log("🚀 handleSubmit called - Current step:", currentStep);
    console.log("📊 Form data state:", {
      companyData,
      currentStep,
      isSubmitting,
    });

    // Handle company registration step
    if (currentStep === "companyRegistration") {
      console.log("📝 Starting company registration validation");
      console.log("🔍 Company data before validation:", companyData);

      const validationErrors = validateCompanyForm(companyData);
      console.log(
        "✅ Validation completed, errors found:",
        Object.keys(validationErrors).length
      );
      console.log("📋 Validation errors:", validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        console.log("❌ Validation failed, setting errors and returning");
        setErrors(validationErrors);
        return;
      }

      console.log("🔄 Setting isSubmitting to true");
      setIsSubmitting(true);

      try {
        console.log("🏗️ Creating company request object");

        // Create company via API service
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
        };

        console.log("📤 Company data being sent:", companyRequest);
        console.log("📋 Original company form data:", companyData);
        console.log("🔧 Individual field check:");
        console.log("- Email:", `"${companyData.email}"`);
        console.log("- Company Name:", `"${companyData.companyName}"`);
        console.log(
          "- Headquarters City:",
          `"${companyData.headquartersCity}"`
        );
        console.log(
          "- Headquarters State:",
          `"${companyData.headquartersState}"`
        );
        console.log(
          "- Headquarters Country:",
          `"${companyData.headquartersCountry}"`
        );

        // Additional validation to ensure email is not empty
        if (!companyRequest.email || companyRequest.email.trim() === "") {
          console.log("❌ Email validation failed - email is empty");
          setSignupError("Email is required and cannot be empty");
          setIsSubmitting(false);
          return;
        }

        console.log("🌐 About to call apiService.registerCompany...");
        console.log("⏰ API call starting at:", new Date().toISOString());

        const createdCompany = await apiService.registerCompany(companyRequest);

        console.log("✅ Company created successfully:", createdCompany);
        console.log("🆔 Company ID returned:", createdCompany.id);
        console.log("🆔 Company ID type:", typeof createdCompany.id);
        console.log("⏰ API call completed at:", new Date().toISOString());

        console.log("💾 Updating company data with returned info");
        // Update company data with the returned company info
        setCompanyData((prev) => {
          const updatedData = {
            ...prev,
            companyId: createdCompany.id,
          };
          console.log("📊 Updated company data:", updatedData);
          console.log("🆔 Stored company ID:", updatedData.companyId);
          console.log(
            "🆔 Stored company ID type:",
            typeof updatedData.companyId
          );
          return updatedData;
        });

        console.log("➡️ Proceeding to user form");
        // Proceed to user form
        proceedToUserForm();
        console.log("🎯 proceedToUserForm completed");
      } catch (error) {
        console.log("❌ Company registration error caught:", error);
        console.log("🔍 Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : "No stack trace",
          type: typeof error,
          error,
        });

        setSignupError(
          error instanceof Error
            ? error.message
            : "Company registration failed. Please try again."
        );
        console.error("Company registration error:", error);
      } finally {
        console.log("🏁 Setting isSubmitting to false");
        setIsSubmitting(false);
        console.log("🏁 Finally block completed");
      }
      console.log("📤 Company registration flow completed, returning");
      return;
    }

    // Handle user registration step
    const validationErrors =
      selectedUserType === "application"
        ? validateJobApplicantForm(jobApplicantData)
        : validateHiringUserForm(hiringUserData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedUserType === "application") {
        // Application user registration
        const applicationUserRequest: ApplicationUserRegisterRequestEnhanced = {
          firstName: jobApplicantData.firstName,
          lastName: jobApplicantData.lastName,
          email: jobApplicantData.email,
          password: jobApplicantData.password,
          userType: "application",
        };

        const response = await apiService.registerApplicationUser(
          applicationUserRequest
        );
        console.log("Application user registered successfully:", response);

        // Store authentication tokens
        if (response.accessToken) {
          localStorage.setItem("authToken", response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem("refreshToken", response.refreshToken);
          }

          // Store user info
          localStorage.setItem("userType", "application");
          localStorage.setItem("userId", response.userId);
          localStorage.setItem("userEmail", response.email);

          // Show success briefly then redirect
          setSignupSuccess(true);

          // Redirect to application user dashboard after a short delay
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          setSignupSuccess(true);
        }
      } else {
        // Hiring user registration
        console.log("Hiring user registration - Company data:", companyData);
        console.log(
          "Hiring user registration - Has existing company:",
          hasExistingCompany
        );
        console.log(
          "Hiring user registration - Company ID:",
          companyData.companyId
        );

        const hiringUserRequest: HiringUserRegisterRequest = {
          firstName: hiringUserData.firstName,
          lastName: hiringUserData.lastName,
          email: hiringUserData.email,
          password: hiringUserData.password,
          company: hiringUserData.company,
          role: hiringUserData.role,
          userType: "hiring",
          // Always include company ID if available (from either existing or newly registered company)
          companyId: companyData.companyId,
          // Include company data if we registered a new company
          ...(companyData.companyName &&
            !hasExistingCompany && {
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
              },
            }),
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

          // Redirect to hiring user dashboard after a short delay
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          setSignupSuccess(true);
        }
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

  // Loading state
  if (signupSuccess) {
    return <SuccessScreen selectedUserType={selectedUserType} />;
  }

  // Render appropriate step
  switch (currentStep) {
    case "selection":
      return (
        <AccountTypeSelection onUserTypeSelection={handleUserTypeSelection} />
      );

    case "companyCheck":
      return (
        <CompanyCheck onCompanyCheckResponse={handleCompanyCheckResponse} />
      );

    case "companyRegistration":
      return (
        <CompanyRegistrationForm
          companyData={companyData}
          onCompanyChange={handleCompanyChange}
          onAgreeToTermsChange={handleCompanyAgreeToTermsChange}
          onSubmit={handleSubmit}
          onGoBack={goBackToCompanyCheck}
          errors={errors}
          isSubmitting={isSubmitting}
          signupError={signupError}
        />
      );

    case "form":
      return (
        <UserRegistrationForm
          selectedUserType={selectedUserType!}
          jobApplicantData={jobApplicantData}
          hiringUserData={hiringUserData}
          companyData={companyData}
          hasExistingCompany={hasExistingCompany}
          onJobApplicantChange={handleJobApplicantChange}
          onHiringUserChange={handleHiringUserChange}
          onSubmit={handleSubmit}
          onGoBack={
            selectedUserType === "hiring"
              ? goBackToCompanyCheck
              : goBackToSelection
          }
          errors={errors}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onToggleConfirmPassword={() =>
            setShowConfirmPassword(!showConfirmPassword)
          }
          isSubmitting={isSubmitting}
          signupError={signupError}
        />
      );

    default:
      return (
        <AccountTypeSelection onUserTypeSelection={handleUserTypeSelection} />
      );
  }
};

export default SignupPage;
