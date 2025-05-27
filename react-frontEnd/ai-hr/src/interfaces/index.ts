export interface Candidate {
  id: string;
  name: string;
  photo: string;
  company: string;
  companyLogo: string;
  assessment: number;
  stage: string;
  role?: string;
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
