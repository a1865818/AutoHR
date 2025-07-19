"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Building2, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";

interface Company {
  id: string;
  name: string;
  industry: string;
  companySize: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  headquarters?: {
    city: string;
    state: string;
    country: string;
  };
}

export default function ExistingCompanyPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Load companies when component mounts
  useEffect(() => {
    loadCompanies();
  }, []);

  // Filter companies based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.industry.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const loadCompanies = async () => {
    setIsLoading(true);
    setError("");
    try {
      const companiesData = await apiService.getCompanies();
      setCompanies(companiesData);
      setFilteredCompanies(companiesData);
    } catch (error) {
      console.error("Error loading companies:", error);
      setError("Failed to load companies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    console.log("Selected company:", company);
    // Redirect to signup with company ID in URL
    router.push(`/signup/hiring/existing-company/${company.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/signup/hiring"
            className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to hiring options
          </Link>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Find Your Company
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Search and select your existing company to join their HR team
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search companies by name or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading companies...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadCompanies}
              className="mt-2 text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Companies List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  No companies found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "No companies are registered yet"}
                </p>
                <Link
                  href="/signup/hiring/new-company"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register a new company instead
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border-2 border-transparent hover:border-blue-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={`${company.name} logo`}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {company.industry} • {company.companySize}
                        </p>
                        {company.headquarters && (
                          <p className="text-sm text-gray-500">
                            📍 {company.headquarters.city},{" "}
                            {company.headquarters.state},{" "}
                            {company.headquarters.country}
                          </p>
                        )}
                        {company.website && (
                          <p className="text-sm text-blue-600 mt-1">
                            🌐 {company.website}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Register New Company Option */}
        {!isLoading && !error && filteredCompanies.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Don't see your company?
            </p>
            <Link
              href="/signup/hiring/new-company"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Register a new company instead
            </Link>
          </div>
        )}

        {/* Back to login */}
        <div className="text-center mt-8">
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
