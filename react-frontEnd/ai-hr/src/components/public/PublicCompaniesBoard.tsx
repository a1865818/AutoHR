"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Building2,
  MapPin,
  Users,
  Briefcase,
  ExternalLink,
  Filter,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  publicCompanyService,
  PublicCompany,
} from "@/services/publicCompanyService";

export default function PublicCompaniesBoard() {
  const [companies, setCompanies] = useState<PublicCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<PublicCompany[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    fetchCompanies();
    fetchIndustries();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, selectedIndustry]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await publicCompanyService.getPublicCompanies();
      setCompanies(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch companies"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustries = async () => {
    try {
      const data = await publicCompanyService.getPublicIndustries();
      setIndustries(data);
    } catch (err) {
      console.error("Failed to fetch industries:", err);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    // Search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((company) => {
        const headquartersString =
          company.headquarters && typeof company.headquarters === "object"
            ? `${company.headquarters.city} ${company.headquarters.state} ${company.headquarters.country}`
            : String(company.headquarters || "");

        return (
          company.name?.toLowerCase().includes(lowercaseSearch) ||
          company.description?.toLowerCase().includes(lowercaseSearch) ||
          company.industry?.toLowerCase().includes(lowercaseSearch) ||
          headquartersString.toLowerCase().includes(lowercaseSearch)
        );
      });
    }

    // Industry filter
    if (selectedIndustry) {
      filtered = filtered.filter(
        (company) => company.industry === selectedIndustry
      );
    }

    setFilteredCompanies(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedIndustry("");
  };

  const hasActiveFilters = searchTerm || selectedIndustry;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-16 bg-gray-300 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Explore Companies
            </h1>
            <p className="text-gray-600">
              Discover amazing companies and their open job opportunities
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search companies, industries, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Industry Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                </span>
              )}
              {selectedIndustry && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Industry: {selectedIndustry}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto p-6">
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchCompanies}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredCompanies.length}{" "}
                {filteredCompanies.length === 1 ? "company" : "companies"} found
              </p>
            </div>

            {/* Companies Grid */}
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No companies found
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria"
                    : "There are no verified companies available at the moment"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/public/companies/${company.id}`}
                    className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
                  >
                    {/* Company Logo */}
                    <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      {company.logoUrl ? (
                        <Image
                          src={company.logoUrl}
                          alt={`${company.name} logo`}
                          width={80}
                          height={80}
                          className="object-contain"
                        />
                      ) : (
                        <Building2 className="h-12 w-12 text-gray-400" />
                      )}
                    </div>

                    <div className="p-6">
                      {/* Company Name */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {company.name}
                      </h3>

                      {/* Industry */}
                      {company.industry && (
                        <p className="text-sm text-blue-600 font-medium mb-2">
                          {company.industry}
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {company.description || "No description available"}
                      </p>

                      {/* Company Details */}
                      <div className="space-y-2">
                        {company.headquarters && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-2" />
                            {typeof company.headquarters === "object"
                              ? `${company.headquarters.city}, ${company.headquarters.state}, ${company.headquarters.country}`
                              : company.headquarters}
                          </div>
                        )}

                        {company.companySize && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-2" />
                            {company.companySize}
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-500">
                          <Briefcase className="h-4 w-4 mr-2" />
                          {company.jobCount} open{" "}
                          {company.jobCount === 1 ? "position" : "positions"}
                        </div>

                        {company.website && (
                          <div className="flex items-center text-sm text-blue-600">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Website
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
