import { JobFormData } from "@/interfaces/job";

// Backend API request type (matching CreateJobRequest.cs)
export interface CreateJobRequest {
  title: string;
  companyId: string; // GUID as string
  createdBy: string; // GUID as string
  description: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  employmentType: string;
  seniorityLevel?: string;
  experienceYearsMin?: number;
  locationType: string;
  locations: Record<string, unknown>; // Dictionary<string, object>
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  applicationDeadline?: string; // ISO date string
  status: string;
  aiGeneratedDescription?: boolean;
  skillMatchThreshold?: number;
}

// Extract years from experience string (e.g., "3-5 years" -> 3)
function extractMinYears(experience: string): number | undefined {
  if (!experience) return undefined;
  
  // Look for patterns like "3-5 years", "2+ years", "5 years"
  const match = experience.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

// Map experience to seniority level
function mapExperienceToSeniority(experience: string): string {
  if (!experience) return "";
  
  const exp = experience.toLowerCase();
  if (exp.includes("entry") || exp.includes("junior") || exp.includes("0-1") || exp.includes("0-2")) {
    return "Junior";
  } else if (exp.includes("mid") || exp.includes("2-5") || exp.includes("3-5")) {
    return "Mid";
  } else if (exp.includes("senior") || exp.includes("5+") || exp.includes("5-10")) {
    return "Senior";
  } else if (exp.includes("lead") || exp.includes("principal") || exp.includes("10+")) {
    return "Lead";
  }
  
  return "Mid"; // Default fallback
}

// Transform location string to locations object
function transformLocation(location: string, locationType: string): Record<string, unknown> {
  // Create a flexible location object that can handle various formats
  return {
    primary: location,
    type: locationType,
    // Could be extended with more location details if needed
    // city: extractCity(location),
    // country: extractCountry(location),
    // remote: locationType === "Remote"
  };
}

// Main mapper function
export function mapFormDataToCreateJobRequest(
  formData: JobFormData,
  companyId: string = "00000000-0000-0000-0000-000000000001", // Default company ID - should come from auth context
  createdBy: string = "00000000-0000-0000-0000-000000000001", // Default user ID - should come from auth context
  status: "Open" | "Draft" = "Open",
  aiGeneratedDescription: boolean = false
): CreateJobRequest {
  return {
    title: formData.title,
    companyId,
    createdBy,
    description: formData.description,
    responsibilities: formData.responsibilities,
    requirements: formData.requirements,
    qualifications: formData.qualifications,
    benefits: formData.benefits,
    employmentType: formData.type, // "Full-Time", "Part-Time", etc.
    seniorityLevel: mapExperienceToSeniority(formData.experience),
    experienceYearsMin: extractMinYears(formData.experience),
    locationType: formData.locationType, // "On-site", "Remote", "Hybrid"
    locations: transformLocation(formData.location, formData.locationType),
    salaryMin: formData.salary.min || undefined,
    salaryMax: formData.salary.max || undefined,
    salaryCurrency: formData.salary.currency,
    applicationDeadline: formData.applicationSettings.deadline 
      ? new Date(formData.applicationSettings.deadline).toISOString()
      : undefined,
    status,
    aiGeneratedDescription,
    skillMatchThreshold: 0.70, // Default value from backend
  };
}

// Validation function to check if form data is complete enough for API call
export function validateFormDataForSubmission(formData: JobFormData): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Required fields for job creation
  if (!formData.title.trim()) missingFields.push("Job Title");
  if (!formData.description.trim()) missingFields.push("Job Description");
  if (!formData.location.trim()) missingFields.push("Location");
  if (formData.responsibilities.length === 0) missingFields.push("Responsibilities");
  if (formData.requirements.length === 0) missingFields.push("Requirements");
  if (formData.qualifications.length === 0) missingFields.push("Qualifications");

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

// Validation for draft (less strict)
export function validateFormDataForDraft(formData: JobFormData): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Only require title for draft
  if (!formData.title.trim()) missingFields.push("Job Title");

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
} 