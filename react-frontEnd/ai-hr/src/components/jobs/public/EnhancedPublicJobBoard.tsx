"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Filter,
  X,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  Bookmark,
  ExternalLink,
  Clock,
  DollarSign,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiJob, ApiCompany } from "@/interfaces";
import { publicJobService } from "@/services/publicJobService";
import { PublicJobFilters } from "@/components/jobs/public/PublicJobFilters";
import Link from "next/link";

type SortOption = "newest" | "oldest" | "salary" | "company";
type ViewMode = "grid" | "list";

interface Filters {
  type: string[];
  experience: string[];
  workType: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.6
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

export function EnhancedPublicJobBoard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<ApiJob[]>([]);
  const [companies, setCompanies] = useState<Map<string, ApiCompany>>(new Map());
  
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(12);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const [activeFilters, setActiveFilters] = useState<Filters>({
    type: [],
    experience: [],
    workType: [],
  });

  // Read URL parameters
  useEffect(() => {
    const companyParam = searchParams.get("company");
    const pageParam = searchParams.get("page");
    const searchParam = searchParams.get("search");
    const locationParam = searchParams.get("location");

    if (companyParam) setSelectedCompanyId(companyParam);
    if (pageParam) setCurrentPage(parseInt(pageParam, 10) || 1);
    if (searchParam) setSearchQuery(searchParam);
    if (locationParam) setLocationQuery(locationParam);
  }, [searchParams]);

  useEffect(() => {
    loadPublicJobs();
  }, [currentPage, jobsPerPage]);

  useEffect(() => {
    if (selectedCompanyId) {
      loadPublicJobs(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const loadPublicJobs = async (companyId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await publicJobService.getPublicJobs(
        companyId ? { companyId } : undefined,
        currentPage,
        jobsPerPage
      );

      const jobs = response.jobs;
      setAllJobs(jobs);
      setTotalJobs(response.pagination.totalCount);
      setTotalPages(response.pagination.totalPages);

      // Load company data
      const uniqueCompanyIds = [...new Set(jobs.map((job) => job.companyId))];
      const companyMap = new Map<string, ApiCompany>();

      await Promise.all(
        uniqueCompanyIds.map(async (companyId) => {
          try {
            const company = await publicJobService.getCompanyById(companyId);
            companyMap.set(companyId, company);
          } catch (error) {
            console.warn(`Failed to load company ${companyId}:`, error);
          }
        })
      );

      setCompanies(companyMap);
    } catch (error) {
      console.error("Failed to load public jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = allJobs;

    // Apply filters...
    if (selectedCompanyId) {
      filtered = filtered.filter((job) => job.companyId === selectedCompanyId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          companies.get(job.companyId)?.name.toLowerCase().includes(query) ||
          job.department?.toLowerCase().includes(query)
      );
    }

    if (locationQuery.trim()) {
      const locationSearch = locationQuery.toLowerCase();
      filtered = filtered.filter((job) => {
        let locationText = "";
        if (job.locations && typeof job.locations === "object") {
          locationText = Object.values(job.locations)
            .filter(Boolean)
            .map((val) => String(val))
            .join(" ")
            .toLowerCase();
        }
        return locationText.includes(locationSearch);
      });
    }

    // Apply other filters...
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter((job) =>
        activeFilters.type.some(
          (filterType) =>
            (job.employmentType || "").toLowerCase() === filterType.toLowerCase()
        )
      );
    }

    if (activeFilters.experience.length > 0) {
      filtered = filtered.filter((job) => {
        const experience = job.experienceYearsMin || 0;
        return activeFilters.experience.some((exp) => {
          switch (exp) {
            case "entry":
              return experience <= 1;
            case "mid":
              return experience >= 2 && experience <= 5;
            case "senior":
              return experience >= 6;
            default:
              return false;
          }
        });
      });
    }

    if (activeFilters.workType.length > 0) {
      filtered = filtered.filter((job) =>
        activeFilters.workType.some(
          (filterWorkType) =>
            (job.locationType || "").toLowerCase() === filterWorkType.toLowerCase()
        )
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.postedDate || b.createdAt).getTime() -
            new Date(a.postedDate || a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.postedDate || a.createdAt).getTime() -
            new Date(b.postedDate || b.createdAt).getTime()
          );
        case "salary":
          const salaryA = a.salaryMax || a.salaryMin || 0;
          const salaryB = b.salaryMax || b.salaryMin || 0;
          return salaryB - salaryA;
        case "company":
          const companyA = companies.get(a.companyId)?.name || "";
          const companyB = companies.get(b.companyId)?.name || "";
          return companyA.localeCompare(companyB);
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    allJobs,
    companies,
    searchQuery,
    locationQuery,
    sortBy,
    activeFilters,
    selectedCompanyId,
  ]);

  const updateFilter = (category: keyof Filters, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      type: [],
      experience: [],
      workType: [],
    });
    setSearchQuery("");
    setLocationQuery("");
    setCurrentPage(1);
    if (selectedCompanyId) {
      window.history.pushState(null, "", "/public/browse-jobs");
      setSelectedCompanyId(null);
    }
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(jobId)) {
        newSaved.delete(jobId);
      } else {
        newSaved.add(jobId);
      }
      return newSaved;
    });
  };

  const hasActiveFilters =
    Object.values(activeFilters).some((arr) => arr.length > 0) ||
    searchQuery.trim() !== "" ||
    locationQuery.trim() !== "" ||
    selectedCompanyId !== null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading amazing opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-destructive mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Unable to Load Jobs
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => loadPublicJobs()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {selectedCompanyId && companies.get(selectedCompanyId)
                ? `Jobs at ${companies.get(selectedCompanyId)?.name}`
                : "Discover Your Next Opportunity"}
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              {selectedCompanyId && companies.get(selectedCompanyId)
                ? `Explore all available positions at ${companies.get(selectedCompanyId)?.name}. Apply instantly without creating an account.`
                : "Browse thousands of job opportunities from top companies. Find your perfect match with our intelligent search."}
            </p>
          </motion.div>

          {/* Enhanced Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Job title, company, or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-white/90 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="City, state, or remote"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      className="pl-12 h-12 bg-white/90 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8">
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="sticky top-8">
              <PublicJobFilters
                activeFilters={activeFilters}
                updateFilter={updateFilter}
                clearAllFilters={clearAllFilters}
                totalJobs={totalJobs}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              {/* Results Info */}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {filteredAndSortedJobs.length.toLocaleString()} Job
                  {filteredAndSortedJobs.length !== 1 ? "s" : ""} Found
                  {selectedCompanyId && companies.get(selectedCompanyId) && (
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      at {companies.get(selectedCompanyId)?.name}
                    </span>
                  )}
                </h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-primary hover:text-primary/80 p-0 h-auto"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Mobile Filters */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filter Jobs</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <PublicJobFilters
                        activeFilters={activeFilters}
                        updateFilter={updateFilter}
                        clearAllFilters={clearAllFilters}
                        totalJobs={totalJobs}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="salary">Highest Salary</SelectItem>
                    <SelectItem value="company">Company A-Z</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <Tabs value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                  <TabsList>
                    <TabsTrigger value="grid" size="sm">
                      <Grid3X3 className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list" size="sm">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Active Filters */}
            {selectedCompanyId && (
              <div className="mb-6">
                <Badge variant="secondary" className="mr-2">
                  <Building2 className="h-3 w-3 mr-1" />
                  {companies.get(selectedCompanyId)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.history.pushState(null, "", "/public/browse-jobs");
                      setSelectedCompanyId(null);
                    }}
                    className="ml-2 p-0 h-auto hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              </div>
            )}

            {/* Job Grid/List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "space-y-4"
              }
            >
              {filteredAndSortedJobs.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <Card>
                    <CardContent className="p-12">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        No Jobs Found
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {hasActiveFilters
                          ? "Try adjusting your search or filters"
                          : "No jobs match your current criteria"}
                      </p>
                      {hasActiveFilters && (
                        <Button onClick={clearAllFilters}>Clear All Filters</Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredAndSortedJobs.map((job, index) => (
                  <motion.div key={job.id} variants={itemVariants}>
                    <JobCard 
                      job={job} 
                      company={companies.get(job.companyId)} 
                      viewMode={viewMode}
                      isSaved={savedJobs.has(job.id)}
                      onToggleSave={() => toggleSaveJob(job.id)}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Pagination */}
            {filteredAndSortedJobs.length > 0 && totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            {filteredAndSortedJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-16 text-center"
              >
                <Card className="bg-gradient-primary text-white border-0">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-4">
                      Want to save jobs and track applications?
                    </h3>
                    <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                      Create an account to unlock additional features like job alerts, 
                      application tracking, and personalized recommendations.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button
                        size="lg"
                        asChild
                        className="bg-white text-primary hover:bg-white/90 font-semibold"
                      >
                        <Link href="/signup/applicant">Sign Up Free</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <Link href="/login">Sign In</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Job Card Component
interface JobCardProps {
  job: ApiJob;
  company?: ApiCompany;
  viewMode: ViewMode;
  isSaved: boolean;
  onToggleSave: () => void;
}

function JobCard({ job, company, viewMode, isSaved, onToggleSave }: JobCardProps) {
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max && min !== max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    return `$${(min || max)?.toLocaleString()}`;
  };

  const formatLocation = (locations: any) => {
    if (!locations || typeof locations !== 'object') return null;
    
    // Get all location values and flatten any nested arrays
    const locationValues = Object.values(locations)
      .flat()
      .filter(Boolean)
      .map(val => String(val).trim())
      .filter(val => val.length > 0);
    
    // Split by common separators and flatten
    const allParts = locationValues
      .flatMap(val => val.split(/[,;|]/))
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    // Remove duplicates (case insensitive) and join
    const uniqueLocations = [...new Set(allParts.map(loc => loc.toLowerCase()))]
      .map(lowerLoc => allParts.find(loc => loc.toLowerCase() === lowerLoc))
      .filter(Boolean);
      
    return uniqueLocations.length > 0 ? uniqueLocations.join(', ') : null;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card shadow-sm">
      <CardContent className="p-6">
        <div className={viewMode === "list" ? "flex items-start gap-6" : ""}>
          {/* Company Logo - Consistent */}
          <div className={`${viewMode === "list" ? "flex-shrink-0" : "mb-4"}`}>
            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between min-h-[280px]">
            {/* Top Content */}
            <div className="space-y-4">
              {/* Header - Consistent spacing */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/public/jobs/${job.id}`}
                    className="group-hover:text-primary transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 leading-tight h-[3.5rem] flex items-start">
                      {job.title}
                    </h3>
                  </Link>
                  {company && (
                    <p className="text-primary font-medium text-sm">{company.name}</p>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleSave}
                  className="flex-shrink-0 hover:bg-accent"
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                </Button>
              </div>

              {/* Job Details - Consistent layout */}
              <div className="space-y-2">
                {/* Location and Date on first line */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {formatLocation(job.locations) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{formatLocation(job.locations)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{new Date(job.postedDate || job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Salary on second line */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3 flex-shrink-0" />
                  <span>{formatSalary(job.salaryMin, job.salaryMax) || "No salary range"}</span>
                </div>
              </div>

              {/* Description - Fixed height container */}
              <div className="h-[4.5rem] flex items-start">
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                  {job.description || "No description available"}
                </p>
              </div>

              {/* Tags - Consistent styling */}
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] items-start">
                {job.employmentType && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {job.employmentType}
                  </Badge>
                )}
                {job.locationType && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {job.locationType}
                  </Badge>
                )}
                {job.department && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {job.department}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions - Always at bottom */}
            <div className="flex items-center gap-2 pt-4">
              <Button size="sm" asChild className="flex-1 h-9">
                <Link href={`/public/jobs/${job.id}`}>
                  View Details
                </Link>
              </Button>
              
              <Button variant="outline" size="sm" asChild className="flex-1 h-9">
                <Link href={`/public/jobs/${job.id}/apply`}>
                  Apply Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}