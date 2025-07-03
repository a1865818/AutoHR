"use client";

import { JobFormData, JobFormErrors } from "@/interfaces";
import { jobService } from "@/services/jobService";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Eye,
  Loader2,
  MapPin,
  Save,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApplicationSettingsSection } from "./ApplicationSettingsSection";
import { BasicInfoSection } from "./BasicInfoSection";
import { CompensationSection } from "./CompensationSection";
import { JobDetailsSection } from "./JobDetailsSection";
import { JobPreviewModal } from "./JobPreviewModal";

interface JobEditPageProps {
  jobId: string;
}

export function JobEditPage({ jobId }: JobEditPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize with empty form data
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    department: "",
    description: "",
    city: "",
    country: "",
    locationType: "On-site",
    type: "",
    experience: "",
    responsibilities: [],
    requirements: [],
    qualifications: [],
    benefits: [],
    skills: [],
    salary: {
      min: undefined,
      max: undefined,
      currency: "USD",
      period: "per year",
    },
    applicationSettings: {
      deadline: "",
      questionsRequired: false,
      resumeRequired: true,
      coverLetterRequired: false,
      portfolioRequired: false,
    },
  });

  const [errors, setErrors] = useState<JobFormErrors>({});

  // Load job data on component mount
  useEffect(() => {
    loadJobData();
  }, [jobId]);

  // Auto-save functionality (disabled during initial load)
  useEffect(() => {
    if (!isLoading && formData.title.trim() && !isSaving) {
      const autoSave = setTimeout(() => {
        handleAutoSave();
      }, 3000); // Increased to 3 seconds to avoid too frequent saves

      return () => clearTimeout(autoSave);
    }
  }, [formData, isLoading, isSaving]);

  const loadJobData = async () => {
    setIsLoading(true);
    try {
      const job = await jobService.getJobById(jobId);

      // Get company data if we have a company ID
      let company;
      if (job.companyId) {
        try {
          company = await jobService.getCompanyById(job.companyId);
        } catch (error) {
          console.warn("Could not load company data:", error);
        }
      }

      // Convert API data to form data
      const convertedFormData = jobService.convertApiJobToFormData(
        job,
        company
      );
      setFormData(convertedFormData);
    } catch (error) {
      console.error("Error loading job data:", error);
      setErrors({ general: "Failed to load job data. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async () => {
    // For auto-save, we only care about having a title
    if (!formData.title.trim()) {
      console.log("⚠️ Skipping auto-save - no title");
      return;
    }

    try {
      console.log("💾 Starting auto-save...");
      const updateRequest = jobService.convertFormDataToUpdateRequest(formData);

      // Make the API call
      await jobService.updateJob(jobId, updateRequest);

      console.log("✅ Auto-save successful");
      setLastSaved(new Date());
      setSaveError(null);
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
    }
  };

  const updateFormData = (field: keyof JobFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field-specific errors when user starts typing
    if (errors[field as keyof JobFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const updateNestedFormData = (
    parentField: string,
    childField: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof JobFormData] as any),
        [childField]: value,
      },
    }));
  };

  const addListItem = (field: keyof JobFormData) => {
    const currentArray = formData[field] as string[];
    setFormData((prev) => ({
      ...prev,
      [field]: [...(currentArray || []), ""],
    }));
  };

  const updateListItem = (
    field: keyof JobFormData,
    index: number,
    value: string
  ) => {
    const currentArray = formData[field] as string[];
    setFormData((prev) => ({
      ...prev,
      [field]: currentArray.map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeListItem = (field: keyof JobFormData, index: number) => {
    const currentArray = formData[field] as string[];
    setFormData((prev) => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (isPublishing: boolean = false) => {
    const newErrors: JobFormErrors = {};

    // Only validate these fields if publishing or if they have some content
    if (isPublishing || formData.title) {
      if (
        !formData.title ||
        (typeof formData.title === "string" && !formData.title.trim())
      ) {
        newErrors.title = "Job title is required";
      }
    }

    if (isPublishing || formData.description) {
      if (
        !formData.description ||
        (typeof formData.description === "string" &&
          !formData.description.trim())
      ) {
        newErrors.description = "Job description is required";
      }
    }

    if (isPublishing || formData.city || formData.country) {
      if (!formData.city || !formData.city.trim()) {
        newErrors.city = "City is required";
      }
      if (!formData.country || !formData.country.trim()) {
        newErrors.country = "Country is required";
      }
    }

    // Always validate salary logic if both values are present
    if (
      formData.salary.min !== undefined &&
      formData.salary.max !== undefined &&
      formData.salary.min >= formData.salary.max
    ) {
      newErrors.salary = "Minimum salary must be less than maximum salary";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // For drafts, we don't need full validation, just basic check
    // Validate with showErrors=true but don't block saving
    validateForm(false);

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log("💾 Manual save started...");
      const updateRequest = jobService.convertFormDataToUpdateRequest(formData);

      await jobService.updateJob(jobId, updateRequest);

      console.log("✅ Manual save successful");
      setLastSaved(new Date());

      // Show success feedback for manual saves
      // You could add a toast notification here
    } catch (error) {
      console.error("❌ Manual save failed:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save job"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    // For publishing, we need full validation
    if (!validateForm(true)) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log("🚀 Publishing job...");
      const updateRequest = jobService.convertFormDataToUpdateRequest(formData);

      updateRequest.status = "Active";
      updateRequest.postedDate = new Date().toISOString();

      await jobService.updateJob(jobId, updateRequest);

      console.log("✅ Job published successfully");

      // Redirect to job details page
      router.push(`/jobs/${jobId}`);
    } catch (error) {
      console.error("❌ Publish failed:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to publish job"
      );
      setIsSaving(false);
    }
  };

  const sections = [
    { id: "basic", label: "Basic Information", icon: Briefcase },
    { id: "details", label: "Job Details", icon: MapPin },
    { id: "compensation", label: "Compensation", icon: DollarSign },
    { id: "application", label: "Application Settings", icon: Settings },
  ];

  const getCompletionStatus = () => {
    const required = {
      basic: formData.title && formData.description && formData.city && formData.country,
      details:
        formData.responsibilities.filter((r) => r.trim()).length > 0 &&
        formData.requirements.filter((r) => r.trim()).length > 0,
      compensation: formData.salary.currency,
      application: true, // Always considered complete since all fields are optional
    };

    const completed = Object.values(required).filter(Boolean).length;
    const total = Object.keys(required).length;

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  };

  const completionStatus = getCompletionStatus();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading job data...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a general error
  if (errors.general) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Job
            </h2>
            <p className="text-red-700 mb-4">{errors.general}</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={loadJobData}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/jobs"
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - removed sticky positioning */}
      <div className="bg-white border-b z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href={`/jobs/${jobId}`}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Edit Job: {formData.title || "Untitled Job"}
                </h1>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${completionStatus.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {completionStatus.completed}/{completionStatus.total}{" "}
                      sections complete
                    </span>
                  </div>

                  {saveError && (
                    <span className="text-xs text-red-600">⚠ {saveError}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={handlePublish}
                disabled={isSaving || completionStatus.percentage < 75}
                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                title={
                  completionStatus.percentage < 75
                    ? "Complete at least 75% to publish"
                    : ""
                }
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Publish Job
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-4 sticky top-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isCompleted =
                    section.id === "basic"
                      ? formData.title &&
                        formData.description &&
                        formData.city &&
                        formData.country
                      : section.id === "details"
                      ? formData.responsibilities.filter((r) => r.trim())
                          .length > 0 &&
                        formData.requirements.filter((r) => r.trim()).length > 0
                      : section.id === "compensation"
                      ? formData.salary.currency
                      : true;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-3" />
                        {section.label}
                      </div>
                      {isCompleted && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </nav>

              {completionStatus.percentage < 100 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-md">
                  <p className="text-xs text-amber-800">
                    Complete all sections to publish your job posting.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border">
              {activeSection === "basic" && (
                <BasicInfoSection
                  formData={formData}
                  errors={errors}
                  updateFormData={updateFormData}
                />
              )}

              {activeSection === "details" && (
                <JobDetailsSection
                  formData={formData}
                  updateFormData={updateFormData}
                  updateListItem={updateListItem}
                  addListItem={addListItem}
                  removeListItem={removeListItem}
                />
              )}

              {activeSection === "compensation" && (
                <CompensationSection
                  formData={formData}
                  errors={errors}
                  updateNestedFormData={updateNestedFormData}
                />
              )}

              {activeSection === "application" && (
                <ApplicationSettingsSection
                  formData={formData}
                  updateNestedFormData={updateNestedFormData}
                  updateFormData={(data) => {
                    Object.entries(data).forEach(([key, value]) => {
                      updateFormData(key as keyof JobFormData, value);
                    });
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <JobPreviewModal
        formData={formData}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
