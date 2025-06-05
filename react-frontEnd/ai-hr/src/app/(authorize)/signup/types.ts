// Types for form data
export interface JobApplicantFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface HiringUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  role: string;
  agreeToTerms: boolean;
}

export interface CompanyRegistrationData {
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  headquartersCity: string;
  headquartersState: string;
  headquartersCountry: string;
  email: string;
  description: string;
  logoUrl?: string;
  agreeToTerms: boolean;
  companyId?: string; // Added for storing selected company ID
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  companySize: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  email?: string;
  headquarters?: {
    city: string;
    state: string;
    country: string;
  };
}

export type UserType = "application" | "hiring";
export type SignupStep = "selection" | "companyCheck" | "companyRegistration" | "form";

// Company size options
export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50", 
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+"
] as const; 