"use client";

import { useJobViewTracking } from "@/hooks/useJobViewTracking";
import { ApiCompany, ApiJob } from "@/interfaces";
import { publicJobService } from "@/services/publicJobService";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Share2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PublicJobDetailsProps {
  jobId: string;
}

export function PublicJobDetails({ jobId }: PublicJobDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<ApiJob | null>(null);
  const [company, setCompany] = useState<ApiCompany | null>(null);

  // Add view tracking for public job views
  const { isTracking, hasTracked } = useJobViewTracking(jobId, {
    enabled: true,
    delay: 2000,
  });

  // Log view tracking status for debugging
  useEffect(() => {
    if (jobId) {
      console.log(`🌍 Public view tracking status for job ${jobId}:`, {
        isTracking,
        hasTracked,
        jobTitle: job?.title,
      });
    }
  }, [jobId, isTracking, hasTracked, job?.title]);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🌍 Loading public job details: ${jobId}`);

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

      console.log(`✅ Loaded job details: ${jobData.title}`);
    } catch (error) {
      console.error("❌ Failed to load job details:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load job details"
      );
    } finally {
      setIsLoading(false);
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

  const formatLocation = (locations: any) => {
    if (typeof locations === "object" && locations) {
      const { city, state, country } = locations;
      const parts = [city, state, country].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "Location not specified";
    }
    return String(locations || "Location not specified");
  };

  const formatExperience = (experienceYearsMin?: number) => {
    if (!experienceYearsMin || experienceYearsMin === 0) {
      return "Entry level";
    } else if (experienceYearsMin === 1) {
      return "1+ year experience";
    } else {
      return `${experienceYearsMin}+ years experience`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently posted";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysAgo = (dateString?: string) => {
    if (!dateString) return "Recently";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${company?.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Job Not Available
            </h2>
            <p className="text-red-700 mb-4">
              {error || "This job is no longer available"}
            </p>
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
                Browse Other Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/public"
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {job.title}
                </h1>
                <p className="text-lg text-gray-600">
                  {company?.name || "Company"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Job
              </button>
              <Link
                href={`/public/jobs/${job.id}/apply`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Overview */}
            <div className="bg-white rounded-lg border p-6">
              {/* Job Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{formatLocation(job.locations)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>{job.employmentType || "Full-time"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>{formatSalary(job)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{formatExperience(job.experienceYearsMin)}</span>
                </div>
                {/* add view tracking count
                {isTracking && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      Viewed {job.viewCount} times
                    </span>
                  </div>
                )} */}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {job.seniorityLevel && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {job.seniorityLevel}
                  </span>
                )}
                {job.department && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {job.department}
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#066046]/15 text-[#066046] border border-[#066046]/20">
                  {job.employmentType}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Job Description
                </h3>
                <div className="prose max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Key Responsibilities
                  </h3>
                  <ul className="space-y-2">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Qualifications */}
              {job.qualifications && job.qualifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Preferred Qualifications
                  </h3>
                  <ul className="space-y-2">
                    {job.qualifications.map((qualification, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{qualification}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Benefits & Perks
                  </h3>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="bg-white rounded-lg border p-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatSalary(job)}
                </div>
                <div className="text-sm text-gray-500">
                  {job.applicantCount !== undefined && (
                    <span>
                      {job.applicantCount} applicant
                      {job.applicantCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={`/public/jobs/${job.id}/apply`}
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center font-medium mb-3"
              >
                Apply for this Job
              </Link>

              <p className="text-xs text-gray-500 text-center">
                No account required • Apply in minutes
              </p>
            </div>

            {/* Company Info */}
            {company && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  About {company.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Building2 className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Company: </span>
                      <span className="font-medium text-gray-900">
                        {company.name}
                      </span>
                    </div>
                  </div>
                  {company.companySize && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-3 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Size: </span>
                        <span className="font-medium text-gray-900">
                          {company.companySize}
                        </span>
                      </div>
                    </div>
                  )}
                  {company.industry && (
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Industry: </span>
                        <span className="font-medium text-gray-900">
                          {company.industry}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Job Details */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Job Details
              </h3>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Posted: </span>
                    <span className="font-medium text-gray-900">
                      {formatDate(job.postedDate || job.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <span className="text-gray-600">Posted: </span>
                    <span className="font-medium text-gray-900">
                      {getDaysAgo(job.postedDate || job.createdAt)}
                    </span>
                  </div>
                </div>
                {job.applicationDeadline && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Deadline: </span>
                      <span className="font-medium text-gray-900">
                        {formatDate(job.applicationDeadline)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sign Up CTA */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Want more features?
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Create an account to save jobs, track applications, and get
                personalized recommendations.
              </p>
              <div className="space-y-2">
                <Link
                  href="/signup/applicant"
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/login"
                  className="block w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
