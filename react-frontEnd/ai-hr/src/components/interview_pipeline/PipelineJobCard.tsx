"use client";

import React, { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { interviewService } from "@/services/interviewService";
import { candidateService } from "@/services/candidateService";
import { jobService } from "@/services/jobService";
import { Loader2 } from "lucide-react";
import { ApiJob } from "@/interfaces/api";
import { InterviewTemplate } from "@/interfaces/interview";

interface JobWithTemplate extends Omit<ApiJob, "interviewTemplate"> {
  interviewTemplate?: InterviewTemplate;
  candidateCount?: number;
}

interface PipelineJobCardProps {
  job: JobWithTemplate;
}

export function PipelineJobCard({
  job,
}: PipelineJobCardProps) {
  const [isInView, setIsInView] = useState(false);
  const [template, setTemplate] = useState<InterviewTemplate | undefined>(
    job.interviewTemplate
  );
  const [candidateCount, setCandidateCount] = useState<number | undefined>(
    job.candidateCount
  );
  const [isLoadingLazy, setIsLoadingLazy] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<InterviewTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isChangingTemplate, setIsChangingTemplate] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Observe when card enters viewport to trigger lazy data fetch
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Lazy load template and candidate count once in view
  useEffect(() => {
    let aborted = false;
    const run = async () => {
      if (!isInView || isLoadingLazy) return;
      setIsLoadingLazy(true);
      try {
        const tasks: Promise<void>[] = [];
        const templateId = (job as any).interviewTemplateId as
          | string
          | undefined;

        // Fetch interview template if missing but job has template id
        if (!template && templateId) {
          const templateTask = Promise.all([
            interviewService.getInterviewTemplate(templateId),
            interviewService.getInterviewRounds(templateId),
          ])
            .then(([tmpl, rounds]) => {
              if (!aborted) setTemplate({ ...tmpl, rounds });
            })
            .catch(() => {
              // ignore template errors; UI will handle missing template gracefully
            });
          tasks.push(templateTask);
        }

        // Fetch candidate count if missing
        if (candidateCount === undefined) {
          const candidatesTask = candidateService
            .getCandidatesForJob(job.id)
            .then((candidates) => {
              if (!aborted) setCandidateCount(candidates?.length || 0);
            })
            .catch((e) => {
              console.error("❌ Error fetching candidates for job:", job.id, e);
              if (!aborted) setCandidateCount(0);
            });
          tasks.push(candidatesTask);
        }

        if (tasks.length > 0) {
          await Promise.allSettled(tasks);
        }
      } finally {
        if (!aborted) setIsLoadingLazy(false);
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [isInView]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Load available templates when dropdown opens
  const handleOpenDropdown = async () => {
    setShowDropdown(true);
    if (availableTemplates.length === 0) {
      setIsLoadingTemplates(true);
      try {
        const templates = await interviewService.getInterviewTemplates();
        setAvailableTemplates(templates);
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
  };

  // Handle template change
  const handleChangeTemplate = async (templateId: string) => {
    try {
      setIsChangingTemplate(true);
      await jobService.updateJob(job.id, {
        interviewTemplateId: templateId,
      });

      // Reload template data
      const [tmpl, rounds] = await Promise.all([
        interviewService.getInterviewTemplate(templateId),
        interviewService.getInterviewRounds(templateId),
      ]);
      setTemplate({ ...tmpl, rounds });
      setShowDropdown(false);

      const { showToast } = await import("@/utils/toast");
      showToast.success("Interview template updated successfully");
    } catch (error) {
      console.error("Error changing template:", error);
      const { showToast } = await import("@/utils/toast");
      showToast.error("Failed to update interview template");
    } finally {
      setIsChangingTemplate(false);
    }
  };
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
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "video_interview":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "technical_assessment":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "coding_challenge":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "final_interview":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "culture_fit":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
    >
      <div className="p-6">
        {/* Job Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              <Link
                href={`/interview-pipeline/${job.id}`}
                className="hover:text-secondary hover:underline"
              >
                {job.title}
              </Link>
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
                {candidateCount === undefined ? (
                  <span className="inline-flex items-center text-gray-400">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>{candidateCount} candidates</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interview Template Info */}
        {template ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h4 className="text-sm font-medium text-gray-700 truncate flex-1 min-w-0">
                {template.name}
              </h4>
              <div className="flex items-center space-x-3 flex-shrink-0">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {template.rounds?.length || 0} rounds
                </span>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={handleOpenDropdown}
                    disabled={isChangingTemplate}
                    className="flex items-center gap-1 text-xs text-gray-900 hover:text-black hover:underline whitespace-nowrap font-medium disabled:opacity-50"
                  >
                    Change Template
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-700">
                          Select Interview Template
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Current: {template.name}
                        </p>
                      </div>

                      {isLoadingTemplates ? (
                        <div className="p-4 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : availableTemplates.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No templates available
                        </div>
                      ) : (
                        <div className="py-1">
                          {availableTemplates.map((tmpl) => (
                            <button
                              key={tmpl.id}
                              onClick={() => handleChangeTemplate(tmpl.id)}
                              disabled={isChangingTemplate || tmpl.id === (job as any).interviewTemplateId}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 ${
                                tmpl.id === (job as any).interviewTemplateId
                                  ? "bg-[#066046]/5"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {tmpl.name}
                                  </p>
                                  {tmpl.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {tmpl.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {tmpl.rounds?.length || 0} rounds
                                  </p>
                                </div>
                                {tmpl.id === (job as any).interviewTemplateId && (
                                  <CheckCircle className="w-4 h-4 text-[#066046] flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interview Rounds Flow */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {template.rounds?.map((round, index) => {
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
                    {index < (template?.rounds?.length || 0) - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            {/* If job has a templateId and we're still loading lazy data, show a subtle placeholder */}
            {(job as any).interviewTemplateId && isLoadingLazy ? (
              <div className="h-9 bg-gray-100 border border-gray-200 rounded-lg animate-pulse" />
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center flex-1 min-w-0">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <span className="text-sm text-yellow-800">
                      No interview template assigned
                    </span>
                  </div>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={handleOpenDropdown}
                      disabled={isChangingTemplate}
                      className="flex items-center gap-1 text-xs text-gray-900 hover:text-black hover:underline font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50"
                    >
                      Assign Template
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-700">
                            Select Interview Template
                          </p>
                        </div>

                        {isLoadingTemplates ? (
                          <div className="p-4 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          </div>
                        ) : availableTemplates.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No templates available
                          </div>
                        ) : (
                          <div className="py-1">
                            {availableTemplates.map((tmpl) => (
                              <button
                                key={tmpl.id}
                                onClick={() => handleChangeTemplate(tmpl.id)}
                                disabled={isChangingTemplate}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {tmpl.name}
                                  </p>
                                  {tmpl.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {tmpl.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {tmpl.rounds?.length || 0} rounds
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Posted {formatDate(job.postedDate || job.createdAt)}
          </div>
          <Link
            href={`/interview-pipeline/${job.id}`}
            className="inline-flex items-center px-4 py-2 bg-[#066046]/10 text-[#066046] rounded-lg hover:bg-[#066046] hover:text-white transition-colors text-sm font-medium"
          >
            Manage Pipeline
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
