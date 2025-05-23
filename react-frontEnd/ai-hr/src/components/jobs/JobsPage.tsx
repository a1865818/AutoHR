"use client";

import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { JobCard } from "./JobCard";
import { JobFilterSidebar } from "./JobFilterSidebar";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-Time" | "Part-Time" | "Contract" | "Internship";
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  postedDate: string;
  applicants: number;
  status: "Active" | "Paused" | "Closed";
  urgency?: "Urgent" | "High Priority";
}

// Mock data for jobs - Updated for Australian market
const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "Atlassian",
    location: "Sydney, NSW",
    type: "Full-Time",
    experience: "5-7 Years",
    salary: "$110k - $150k AUD",
    description:
      "We're looking for a senior frontend developer to join our design tools team.",
    requirements: ["React", "TypeScript", "5+ years experience"],
    postedDate: "2 days ago",
    applicants: 24,
    status: "Active",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Canva",
    location: "Melbourne, VIC",
    type: "Full-Time",
    experience: "3-5 Years",
    salary: "$95k - $125k AUD",
    description:
      "Join our product design team to create exceptional user experiences.",
    requirements: ["Figma", "User Research", "3+ years experience"],
    postedDate: "1 week ago",
    applicants: 18,
    status: "Active",
    urgency: "High Priority",
  },
  {
    id: "3",
    title: "UX Designer",
    company: "REA Group",
    location: "Brisbane, QLD",
    type: "Full-Time",
    experience: "2-4 Years",
    salary: "$85k - $110k AUD",
    description:
      "Help us design intuitive experiences for millions of users across Australia.",
    requirements: ["Sketch", "Prototyping", "User Testing"],
    postedDate: "3 days ago",
    applicants: 32,
    status: "Active",
    urgency: "Urgent",
  },
  {
    id: "4",
    title: "Backend Engineer",
    company: "Xero",
    location: "Melbourne, VIC",
    type: "Full-Time",
    experience: "4-6 Years",
    salary: "$120k - $150k AUD",
    description:
      "Build scalable backend systems for our accounting software platform.",
    requirements: ["Node.js", "PostgreSQL", "AWS"],
    postedDate: "5 days ago",
    applicants: 15,
    status: "Paused",
  },
  {
    id: "5",
    title: "Marketing Manager",
    company: "Commonwealth Bank",
    location: "Sydney, NSW",
    type: "Full-Time",
    experience: "3-5 Years",
    salary: "$90k - $120k AUD",
    description:
      "Lead marketing campaigns and drive customer acquisition strategies.",
    requirements: ["Digital Marketing", "Analytics", "Campaign Management"],
    postedDate: "1 week ago",
    applicants: 28,
    status: "Active",
  },
  {
    id: "6",
    title: "Data Scientist",
    company: "Telstra",
    location: "Perth, WA",
    type: "Contract",
    experience: "2-4 Years",
    salary: "$100k - $130k AUD",
    description:
      "Analyze customer behavior and improve our recommendation algorithms.",
    requirements: ["Python", "Machine Learning", "Statistics"],
    postedDate: "4 days ago",
    applicants: 12,
    status: "Active",
  },
];

type SortOption = "newest" | "oldest" | "applicants" | "salary";

export function JobsPage() {
  // Rest of the component remains unchanged
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    type: true,
    experience: false,
    location: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const toggleFilter = (filterType: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "newest":
        return "Date Posted";
      case "oldest":
        return "Oldest First";
      case "applicants":
        return "Most Applicants";
      case "salary":
        return "Highest Salary";
      default:
        return "Date Posted";
    }
  };

  const filteredJobs = mockJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <JobFilterSidebar
        expandedFilters={expandedFilters}
        toggleFilter={toggleFilter}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Active jobs
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mb-4">
            <button className="text-blue-600 border-b-2 border-blue-600 pb-2 px-1">
              <span className="font-medium">Jobs</span>
              <span className="ml-2 bg-blue-100 text-blue-600 text-sm px-2 py-0.5 rounded-full">
                {filteredJobs.length}
              </span>
            </button>
            <button className="text-gray-500 hover:text-gray-700 pb-2 px-1">
              <span>Drafts</span>
              <span className="ml-2 bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                3
              </span>
            </button>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative ml-4">
              <button
                className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <span>Sort By: {getSortLabel(sortBy)}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {(
                      [
                        "newest",
                        "oldest",
                        "applicants",
                        "salary",
                      ] as SortOption[]
                    ).map((option) => (
                      <button
                        key={option}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setSortBy(option);
                          setShowSortDropdown(false);
                        }}
                      >
                        {getSortLabel(option)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No jobs found matching your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
