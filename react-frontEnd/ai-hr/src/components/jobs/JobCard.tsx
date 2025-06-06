import { Job } from "@/interfaces/job";
import {
  Briefcase,
  Clock,
  DollarSign,
  MapPin,
  MoreHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Enhanced safe rendering functions to handle .NET objects
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return "";

    // Handle .NET DateTime objects that might have ValueKind property
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

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map((item) => safeRender(item)).join(", ");
      }

      // Handle other objects - avoid rendering complex objects directly
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

  const safeRenderNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;

    // Handle .NET numeric objects
    if (
      typeof value === "object" &&
      (value.value !== undefined || value.Value !== undefined)
    ) {
      const numValue = value.value || value.Value;
      const num = Number(numValue);
      return isNaN(num) ? 0 : num;
    }

    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const safeRenderArray = (value: any): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((item) => item != null);
    }
    return [];
  };

  const getStatusColor = (status: string) => {
    const safeStatus = safeRender(status);
    switch (safeStatus) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Paused":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    const safeType = safeRender(type);
    switch (safeType) {
      case "Full-Time":
        return "bg-blue-100 text-blue-800";
      case "Part-Time":
        return "bg-purple-100 text-purple-800";
      case "Contract":
        return "bg-orange-100 text-orange-800";
      case "Internship":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatSalary = (salary: any): string => {
    if (!salary || typeof salary !== "object") {
      return "Salary not specified";
    }

    const min = safeRenderNumber(salary.min);
    const max = safeRenderNumber(salary.max);
    const currency = safeRender(salary.currency) || "USD";
    const period = safeRender(salary.period) || "per year";

    const hasMin = min > 0;
    const hasMax = max > 0;

    if (hasMin && hasMax) {
      return `${currency} ${min.toLocaleString()} - ${currency} ${max.toLocaleString()} ${period}`;
    } else if (hasMin) {
      return `${currency} ${min.toLocaleString()}+ ${period}`;
    } else if (hasMax) {
      return `Up to ${currency} ${max.toLocaleString()} ${period}`;
    }

    return "Salary not specified";
  };

  const handleStatusChange = (newStatus: string) => {
    console.log(`Changing job ${job.id} status to ${newStatus}`);
    setShowDropdown(false);
  };

  const handleEdit = () => {
    window.location.href = `/jobs/${job.id}/edit`;
  };

  const handleDuplicate = () => {
    console.log(`Duplicating job ${job.id}`);
  };

  const handleDelete = () => {
    console.log(`Deleting job ${job.id}`);
  };

  // Safely extract values
  const jobTitle = safeRender(job.title);
  const companyName = safeRender(job.company);
  const jobStatus = safeRender(job.status);
  const jobType = safeRender(job.type);
  const location = safeRender(job.location);
  const experience = safeRender(job.experience);
  const postedDate = safeRender(job.postedDate);
  const description = safeRender(job.description);
  const applicantCount = safeRenderNumber(job.applicants);
  const requirements = safeRenderArray(job.requirements);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left side - Job info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/jobs/${job.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 cursor-pointer">
                    {jobTitle}
                  </h3>
                </Link>
              </div>
              <p className="text-sm text-gray-600 font-medium">{companyName}</p>
            </div>

            {/* Status badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                jobStatus
              )}`}
            >
              {jobStatus}
            </span>
          </div>

          {/* Job details */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {location}
            </div>
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              {experience}
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatSalary(job.salary)}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Posted {postedDate}
            </div>
          </div>

          {/* Job type and applicants */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                jobType
              )}`}
            >
              {jobType}
            </span>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {applicantCount} applicants
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {description}
          </p>

          {/* Requirements */}
          <div className="flex flex-wrap gap-1">
            {requirements
              .filter((req) => req && typeof req === "string" && req.trim())
              .slice(0, 3)
              .map((req, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {safeRender(req)}
                </span>
              ))}
            {requirements.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{requirements.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="ml-6 flex flex-col gap-2 relative">
          <button
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleEdit}
          >
            Edit Job
          </button>

          <div className="relative">
            <button
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <MoreHorizontal className="h-4 w-4 mr-1" />
              More
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                    Change Status
                  </div>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleStatusChange("Active")}
                  >
                    Mark as Active
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleStatusChange("Paused")}
                  >
                    Pause Job
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleStatusChange("Closed")}
                  >
                    Close Job
                  </button>
                  <div className="border-t">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleDuplicate}
                    >
                      Duplicate Job
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={handleDelete}
                    >
                      Delete Job
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
