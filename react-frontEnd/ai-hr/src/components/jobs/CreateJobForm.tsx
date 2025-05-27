"use client";

import { useState } from "react";
import { JobFormData, JobCreationStep } from "@/interfaces";
import { Check, ChevronRight, Sparkles, Save, Eye, Send } from "lucide-react";
import { BasicInfoStep } from "./CreateJobForm/BasicInfoStep";
import { JobDescriptionStep } from "./CreateJobForm/JobDescriptionStep";
import { RequirementsStep } from "./CreateJobForm/RequirementsStep";
import { ApplicationSettingsStep } from "./CreateJobForm/ApplicationSettingsStep";
import { PreviewStep } from "./CreateJobForm/PreviewStep";

const steps: JobCreationStep[] = [
  {
    id: 1,
    title: "Basic Information",
    description: "Job title, location, and basic details",
    completed: false,
  },
  {
    id: 2,
    title: "Job Description",
    description: "Detailed description and responsibilities",
    completed: false,
  },
  {
    id: 3,
    title: "Requirements",
    description: "Skills, qualifications, and experience",
    completed: false,
  },
  {
    id: 4,
    title: "Application Settings",
    description: "Deadline and application requirements",
    completed: false,
  },
  {
    id: 5,
    title: "Preview & Publish",
    description: "Review and publish your job posting",
    completed: false,
  },
];

const initialFormData: JobFormData = {
  title: "",
  company: "",
  location: "",
  locationType: "On-site",
  type: "Full-Time",
  department: "",
  experience: "",
  salary: {
    min: null,
    max: null,
    currency: "USD",
    period: "per year",
  },
  description: "",
  requirements: [],
  qualifications: [],
  responsibilities: [],
  benefits: [],
  skills: [],
  applicationSettings: {
    deadline: "",
    questionsRequired: false,
    resumeRequired: true,
    coverLetterRequired: false,
    portfolioRequired: false,
  },
  urgency: null,
};

export function CreateJobForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateFormData = (newData: Partial<JobFormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const markStepCompleted = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps((prev) => [...prev, stepId]);
    }
  };

  const nextStep = () => {
    markStepCompleted(currentStep);
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true);
    // Simulate AI generation - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const generatedDescription = `We are seeking a talented ${
      formData.title
    } to join our ${
      formData.department
    } team. In this ${formData.type.toLowerCase()} position, you will play a crucial role in driving our company's success through innovative solutions and collaborative teamwork.

Key Responsibilities:
• Lead and execute strategic initiatives aligned with business objectives
• Collaborate with cross-functional teams to deliver high-quality results
• Mentor junior team members and contribute to their professional development
• Stay current with industry trends and best practices
• Participate in project planning and execution phases

We offer a dynamic work environment where creativity and innovation are valued, along with opportunities for professional growth and development.`;

    updateFormData({ description: generatedDescription });
    setIsGeneratingDescription(false);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message
  };

  const handlePublish = async () => {
    // Handle job publishing
    console.log("Publishing job:", formData);
  };

  const isStepValid = (stepId: number): boolean => {
    switch (stepId) {
      case 1:
        return !!(
          formData.title &&
          formData.company &&
          formData.location &&
          formData.department
        );
      case 2:
        return !!(formData.description && formData.responsibilities.length > 0);
      case 3:
        return !!(
          formData.requirements.length > 0 && formData.qualifications.length > 0
        );
      case 4:
        return !!formData.applicationSettings.deadline;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <JobDescriptionStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
            onGenerateDescription={handleGenerateDescription}
            isGenerating={isGeneratingDescription}
          />
        );
      case 3:
        return (
          <RequirementsStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <ApplicationSettingsStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <PreviewStep
            formData={formData}
            onPrev={prevStep}
            onPublish={handlePublish}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Progress Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer transition-colors ${
                    completedSteps.includes(step.id)
                      ? "bg-green-500 border-green-500 text-white"
                      : currentStep === step.id
                      ? "border-indigo-500 text-indigo-500 bg-indigo-50"
                      : "border-gray-300 text-gray-400"
                  }`}
                  onClick={() => goToStep(step.id)}
                >
                  {completedSteps.includes(step.id) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="mx-2 w-4 h-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>

        {/* Step Info */}
        <div className="mt-4">
          <h2 className="text-lg font-medium text-gray-900">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-sm text-gray-600">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 py-6">{renderStepContent()}</div>
    </div>
  );
}
