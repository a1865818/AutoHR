"use client";

import { publicJobService } from "@/services/publicJobService";
import { ApiJob, ApiCompany } from "@/interfaces/api";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  FileText,
  Loader2,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface GuestApplicationSuccessPageProps {
  jobId: string;
  applicationId?: string;
}

export function GuestApplicationSuccessPage({
  jobId,
  applicationId: propApplicationId,
}: GuestApplicationSuccessPageProps) {
  const searchParams = useSearchParams();
  const applicationId = propApplicationId || searchParams.get("applicationId");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobData, setJobData] = useState<ApiJob | null>(null);
  const [companyData, setCompanyData] = useState<ApiCompany | null>(null);

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    try {
      // Load job data using public service (no auth required)
      const job = await publicJobService.getPublicJobById(jobId);
      setJobData(job);

      // Load company data if available
      if (job.companyId) {
        try {
          const company = await publicJobService.getCompanyById(job.companyId);
          setCompanyData(company);
        } catch (error) {
          console.warn("Could not load company data:", error);
          // Continue without company data
        }
      }
    } catch (error) {
      console.error("Error loading job data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load job data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatSalary = (job: ApiJob) => {
    if (!job.salaryMin && !job.salaryMax) return "Salary not specified";

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: job.salaryCurrency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    if (job.salaryMin && job.salaryMax) {
      return `${formatter.format(job.salaryMin)} - ${formatter.format(
        job.salaryMax
      )} per year`;
    } else if (job.salaryMin) {
      return `${formatter.format(job.salaryMin)}+ per year`;
    } else if (job.salaryMax) {
      return `Up to ${formatter.format(job.salaryMax)} per year`;
    }

    return "Salary not specified";
  };

  const getTypeColor = (employmentType: string) => {
    switch (employmentType?.toLowerCase()) {
      case "full-time":
        return "bg-blue-100 text-blue-800";
      case "part-time":
        return "bg-purple-100 text-purple-800";
      case "contract":
        return "bg-orange-100 text-orange-800";
      case "internship":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatLocation = (locations: Record<string, any>) => {
    if (!locations) return "Remote";

    // Try to extract meaningful location info from the locations object
    if (typeof locations === "string") return locations;

    // If it's an object, try to find city/state/country
    const city = locations.city || locations.location || "";
    const state = locations.state || "";
    const country = locations.country || "";

    if (city && state && country) {
      return `${city}, ${state}, ${country}`;
    } else if (city && country) {
      return `${city}, ${country}`;
    } else if (city) {
      return city;
    }

    return "Remote";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error && !jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Application
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/public/jobs"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Application Submitted Successfully!
                </h1>
                <p className="text-gray-600">
                  Thank you for your interest in this position
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Success Message */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Status */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Application Status
                </h2>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">
                    Application Submitted
                  </span>
                </div>
                {applicationId && (
                  <p className="text-sm text-green-700 mt-2">
                    Application ID:{" "}
                    <code className="bg-green-100 px-2 py-1 rounded">
                      {applicationId}
                    </code>
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  What happens next?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        Email Confirmation
                      </p>
                      <p className="text-gray-600 text-sm">
                        You'll receive an email confirmation within 24 hours
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        Application Review
                      </p>
                      <p className="text-gray-600 text-sm">
                        Our team will review your application and resume
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Next Steps</p>
                      <p className="text-gray-600 text-sm">
                        If selected, we'll contact you within 1-2 weeks for next
                        steps
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Create Account CTA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Want to track your application?
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Create an account to track your application status, save
                    your resume, and apply to more jobs faster.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/register"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Details Sidebar */}
          <div className="space-y-6">
            {jobData && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Applied Position
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {jobData.title}
                    </h4>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <Building2 className="h-4 w-4 mr-1" />
                      {companyData?.name || "Company"}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {formatLocation(jobData.locations)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        jobData.employmentType
                      )}`}
                    >
                      {jobData.employmentType}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {jobData.seniorityLevel}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Salary</p>
                    <p className="font-medium text-gray-900">
                      {formatSalary(jobData)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Link
                    href={`/public/jobs/${jobId}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Job Details →
                  </Link>
                </div>
              </div>
            )}

            {/* Browse More Jobs */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Explore More Opportunities
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Continue browsing our job openings while you wait for a
                response.
              </p>
              <Link
                href="/public/jobs"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors w-full justify-center"
              >
                Browse All Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
