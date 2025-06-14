"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  Globe,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  publicCompanyService,
  type PublicCompanyDetails,
} from "@/services/publicCompanyService";
import { PublicJobCard } from "@/components/jobs/public/PublicJobCard";
import { Pagination } from "@/components/ui/Pagination";

interface PublicCompanyDetailsProps {
  companyId: string;
}

export default function PublicCompanyDetails({
  companyId,
}: PublicCompanyDetailsProps) {
  const [company, setCompany] = useState<PublicCompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 4; // Fewer jobs per page for company details

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const data = await publicCompanyService.getPublicCompanyById(companyId);
      setCompany(data);
      setCurrentPage(1); // Reset to first page when new company is loaded
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch company details"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="h-32 bg-gray-300 rounded mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={fetchCompany}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Try Again
                </button>
                <Link
                  href="/public/companies"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Back to Companies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Pagination logic for jobs
  const totalJobs = company?.jobs.length || 0;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const paginatedJobs = company?.jobs.slice(startIndex, endIndex) || [];

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Scroll to top of job listings
    const jobListingsElement = document.getElementById("company-job-listings");
    if (jobListingsElement) {
      jobListingsElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/public/companies"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Companies
          </Link>
        </div>
      </div>

      {/* Company Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="h-32 w-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                {company.logoUrl ? (
                  <Image
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                ) : (
                  <Building2 className="h-16 w-16 text-gray-400" />
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {company.name}
                    </h1>
                    {company.isVerified && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>

                  {company.industry && (
                    <p className="text-lg text-blue-600 font-medium mb-4">
                      {company.industry}
                    </p>
                  )}
                </div>

                {company.website && (
                  <a
                    href={
                      company.website.startsWith("http")
                        ? company.website
                        : `https://${company.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                )}
              </div>

              {/* Company Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {company.headquarters && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>
                      {typeof company.headquarters === "object"
                        ? `${company.headquarters.city}, ${company.headquarters.state}, ${company.headquarters.country}`
                        : company.headquarters}
                    </span>
                  </div>
                )}

                {company.companySize && (
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span>{company.companySize}</span>
                  </div>
                )}

                {company.foundedYear && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>Founded {company.foundedYear}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Company */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                About {company.name}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {company.description ||
                  "No description available for this company."}
              </p>
            </div>

            {/* Open Positions */}
            <div
              className="bg-white rounded-lg shadow p-6"
              id="company-job-listings"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Open Positions ({totalJobs})
                </h2>
                {totalJobs > 0 && (
                  <Link
                    href={`/public?company=${company.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all jobs
                  </Link>
                )}
              </div>

              {totalJobs === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No open positions at the moment
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Check back later for new opportunities
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedJobs.map((job) => (
                      <PublicJobCard key={job.id} job={job} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={totalJobs}
                        itemsPerPage={jobsPerPage}
                        showInfo={false}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Quick Facts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Facts
              </h3>
              <div className="space-y-3">
                {company.industry && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Industry
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {company.industry}
                    </dd>
                  </div>
                )}

                {company.companySize && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Company Size
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {company.companySize}
                    </dd>
                  </div>
                )}

                {company.headquarters && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Headquarters
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {typeof company.headquarters === "object"
                        ? `${company.headquarters.city}, ${company.headquarters.state}, ${company.headquarters.country}`
                        : company.headquarters}
                    </dd>
                  </div>
                )}

                {company.foundedYear && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Founded
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {company.foundedYear}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Member Since
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(company.createdAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    Verified Company
                  </dd>
                </div>
              </div>
            </div>

            {/* Job Categories */}
            {company.jobs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Job Categories
                </h3>
                <div className="space-y-2">
                  {Array.from(
                    new Set(
                      company.jobs.map((job) => job.department).filter(Boolean)
                    )
                  )
                    .slice(0, 5)
                    .map((department) => (
                      <div
                        key={department}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-600">
                          {department}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {
                            company.jobs.filter(
                              (job) => job.department === department
                            ).length
                          }
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
