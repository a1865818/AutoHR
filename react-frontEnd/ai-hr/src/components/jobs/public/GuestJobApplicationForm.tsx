"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import { ApiJob, ApiCompany } from "@/interfaces";
import { publicJobService } from "@/services/publicJobService";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GuestJobApplicationFormProps {
  jobId: string;
}

interface GuestApplicationData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    city: string;
    countryCode: string;
  };
  resume: File | null;
  coverLetter: string;
  experience: Array<{
    title: string;
    company: string;
    location: string;
    description: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    major: string;
    location: string;
    description?: string;
    startDate: string;
    endDate?: string;
    isCurrentlyAttending: boolean;
  }>;
}

export function GuestJobApplicationForm({
  jobId,
}: GuestJobApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [job, setJob] = useState<ApiJob | null>(null);
  const [company, setCompany] = useState<ApiCompany | null>(null);

  const [formData, setFormData] = useState<GuestApplicationData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      city: "",
      countryCode: "+1",
    },
    resume: null,
    coverLetter: "",
    experience: [],
    education: [],
  });

  const router = useRouter();

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load job details
      const jobData = await publicJobService.getPublicJobById(jobId);
      setJob(jobData);

      // Load company data
      if (jobData.companyId) {
        try {
          const companyData = await publicJobService.getCompanyById(
            jobData.companyId
          );
          setCompany(companyData);
        } catch (error) {
          console.warn("Failed to load company data:", error);
        }
      }
    } catch (error) {
      console.error("❌ Failed to load job details:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load job details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoChange = (
    field: keyof typeof formData.personalInfo,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a PDF or Word document");
        return;
      }

      if (file.size > maxSize) {
        setError("File size must be less than 10MB");
        return;
      }

      setFormData((prev) => ({ ...prev, resume: file }));
      setError(null);
    }
  };

  const validateForm = (): string | null => {
    const { personalInfo, resume } = formData;

    if (!personalInfo.firstName.trim()) return "First name is required";
    if (!personalInfo.lastName.trim()) return "Last name is required";
    if (!personalInfo.email.trim()) return "Email is required";
    if (!personalInfo.phoneNumber.trim()) return "Phone number is required";
    if (!personalInfo.city.trim()) return "City is required";
    if (!resume) return "Resume is required";

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email)) {
      return "Please enter a valid email address";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!job || !formData.resume) {
      setError("Missing required information");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await publicJobService.submitGuestApplication(jobId, {
        personalInfo: formData.personalInfo,
        resume: formData.resume,
        coverLetter: formData.coverLetter || undefined,
        experience:
          formData.experience.length > 0 ? formData.experience : undefined,
        education:
          formData.education.length > 0 ? formData.education : undefined,
      });

      setApplicationId(result.applicationId);
      setIsSubmitted(true);

      // Redirect to success page after delay
      setTimeout(() => {
        router.push(
          `/jobs/${jobId}/apply-success?applicationId=${result.applicationId}`
        );
      }, 2000);
    } catch (error) {
      console.error("❌ Application submission failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to submit application"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSalary = (job: ApiJob) => {
    if (job.salaryMin && job.salaryMax) {
      return `${
        job.salaryCurrency || "$"
      }${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
    } else if (job.salaryMin) {
      return `${job.salaryCurrency || "$"}${job.salaryMin.toLocaleString()}+`;
    } else if (job.salaryMax) {
      return `Up to ${
        job.salaryCurrency || "$"
      }${job.salaryMax.toLocaleString()}`;
    }
    return "Salary negotiable";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Unable to Load Application
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-x-3">
              <button
                onClick={loadJobDetails}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/public"
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Application Submitted!
            </h2>
            <p className="text-green-700 mb-4">
              Your application for <strong>{job?.title}</strong> at{" "}
              <strong>{company?.name}</strong> has been successfully submitted.
            </p>
            {applicationId && (
              <div className="bg-white border border-green-200 rounded-md p-3 mb-4">
                <p className="text-sm text-gray-600 mb-1">Application ID:</p>
                <p className="font-mono text-sm text-gray-900">
                  {applicationId}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Save this ID to track your application status
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Link
                href={`/public/jobs/${jobId}`}
                className="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                View Job Details
              </Link>
              <Link
                href="/public"
                className="block w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Browse More Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link
              href={`/public/jobs/${jobId}`}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Back to Job Details</span>
            </Link>
          </div>

          <div className="pb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Apply for {job.title}
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  {company?.name || "Company"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatSalary(job)} • No account required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.firstName}
                  onChange={(e) =>
                    handlePersonalInfoChange("firstName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.lastName}
                  onChange={(e) =>
                    handlePersonalInfoChange("lastName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.personalInfo.email}
                    onChange={(e) =>
                      handlePersonalInfoChange("email", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <select
                    value={formData.personalInfo.countryCode}
                    onChange={(e) =>
                      handlePersonalInfoChange("countryCode", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+33">+33</option>
                    <option value="+49">+49</option>
                    <option value="+81">+81</option>
                    <option value="+86">+86</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.personalInfo.phoneNumber}
                      onChange={(e) =>
                        handlePersonalInfoChange("phoneNumber", e.target.value)
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.personalInfo.city}
                    onChange={(e) =>
                      handlePersonalInfoChange("city", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., New York, San Francisco"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Resume <span className="text-red-500">*</span>
              </h2>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {formData.resume
                    ? formData.resume.name
                    : "Upload your resume"}
                </h3>
                <p className="text-gray-600 mb-2">
                  Click to browse or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOC, or DOCX (max 10MB)
                </p>
              </label>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cover Letter{" "}
              <span className="text-sm text-gray-500">(Optional)</span>
            </h2>
            <textarea
              value={formData.coverLetter}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  coverLetter: e.target.value,
                }))
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us why you're interested in this role and what makes you a great fit..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              By submitting, you agree to be contacted about this position.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>

        {/* Sign Up CTA */}
        <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Want to track your applications?
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Create an account to save jobs, track application status, and get
            personalized job recommendations.
          </p>
          <div className="flex space-x-3">
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
