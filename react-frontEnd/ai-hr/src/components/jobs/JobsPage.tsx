// "use client";

// import { ChevronDown, Search } from "lucide-react";
// import { useState } from "react";
// import { JobCard } from "./JobCard";
// import { JobFilterSidebar } from "./JobFilterSidebar";

// interface Job {
//   id: string;
//   title: string;
//   company: string;
//   location: string;
//   type: "Full-Time" | "Part-Time" | "Contract" | "Internship";
//   experience: string;
//   salary: string;
//   description: string;
//   requirements: string[];
//   postedDate: string;
//   applicants: number;
//   status: "Active" | "Paused" | "Closed";
//   urgency?: "Urgent" | "High Priority";
// }

// // Mock data for jobs - Updated for Australian market
// const mockJobs: Job[] = [
//   {
//     id: "1",
//     title: "Senior Frontend Developer",
//     company: "Atlassian",
//     location: "Sydney, NSW",
//     type: "Full-Time",
//     experience: "5-7 Years",
//     salary: "$110k - $150k AUD",
//     description:
//       "We're looking for a senior frontend developer to join our design tools team.",
//     requirements: ["React", "TypeScript", "5+ years experience"],
//     postedDate: "2 days ago",
//     applicants: 24,
//     status: "Active",
//   },
//   {
//     id: "2",
//     title: "Product Designer",
//     company: "Canva",
//     location: "Melbourne, VIC",
//     type: "Full-Time",
//     experience: "3-5 Years",
//     salary: "$95k - $125k AUD",
//     description:
//       "Join our product design team to create exceptional user experiences.",
//     requirements: ["Figma", "User Research", "3+ years experience"],
//     postedDate: "1 week ago",
//     applicants: 18,
//     status: "Active",
//     urgency: "High Priority",
//   },
//   {
//     id: "3",
//     title: "UX Designer",
//     company: "REA Group",
//     location: "Brisbane, QLD",
//     type: "Full-Time",
//     experience: "2-4 Years",
//     salary: "$85k - $110k AUD",
//     description:
//       "Help us design intuitive experiences for millions of users across Australia.",
//     requirements: ["Sketch", "Prototyping", "User Testing"],
//     postedDate: "3 days ago",
//     applicants: 32,
//     status: "Active",
//     urgency: "Urgent",
//   },
//   {
//     id: "4",
//     title: "Backend Engineer",
//     company: "Xero",
//     location: "Melbourne, VIC",
//     type: "Full-Time",
//     experience: "4-6 Years",
//     salary: "$120k - $150k AUD",
//     description:
//       "Build scalable backend systems for our accounting software platform.",
//     requirements: ["Node.js", "PostgreSQL", "AWS"],
//     postedDate: "5 days ago",
//     applicants: 15,
//     status: "Paused",
//   },
//   {
//     id: "5",
//     title: "Marketing Manager",
//     company: "Commonwealth Bank",
//     location: "Sydney, NSW",
//     type: "Full-Time",
//     experience: "3-5 Years",
//     salary: "$90k - $120k AUD",
//     description:
//       "Lead marketing campaigns and drive customer acquisition strategies.",
//     requirements: ["Digital Marketing", "Analytics", "Campaign Management"],
//     postedDate: "1 week ago",
//     applicants: 28,
//     status: "Active",
//   },
//   {
//     id: "6",
//     title: "Data Scientist",
//     company: "Telstra",
//     location: "Perth, WA",
//     type: "Contract",
//     experience: "2-4 Years",
//     salary: "$100k - $130k AUD",
//     description:
//       "Analyze customer behavior and improve our recommendation algorithms.",
//     requirements: ["Python", "Machine Learning", "Statistics"],
//     postedDate: "4 days ago",
//     applicants: 12,
//     status: "Active",
//   },
// ];

// type SortOption = "newest" | "oldest" | "applicants" | "salary";

// export function JobsPage() {
//   // Rest of the component remains unchanged
//   const [expandedFilters, setExpandedFilters] = useState({
//     status: true,
//     type: true,
//     experience: false,
//     location: false,
//   });
//   const [searchQuery, setSearchQuery] = useState("");
//   const [sortBy, setSortBy] = useState<SortOption>("newest");
//   const [showSortDropdown, setShowSortDropdown] = useState(false);

//   const toggleFilter = (filterType: keyof typeof expandedFilters) => {
//     setExpandedFilters((prev) => ({
//       ...prev,
//       [filterType]: !prev[filterType],
//     }));
//   };

//   const getSortLabel = (sort: SortOption) => {
//     switch (sort) {
//       case "newest":
//         return "Date Posted";
//       case "oldest":
//         return "Oldest First";
//       case "applicants":
//         return "Most Applicants";
//       case "salary":
//         return "Highest Salary";
//       default:
//         return "Date Posted";
//     }
//   };

//   const filteredJobs = mockJobs.filter(
//     (job) =>
//       job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       job.company.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Filter Sidebar */}
//       <JobFilterSidebar
//         expandedFilters={expandedFilters}
//         toggleFilter={toggleFilter}
//       />

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Header */}
//         <div className="bg-white border-b px-6 py-4">
//           <div className="flex items-center justify-between mb-4">
//             <h1 className="text-2xl font-semibold text-gray-900">
//               Active jobs
//             </h1>
//           </div>

//           {/* Tabs */}
//           <div className="flex space-x-8 mb-4">
//             <button className="text-blue-600 border-b-2 border-blue-600 pb-2 px-1">
//               <span className="font-medium">Jobs</span>
//               <span className="ml-2 bg-blue-100 text-blue-600 text-sm px-2 py-0.5 rounded-full">
//                 {filteredJobs.length}
//               </span>
//             </button>
//             <button className="text-gray-500 hover:text-gray-700 pb-2 px-1">
//               <span>Drafts</span>
//               <span className="ml-2 bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
//                 3
//               </span>
//             </button>
//           </div>

//           {/* Search and Sort */}
//           <div className="flex items-center justify-between">
//             <div className="relative flex-1 max-w-md">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Search className="h-4 w-4 text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="Search jobs..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>

//             <div className="relative ml-4">
//               <button
//                 className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                 onClick={() => setShowSortDropdown(!showSortDropdown)}
//               >
//                 <span>Sort By: {getSortLabel(sortBy)}</span>
//                 <ChevronDown className="ml-2 h-4 w-4" />
//               </button>

//               {showSortDropdown && (
//                 <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
//                   <div className="py-1">
//                     {(
//                       [
//                         "newest",
//                         "oldest",
//                         "applicants",
//                         "salary",
//                       ] as SortOption[]
//                     ).map((option) => (
//                       <button
//                         key={option}
//                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                         onClick={() => {
//                           setSortBy(option);
//                           setShowSortDropdown(false);
//                         }}
//                       >
//                         {getSortLabel(option)}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Job List */}
//         <div className="flex-1 overflow-y-auto p-6">
//           <div className="space-y-4">
//             {filteredJobs.map((job) => (
//               <JobCard key={job.id} job={job} />
//             ))}
//           </div>

//           {filteredJobs.length === 0 && (
//             <div className="text-center py-12">
//               <p className="text-gray-500">
//                 No jobs found matching your search.
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
// components/jobs/JobsPage.tsx
"use client";

import { Job } from "@/interfaces/job";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { JobCard } from "./JobCard";
import { JobFilterSidebar } from "./JobFilterSidebar";

// Mock data for jobs
const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "Figma",
    location: "Chicago, IL",
    locationType: "On-site",
    type: "Full-Time",
    department: "Engineering",
    experience: "5-7 Years",
    salary: {
      min: 90000,
      max: 120000,
      currency: "USD",
      period: "per year",
    },
    description:
      "We're looking for a senior frontend developer to join our design tools team.",
    requirements: ["React", "TypeScript", "5+ years experience"],
    qualifications: ["Bachelor's degree in Computer Science or related field"],
    responsibilities: ["Develop UI features", "Collaborate with design team"],
    benefits: ["Health insurance", "401(k)", "Stock options"],
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
    applicationSettings: {
      deadline: "2025-06-15",
      questionsRequired: true,
      resumeRequired: true,
      coverLetterRequired: false,
      portfolioRequired: true,
    },
    postedDate: "2025-05-26",
    status: "Active",
    applicants: 24,
    createdBy: "admin1",
    updatedAt: "2025-05-27T10:00:00Z",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Stripe",
    location: "Chicago, IL",
    locationType: "On-site",
    type: "Full-Time",
    department: "Design",
    experience: "3-5 Years",
    salary: {
      min: 80000,
      max: 110000,
      currency: "USD",
      period: "per year",
    },
    description:
      "Join our product design team to create exceptional user experiences.",
    requirements: ["Figma", "User Research", "3+ years experience"],
    qualifications: ["Design portfolio", "Bachelor's degree"],
    responsibilities: ["Create wireframes", "Conduct user testing"],
    benefits: ["Flexible hours", "Remote work allowance"],
    skills: ["Figma", "UX Research", "Prototyping"],
    applicationSettings: {
      deadline: "2025-06-20",
      questionsRequired: false,
      resumeRequired: true,
      coverLetterRequired: true,
      portfolioRequired: true,
    },
    postedDate: "2025-05-21",
    status: "Active",
    applicants: 18,
    urgency: "High Priority",
    createdBy: "admin2",
    updatedAt: "2025-05-27T09:30:00Z",
  },
  {
    id: "3",
    title: "UX Designer",
    company: "Mailchimp",
    location: "Remote",
    locationType: "Remote",
    type: "Full-Time",
    department: "Design",
    experience: "2-4 Years",
    salary: {
      min: 70000,
      max: 95000,
      currency: "USD",
      period: "per year",
    },
    description:
      "Help us design intuitive experiences for millions of users worldwide.",
    requirements: ["Sketch", "Prototyping", "User Testing"],
    qualifications: ["UX Design Certificate", "Portfolio"],
    responsibilities: ["Design user journeys", "Run A/B tests"],
    benefits: ["Remote-first", "Wellness stipend"],
    skills: ["Sketch", "User Research", "Wireframing"],
    applicationSettings: {
      deadline: "2025-06-18",
      questionsRequired: true,
      resumeRequired: true,
      coverLetterRequired: false,
      portfolioRequired: true,
    },
    postedDate: "2025-05-25",
    status: "Active",
    applicants: 32,
    urgency: "Urgent",
    createdBy: "admin3",
    updatedAt: "2025-05-27T08:00:00Z",
  },
  {
    id: "4",
    title: "Backend Engineer",
    company: "Intercom",
    location: "Chicago, IL",
    locationType: "On-site",
    type: "Full-Time",
    department: "Engineering",
    experience: "4-6 Years",
    salary: {
      min: 95000,
      max: 130000,
      currency: "USD",
      period: "per year",
    },
    description:
      "Build scalable backend systems for our customer communication platform.",
    requirements: ["Node.js", "PostgreSQL", "AWS"],
    qualifications: ["CS degree", "Experience with cloud services"],
    responsibilities: ["Develop APIs", "Maintain backend infrastructure"],
    benefits: ["Paid time off", "Commuter benefits"],
    skills: ["Node.js", "SQL", "AWS", "Docker"],
    applicationSettings: {
      deadline: "2025-06-22",
      questionsRequired: false,
      resumeRequired: true,
      coverLetterRequired: true,
      portfolioRequired: false,
    },
    postedDate: "2025-05-23",
    status: "Paused",
    applicants: 15,
    createdBy: "admin4",
    updatedAt: "2025-05-27T10:45:00Z",
  },
  {
    id: "5",
    title: "Marketing Manager",
    company: "Dropbox",
    location: "Chicago, IL",
    locationType: "On-site",
    type: "Full-Time",
    department: "Marketing",
    experience: "3-5 Years",
    salary: {
      min: 75000,
      max: 100000,
      currency: "USD",
      period: "per year",
    },
    description:
      "Lead marketing campaigns and drive user acquisition strategies.",
    requirements: ["Digital Marketing", "Analytics", "Campaign Management"],
    qualifications: ["Marketing degree", "5+ years experience"],
    responsibilities: ["Develop marketing plans", "Analyze campaign data"],
    benefits: ["Stock options", "Team events"],
    skills: ["SEO", "Google Analytics", "Content Strategy"],
    applicationSettings: {
      deadline: "2025-06-25",
      questionsRequired: false,
      resumeRequired: true,
      coverLetterRequired: false,
      portfolioRequired: false,
    },
    postedDate: "2025-05-21",
    status: "Active",
    applicants: 28,
    createdBy: "admin5",
    updatedAt: "2025-05-27T11:00:00Z",
  },
  {
    id: "6",
    title: "Junior Developer",
    company: "Spotify",
    location: "New York, NY",
    locationType: "Hybrid",
    type: "Contract",
    department: "Engineering",
    experience: "0-2 Years",
    salary: {
      min: 55000,
      max: 75000,
      currency: "USD",
      period: "per year",
    },
    description:
      "Analyze user behavior and improve our recommendation algorithms.",
    requirements: ["Python", "Machine Learning", "Statistics"],
    qualifications: ["Bachelor’s in CS or related field"],
    responsibilities: ["Develop scripts", "Analyze datasets"],
    benefits: ["Gym reimbursement", "Mentorship"],
    skills: ["Python", "Pandas", "Data Analysis"],
    applicationSettings: {
      deadline: "2025-06-28",
      questionsRequired: true,
      resumeRequired: true,
      coverLetterRequired: false,
      portfolioRequired: false,
    },
    postedDate: "2025-05-24",
    status: "Active",
    applicants: 12,
    createdBy: "admin6",
    updatedAt: "2025-05-27T09:15:00Z",
  },
];

type SortOption = "newest" | "oldest" | "applicants" | "salary";
type ViewMode = "jobs" | "drafts";

interface Filters {
  status: string[];
  type: string[];
  experience: string[];
  location: string[];
  favorites: string[];
}

export function JobsPage() {
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    type: true,
    experience: false,
    location: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("jobs");

  // Initialize with empty arrays instead of default filters to show all jobs initially
  const [activeFilters, setActiveFilters] = useState<Filters>({
    status: [],
    type: [],
    experience: [],
    location: [],
    favorites: [],
  });

  // Calculate filter counts based on all jobs
  const filterCounts = useMemo(() => {
    const counts = {
      status: {} as Record<string, number>,
      type: {} as Record<string, number>,
      experience: {} as Record<string, number>,
      location: {} as Record<string, number>,
      favorites: {} as Record<string, number>,
    };

    // Count each attribute in the mock jobs
    mockJobs.forEach((job) => {
      // Count by status
      counts.status[job.status] = (counts.status[job.status] || 0) + 1;

      // Count by job type
      counts.type[job.type] = (counts.type[job.type] || 0) + 1;

      // Simplify experience to Entry/Mid/Senior
      let expCategory = "Entry";
      if (job.experience.includes("5+")) {
        expCategory = "Senior";
      } else if (
        job.experience.includes("3-5") ||
        job.experience.includes("2-5")
      ) {
        expCategory = "Mid";
      }
      counts.experience[expCategory] =
        (counts.experience[expCategory] || 0) + 1;

      // Count by location
      if (job.location.includes("Chicago")) {
        counts.location["Chicago"] = (counts.location["Chicago"] || 0) + 1;
      } else if (job.locationType === "Remote") {
        counts.location["Remote"] = (counts.location["Remote"] || 0) + 1;
      } else if (job.locationType === "Hybrid") {
        counts.location["Hybrid"] = (counts.location["Hybrid"] || 0) + 1;
      }

      // Count for favorites (using same as status counts for simplicity)
      counts.favorites[job.status] = (counts.favorites[job.status] || 0) + 1;

      // Count urgent jobs
      if (job.urgency === "Urgent") {
        counts.favorites["Urgent"] = (counts.favorites["Urgent"] || 0) + 1;
      }

      // Count high priority jobs
      if (job.urgency === "High Priority") {
        counts.favorites["High Priority"] =
          (counts.favorites["High Priority"] || 0) + 1;
      }
    });

    // Add "Draft" counts (even though we don't have any actual draft jobs in our mock data)
    counts.favorites["Draft"] = 3; // For display purposes

    return counts;
  }, [mockJobs]);

  const toggleFilter = (filterType: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const updateFilter = (
    category: keyof Filters,
    value: string,
    isActive: boolean
  ) => {
    setActiveFilters((prev) => ({
      ...prev,
      [category]: isActive
        ? [...prev[category], value]
        : prev[category].filter((item) => item !== value),
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      status: [],
      type: [],
      experience: [],
      location: [],
      favorites: [],
    });
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

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = mockJobs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.requirements.some((req) =>
            req.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // If no filters are selected, show all jobs
    const hasStatusFilters = activeFilters.status.length > 0;
    const hasTypeFilters = activeFilters.type.length > 0;
    const hasExperienceFilters = activeFilters.experience.length > 0;
    const hasLocationFilters = activeFilters.location.length > 0;

    // Apply Status filter only if at least one is selected
    if (hasStatusFilters) {
      filtered = filtered.filter((job) =>
        activeFilters.status.includes(job.status)
      );
    }

    // Apply Type filter only if at least one is selected
    if (hasTypeFilters) {
      filtered = filtered.filter((job) =>
        activeFilters.type.includes(job.type)
      );
    }

    // Apply Experience filter only if at least one is selected
    if (hasExperienceFilters) {
      filtered = filtered.filter((job) => {
        if (
          activeFilters.experience.includes("Senior") &&
          job.experience.includes("5+")
        )
          return true;
        if (
          activeFilters.experience.includes("Mid") &&
          (job.experience.includes("3-5") || job.experience.includes("2-5"))
        )
          return true;
        if (
          activeFilters.experience.includes("Entry") &&
          job.experience.includes("0-2")
        )
          return true;
        return false;
      });
    }

    // Apply Location filter only if at least one is selected
    if (hasLocationFilters) {
      filtered = filtered.filter((job) => {
        if (
          activeFilters.location.includes("Chicago") &&
          job.location.includes("Chicago")
        )
          return true;
        if (
          activeFilters.location.includes("Remote") &&
          job.locationType === "Remote"
        )
          return true;
        if (
          activeFilters.location.includes("Hybrid") &&
          job.locationType === "Hybrid"
        )
          return true;
        return false;
      });
    }

    // Apply favorites filter
    if (activeFilters.favorites.length > 0) {
      filtered = filtered.filter((job) => {
        if (activeFilters.favorites.includes(job.status)) return true;
        if (
          job.urgency === "Urgent" &&
          activeFilters.favorites.includes("Urgent")
        )
          return true;
        if (
          job.urgency === "High Priority" &&
          activeFilters.favorites.includes("High Priority")
        )
          return true;
        return false;
      });
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime()
          );
        case "applicants":
          return b.applicants - a.applicants;
        case "salary":
          return b.salary.max - a.salary.max;
        default:
          return 0;
      }
    });

    return sorted;
  }, [mockJobs, searchQuery, activeFilters, sortBy]);

  const draftJobs = 3; // Mock draft count

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <JobFilterSidebar
        expandedFilters={expandedFilters}
        toggleFilter={toggleFilter}
        activeFilters={activeFilters}
        updateFilter={updateFilter}
        clearAllFilters={clearAllFilters}
        filterCounts={filterCounts}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              {viewMode === "jobs" ? "Active jobs" : "Draft jobs"}
            </h1>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
              Create Job
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mb-4">
            <button
              className={`pb-2 px-1 ${
                viewMode === "jobs"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setViewMode("jobs")}
            >
              <span className="font-medium">Jobs</span>
              <span
                className={`ml-2 text-sm px-2 py-0.5 rounded-full ${
                  viewMode === "jobs"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filteredAndSortedJobs.length}
              </span>
            </button>
            <button
              className={`pb-2 px-1 ${
                viewMode === "drafts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setViewMode("drafts")}
            >
              <span>Drafts</span>
              <span
                className={`ml-2 text-sm px-2 py-0.5 rounded-full ${
                  viewMode === "drafts"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {draftJobs}
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
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          sortBy === option
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-700"
                        }`}
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
          {viewMode === "jobs" ? (
            <div className="space-y-4">
              {filteredAndSortedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}

              {filteredAndSortedJobs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchQuery
                      ? "No jobs found matching your search."
                      : "No jobs match your current filters."}
                  </p>
                  {Object.values(activeFilters).some(
                    (arr) => arr.length > 0
                  ) && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Draft functionality coming soon...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
