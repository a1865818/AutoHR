import { PreliminaryData } from "@/interfaces";
import { ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";

interface PreliminaryQuestionsProps {
  jobData?: {
    title: string;
    company: string;
    location: string;
  };
  onBack: () => void;
  onSubmit: (data: PreliminaryData) => void;
}

const PRONOUNS_OPTIONS = [
  "He/Him",
  "She/Her",
  "They/Them",
  "Other",
  "Prefer not to say",
];

const WORKING_STATUS_OPTIONS = [
  "Full-time employee",
  "Part-time employee",
  "Contractor/Freelancer",
  "Student",
  "Unemployed",
  "Other",
];

const WORKING_RIGHTS_OPTIONS = [
  "Yes, I have the right to work",
  "No, I need visa sponsorship",
  "I have a work permit",
  "Prefer not to say",
];

const RACE_ETHNICITY_OPTIONS = [
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Native American or Alaska Native",
  "Native Hawaiian or Pacific Islander",
  "White",
  "Two or more races",
  "Other",
  "Prefer not to say",
];

const GENDER_OPTIONS = [
  "Woman",
  "Man",
  "Non-binary",
  "Transgender",
  "Other",
  "Prefer not to say",
];

export default function PreliminaryQuestionsForm({
  jobData = {
    title: "Senior Frontend Developer",
    company: "Figma",
    location: "Chicago, IL",
  },
  onBack = () => console.log("Back clicked"),
  onSubmit = (data) => console.log("Form submitted:", data),
}: PreliminaryQuestionsProps) {
  const [formData, setFormData] = useState<PreliminaryData>({
    preferredName: "",
    pronouns: "",
    workingStatus: "",
    workingRights: "",
    raceEthnicity: "",
    genderIdentity: "",
    privacyConsent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.preferredName.trim()) {
      newErrors.preferredName = "Preferred name is required";
    }

    if (!formData.pronouns) {
      newErrors.pronouns = "Please select your preferred pronouns";
    }

    if (!formData.workingStatus) {
      newErrors.workingStatus = "Please select your working status";
    }

    if (!formData.workingRights) {
      newErrors.workingRights = "Please select your working rights status";
    }

    if (!formData.privacyConsent) {
      newErrors.privacyConsent =
        "You must agree to the privacy policy to continue";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    error,
    required = false,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
    error?: string;
    required?: boolean;
  }) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
          error ? "border-red-300" : "border-gray-300"
        }`}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center py-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>

          <div className="pb-6">
            <div className="flex items-start mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg mr-4">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Apply for {jobData.title}
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  {jobData.company} • {jobData.location}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Application Progress
                </span>
                <span className="text-sm text-gray-500">Step 2 of 2</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Preliminary questions
          </h2>

          <div className="space-y-6">
            {/* Preferred Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What is your preferred first name?{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.preferredName}
                onChange={(e) =>
                  setFormData({ ...formData, preferredName: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.preferredName ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your preferred name"
              />
              {errors.preferredName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                    !
                  </span>
                  {errors.preferredName}
                </p>
              )}
            </div>

            {/* Pronouns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are your preferred Pronouns?{" "}
                <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={formData.pronouns}
                onChange={(value) =>
                  setFormData({ ...formData, pronouns: value })
                }
                options={PRONOUNS_OPTIONS}
                placeholder="Select your pronouns"
                error={errors.pronouns}
                required
              />
            </div>

            {/* Working Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What is your working status with {jobData.company}?{" "}
                <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={formData.workingStatus}
                onChange={(value) =>
                  setFormData({ ...formData, workingStatus: value })
                }
                options={WORKING_STATUS_OPTIONS}
                placeholder="Select your current working status"
                error={errors.workingStatus}
                required
              />
            </div>

            {/* Working Rights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you have working rights in the country you are applying to?{" "}
                <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={formData.workingRights}
                onChange={(value) =>
                  setFormData({ ...formData, workingRights: value })
                }
                options={WORKING_RIGHTS_OPTIONS}
                placeholder="Select your working rights status"
                error={errors.workingRights}
                required
              />
            </div>

            {/* Diversity Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                {jobData.company} aims to build and nurture a team that
                represents the diversity of the world we serve. Our vision is to
                be a Celebration of Diversity and in order to help us get there,
                we would like to know more about our candidates. These optional
                questions are intended to help us understand who applies for our
                roles so that we can continue to be intentional and thoughtful
                about our outreach. Equity and inclusion are integral to hiring.
                Your responses will be held completely confidential, they are
                not accessible to anyone involved in the hiring process and
                therefore do not feed into any considerations as you go through
                the interview process. Our DEI team will only use your responses
                in an anonymised way for the purposes of measuring inclusivity
                of our hiring process. By answering these questions, you consent
                to us using your responses for this purpose. If you choose not
                to answer these questions,
                {jobData.company} will inform the information you provide in
                this application form to assess your application, offer you any
                reasonable adjustments, and monitor the diversity of its
                applicants and job offers. To find out more about how{" "}
                {jobData.company} uses your personal data, and your data subject
                rights, see our candidate privacy policy captured below.
              </p>

              {/* Race/Ethnicity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please share your race/ethnicity:{" "}
                  <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={formData.raceEthnicity}
                  onChange={(value) =>
                    setFormData({ ...formData, raceEthnicity: value })
                  }
                  options={RACE_ETHNICITY_OPTIONS}
                  placeholder="Select your race/ethnicity"
                />
              </div>

              {/* Gender Identity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please share your gender identity:{" "}
                  <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={formData.genderIdentity}
                  onChange={(value) =>
                    setFormData({ ...formData, genderIdentity: value })
                  }
                  options={GENDER_OPTIONS}
                  placeholder="Select your gender identity"
                />
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="border-t pt-6">
              <p className="text-sm text-gray-700 mb-4">
                Please review the {jobData.company}{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Privacy Policy
                </a>
                .
              </p>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="privacy-consent"
                  checked={formData.privacyConsent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      privacyConsent: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <label
                  htmlFor="privacy-consent"
                  className="ml-3 text-sm text-gray-700"
                >
                  By checking this box, you will declare that you read and agree
                  to the privacy policy of {jobData.company}.{" "}
                  <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.privacyConsent && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                    !
                  </span>
                  {errors.privacyConsent}
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 text-purple-600 border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-8 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
            >
              Submit
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-6 pt-4 border-t text-center">
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
