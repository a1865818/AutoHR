import { ApiCompany, ApiJob } from "@/interfaces";
import {
  Briefcase,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
} from "lucide-react";
import Link from "next/link";

interface ApplicantJobCardProps {
  job: ApiJob;
  company?: ApiCompany;
}

// Helper functions
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (
      value.ValueKind !== undefined ||
      value.value !== undefined ||
      value.Value !== undefined
    ) {
      const dateStr = value.value || value.Value || value.toString();
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch (e) {
        return "";
      }
      return "";
    }
    if (Array.isArray(value)) {
      return value.map((item) => safeRender(item)).join(", ");
    }
    try {
      const str = JSON.stringify(value);
      if (str.length < 100) {
        return str;
      }
      return "[Complex Object]";
    } catch (e) {
      return "[Object]";
    }
  }
  return String(value);
};

const extractLocationString = (locations: any): string => {
  if (!locations) return "Location not specified";
  if (typeof locations === "string") return locations;
  if (typeof locations === "object") {
    if (Array.isArray(locations)) {
      if (locations.length > 0) {
        const firstLocation = locations[0];
        if (typeof firstLocation === "string") return firstLocation;
        if (typeof firstLocation === "object") {
          return extractFromLocationObject(firstLocation);
        }
      }
    } else {
      return extractFromLocationObject(locations);
    }
  }
  return "Location not specified";
};

const extractFromLocationObject = (location: any): string => {
  if (!location) return "Location not specified";
  const city = location.city || "";
  const state = location.state || "";
  if (city && state) {
    return `${city}, ${state}`;
  }
  return (
    location.address ||
    location.description ||
    location.name ||
    location.location ||
    "Location not specified"
  );
};

const formatSalary = (job: ApiJob): string => {
  if (!job) return "Salary not specified";
  const salaryMin = job.salaryMin || 0;
  const salaryMax = job.salaryMax || 0;
  const currency = safeRender(job.salaryCurrency) || "USD";

  if (!salaryMin && !salaryMax) return "Salary not specified";
  const formatNumber = (num: number) => num.toLocaleString();

  if (salaryMin && salaryMax) {
    return `${currency} ${formatNumber(salaryMin)} - ${currency} ${formatNumber(
      salaryMax
    )}`;
  } else if (salaryMin) {
    return `${currency} ${formatNumber(salaryMin)}+`;
  } else if (salaryMax) {
    return `Up to ${currency} ${formatNumber(salaryMax)}`;
  }
  return "Salary not specified";
};

const formatPostedDate = (dateString: any): string => {
  try {
    let dateStr = dateString;
    if (typeof dateString === "object") {
      dateStr = dateString.value || dateString.Value || dateString.toString();
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch (e) {
    return "";
  }
};

const formatExperience = (
  seniorityLevelStr: string,
  minYearsStr?: string
): string => {
  const minYearsNum = minYearsStr ? Number(minYearsStr) : 0;
  if (minYearsNum > 0) {
    if (minYearsNum <= 2) return "0-2 Years";
    if (minYearsNum <= 5) return "2-5 Years";
    return "5+ Years";
  }
  const level = seniorityLevelStr || "";
  switch (level.toLowerCase()) {
    case "junior":
      return "0-2 Years";
    case "mid":
      return "2-5 Years";
    case "senior":
      return "5+ Years";
    default:
      return "Experience not specified";
  }
};

export function ApplicantJobCard({ job, company }: ApplicantJobCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {safeRender(job.title) || "Job Title"}
          </h3>
          <p className="text-gray-600 mb-3">
            {safeRender(company?.name) || "Company"}
          </p>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{extractLocationString(job.locations)}</span>
            </div>
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              <span>{safeRender(job.employmentType) || "Full-time"}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatPostedDate(job.postedDate || job.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="text-right">
            <div className="text-lg font-semibold text-green-600">
              {formatSalary(job)}
            </div>
            <div className="text-sm text-gray-500">
              {formatExperience(
                safeRender(job.seniorityLevel),
                safeRender(job.experienceYearsMin)
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-3">
        {safeRender(job.description) || "No description available"}
      </p>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {safeRender(job.employmentType) || "Full-time"}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {safeRender(job.locationType) || "On-site"}
          </span>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/applicant/jobs/${job.id}`}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            View Details
          </Link>
          <Link
            href={`/applicant/jobs/${job.id}/apply`}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}
