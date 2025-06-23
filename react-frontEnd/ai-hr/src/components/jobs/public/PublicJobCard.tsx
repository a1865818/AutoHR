"use client";

import { ApiCompany, ApiJob } from "@/interfaces";
import {
  Briefcase,
  Building2,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  Users,
} from "lucide-react";
import Link from "next/link";

interface PublicJobCardProps {
  job: ApiJob;
  company?: ApiCompany;
  showViewCount?: boolean; // Whether to show view count
}

export function PublicJobCard({
  job,
  company,
  showViewCount = true,
}: PublicJobCardProps) {
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
    return "Salary not specified";
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
      return "1+ year";
    } else {
      return `${experienceYearsMin}+ years`;
    }
  };

  const formatPostedDate = (dateString?: string) => {
    if (!dateString) return "Recently posted";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const formatViewCount = (count?: number): string => {
    if (!count || count === 0) return "No views yet";
    if (count === 1) return "1 view";
    if (count < 1000) return `${count} views`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k views`;
    return `${(count / 1000000).toFixed(1)}M views`;
  };

  const formatApplicantCount = (count?: number): string => {
    if (!count || count === 0) return "No applicants yet";
    if (count === 1) return "1 applicant";
    return `${count} applicants`;
  };

  // Extract view count from job data
  const viewCount = job.viewCount || (job as any).ViewCount || 0;
  const applicantCount = job.applicantCount || (job as any).ApplicantCount || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1 hover:text-blue-600">
                <Link href={`/public/jobs/${job.id}`}>{job.title}</Link>
              </h3>
              <div className="flex items-center text-gray-600 mb-2">
                <Building2 className="h-4 w-4 mr-1" />
                <span className="font-medium">
                  {company?.name || "Company"}
                </span>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{formatLocation(job.locations)}</span>
            </div>
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              <span>{job.employmentType || "Full-time"}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatPostedDate(job.postedDate || job.createdAt)}</span>
            </div>
          </div>

          {/* Job Description Preview */}
          <p className="text-gray-700 mb-4 line-clamp-2">
            {job.description || "No description available"}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {formatExperience(job.experienceYearsMin)}
            </span>
            {job.seniorityLevel && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {job.seniorityLevel}
              </span>
            )}
            {job.department && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {job.department}
              </span>
            )}
          </div>

          {/* View Count and Applicant Count */}
          {(showViewCount || applicantCount > 0) && (
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              {/* View Count */}
              {showViewCount && viewCount > 0 && (
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{formatViewCount(viewCount)}</span>
                </div>
              )}

              {/* Applicant Count */}
              {applicantCount > 0 && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{formatApplicantCount(applicantCount)}</span>
                </div>
              )}

              {/* Trending indicator for popular jobs */}
              {viewCount > 100 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  🔥 Popular
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Salary and Actions */}
        <div className="flex flex-col items-end space-y-3 ml-6">
          <div className="text-right">
            <div className="text-lg font-semibold text-green-600">
              {formatSalary(job)}
            </div>

            {/* Show basic stats for motivation */}
            <div className="text-sm text-gray-500 mt-1">
              {applicantCount > 0 && (
                <div>{formatApplicantCount(applicantCount)}</div>
              )}
              {showViewCount && viewCount > 0 && (
                <div>{formatViewCount(viewCount)}</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Link
              href={`/public/jobs/${job.id}/apply`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center font-medium"
            >
              Apply Now
            </Link>
            <Link
              href={`/public/jobs/${job.id}`}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* Additional engagement indicators for popular jobs */}
      {(viewCount > 50 || applicantCount > 10) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>High interest position</span>
            <div className="flex items-center space-x-4">
              {viewCount > 50 && (
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {viewCount > 1000 ? "Very popular" : "Popular"}
                </span>
              )}
              {applicantCount > 10 && (
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {applicantCount > 50 ? "Competitive" : "Active"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
