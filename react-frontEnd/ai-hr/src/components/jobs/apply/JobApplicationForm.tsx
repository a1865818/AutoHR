"use client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ApplicationData,
  Education,
  Experience,
  PersonalInfoAppliedForm,
  PreliminaryData,
  SocialProfiles,
} from "@/interfaces";
import { applicationService } from "@/services/applyService";
import { jobService } from "@/services/jobService";
import { apiService } from "@/services/api";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { CoverLetterForm } from "./CoverLetterForm";
import { EasyApplySection } from "./EasyApplySection";
import { EducationSection } from "./EducationSection";
import { ExperienceSection } from "./ExperienceSection";
import { FileUpload } from "./FileUpload";
import { PersonalInfoForm } from "./PersonalInfoForm";
import PreliminaryQuestionsForm from "./PreliminaryQuestionsForm";
import { SocialProfilesForm } from "./SocialProfilesForm";
import ResumeSelector from "@/components/resume/ResumeSelector";
import { Resume } from "@/services/resumeService";

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  department: string;
  applicants: number;
  postedDate: string;
  status: string;
}

interface JobApplicationFormProps {
  jobId?: string;
  jobData?: JobData;
}

export default function JobApplicationForm({
  jobId,
  jobData,
}: JobApplicationFormProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false);
  const [isProfileDataLoaded, setIsProfileDataLoaded] = useState(false);

  // Success state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Track application step
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // File upload states
  const [applicationMethod, setApplicationMethod] = useState<
    "upload" | "manual"
  >("manual");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Resume selection states
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string>("");
  const [selectedResumeName, setSelectedResumeName] = useState<string>("");

  // Form data states
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoAppliedForm>({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    city: "",
    country: "",
    phoneNumber: "",
    countryCode: "+1",
  });

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [profiles, setProfiles] = useState<SocialProfiles>({
    linkedin: "",
    facebook: "",
    twitter: "",
    website: "",
  });
  const [coverLetter, setCoverLetter] = useState("");

  // Preliminary questions state
  const [preliminaryData, setPreliminaryData] = useState<PreliminaryData>({
    preferredName: "",
    pronouns: "",
    workingStatus: "",
    workingRights: "",
    raceEthnicity: "",
    genderIdentity: "",
    privacyConsent: false,
  });

  // Show forms states
  const [showExperienceForm, setShowExperienceForm] = useState(true);
  const [showEducationForm, setShowEducationForm] = useState(true);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(
    null
  );
  const [editingEducation, setEditingEducation] = useState<Education | null>(
    null
  );

  // Real job data state
  const [job, setJob] = useState<JobData | null>(jobData || null);

  // Pre-fill personal info from authenticated user
  useEffect(() => {
    if (user && personalInfo.firstName === "" && personalInfo.lastName === "") {
      console.log("🔄 Pre-filling personal info from user data:", user);
      setPersonalInfo((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        confirmEmail: user.email || "",
      }));
    }
  }, [user, personalInfo.firstName, personalInfo.lastName]);

  // Save location when city or country changes
  useEffect(() => {
    if (isProfileDataLoaded && personalInfo.city && personalInfo.country) {
      const timeoutId = setTimeout(() => {
        saveProfileToBackend(undefined, undefined, undefined, undefined, {
          city: personalInfo.city,
          country: personalInfo.country,
        });
      }, 500); // Debounce for 0.5 second

      return () => clearTimeout(timeoutId);
    }
  }, [personalInfo.city, personalInfo.country, isProfileDataLoaded]);

  // Load user's existing education and experience data
  useEffect(() => {
    const loadUserProfileData = async () => {
      console.log("🚀 loadUserProfileData useEffect triggered", {
        user: user ? { id: user.id, userCategory: user.userCategory } : null,
        isAuthenticated,
      });

      if (
        !user ||
        !isAuthenticated ||
        user.userCategory !== "ApplicationUser"
      ) {
        console.log("❌ Skipping profile data load - requirements not met");
        return;
      }

      try {
        console.log("🔄 Loading user profile data...");
        const userData = await apiService.getCurrentApplicationUser();
        console.log("📥 Received user data:", userData);

        // Pre-fill education data if it exists
        if (
          userData.Education &&
          Array.isArray(userData.Education) &&
          userData.Education.length > 0
        ) {
          console.log("✅ Found existing education data:", userData.Education);
          const transformedEducation = userData.Education.map(
            (edu: any, index: number) => ({
              id: `loaded-edu-${index}-${Date.now()}`, // Generate new ID for frontend use only
              institution: edu.institution || "",
              major: edu.major || "",
              degree: edu.degree || "",
              location: edu.location || "",
              description: edu.description || "",
              startDate: edu.startDate || "",
              endDate: edu.endDate || "",
              isCurrentlyAttending: edu.isCurrentlyAttending || false,
            })
          );
          console.log("📚 Setting education state:", transformedEducation);
          setEducation(transformedEducation);
        } else {
          console.log(
            "❌ No education data found. userData.Education:",
            userData.Education
          );
        }

        // Pre-fill experience data if it exists (check both Experiences and Experience fields)
        const experienceData = userData.Experiences || userData.Experience;
        if (
          experienceData &&
          Array.isArray(experienceData) &&
          experienceData.length > 0
        ) {
          console.log("✅ Found existing experience data:", experienceData);
          const transformedExperience = experienceData.map(
            (exp: any, index: number) => ({
              id: `loaded-exp-${index}-${Date.now()}`, // Generate new ID for frontend use only
              title: exp.title || "",
              company: exp.company || "",
              location: exp.location || "",
              description: exp.description || "",
              startDate: exp.startDate || "",
              endDate: exp.endDate || "",
              isCurrent: exp.isCurrent || false,
            })
          );
          console.log("💼 Setting experiences state:", transformedExperience);
          setExperiences(transformedExperience);
        } else {
          console.log(
            "❌ No experience data found. userData.Experiences:",
            userData.Experiences,
            "userData.Experience:",
            userData.Experience
          );
        }

        // Pre-fill phone number if it exists
        if (userData.PhoneNumber) {
          console.log("✅ Found existing phone number:", userData.PhoneNumber);
          setPersonalInfo((prev) => {
            console.log("📞 Setting phone in personal info:", prev, "->", {
              ...prev,
              phoneNumber: userData.PhoneNumber,
            });
            return {
              ...prev,
              phoneNumber: userData.PhoneNumber || "",
            };
          });
        } else {
          console.log(
            "❌ No phone number found. userData.PhoneNumber:",
            userData.PhoneNumber
          );
        }

        // Pre-fill social links if they exist
        if (userData.SocialLink && typeof userData.SocialLink === "object") {
          console.log("✅ Found existing social links:", userData.SocialLink);
          setProfiles((prev) => {
            const newProfiles = {
              ...prev,
              linkedin: userData.SocialLink.linkedin || "",
              facebook: userData.SocialLink.facebook || "",
              twitter: userData.SocialLink.twitter || "",
              website: userData.SocialLink.website || "",
            };
            console.log("🔗 Setting social profiles:", prev, "->", newProfiles);
            return newProfiles;
          });
        }

        console.log("✅ User profile data loaded successfully");
        setIsProfileDataLoaded(true);
      } catch (error) {
        console.warn("⚠️ Failed to load user profile data:", error);
        // Don't show error to user, just use empty forms
        setIsProfileDataLoaded(true); // Set as loaded even on error to prevent blocking the form
      }
    };

    loadUserProfileData();
  }, [user, isAuthenticated]);

  // Save profile data when social profiles change
  useEffect(() => {
    if (!isAuthenticated || !user || user.userCategory !== "ApplicationUser") {
      return;
    }

    // Don't save on initial load (when profiles are empty or just loaded)
    if (
      profiles.linkedin === "" &&
      profiles.facebook === "" &&
      profiles.twitter === "" &&
      profiles.website === ""
    ) {
      return;
    }

    // Add a small delay to avoid too many API calls
    const saveTimeout = setTimeout(() => {
      saveProfileToBackend(undefined, undefined, profiles);
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [profiles]);

  // Save profile data when phone number changes
  useEffect(() => {
    if (!isAuthenticated || !user || user.userCategory !== "ApplicationUser") {
      return;
    }

    // Don't save on initial load (when phone number is empty or just loaded)
    if (!personalInfo.phoneNumber || personalInfo.phoneNumber === "") {
      return;
    }

    // Add a small delay to avoid too many API calls
    const saveTimeout = setTimeout(() => {
      saveProfileToBackend(
        undefined,
        undefined,
        undefined,
        personalInfo.phoneNumber
      );
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [personalInfo.phoneNumber]);

  // Check authentication and load job data
  useEffect(() => {
    console.log("🔄 JobApplicationForm mounted");
    console.log("🔑 Auth state:", {
      isAuthenticated,
      authLoading,
      user: user ? { id: user.id, userCategory: user.userCategory } : null,
    });

    if (authLoading) {
      console.log("⏳ Waiting for auth to load...");
      return;
    }

    if (!isAuthenticated) {
      console.log("❌ User not authenticated, redirecting to login");
      router.push(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    if (user?.userCategory !== "ApplicationUser") {
      console.log("❌ Wrong user type:", user?.userCategory);
      setError(
        "Only application users can apply for jobs. Please log in with an application user account."
      );
      setIsLoading(false);
      return;
    }

    console.log("✅ User authenticated as ApplicationUser, loading job data");
    loadJobAndCheckApplication();
  }, [isAuthenticated, authLoading, user, router]);

  // Load job data and check if user has already applied
  const loadJobAndCheckApplication = async () => {
    if (!jobId) {
      setJob(jobData || null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("📊 Loading job data for ID:", jobId);

      // Load job data if not provided
      if (!job) {
        console.log("🔄 Fetching job data from backend...");
        const jobResponse = await jobService.getJobById(jobId);
        console.log("✅ Job data loaded:", jobResponse);

        // Get company data
        console.log("🔄 Fetching company data...");
        const company = await jobService.getCompanyById(jobResponse.companyId);
        console.log("✅ Company data loaded:", company);

        // Transform to JobData format
        const transformedJob: JobData = {
          id: jobResponse.id,
          title: jobResponse.title,
          company: company.name,
          location:
            typeof jobResponse.locations === "object"
              ? `${jobResponse.locations.city || ""}, ${
                  jobResponse.locations.state || ""
                }`.trim()
              : "Location not specified",
          type: jobResponse.employmentType,
          experience: `${jobResponse.experienceYearsMin || 0}+ years`,
          salary: {
            min: jobResponse.salaryMin || 0,
            max: jobResponse.salaryMax || 0,
            currency: jobResponse.salaryCurrency || "USD",
            period: "per year",
          },
          department: company.industry || "Not specified",
          applicants: jobResponse.applicantCount || 0,
          postedDate: jobResponse.postedDate || jobResponse.createdAt,
          status: jobResponse.status,
        };

        console.log("✅ Job transformed:", transformedJob);
        setJob(transformedJob);
      }

      // Make sure user is authenticated before proceeding
      if (!isAuthenticated || !user) {
        console.log(
          "❌ User not authenticated, skipping profile and application checks"
        );
        setIsLoading(false);
        return;
      }

      // Check if user has already applied
      console.log("🔍 Checking if user has already applied...");
      const hasApplied = await applicationService.hasAppliedToJob(jobId);
      console.log(
        "📝 Application status:",
        hasApplied ? "Already applied" : "Not applied yet"
      );
      setHasAlreadyApplied(hasApplied);

      // First, load user profile data from the database to ensure auto-fill
      console.log("🔄 Loading user profile data for auto-fill...");
      try {
        // Use AuthContext's authentication state instead of manually checking tokens
        // The AuthContext already handles cookies and session persistence
        console.log(
          "✅ Using AuthContext authentication state for profile data"
        );
        const userData = await apiService.getCurrentApplicationUser();
        console.log("📥 Received user data for auto-fill:", userData);

        // Log all possible field names for debugging
        console.log("🔍 Available fields in userData:", Object.keys(userData));

        // Pre-fill education data if it exists - check all possible field names
        const educationData = userData.education;
        console.log("🎓 Found education data:", educationData);

        if (
          educationData &&
          (Array.isArray(educationData) || typeof educationData === "object")
        ) {
          // Handle both array and single object cases
          const educationArray = Array.isArray(educationData)
            ? educationData
            : [educationData];

          if (educationArray.length > 0) {
            console.log("✅ Auto-filling education data:", educationArray);
            const transformedEducation = educationArray.map(
              (edu: any, index: number) => ({
                id: `loaded-edu-${index}-${Date.now()}`, // Generate new ID for frontend use only
                institution: edu.institution || "",
                major: edu.major || "",
                degree: edu.degree || "",
                location: edu.location || "",
                description: edu.description || "",
                startDate: edu.startDate || "",
                endDate: edu.endDate || "",
                isCurrentlyAttending: edu.isCurrentlyAttending || false,
              })
            );
            console.log(
              "📚 Setting education state with:",
              transformedEducation
            );
            setEducation(transformedEducation);
          }
        }

        // Pre-fill experience data if it exists - check all possible field names
        const experienceData = userData.experiences;
        console.log("💼 Found experience data:", experienceData);

        if (
          experienceData &&
          (Array.isArray(experienceData) || typeof experienceData === "object")
        ) {
          // Handle both array and single object cases
          const experienceArray = Array.isArray(experienceData)
            ? experienceData
            : [experienceData];

          if (experienceArray.length > 0) {
            console.log("✅ Auto-filling experience data:", experienceArray);
            const transformedExperience = experienceArray.map(
              (exp: any, index: number) => ({
                id: `loaded-exp-${index}-${Date.now()}`, // Generate new ID for frontend use only
                title: exp.title || "",
                company: exp.company || "",
                location: exp.location || "",
                description: exp.description || "",
                startDate: exp.startDate || "",
                endDate: exp.endDate || "",
                isCurrent: exp.isCurrent || false,
              })
            );
            console.log(
              "💼 Setting experiences state with:",
              transformedExperience
            );
            setExperiences(transformedExperience);
          }
        }

        // Pre-fill phone number if it exists - check all possible field names
        const phoneNumber = userData.phoneNumber;
        console.log("📞 Found phone number:", phoneNumber);

        if (phoneNumber) {
          console.log("✅ Auto-filling phone number:", phoneNumber);
          setPersonalInfo((prev) => ({
            ...prev,
            phoneNumber: phoneNumber,
          }));
        } else {
          console.log("❌ No phone number found in user data");
        }

        // Pre-fill social links if they exist - check all possible field names
        const socialLinks =
          userData.SocialLink ||
          userData.socialLink ||
          userData.socialLinks ||
          userData.social_links;
        console.log("🔗 Found social links:", socialLinks);

        if (socialLinks && typeof socialLinks === "object") {
          console.log("✅ Auto-filling social links:", socialLinks);
          setProfiles((prev) => ({
            ...prev,
            linkedin: socialLinks.linkedin || socialLinks.Linkedin || "",
            facebook: socialLinks.facebook || socialLinks.Facebook || "",
            twitter: socialLinks.twitter || socialLinks.Twitter || "",
            website: socialLinks.website || socialLinks.Website || "",
          }));
        }

        console.log("✅ Auto-fill from user profile completed");

        // Store references to the data for verification
        const finalEducationData = educationData;
        const finalExperienceData = experienceData;

        // Verify that the data was properly loaded into state
        setTimeout(() => {
          console.log("🔍 Verification - Current state after auto-fill:");
          console.log("📚 Education:", education.length, "items");
          console.log("💼 Experiences:", experiences.length, "items");
          console.log("📞 Phone number:", personalInfo.phoneNumber);
          console.log("🔗 Social profiles:", profiles);

          // If data wasn't loaded properly, try one more time
          if (
            education.length === 0 &&
            finalEducationData &&
            (Array.isArray(finalEducationData)
              ? finalEducationData.length > 0
              : true)
          ) {
            console.log(
              "⚠️ Education data wasn't loaded properly, trying again..."
            );
            const educationArray = Array.isArray(finalEducationData)
              ? finalEducationData
              : [finalEducationData];
            const transformedEducation = educationArray.map(
              (edu: any, index: number) => ({
                id: `retry-edu-${index}-${Date.now()}`,
                institution: edu.institution || "",
                major: edu.major || "",
                degree: edu.degree || "",
                location: edu.location || "",
                description: edu.description || "",
                startDate: edu.startDate || "",
                endDate: edu.endDate || "",
                isCurrentlyAttending: edu.isCurrentlyAttending || false,
              })
            );
            setEducation(transformedEducation);
          }

          if (
            experiences.length === 0 &&
            finalExperienceData &&
            (Array.isArray(finalExperienceData)
              ? finalExperienceData.length > 0
              : true)
          ) {
            console.log(
              "⚠️ Experience data wasn't loaded properly, trying again..."
            );
            const experienceArray = Array.isArray(finalExperienceData)
              ? finalExperienceData
              : [finalExperienceData];
            const transformedExperience = experienceArray.map(
              (exp: any, index: number) => ({
                id: `retry-exp-${index}-${Date.now()}`,
                title: exp.title || "",
                company: exp.company || "",
                location: exp.location || "",
                description: exp.description || "",
                startDate: exp.startDate || "",
                endDate: exp.endDate || "",
                isCurrent: exp.isCurrent || false,
              })
            );
            setExperiences(transformedExperience);
          }
        }, 500);
      } catch (error) {
        console.warn(
          "⚠️ Failed to load user profile data for auto-fill:",
          error
        );

        // Handle 401 Unauthorized errors - user might need to log in again
        if (error instanceof Error && error.message.includes("401")) {
          console.log("🔄 Auth token expired, redirecting to login...");

          // Clear auth data
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("refreshToken");

          // Set error message for user
          setError("Your session has expired. Please log in again.");

          // Redirect to login after a short delay
          setTimeout(() => {
            router.push(
              `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
            );
          }, 2000);
        }
      }

      // Then, load saved draft if exists (but only for job-specific fields)
      console.log("💾 Loading saved draft for job-specific fields...");
      const draft = await applicationService.getApplicationDraft(jobId);
      if (draft) {
        console.log("✅ Draft found, loading job-specific fields");

        // Only load cover letter from draft as it's job-specific
        if (draft.coverLetter) {
          console.log("📝 Loading cover letter from draft");
          setCoverLetter(draft.coverLetter);
        }

        // Load application method if it exists
        if (draft.method) {
          console.log("📝 Loading application method from draft");
          setApplicationMethod(draft.method);
        }

        console.log("✅ Job-specific draft data loaded");
      } else {
        console.log("ℹ️ No draft found");
      }
    } catch (error) {
      console.error("❌ Error loading job or checking application:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load job data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save draft periodically
  useEffect(() => {
    if (!jobId || isLoading || hasAlreadyApplied || !isAuthenticated) return;

    const autoSave = setTimeout(() => {
      saveDraft();
    }, 10000); // Save every 30 seconds

    return () => clearTimeout(autoSave);
  }, [
    personalInfo,
    experiences,
    education,
    profiles,
    coverLetter,
    jobId,
    isLoading,
    hasAlreadyApplied,
    isAuthenticated,
  ]);

  const saveDraft = async () => {
    if (!jobId || isSaving || !isAuthenticated) return;

    try {
      setIsSaving(true);
      const applicationData: Partial<ApplicationData> = {
        personalInfo,
        experiences,
        education,
        profiles,
        coverLetter,
        method: applicationMethod,
      };

      await applicationService.saveApplicationDraft(jobId, applicationData);
      console.log("💾 Draft saved successfully");
    } catch (error) {
      console.warn("Failed to save draft:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save profile data to backend
  const saveProfileToBackend = async (
    updatedEducation?: Education[],
    updatedExperiences?: Experience[],
    updatedProfiles?: SocialProfiles,
    updatedPhoneNumber?: string,
    updatedLocation?: { city: string; country: string }
  ) => {
    if (!isAuthenticated || !user || user.userCategory !== "ApplicationUser") {
      return;
    }

    // Don't save if profile data is still loading
    if (!isProfileDataLoaded) {
      console.log("⏳ Profile data still loading, skipping save");
      return;
    }

    try {
      console.log("💾 Saving profile data to backend...");

      // Always use the most current data - either provided updates or current state
      const educationToSave =
        updatedEducation !== undefined ? updatedEducation : education;
      const experiencesToSave =
        updatedExperiences !== undefined ? updatedExperiences : experiences;
      const profilesToSave =
        updatedProfiles !== undefined ? updatedProfiles : profiles;
      const phoneToSave =
        updatedPhoneNumber !== undefined
          ? updatedPhoneNumber
          : personalInfo.phoneNumber;
      const locationToSave =
        updatedLocation !== undefined
          ? updatedLocation
          : { city: personalInfo.city, country: personalInfo.country };

      console.log("📊 Education to save:", educationToSave);
      console.log("📊 Experiences to save:", experiencesToSave);
      console.log("📊 Social profiles to save:", profilesToSave);
      console.log("📊 Phone number to save:", phoneToSave);
      console.log("📊 Location to save:", locationToSave);

      // Transform data to backend format - always send complete data
      const profileData = {
        Education: educationToSave.map((edu) => ({
          institution: edu.institution,
          major: edu.major,
          degree: edu.degree,
          location: edu.location,
          description: edu.description,
          startDate: edu.startDate,
          endDate: edu.endDate,
          isCurrentlyAttending: edu.isCurrentlyAttending,
        })),
        Experience: experiencesToSave.map((exp) => ({
          title: exp.title,
          company: exp.company,
          location: exp.location,
          description: exp.description,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: exp.isCurrent,
        })),
        SocialLink: {
          linkedin: profilesToSave.linkedin || "",
          facebook: profilesToSave.facebook || "",
          twitter: profilesToSave.twitter || "",
          website: profilesToSave.website || "",
        },
        PhoneNumber: phoneToSave || "",
        Location: {
          city: locationToSave.city || "",
          country: locationToSave.country || "",
        },
      };

      console.log("📤 Sending profile data:", profileData);
      await apiService.updateApplicationUserProfile(profileData);
      console.log("✅ Profile data saved to backend successfully");

      // Log the final counts for verification
      console.log(
        `✅ Saved: ${profileData.Education?.length || 0} education items, ${
          profileData.Experience?.length || 0
        } experience items`
      );
    } catch (error) {
      console.warn("⚠️ Failed to save profile data to backend:", error);
      // Don't show error to user - this is background saving
    }
  };

  // Rest of your component methods remain the same...
  const handleAutoFillUpload = async (file: File) => {
    setUploadedFile(file);
    setResumeFile(file);

    if (applicationMethod === "upload") {
      console.log(
        "Auto-fill feature will be implemented when backend AI parsing is ready"
      );
      setError(
        "Auto-fill from resume will be available soon. Please fill the form manually for now."
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleResumeUpload = async (file: File) => {
    setResumeFile(file);
    console.log("Resume file selected:", file.name);
  };

  // Resume selection handlers
  const handleResumeSelect = (resumeUrl: string, resumeName: string) => {
    setSelectedResumeUrl(resumeUrl);
    setSelectedResumeName(resumeName);
    console.log("Resume selected:", resumeName, resumeUrl);
  };

  const handleResumeUploadFromSelector = (resume: Resume) => {
    setSelectedResumeUrl(resume.url);
    setSelectedResumeName(resume.originalName);
    console.log("New resume uploaded:", resume.originalName, resume.url);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Experience handlers
  const addExperience = async (experience: Omit<Experience, "id">) => {
    const newExperience = { ...experience, id: Date.now().toString() };
    const updatedExperiences = [...experiences, newExperience];
    setExperiences(updatedExperiences);
    setShowExperienceForm(false);

    console.log("💼 Experience added, saving to backend:", newExperience);
    // Save to backend in the background with the updated data
    setTimeout(() => saveProfileToBackend(undefined, updatedExperiences), 500);
  };

  const updateExperience = async (experience: Experience) => {
    const updatedExperiences = experiences.map((exp) =>
      exp.id === experience.id ? experience : exp
    );
    setExperiences(updatedExperiences);
    setEditingExperience(null);
    setShowExperienceForm(false);

    console.log("💼 Experience updated, saving to backend:", experience);
    // Save to backend in the background with the updated data
    setTimeout(() => saveProfileToBackend(undefined, updatedExperiences), 500);
  };

  const removeExperience = async (id: string) => {
    const updatedExperiences = experiences.filter((exp) => exp.id !== id);
    setExperiences(updatedExperiences);

    console.log(
      "💼 Experience removed, saving to backend. Remaining:",
      updatedExperiences.length
    );
    // Save to backend in the background with the updated data
    setTimeout(() => saveProfileToBackend(undefined, updatedExperiences), 500);
  };

  // Education handlers
  const addEducation = async (educationItem: Omit<Education, "id">) => {
    const newEducation = { ...educationItem, id: Date.now().toString() };
    const updatedEducation = [...education, newEducation];
    setEducation(updatedEducation);
    setShowEducationForm(false);

    console.log("📚 Education added, saving to backend:", newEducation);
    // Save to backend in the background with the updated data
    setTimeout(() => saveProfileToBackend(updatedEducation), 500);
  };

  const updateEducation = async (educationItem: Education) => {
    const updatedEducation = education.map((edu) =>
      edu.id === educationItem.id ? educationItem : edu
    );
    setEducation(updatedEducation);
    setEditingEducation(null);
    setShowEducationForm(false);

    console.log("📚 Education updated, saving to backend:", educationItem);
    // Save to backend in the background with the updated data
    setTimeout(() => saveProfileToBackend(updatedEducation), 500);
  };

  const removeEducation = async (id: string) => {
    const updatedEducation = education.filter((edu) => edu.id !== id);
    setEducation(updatedEducation);

    console.log(
      "📚 Education removed, saving to backend. Remaining:",
      updatedEducation.length
    );
    // Save to backend in the background with the updated data
    setTimeout(() => saveProfileToBackend(updatedEducation), 500);
  };

  // Step navigation
  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // Form validation
  const validateFirstStep = (): string | null => {
    if (!personalInfo.firstName.trim()) return "First name is required";
    if (!personalInfo.lastName.trim()) return "Last name is required";
    if (!personalInfo.email.trim()) return "Email is required";
    if (personalInfo.email !== personalInfo.confirmEmail)
      return "Emails do not match";
    if (!personalInfo.phoneNumber.trim()) return "Phone number is required";
    if (!personalInfo.city.trim()) return "City is required";
    if (!personalInfo.country.trim()) return "Country is required";

    if (applicationMethod === "manual" && !selectedResumeUrl && !resumeFile) {
      return "Resume is required";
    }

    return null;
  };

  // Handle first step submission
  const handleSubmitFirstStep = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateFirstStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    // Save current progress
    await saveDraft();

    handleNextStep();
  };

  // Handle final submission
  const handlePreliminarySubmit = async (data: PreliminaryData) => {
    if (!jobId || !job) {
      setError("Job information is missing");
      return;
    }

    if (!isAuthenticated || !user) {
      setError("Please log in to submit your application");
      return;
    }

    setPreliminaryData(data);
    setIsSubmitting(true);
    setError(null);

    try {
      const applicationData: ApplicationData = {
        method: applicationMethod,
        personalInfo,
        experiences,
        education,
        profiles,
        coverLetter,
        files: {
          uploadedFile,
          resumeFile,
        },
        profileImage,
        // Include resume selection data
        selectedResumeUrl,
        selectedResumeName,
      };

      console.log("🚀 Submitting application...");
      const response = await applicationService.submitApplication(
        jobId,
        applicationData,
        data
      );

      console.log("✅ Application submitted successfully:", response);

      // Success!
      setApplicationId(response.applicationId);
      setIsSubmitted(true);

      // Clear draft since application was submitted
      if (typeof window !== "undefined") {
        localStorage.removeItem(`application_draft_${jobId}_${user.id}`);
      }

      // Redirect to success page after a delay
      setTimeout(() => {
        router.push(
          `/applicant/jobs/${jobId}/application-success?applicationId=${response.applicationId}`
        );
      }, 100);
    } catch (error) {
      console.error("❌ Application submission failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to submit application"
      );
      setIsSubmitting(false);
    }
  };

  // Format salary display
  const formatSalary = (salary: JobData["salary"]) => {
    if (!salary.min && !salary.max) return "Salary not specified";

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(
        salary.max
      )} ${salary.period}`;
    } else if (salary.min) {
      return `${formatter.format(salary.min)}+ ${salary.period}`;
    } else if (salary.max) {
      return `Up to ${formatter.format(salary.max)} ${salary.period}`;
    }

    return "Salary not specified";
  };

  // Calculate days ago
  const getDaysAgo = (dateString: string) => {
    const posted = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "full-time":
        return "bg-[#066046]/15 text-[#066046] border border-[#066046]/20";
      case "part-time":
        return "bg-[#066046]/15 text-[#066046] border border-[#066046]/20";
      case "contract":
        return "bg-[#066046]/15 text-[#066046] border border-[#066046]/20";
      case "internship":
        return "bg-[#066046]/15 text-[#066046] border border-[#066046]/20";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Loading state - show while auth is loading or job data is loading
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {authLoading
              ? "Checking authentication..."
              : "Loading job details..."}
          </p>
        </div>
      </div>
    );
  }

  // Authentication required state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-yellow-700 mb-4">
              Please log in with an application user account to apply for jobs.
            </p>
            <div className="space-y-2">
              <Link
                href={`/login?returnUrl=${encodeURIComponent(
                  window.location.pathname
                )}`}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </Link>
              <Link
                href="/jobs"
                className="block w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wrong user type state
  if (user?.userCategory !== "ApplicationUser") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Wrong Account Type
            </h2>
            <p className="text-red-700 mb-4">
              Only application users can apply for jobs. You are currently
              logged in as a {user?.userCategory} user.
            </p>
            <div className="space-y-2">
              <Link
                href="/login?userType=application"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Login as Application User
              </Link>
              <Link
                href="/jobs"
                className="block w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!job && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Job
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={loadJobAndCheckApplication}
                className="block w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/jobs"
                className="block w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Job not found state
  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Job Not Found
            </h2>
            <p className="text-red-700 mb-4">
              The job you are trying to apply for could not be found.
            </p>
            <Link
              href="/jobs"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already applied state
  if (hasAlreadyApplied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <CheckCircle className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              Already Applied
            </h2>
            <p className="text-yellow-700 mb-4">
              You have already submitted an application for this position.
            </p>
            <div className="space-y-2">
              <Link
                href={`/applicant/jobs/${jobId}`}
                className="block w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                View Job Details
              </Link>
              <Link
                href="/applicant/applications"
                className="block w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                View My Applications
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Application Submitted!
            </h2>
            <p className="text-green-700 mb-4">
              Your application for <strong>{job.title}</strong> at{" "}
              <strong>{job.company}</strong> has been successfully submitted.
            </p>
            {applicationId && (
              <p className="text-sm text-green-600 mb-4">
                Application ID: {applicationId}
              </p>
            )}
            <div className="space-y-2">
              <Link
                href={`/jobs/${jobId}`}
                className="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                View Job Details
              </Link>
              <Link
                href="/jobs"
                className="block w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Browse More Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          {/* Navigation */}
          <div className="flex items-center py-4">
            {currentStep === 1 ? (
              <Link
                href={`/jobs/${job.id}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Back to Job Details</span>
              </Link>
            ) : (
              <button
                onClick={handlePrevStep}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  Back to Application Form
                </span>
              </button>
            )}
          </div>

          {/* Job Header */}
          <div className="pb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg mr-4">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      Apply for {job.title}
                    </h1>
                    <p className="text-lg text-gray-600 font-medium">
                      {job.company}
                    </p>
                  </div>
                </div>

                {/* User Info Display */}
                {user && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Applying as: <strong>{user.name}</strong> ({user.email})
                    </p>
                  </div>
                )}

                {/* Job Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{job.experience}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatSalary(job.salary)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Posted {getDaysAgo(job.postedDate)}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-3 mt-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                      job.type
                    )}`}
                  >
                    {job.type}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {job.department}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {job.applicants} applicants
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-gray-700">
                    Featured Job
                  </span>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {job.status}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Application Progress
                </span>
                <span className="text-sm text-gray-500">
                  Step {currentStep} of 2
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentStep * 50}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 text-sm underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {currentStep === 1 ? (
          <form onSubmit={handleSubmitFirstStep} className="space-y-8">
            {/* Easy Apply Section */}
            <EasyApplySection
              applicationMethod={applicationMethod}
              setApplicationMethod={setApplicationMethod}
              uploadedFile={uploadedFile}
              onFileUpload={handleAutoFillUpload}
            />

            {/* Personal Information */}
            <PersonalInfoForm
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              profileImage={profileImage}
              onImageUpload={handleImageUpload}
            />

            {/* Experience Section */}
            <ExperienceSection
              experiences={experiences}
              showExperienceForm={showExperienceForm}
              editingExperience={editingExperience}
              setShowExperienceForm={setShowExperienceForm}
              setEditingExperience={setEditingExperience}
              addExperience={addExperience}
              updateExperience={updateExperience}
              removeExperience={removeExperience}
            />

            {/* Education Section */}
            <EducationSection
              education={education}
              showEducationForm={showEducationForm}
              editingEducation={editingEducation}
              setShowEducationForm={setShowEducationForm}
              setEditingEducation={setEditingEducation}
              addEducation={addEducation}
              updateEducation={updateEducation}
              removeEducation={removeEducation}
            />

            {/* Social Profiles */}
            <SocialProfilesForm profiles={profiles} setProfiles={setProfiles} />

            {/* Resume Selection (for manual method) */}
            {applicationMethod === "manual" && (
              <ResumeSelector
                selectedResumeUrl={selectedResumeUrl || ""}
                onResumeSelect={handleResumeSelect}
                onResumeUpload={handleResumeUploadFromSelector}
                required={true}
              />
            )}

            {/* Cover Letter */}
            <CoverLetterForm
              coverLetter={coverLetter}
              setCoverLetter={setCoverLetter}
            />

            {/* Submit Button */}
            <div className="flex justify-between space-x-4">
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSaving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Draft"
                )}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          <PreliminaryQuestionsForm
            jobData={{
              title: job.title,
              company: job.company,
              location: job.location,
            }}
            onBack={handlePrevStep}
            onSubmit={handlePreliminarySubmit}
          />
        )}

        {/* Submitting Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Submitting Application
                </h3>
                <p className="text-gray-600">
                  Please wait while we process your application...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
