// interfaces/apply.ts

export interface PersonalInfoAppliedForm {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  city: string;
  phoneNumber: string;
  countryCode: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Education {
  id: string;
  institution: string;
  major: string;
  degree: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string;
  isCurrentlyAttending: boolean;
}

export interface SocialProfiles {
  linkedin: string;
  facebook: string;
  twitter: string;
  website: string;
}

export interface ApplicationData {
  method: "upload" | "manual";
  personalInfo: PersonalInfoAppliedForm;
  experiences: Experience[];
  education: Education[];
  profiles: SocialProfiles;
  coverLetter: string;
  files: {
    uploadedFile: File | null;
    resumeFile: File | null;
  };
  profileImage: string | null;
}
export interface PreliminaryData {
  preferredName: string;
  pronouns: string;
  workingStatus: string;
  workingRights: string;
  raceEthnicity: string;
  genderIdentity: string;
  privacyConsent: boolean;
}

export interface ApplyFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    location: string;
  };
  experience: ExperienceItemData[];
  education: EducationItemData[];
  resume?: File;
  coverLetter?: string;
}

interface ExperienceItemData {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  location: string;
}

interface EducationItemData {
  id: string;
  institution: string;
  degree: string;
  major: string;
  startDate: string;
  endDate?: string;
  isCurrentlyAttending: boolean;
  location: string;
  description?: string;
}
