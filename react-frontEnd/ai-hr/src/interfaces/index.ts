export interface Candidate {
  id: string;
  name: string;
  photo: string;
  role?: string;
  company: string;
  companyLogo: string;
  assessment: number;
  stage: "Applied" | "Interview" | "Offer";
  status?: "In Progress" | "Hired" | "Disqualified";
}

export interface FilterOption {
  id: string;
  label: string;
  count: number;
  active?: boolean;
}

export interface FilterOptionJobs {
  id: string;
  label: string;
  count: number;
  active?: boolean;
}

// Export settings interfaces
export * from "./settings";

// Export profile interfaces
export * from "./profile";

// Export job interfaces
export * from "./job";

// Export API interfaces
export * from "./api";

// Export notification interfaces
export * from "./notifications";
