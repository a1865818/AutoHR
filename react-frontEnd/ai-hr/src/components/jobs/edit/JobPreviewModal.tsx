// components/jobs/edit/JobPreviewModal.tsx
import { JobFormData } from "@/interfaces";
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  X,
} from "lucide-react";

interface JobPreviewModalProps {
  formData: JobFormData;
  isOpen: boolean;
  onClose: () => void;
}

export function JobPreviewModal({
  formData,
  isOpen,
  onClose,
}: JobPreviewModalProps) {
  if (!isOpen) return null;

  const formatSalary = () => {
    const { min, max, currency, period } = formData.salary;
    if (!min && !max) return "Salary not specified";

    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${currency} ${max.toLocaleString()}${
        period ? ` ${period}` : ""
      }`;
    } else if (min) {
      return `${currency} ${min.toLocaleString()}+${
        period ? ` ${period}` : ""
      }`;
    } else if (max) {
      return `Up to ${currency} ${max.toLocaleString()}${
        period ? ` ${period}` : ""
      }`;
    }
    return "Salary not specified";
  };

  const getApplicationRequirements = () => {
    const requirements = [];
    if (formData.applicationSettings.resumeRequired)
      requirements.push("Resume/CV");
    if (formData.applicationSettings.coverLetterRequired)
      requirements.push("Cover Letter");
    if (formData.applicationSettings.portfolioRequired)
      requirements.push("Portfolio");
    if (formData.applicationSettings.questionsRequired)
      requirements.push("Screening Questions");
    return requirements;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Job Preview</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formData.title}
            </h1>
            {formData.company && (
              <p className="text-xl text-gray-600 mb-4">{formData.company}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{backgroundColor: '#06604620', color: '#066046'}}>
                {formData.type}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {formData.locationType}
              </span>
            </div>

            {/* Job Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  {formData.city && formData.country
                    ? `${formData.city}, ${formData.country}`
                    : formData.city ||
                      formData.country ||
                      "Location not specified"}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{formData.experience}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{formatSalary()}</span>
              </div>
              {formData.department && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{formData.department}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Job Description
            </h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {formData.description}
              </p>
            </div>
          </div>

          {/* Responsibilities */}
          {formData.responsibilities.filter((r) => r.trim()).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Key Responsibilities
              </h2>
              <ul className="space-y-3">
                {formData.responsibilities
                  .filter((r) => r.trim())
                  .map((responsibility, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2 mr-3" style={{backgroundColor: '#066046'}}></div>
                      <span className="text-gray-700">{responsibility}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {formData.requirements.filter((r) => r.trim()).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Requirements
              </h2>
              <ul className="space-y-3">
                {formData.requirements
                  .filter((r) => r.trim())
                  .map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Qualifications */}
          {formData.qualifications.filter((q) => q.trim()).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Qualifications
              </h2>
              <ul className="space-y-3">
                {formData.qualifications
                  .filter((q) => q.trim())
                  .map((qualification, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
                      <span className="text-gray-700">{qualification}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {formData.skills &&
            formData.skills.filter((s) => s.trim()).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {formData.skills
                    .filter((s) => s.trim())
                    .map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              </div>
            )}

          {/* Benefits */}
          {formData.benefits.filter((b) => b.trim()).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Benefits & Perks
              </h2>
              <ul className="space-y-3">
                {formData.benefits
                  .filter((b) => b.trim())
                  .map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3"></div>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Application Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              How to Apply
            </h2>

            {formData.applicationSettings.deadline && (
              <div className="flex items-center mb-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  Application deadline:{" "}
                  {new Date(
                    formData.applicationSettings.deadline
                  ).toLocaleDateString()}
                </span>
              </div>
            )}

            {getApplicationRequirements().length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Required Documents:
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {getApplicationRequirements().map((req, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-1 h-1 bg-gray-500 rounded-full mr-2"></div>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="w-full text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition-colors" style={{backgroundColor: '#066046'}}>
              Apply for This Position
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
