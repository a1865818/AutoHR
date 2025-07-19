import React from "react";
import {
  ArrowRight,
  Building,
  MapPin,
  Users,
  Calendar,
  Clock,
  Phone,
  Video,
  Code,
  MessageSquare,
  Crown,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { ApiJob } from "@/interfaces/api";
import { InterviewTemplate } from "@/interfaces/interview";

interface JobWithTemplate extends Omit<ApiJob, "interviewTemplate"> {
  interviewTemplate?: InterviewTemplate;
  candidateCount?: number;
}

interface PipelineJobCardProps {
  job: JobWithTemplate;
  onChangeTemplate?: (job: JobWithTemplate) => void;
}

export function PipelineJobCard({
  job,
  onChangeTemplate,
}: PipelineJobCardProps) {
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "Recently";

    try {
      let dateStr = dateValue;

      // Handle .NET DateTime objects
      if (typeof dateValue === "object" && dateValue !== null) {
        dateStr = dateValue.value || dateValue.Value || dateValue.toString();
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Recently";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Recently";
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case "phone_screening":
        return Phone;
      case "video_interview":
        return Video;
      case "technical_assessment":
        return Code;
      case "coding_challenge":
        return Code;
      case "final_interview":
        return Crown;
      case "culture_fit":
        return Heart;
      default:
        return Calendar;
    }
  };

  const getInterviewTypeColor = (type: string) => {
    switch (type) {
      case "phone_screening":
        return "bg-blue-100 text-blue-800";
      case "video_interview":
        return "bg-green-100 text-green-800";
      case "technical_assessment":
        return "bg-purple-100 text-purple-800";
      case "coding_challenge":
        return "bg-orange-100 text-orange-800";
      case "final_interview":
        return "bg-yellow-100 text-yellow-800";
      case "culture_fit":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
      <div className="p-6">
        {/* Job Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {job.title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {job.department && (
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  {job.department}
                </div>
              )}
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {job.locationType}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {job.candidateCount || 0} candidates
              </div>
            </div>
          </div>
        </div>

        {/* Interview Template Info */}
        {job.interviewTemplate ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h4 className="text-sm font-medium text-gray-700 truncate flex-1 min-w-0">
                {job.interviewTemplate.name} {/* Interview Process:  */}
              </h4>
              <div className="flex items-center space-x-3 flex-shrink-0">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {job.interviewTemplate.rounds?.length || 0} rounds
                </span>
                {onChangeTemplate && (
                  <button
                    onClick={() => onChangeTemplate(job)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap"
                  >
                    Change Template
                  </button>
                )}
              </div>
            </div>

            {/* Interview Rounds Flow */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {job.interviewTemplate.rounds?.map((round, index) => {
                const IconComponent = getInterviewTypeIcon(round.type);
                const colorClass = getInterviewTypeColor(round.type);

                return (
                  <React.Fragment key={round.id}>
                    <div className="flex-shrink-0">
                      <div
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${colorClass}`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm font-medium whitespace-nowrap">
                          {round.name}
                        </span>
                        <span className="text-xs opacity-75">
                          {round.duration || 30}min
                        </span>
                      </div>
                    </div>
                    {index <
                      (job.interviewTemplate?.rounds?.length || 0) - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center flex-1 min-w-0">
                <Clock className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                <span className="text-sm text-yellow-800">
                  No interview template assigned
                </span>
              </div>
              {onChangeTemplate && (
                <button
                  onClick={() => onChangeTemplate(job)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium whitespace-nowrap flex-shrink-0"
                >
                  Assign Template
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Posted {formatDate(job.postedDate || job.createdAt)}
          </div>
          <Link
            href={`/interview-pipeline/${job.id}`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Manage Pipeline
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
