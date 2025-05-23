"use client";

import { CandidateDetail } from "@/components/candidates/CandidateDetail";
import { CandidateHeader } from "@/components/candidates/CandidateHeader ";
import { CandidatesList } from "@/components/candidates/CandidatesList";
import { FilterSidebar } from "@/components/candidates/FilterSidebar";
import { Candidate } from "@/interfaces";
import { useState } from "react";

// Sample candidate data
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

  // Get selected candidate data
  const selectedCandidateData = candidates.find(
    (candidate) => candidate.id === selectedCandidate
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left navigation sidebar */}
      <FilterSidebar
        expandedFilters={expandedFilters}
        toggleFilter={toggleFilter}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <CandidateHeader />
        <CandidatesList
          candidates={candidates}
          selectedCandidate={selectedCandidate}
          onCandidateClick={handleCandidateClick}
        />
      </div>

      {/* Sidebar details panel */}
      {selectedCandidateData && (
        <CandidateDetail
          candidate={selectedCandidateData}
          onClose={closeSidebar}
        />
      )}
    </div>
  );
}
