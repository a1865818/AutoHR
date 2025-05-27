// components/jobs/JobCard.tsx
import { Briefcase, Clock, DollarSign, MapPin, Users } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-Time" | "Part-Time" | "Contract" | "Internship";
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  postedDate: string;
  applicants: number;
  status: "Active" | "Paused" | "Closed";
  urgency?: "Urgent" | "High Priority";
}

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
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
    switch (type) {
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

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "Urgent":
        return "bg-red-500 text-white";
      case "High Priority":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left side - Job info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                  {job.title}
                </h3>
                {job.urgency && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(
                      job.urgency
                    )}`}
                  >
                    {job.urgency}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 font-medium">{job.company}</p>
            </div>

            {/* Status badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                job.status
              )}`}
            >
              {job.status}
            </span>
          </div>

          {/* Job details */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {job.location}
            </div>
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              {job.experience}
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {job.salary} per year
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Posted {job.postedDate}
            </div>
          </div>

          {/* Job type and applicants */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                job.type
              )}`}
            >
              {job.type}
            </span>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {job.applicants} applicants
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {job.description}
          </p>

          {/* Requirements */}
          <div className="flex flex-wrap gap-1">
            {job.requirements.slice(0, 3).map((req, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="ml-6 flex flex-col gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
            View Job
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
