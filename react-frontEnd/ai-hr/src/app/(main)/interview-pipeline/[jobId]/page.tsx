"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  MapPin,
  Building,
  GitBranch,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Video,
  Code,
  MessageSquare,
  Crown,
  Heart,
  User,
  Mail,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { jobService } from "@/services/jobService";
import { interviewService } from "@/services/interviewService";
import { candidateService } from "@/services/candidateService";
import { ApiJob } from "@/interfaces/api";
import {
  InterviewTemplate,
  InterviewRound,
  InterviewType,
} from "@/interfaces/interview";
import { Candidate } from "@/interfaces";
import { PipelineCandidateCard } from "../components/PipelineCandidateCard";
import {
  DragDropCandidateCard,
  DroppableColumn,
  BulkActions,
} from "../components/DragDropPipeline";
import { RoundSpecificActions } from "../components/RoundSpecificActions";
import { InterviewManager } from "../components/InterviewManager";

interface JobWithTemplate extends ApiJob {
  interviewTemplate?: InterviewTemplate;
}

interface PipelineCandidate extends Candidate {
  currentRoundId?: string;
  roundProgress?: number;
}

interface PipelineColumn {
  id: string;
  title: string;
  type: "new" | "round" | "hired";
  round?: InterviewRound;
  candidates: PipelineCandidate[];
  color: string;
}

export default function JobPipelinePage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "N/A";

    try {
      let dateStr = dateValue;

      // Handle .NET DateTime objects
      if (typeof dateValue === "object" && dateValue !== null) {
        dateStr = dateValue.value || dateValue.Value || dateValue.toString();
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const [job, setJob] = useState<JobWithTemplate | null>(null);
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [dragEnabled, setDragEnabled] = useState(true);

  // Template management states
  const [availableTemplates, setAvailableTemplates] = useState<
    InterviewTemplate[]
  >([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isAssigningTemplate, setIsAssigningTemplate] = useState(false);

  // Load job, template, and candidates
  useEffect(() => {
    if (jobId) {
      loadJobPipeline();
    }
  }, [jobId]);

  // Update columns when candidates change
  useEffect(() => {
    if (job && candidates.length >= 0) {
      console.log("🔄 Organizing columns with job:", job);
      console.log("🔄 Job has interview template:", !!job.interviewTemplate);
      organizeIntoColumns();
    }
  }, [job, candidates]);

  const loadJobPipeline = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load job details
      const jobData = await jobService.getJobById(jobId);
      console.log("🔍 Raw job data from backend:", jobData);
      console.log(
        "🔍 Job has interviewTemplateId:",
        jobData.interviewTemplateId
      );
      console.log(
        "🔍 Job has InterviewTemplate:",
        (jobData as any).InterviewTemplate
      );

      let jobWithTemplate: JobWithTemplate = jobData;

      // Check if interview template is already included in the response
      if ((jobData as any).InterviewTemplate) {
        console.log("✅ Interview template found in job data");
        jobWithTemplate.interviewTemplate = (jobData as any).InterviewTemplate;
      }
      // Otherwise, load interview template if job has one
      else if (jobData.interviewTemplateId) {
        try {
          console.log("🔄 Loading interview template separately...");
          const template = await interviewService.getInterviewTemplate(
            jobData.interviewTemplateId
          );
          const rounds = await interviewService.getInterviewRounds(
            jobData.interviewTemplateId
          );
          jobWithTemplate.interviewTemplate = {
            ...template,
            rounds: rounds,
          };
        } catch (error) {
          console.warn(`Failed to load template for job ${jobId}:`, error);
        }
      }

      setJob(jobWithTemplate);

      // Load candidates for this job
      const candidatesData = await candidateService.getCandidatesForJob(jobId);
      const pipelineCandidates: PipelineCandidate[] = candidatesData.map(
        (candidate) => ({
          ...candidate,
          currentRoundId: getCurrentRoundId(
            candidate,
            jobWithTemplate.interviewTemplate
          ),
          roundProgress: calculateRoundProgress(
            candidate,
            jobWithTemplate.interviewTemplate
          ),
        })
      );

      setCandidates(pipelineCandidates);
    } catch (error) {
      console.error("Error loading job pipeline:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load pipeline"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRoundId = (
    candidate: Candidate,
    template?: InterviewTemplate
  ): string | undefined => {
    if (candidate.status === "Hired") {
      return "hired";
    }
    return "new";
  };

  const calculateRoundProgress = (
    candidate: Candidate,
    template?: InterviewTemplate
  ): number => {
    if (!template?.rounds) return 0;

    switch (candidate.stage) {
      case "Applied":
        return 0;
      case "Interview":
        return 50;
      case "Offer":
        return 90;
      default:
        return 0;
    }
  };

  const organizeIntoColumns = () => {
    // Always create at least the basic columns, even without a template
    const newColumns: PipelineColumn[] = [];

    // New Applications column - always show this
    newColumns.push({
      id: "new",
      title: "New Applications",
      type: "new",
      candidates: candidates.filter(
        (c) =>
          c.status === "In Progress" &&
          (!c.currentRoundId || c.currentRoundId === "new")
      ),
      color: "border-blue-500 bg-blue-50",
    });

    // Only add interview round columns if template exists
    if (job?.interviewTemplate?.rounds) {
      const rounds = job.interviewTemplate.rounds;
      rounds.forEach((round, index) => {
        const isLastRound = index === rounds.length - 1;
        newColumns.push({
          id: round.id,
          title: round.name,
          type: "round",
          round: round,
          candidates: candidates.filter(
            (c) =>
              c.currentRoundId === round.id &&
              c.status === "In Progress" &&
              c.currentRoundId !== "new"
          ),
          color: getColumnColor(round.type, isLastRound),
        });
      });
    }

    // Hired column - always show this
    newColumns.push({
      id: "hired",
      title: "Hired",
      type: "hired",
      candidates: candidates.filter((c) => c.status === "Hired"),
      color: "border-emerald-500 bg-emerald-50",
    });

    setColumns(newColumns);
  };

  const getColumnColor = (
    type: InterviewType,
    isLastRound: boolean = false
  ): string => {
    // If it's the last round, always use yellow background
    if (isLastRound) {
      return "border-yellow-400 bg-yellow-50";
    }

    switch (type) {
      case "phone_screening":
        return "border-blue-400 bg-blue-50";
      case "video_interview":
        return "border-green-400 bg-green-50";
      case "technical_assessment":
        return "border-purple-400 bg-purple-50";
      case "coding_challenge":
        return "border-orange-400 bg-orange-50";
      case "behavioral_interview":
        return "border-pink-400 bg-pink-50";
      case "panel_interview":
        return "border-indigo-400 bg-indigo-50";
      case "final_interview":
        return "border-gray-400 bg-gray-50"; // Normal styling when not the last round
      case "culture_fit":
        return "border-red-400 bg-red-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  const getInterviewTypeIcon = (type: InterviewType) => {
    switch (type) {
      case "phone_screening":
        return Phone;
      case "video_interview":
        return Video;
      case "technical_assessment":
        return Code;
      case "coding_challenge":
        return Code;
      case "behavioral_interview":
        return MessageSquare;
      case "panel_interview":
        return Users;
      case "final_interview":
        return Crown;
      case "culture_fit":
        return Heart;
      default:
        return Calendar;
    }
  };

  const handleCandidateMove = async (
    candidateId: string,
    fromColumnId: string,
    toColumnId: string
  ) => {
    console.log(
      `Moving candidate ${candidateId} from ${fromColumnId} to ${toColumnId}`
    );

    // Update local state optimistically
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              currentRoundId: toColumnId,
              // Update stage when moving from New Applications to first interview round
              stage:
                toColumnId === "new"
                  ? "Applied"
                  : toColumnId === "hired"
                  ? "Offer"
                  : "Interview",
            }
          : candidate
      )
    );

    // Re-organize columns
    organizeIntoColumns();
  };

  const handleDragDrop = (candidateData: any, toColumnId: string) => {
    handleCandidateMove(
      candidateData.candidateId,
      candidateData.fromColumn,
      toColumnId
    );
  };

  const handleBulkMove = (
    candidateIds: string[],
    direction: "next" | "previous"
  ) => {
    candidateIds.forEach((candidateId) => {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate) return;

      const currentColumnIndex = columns.findIndex((col) =>
        col.candidates.some((c) => c.id === candidateId)
      );

      const targetIndex =
        direction === "next"
          ? Math.min(currentColumnIndex + 1, columns.length - 1)
          : Math.max(currentColumnIndex - 1, 0);

      if (targetIndex !== currentColumnIndex) {
        handleCandidateMove(
          candidateId,
          columns[currentColumnIndex].id,
          columns[targetIndex].id
        );
      }
    });
    setSelectedCandidates([]);
  };

  const handleBulkReject = (candidateIds: string[]) => {
    candidateIds.forEach((candidateId) => {
      // TODO: Implement reject logic
      console.log(`Rejecting candidate ${candidateId}`);
    });
    setSelectedCandidates([]);
  };

  const handleBulkSchedule = (candidateIds: string[]) => {
    // TODO: Implement bulk scheduling
    console.log(`Bulk scheduling for candidates: ${candidateIds.join(", ")}`);
    setSelectedCandidates([]);
  };

  const handleScheduleInterview = (candidateId: string, roundId: string) => {
    console.log(
      `Scheduling interview for candidate ${candidateId} in round ${roundId}`
    );
    // TODO: Implement interview scheduling
  };

  const handleCompleteRound = (
    candidateId: string,
    roundId: string,
    result: any
  ) => {
    console.log(
      `Completing round ${roundId} for candidate ${candidateId}`,
      result
    );
    // TODO: Implement round completion
  };

  const handleAddNotes = (
    candidateId: string,
    roundId: string,
    notes: string
  ) => {
    console.log(
      `Adding notes for candidate ${candidateId} in round ${roundId}: ${notes}`
    );
    // TODO: Implement notes functionality
  };

  const handleHireCandidate = (candidateId: string) => {
    console.log(`Hiring candidate ${candidateId}`);
    // Update candidate status to hired
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status: "Hired",
              currentRoundId: "hired",
              stage: "Offer",
            }
          : candidate
      )
    );
    // Re-organize columns
    organizeIntoColumns();
  };

  const handleRejectCandidate = (candidateId: string) => {
    console.log(`Rejecting candidate ${candidateId}`);
    // Update candidate status to rejected
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, status: "Rejected" }
          : candidate
      )
    );
    // Re-organize columns
    organizeIntoColumns();
  };

  // Template management functions
  const loadAvailableTemplates = async () => {
    try {
      const templates = await interviewService.getInterviewTemplates();
      setAvailableTemplates(templates);
    } catch (error) {
      console.error("Error loading interview templates:", error);
    }
  };

  const handleAssignTemplate = async (templateId: string) => {
    if (!job) return;

    try {
      setIsAssigningTemplate(true);

      // Update the job with new template
      await jobService.updateJob(job.id, {
        ...job,
        interviewTemplateId: templateId,
      });

      // Reload the job pipeline to reflect the change
      await loadJobPipeline();

      setShowTemplateSelector(false);
    } catch (error) {
      console.error("Error assigning interview template:", error);
      alert("Failed to assign interview template. Please try again.");
    } finally {
      setIsAssigningTemplate(false);
    }
  };

  const handleOpenTemplateSelector = () => {
    if (availableTemplates.length === 0) {
      loadAvailableTemplates();
    }
    setShowTemplateSelector(true);
  };

  const isLastRound = (roundId: string): boolean => {
    if (!job?.interviewTemplate?.rounds) return false;
    const rounds = job.interviewTemplate.rounds;
    const currentRoundIndex = rounds.findIndex((r) => r.id === roundId);
    return currentRoundIndex === rounds.length - 1;
  };

  const filteredColumns = columns.map((column) => ({
    ...column,
    candidates: column.candidates.filter(
      (candidate) =>
        searchQuery === "" ||
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-medium">Error loading pipeline</p>
          <p className="text-gray-600 text-sm mt-1">
            {error || "Job not found"}
          </p>
          <Link
            href="/interview-pipeline"
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/interview-pipeline"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <GitBranch className="h-6 w-6 mr-2 text-indigo-600" />
                {job.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
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
                  {candidates.length} candidate
                  {candidates.length !== 1 ? "s" : ""}
                </div>
                {job.interviewTemplate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {job.interviewTemplate.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* No Template Warning - Show when job has no interview template */}
      {!job?.interviewTemplate && (
        <div className="mx-6 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-amber-900 mb-2">
                  No Interview Template Assigned
                </h3>
                <p className="text-amber-800 mb-4">
                  This job doesn't have an interview template configured. To
                  manage candidates through interview rounds, you need to assign
                  an interview template that defines the interview process.
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleOpenTemplateSelector}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Assign Template
                  </button>
                  <Link
                    href="/interviews/create"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Template
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-6 space-x-6 min-w-max">
          {filteredColumns.map((column, columnIndex) => (
            <DroppableColumn
              key={column.id}
              onDrop={(candidateData) =>
                handleDragDrop(candidateData, column.id)
              }
              className={`flex flex-col w-80 bg-white rounded-lg border-2 ${column.color} shadow-sm relative`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {column.round ? (
                      <div className="w-6 h-6 flex items-center justify-center">
                        {React.createElement(
                          getInterviewTypeIcon(column.round.type),
                          {
                            className: "w-4 h-4 text-gray-600",
                          }
                        )}
                      </div>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    {column.round ? (
                      <Link
                        href={`/interview-pipeline/${jobId}/rounds/${column.round.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {column.title}
                      </Link>
                    ) : (
                      <h3 className="font-semibold text-gray-900">
                        {column.title}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {column.round && (
                      <Link
                        href={`/interview-pipeline/${jobId}/rounds/${column.round.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Configure
                      </Link>
                    )}
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                      {column.candidates.length}
                    </span>
                  </div>
                </div>
                {/* Ensure consistent header height by always showing info line */}
                <div className="mt-2 text-xs text-gray-500 min-h-[16px]">
                  {column.round ? (
                    <>
                      {column.round.duration} min •{" "}
                      {column.round.passingCriteria}% to pass
                    </>
                  ) : (
                    <span className="text-gray-400">
                      New applicants waiting for review
                    </span>
                  )}
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {column.candidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <User className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No candidates</p>
                  </div>
                ) : (
                  column.candidates.map((candidate) => (
                    <div key={candidate.id} className="space-y-2">
                      <DragDropCandidateCard
                        candidate={candidate}
                        roundId={column.id}
                        canMoveLeft={columnIndex > 0}
                        canMoveRight={columnIndex < filteredColumns.length - 1}
                        onMove={(candidateId, direction) => {
                          const targetIndex =
                            direction === "right"
                              ? Math.min(
                                  columnIndex + 1,
                                  filteredColumns.length - 1
                                )
                              : Math.max(columnIndex - 1, 0);
                          if (targetIndex !== columnIndex) {
                            handleCandidateMove(
                              candidateId,
                              column.id,
                              filteredColumns[targetIndex].id
                            );
                          }
                        }}
                        onSchedule={(candidateId) =>
                          handleScheduleInterview(candidateId, column.id)
                        }
                        onReject={(candidateId) =>
                          handleBulkReject([candidateId])
                        }
                        onViewProfile={(candidateId) =>
                          console.log(`View profile: ${candidateId}`)
                        }
                        onAddNote={(candidateId, note) =>
                          handleAddNotes(candidateId, column.id, note)
                        }
                      />

                      {/* Round-specific actions */}
                      {column.round && (
                        <RoundSpecificActions
                          round={column.round}
                          candidate={candidate}
                          isLastRound={isLastRound(column.round.id)}
                          onSchedule={handleScheduleInterview}
                          onComplete={handleCompleteRound}
                          onAddNotes={handleAddNotes}
                          onHire={handleHireCandidate}
                          onReject={handleRejectCandidate}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </DroppableColumn>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCandidates={selectedCandidates}
        onClearSelection={() => setSelectedCandidates([])}
        onBulkMove={handleBulkMove}
        onBulkReject={handleBulkReject}
        onBulkSchedule={handleBulkSchedule}
      />

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Interview Template
              </h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isAssigningTemplate}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Job: <span className="font-medium">{job?.title}</span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Assigning a template will create interview rounds for
                managing candidates
              </p>
            </div>

            <div className="space-y-3">
              {availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-50"
                  onClick={() => handleAssignTemplate(template.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span>{template.rounds?.length || 0} rounds</span>
                        {template.isDefault && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>

            {availableTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No interview templates available</p>
                <p className="text-xs mt-1">Create a template first</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <Link
                href="/interviews/create"
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors font-medium"
              >
                Create New Template
              </Link>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                disabled={isAssigningTemplate}
              >
                Cancel
              </button>
            </div>

            {isAssigningTemplate && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-sm text-gray-600">Assigning template...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
