"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

// Define favorites and filters
const favorites: FilterOption[] = [
  { id: "qualified", label: "Qualified", count: 32, active: true },
  { id: "new", label: "New", count: 8 },
  { id: "not-connected", label: "Not connected", count: 12 },
  { id: "followed", label: "Followed", count: 8 },
];

const statusFilters: FilterOption[] = [
  { id: "qualified", label: "Qualified", count: 26, active: true },
  { id: "new", label: "New", count: 0 },
  { id: "disqualified", label: "Disqualified", count: 0 },
];

const stageFilters: FilterOption[] = [
  { id: "hired", label: "Hired", count: 4, active: true },
  { id: "applied", label: "Applied", count: 12, active: true },
  { id: "interview", label: "Interview", count: 6, active: true },
  { id: "phone-interview", label: "Phone Interview", count: 2 },
  { id: "offer", label: "Offer", count: 2, active: true },
  { id: "evaluation", label: "Evaluation", count: 6 },
];

interface Candidate {
  id: string;
  name: string;
  photo: string;
  company: string;
  companyLogo: string;
  assessment: number;
  stage: string;
  role?: string;
}

interface FilterOption {
  id: string;
  label: string;
  count: number;
  active?: boolean;
}

export default function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  );
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    stage: true,
  });

  const handleCandidateClick = (candidateId: string) => {
    setSelectedCandidate(candidateId);
  };

  const closeSidebar = () => {
    setSelectedCandidate(null);
  };

  const toggleFilter = (filterType: "status" | "stage") => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const candidates: Candidate[] = [
    {
      id: "1",
      name: "Josephine Torres",
      photo: "/api/placeholder/32/32",
      company: "Figma",
      companyLogo: "/api/placeholder/24/24",
      assessment: 100,
      stage: "Applied",
    },
    {
      id: "2",
      name: "Mitchell Santos",
      photo: "/api/placeholder/32/32",
      role: "UI/UX designer at Mailchimp",
      company: "Mailchimp",
      companyLogo: "/api/placeholder/24/24",
      assessment: 80,
      stage: "Interview",
    },
    {
      id: "3",
      name: "Fred Bowen",
      photo: "/api/placeholder/32/32",
      company: "Intercom",
      companyLogo: "/api/placeholder/24/24",
      assessment: 50,
      stage: "Interview",
    },
    {
      id: "4",
      name: "Keith Morgan",
      photo: "/api/placeholder/32/32",
      company: "Stripe",
      companyLogo: "/api/placeholder/24/24",
      assessment: 80,
      stage: "Hired",
    },
    {
      id: "5",
      name: "Rena Johnston",
      photo: "/api/placeholder/32/32",
      company: "Microsoft",
      companyLogo: "/api/placeholder/24/24",
      assessment: 25,
      stage: "Hired",
    },
    {
      id: "6",
      name: "Flora Russell",
      photo: "/api/placeholder/32/32",
      company: "Spotify",
      companyLogo: "/api/placeholder/24/24",
      assessment: 80,
      stage: "Interview",
    },
    {
      id: "7",
      name: "Andre Lyons",
      photo: "/api/placeholder/32/32",
      company: "Atlassian",
      companyLogo: "/api/placeholder/24/24",
      assessment: 100,
      stage: "Offer",
    },
    {
      id: "8",
      name: "Fred Bowen",
      photo: "/api/placeholder/32/32",
      company: "Dropbox",
      companyLogo: "/api/placeholder/24/24",
      assessment: 72,
      stage: "Applied",
    },
    {
      id: "9",
      name: "Josie Fowler",
      photo: "/api/placeholder/32/32",
      company: "Amazon",
      companyLogo: "/api/placeholder/24/24",
      assessment: 64,
      stage: "Hired",
    },
    {
      id: "10",
      name: "Gabriel Frazier",
      photo: "/api/placeholder/32/32",
      company: "Facebook",
      companyLogo: "/api/placeholder/24/24",
      assessment: 100,
      stage: "Applied",
    },
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Applied":
        return "bg-green-500 text-white";
      case "Interview":
        return "bg-yellow-500 text-white";
      case "Offer":
        return "bg-blue-500 text-white";
      case "Hired":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getAssessmentColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getAssessmentIcon = (score: number) => {
    if (score === 100) {
      return (
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-4 w-4 text-green-500" />
        </div>
      );
    }

    if (score >= 80) {
      return (
        <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
          <div className="font-medium text-xs text-green-500">{score}%</div>
        </div>
      );
    }

    if (score >= 50) {
      return (
        <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center">
          <div className="font-medium text-xs text-yellow-500">{score}%</div>
        </div>
      );
    }

    return (
      <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
        <div className="font-medium text-xs text-red-500">{score}%</div>
      </div>
    );
  };

  // Get selected candidate data
  const selectedCandidateData = candidates.find(
    (candidate) => candidate.id === selectedCandidate
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left navigation sidebar */}
      <div className="w-52 bg-white border-r flex-shrink-0 flex flex-col">
        {/* Favorites section */}
        <div className="px-4 py-3">
          <h3 className="text-xs font-medium text-gray-500 mb-2">Favorites</h3>
          <ul className="space-y-1">
            {favorites.map((item) => (
              <li key={item.id}>
                <button
                  className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-left ${
                    item.active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Filters section */}
        <div className="px-4 py-3 border-t">
          <h3 className="text-xs font-medium text-gray-500 mb-2">Filters</h3>

          {/* Status filter */}
          <div className="mb-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleFilter("status")}
            >
              <div className="flex items-center">
                {expandedFilters.status ? (
                  <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  Status
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            </div>

            {expandedFilters.status && (
              <ul className="ml-4 mt-1 space-y-1">
                {statusFilters.map((item) => (
                  <li key={item.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`status-${item.id}`}
                      checked={item.active}
                      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`status-${item.id}`}
                      className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-gray-500">
                        {item.count}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stage filter */}
          <div className="mb-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleFilter("stage")}
            >
              <div className="flex items-center">
                {expandedFilters.stage ? (
                  <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
                )}
                <span className="text-sm font-medium text-gray-700">Stage</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            </div>

            {expandedFilters.stage && (
              <ul className="ml-4 mt-1 space-y-1">
                {stageFilters.map((item) => (
                  <li key={item.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`stage-${item.id}`}
                      checked={item.active}
                      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`stage-${item.id}`}
                      className="ml-2 flex flex-1 items-center justify-between text-sm text-gray-700"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-gray-500">
                        {item.count}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Filter buttons */}
          <div className="flex space-x-2 mt-6">
            <button className="flex-1 bg-blue-500 text-white rounded-md py-1.5 text-xs font-medium hover:bg-blue-600 flex items-center justify-center">
              <Plus className="h-3 w-3 mr-1" /> Add filter
            </button>
            <button className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-md py-1.5 text-xs font-medium hover:bg-gray-50">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-white">
          <h1 className="text-xl font-semibold text-gray-800">
            Qualified candidates
          </h1>

          {/* Tabs */}
          <div className="flex mt-6 border-b">
            <button className="pb-2 px-4 text-sm font-medium border-b-2 border-blue-500 text-blue-500">
              Candidates{" "}
              <span className="ml-1 text-xs bg-blue-100 text-blue-500 px-2 py-0.5 rounded-full">
                26
              </span>
            </button>
            <button className="pb-2 px-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Notes{" "}
              <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                12
              </span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-6 py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search candidates..."
            />
          </div>
        </div>

        {/* Table header */}
        <div className="px-6">
          <div className="grid grid-cols-8 py-2 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3 flex items-center">
              Name <ChevronDown className="ml-1 h-3 w-3" />
            </div>
            <div className="col-span-2 flex items-center">
              Company <ChevronDown className="ml-1 h-3 w-3" />
            </div>
            <div className="col-span-2 flex items-center">
              Assessment <ChevronDown className="ml-1 h-3 w-3" />
            </div>
            <div className="col-span-1 flex items-center">Stage</div>
          </div>
        </div>

        {/* Candidate list */}
        <div
          className="px-6 overflow-y-auto"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`grid grid-cols-8 py-3 border-b hover:bg-gray-50 cursor-pointer ${
                selectedCandidate === candidate.id ? "bg-blue-50" : ""
              }`}
              onClick={() => handleCandidateClick(candidate.id)}
            >
              <div className="col-span-3 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                  <img
                    src={candidate.photo}
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">
                    {candidate.name}
                  </div>
                  {candidate.role && (
                    <div className="text-xs text-gray-500">
                      {candidate.role}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-2 flex items-center">
                <div className="w-6 h-6 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                  <img
                    src={candidate.companyLogo}
                    alt={candidate.company}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="ml-2 text-gray-700">{candidate.company}</span>
              </div>
              <div className="col-span-2 flex items-center">
                {getAssessmentIcon(candidate.assessment)}
                <span
                  className={`ml-2 ${getAssessmentColor(candidate.assessment)}`}
                >
                  {candidate.assessment}%
                </span>
              </div>
              <div className="col-span-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(
                    candidate.stage
                  )}`}
                >
                  {candidate.stage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar details panel */}
      {selectedCandidateData && (
        <div className="w-80 border-l bg-white overflow-hidden flex flex-col">
          {/* Header with close button */}
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                <img
                  src={selectedCandidateData.photo}
                  alt={selectedCandidateData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3">
                <h2 className="font-medium text-gray-900">
                  {selectedCandidateData.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedCandidateData.role ||
                    `UI/UX designer at ${selectedCandidateData.company}`}
                </p>
              </div>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b flex">
            <button className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
              Info
            </button>
            <button className="px-3 py-2 text-xs text-blue-500 border-b-2 border-blue-500 font-medium">
              Interview
            </button>
            <button className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
              Assessment
            </button>
            <button className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
              Files
            </button>
          </div>

          {/* Interview details */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Step 1 */}
            <div className="mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium text-sm">
                  15
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <h3 className="font-medium text-sm">
                      1 Step - HR interview
                    </h3>
                    <button className="ml-2 text-gray-400 hover:text-gray-600">
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">11:30 AM - 12:30 PM</p>
                </div>
              </div>

              <div className="mt-4 pl-11">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Interviewers
                </h4>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
                    <img
                      src="/api/placeholder/24/24"
                      alt="Caroline Robertson"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="ml-2 text-xs font-medium">
                    Caroline Robertson
                  </span>
                  <span className="ml-1 text-xs text-gray-500">HR Manager</span>
                </div>
              </div>

              <div className="mt-4 pl-11">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Evaluation
                </h4>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">4</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{ width: "80%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium text-sm">
                  18
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <h3 className="font-medium text-sm">
                      2 Step - Tech interview
                    </h3>
                    <button className="ml-2 text-gray-400 hover:text-gray-600">
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">1:30 PM - 2:30 PM</p>
                </div>
              </div>

              <div className="mt-4 pl-11">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Interviewers
                </h4>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
                    <img
                      src="/api/placeholder/24/24"
                      alt="Matthew Curry"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="ml-2 text-xs font-medium">
                    Matthew Curry
                  </span>
                  <span className="ml-1 text-xs text-gray-500">
                    TL of Design Department
                  </span>
                </div>
                <button className="mt-2 flex items-center text-blue-500 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add specialist
                </button>
              </div>

              <div className="mt-4 pl-11">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Evaluation
                </h4>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">3</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-yellow-500 rounded"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2 mt-8">
              <button className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-50">
                Decline
              </button>
              <button className="flex-1 bg-blue-500 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-600">
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
