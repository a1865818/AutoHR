import { JobFormData } from "@/interfaces";
import {
  ChevronLeft,
  Send,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface PreviewStepProps {
  formData: JobFormData;
  onPrev: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export function PreviewStep({
  formData,
  onPrev,
  onPublish,
  isPublishing = false,
}: PreviewStepProps) {
  const hasSalaryInfo = () => {
    const { min, max } = formData.salary;
    return !!(min || max);
  };

  const formatSalary = () => {
    const { min, max, currency, period } = formData.salary;

    const minStr = min ? min.toLocaleString() : "";
    const maxStr = max ? max.toLocaleString() : "";

    if (min && max) {
      return `${currency} ${minStr} - ${maxStr} ${period}`;
    } else if (min) {
      return `${currency} ${minStr}+ ${period}`;
    } else if (max) {
      return `Up to ${currency} ${maxStr} ${period}`;
    }
    return "";
  };

  const getWorkTypeBadge = () => {
    const colors = {
      "On-site": "bg-blue-100 text-blue-800",
      Remote: "bg-green-100 text-green-800",
      Hybrid: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[formData.locationType]
        }`}
      >
        {formData.locationType}
      </span>
    );
  };

  const getJobTypeBadge = () => {
    const colors: Record<string, string> = {
      "Full-Time": "bg-blue-100 text-blue-800",
      "Part-Time": "bg-purple-100 text-purple-800",
      Contract: "bg-orange-100 text-orange-800",
      Internship: "bg-pink-100 text-pink-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[formData.type] || "bg-gray-100 text-gray-800"
        }`}
      >
        {formData.type}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Job Preview Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {formData.title}
              </h1>
            </div>
            <p className="text-lg text-gray-600 font-medium mb-2">
              {formData.company}
            </p>
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              {formData.location}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Department</p>
            <p className="font-medium text-gray-900">{formData.department}</p>
          </div>
        </div>

        {/* Job Details */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-1" />
            {formData.experience || "Experience level not specified"}
          </div>
          {hasSalaryInfo() && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatSalary()}
            </div>
          )}
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Posted today
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Apply by{" "}
            {formData.applicationSettings.deadline
              ? new Date(
                  formData.applicationSettings.deadline
                ).toLocaleDateString()
              : "Not set"}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-6">
          {getWorkTypeBadge()}
          {getJobTypeBadge()}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            About this role
          </h3>
          <p className="text-gray-700 whitespace-pre-line">
            {formData.description}
          </p>
        </div>

        {/* Responsibilities */}
        {formData.responsibilities.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Key Responsibilities
            </h3>
            <ul className="space-y-2">
              {formData.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{responsibility}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {formData.requirements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Requirements
            </h3>
            <ul className="space-y-2">
              {formData.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Qualifications */}
        {formData.qualifications.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Preferred Qualifications
            </h3>
            <ul className="space-y-2">
              {formData.qualifications.map((qualification, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{qualification}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills */}
        {formData.skills && formData.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {formData.benefits.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Benefits & Perks
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Application Requirements */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Application Requirements
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <CheckCircle
                  className={`h-5 w-5 mr-2 ${
                    formData.applicationSettings.resumeRequired
                      ? "text-green-500"
                      : "text-gray-300"
                  }`}
                />
                <span
                  className={`text-sm ${
                    formData.applicationSettings.resumeRequired
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  Resume/CV{" "}
                  {formData.applicationSettings.resumeRequired
                    ? "Required"
                    : "Optional"}
                </span>
              </div>
              <div className="flex items-center">
                <CheckCircle
                  className={`h-5 w-5 mr-2 ${
                    formData.applicationSettings.coverLetterRequired
                      ? "text-green-500"
                      : "text-gray-300"
                  }`}
                />
                <span
                  className={`text-sm ${
                    formData.applicationSettings.coverLetterRequired
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  Cover Letter{" "}
                  {formData.applicationSettings.coverLetterRequired
                    ? "Required"
                    : "Optional"}
                </span>
              </div>
              <div className="flex items-center">
                <CheckCircle
                  className={`h-5 w-5 mr-2 ${
                    formData.applicationSettings.portfolioRequired
                      ? "text-green-500"
                      : "text-gray-300"
                  }`}
                />
                <span
                  className={`text-sm ${
                    formData.applicationSettings.portfolioRequired
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  Portfolio{" "}
                  {formData.applicationSettings.portfolioRequired
                    ? "Required"
                    : "Optional"}
                </span>
              </div>
              <div className="flex items-center">
                <CheckCircle
                  className={`h-5 w-5 mr-2 ${
                    formData.applicationSettings.questionsRequired
                      ? "text-green-500"
                      : "text-gray-300"
                  }`}
                />
                <span
                  className={`text-sm ${
                    formData.applicationSettings.questionsRequired
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  Screening Questions{" "}
                  {formData.applicationSettings.questionsRequired
                    ? "Required"
                    : "Optional"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publishing Options */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          Ready to Publish?
        </h3>
        <p className="text-sm text-green-800 mb-4">
          Your job posting is complete and ready to go live. Once published,
          candidates will be able to view and apply for this position.
        </p>
        <div className="flex items-center gap-2 text-sm text-green-700">
          <Users className="h-4 w-4" />
          <span>This job will be visible to all registered candidates</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onPrev}
          disabled={isPublishing}
          className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </button>
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="inline-flex items-center px-8 py-3 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="mr-2 h-4 w-4" />
          {isPublishing ? "Publishing..." : "Publish Job"}
        </button>
      </div>
    </div>
  );
}
