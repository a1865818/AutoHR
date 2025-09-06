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
import { Pagination } from "@/components/ui/Pagination";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 6; // 3x4 grid on desktop

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
    setCurrentPage(1); // Reset pagination when clearing filters
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Scroll to top of companies grid
    const companiesGrid = document.getElementById("companies-grid");
    if (companiesGrid) {
      companiesGrid.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedIndustry]);

  // Calculate pagination
  const totalCompanies = filteredCompanies.length;
  const totalPages = Math.ceil(totalCompanies / companiesPerPage);
  const startIndex = (currentPage - 1) * companiesPerPage;
  const endIndex = startIndex + companiesPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  const hasActiveFilters = searchTerm || selectedIndustry;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-12 bg-white/20 rounded-lg w-80 mx-auto mb-4"></div>
                <div className="h-6 bg-white/10 rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card p-6 rounded-2xl border-0 shadow-sm">
                  <div className="h-40 bg-muted rounded-xl mb-6"></div>
                  <div className="h-6 bg-muted rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-muted rounded mb-2 w-1/2"></div>
                  <div className="h-12 bg-muted rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/6"></div>
                    <div className="h-4 bg-muted rounded w-3/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Companies
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Discover amazing companies and their open job opportunities. Find your perfect workplace match.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
              <input
                type="text"
                placeholder="Search companies, industries, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border-0 text-white placeholder:text-white/60 focus:bg-white/20 rounded-xl text-lg focus:ring-2 focus:ring-white/20 focus:outline-none"
              />
            </div>

            {/* Industry Filter */}
            <div className="relative min-w-[250px]">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border-0 text-white rounded-xl text-lg focus:ring-2 focus:ring-white/20 focus:outline-none appearance-none focus:bg-white/20"
              >
                <option value="" className="text-gray-900">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry} className="text-gray-900">
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-white/80">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                  Search: "{searchTerm}"
                </span>
              )}
              {selectedIndustry && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                  Industry: {selectedIndustry}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-white/90 hover:text-white underline"
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
          <div className="text-center py-16">
            <div className="bg-destructive/10 border-0 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-destructive mb-6 text-lg">{error}</p>
              <button
                onClick={fetchCompanies}
                className="bg-destructive text-destructive-foreground px-6 py-3 rounded-xl hover:bg-destructive/90 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-lg">
                  <span className="font-semibold text-foreground">{totalCompanies}</span>{" "}
                  {totalCompanies === 1 ? "company" : "companies"} found
                  {totalPages > 1 && (
                    <span className="ml-2 text-sm">
                      (Showing {startIndex + 1}-
                      {Math.min(endIndex, totalCompanies)} of {totalCompanies})
                    </span>
                  )}
                </p>
                {totalPages > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>
            </div>

            {/* Companies Grid */}
            <div id="companies-grid">
              {totalCompanies === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-card rounded-2xl border-0 shadow-sm p-12 max-w-lg mx-auto">
                    <Building2 className="h-20 w-20 text-primary/40 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-foreground mb-3">
                      No companies found
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      {hasActiveFilters
                        ? "Try adjusting your search criteria to find more companies"
                        : "There are no verified companies available at the moment"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedCompanies.map((company) => (
                      <Link
                        key={company.id}
                        href={`/public/companies/${company.id}`}
                        className="block bg-card rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group hover:-translate-y-1"
                      >
                        {/* Company Logo */}
                        <div className="h-40 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                          {company.logoUrl ? (
                            <Image
                              src={company.logoUrl}
                              alt={`${company.name} logo`}
                              width={96}
                              height={96}
                              className="object-contain"
                            />
                          ) : (
                            <Building2 className="h-16 w-16 text-primary/40" />
                          )}
                        </div>

                        <div className="p-6">
                          {/* Company Name */}
                          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
                            {company.name}
                          </h3>

                          {/* Industry */}
                          {company.industry && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
                              {company.industry}
                            </div>
                          )}

                          {/* Description */}
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-3 min-h-[60px]">
                            {company.description || "No description available"}
                          </p>

                          {/* Company Details */}
                          <div className="space-y-3">
                            {company.headquarters && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-3 text-primary/70 flex-shrink-0" />
                                <span className="line-clamp-1">
                                  {typeof company.headquarters === "object"
                                    ? `${company.headquarters.city}, ${company.headquarters.state}, ${company.headquarters.country}`
                                    : company.headquarters}
                                </span>
                              </div>
                            )}

                            {company.companySize && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="h-4 w-4 mr-3 text-primary/70 flex-shrink-0" />
                                <span>{company.companySize}</span>
                              </div>
                            )}

                            <div className="flex items-center text-sm text-muted-foreground">
                              <Briefcase className="h-4 w-4 mr-3 text-primary/70 flex-shrink-0" />
                              <span>
                                {company.jobCount} open{" "}
                                {company.jobCount === 1 ? "position" : "positions"}
                              </span>
                            </div>

                            {company.website && (
                              <div className="flex items-center text-sm text-primary font-medium">
                                <ExternalLink className="h-4 w-4 mr-3 flex-shrink-0" />
                                <span>Visit Website</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalCompanies}
                    itemsPerPage={companiesPerPage}
                    className="mt-8"
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
