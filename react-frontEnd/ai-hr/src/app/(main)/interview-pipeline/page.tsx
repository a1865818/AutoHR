"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  MapPin,
  Building,
  GitBranch,
  ArrowRight,
  Loader2,
  Briefcase,
  Phone,
  Video,
  Code,
  MessageSquare,
  Crown,
  Heart,
  XCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { jobService } from "@/services/jobService";
import { interviewService } from "@/services/interviewService";
import { candidateService } from "@/services/candidateService";
import { ApiJob } from "@/interfaces/api";
import {
  InterviewTemplate,
  InterviewRound,
  InterviewType,
} from "@/interfaces/interview";
import { PipelineJobCard } from "@/components/interview_pipeline/PipelineJobCard";

interface JobWithTemplate extends Omit<ApiJob, "interviewTemplate"> {
  interviewTemplate?: InterviewTemplate;
  candidateCount?: number;
}

export default function InterviewPipelinePage() {
  const [jobs, setJobs] = useState<JobWithTemplate[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobWithTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Template management state
  const [availableTemplates, setAvailableTemplates] = useState<
    InterviewTemplate[]
  >([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedJobForTemplate, setSelectedJobForTemplate] =
    useState<JobWithTemplate | null>(null);
  const [isChangingTemplate, setIsChangingTemplate] = useState(false);

  // Load jobs and their templates
  useEffect(() => {
    loadJobsWithTemplates();
  }, []);

  // Filter jobs based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.interviewTemplate?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
  }, [jobs, searchQuery]);

  const loadJobsWithTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user's company ID
      const authData = jobService.getCurrentUser();
      const userCompanyId = authData.companyId;

      if (!userCompanyId) {
        throw new Error("No company associated with your account");
      }

      // Load active jobs for the company
      const activeJobs = await jobService.getAllJobs("Open", userCompanyId);

      if (!activeJobs || activeJobs.length === 0) {
        setJobs([]);
        return;
      }

      // Load interview templates and candidate counts for each job
      const jobsWithTemplates = await Promise.all(
        activeJobs.map(async (job) => {
          const jobWithTemplate: JobWithTemplate = {
            ...job,
            interviewTemplate: undefined,
          };

          // Load interview template if job has one
          if (job.interviewTemplateId) {
            try {
              const template = await interviewService.getInterviewTemplate(
                job.interviewTemplateId
              );
              const rounds = await interviewService.getInterviewRounds(
                job.interviewTemplateId
              );
              jobWithTemplate.interviewTemplate = {
                ...template,
                rounds: rounds,
              };
            } catch (error) {
              console.warn(`Failed to load template for job ${job.id}:`, error);
            }
          }

          // Load candidate count for the job
          try {
            const candidates = await candidateService.getCandidatesForJob(
              job.id
            );
            jobWithTemplate.candidateCount = candidates?.length || 0;
          } catch (error) {
            console.warn(`Failed to load candidates for job ${job.id}:`, error);
            jobWithTemplate.candidateCount = 0;
          }

          return jobWithTemplate;
        })
      );

      setJobs(jobsWithTemplates);
    } catch (error) {
      console.error("Error loading jobs with templates:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableTemplates = async () => {
    try {
      const templates = await interviewService.getInterviewTemplates();
      setAvailableTemplates(templates);
    } catch (error) {
      console.error("Error loading interview templates:", error);
    }
  };

  const handleOpenTemplateSelector = (job: JobWithTemplate) => {
    setSelectedJobForTemplate(job);
    if (availableTemplates.length === 0) {
      loadAvailableTemplates();
    }
    setShowTemplateSelector(true);
  };

  const handleChangeTemplate = async (templateId: string) => {
    if (!selectedJobForTemplate) return;

    try {
      setIsChangingTemplate(true);

      // Update the job with new template
      await jobService.updateJob(selectedJobForTemplate.id, {
        interviewTemplateId: templateId,
      });

      // Reload jobs to reflect the change
      await loadJobsWithTemplates();

      setShowTemplateSelector(false);
      setSelectedJobForTemplate(null);
    } catch (error) {
      console.error("Error changing interview template:", error);
      alert("Failed to change interview template. Please try again.");
    } finally {
      setIsChangingTemplate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading interview pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-800 font-medium">Error loading pipeline</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
          <button
            onClick={loadJobsWithTemplates}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <GitBranch className="h-8 w-8 mr-3 text-indigo-600" />
              Interview Pipeline
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your interview process for active job postings
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-600">
                {filteredJobs.length} Active Job
                {filteredJobs.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job title, department, or interview template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No jobs found" : "No active jobs"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Create job postings to start managing interview pipelines"}
          </p>
          {!searchQuery && (
            <Link
              href="/create-job"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create Job
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <PipelineJobCard
              key={job.id}
              job={job}
              onChangeTemplate={handleOpenTemplateSelector}
            />
          ))}
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && selectedJobForTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedJobForTemplate.interviewTemplate ? "Change" : "Assign"}{" "}
                Interview Template
              </h3>
              <button
                onClick={() => {
                  setShowTemplateSelector(false);
                  setSelectedJobForTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={isChangingTemplate}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Job:{" "}
                <span className="font-medium">
                  {selectedJobForTemplate.title}
                </span>
              </p>
              {selectedJobForTemplate.interviewTemplate && (
                <p className="text-sm text-gray-600 mt-1">
                  Current template:{" "}
                  <span className="font-medium">
                    {selectedJobForTemplate.interviewTemplate.name}
                  </span>
                </p>
              )}
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Changing the template will affect all candidates in this
                job's pipeline
              </p>
            </div>

            <div className="space-y-3">
              {availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    template.id === selectedJobForTemplate.interviewTemplateId
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleChangeTemplate(template.id)}
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
                      </div>
                    </div>
                    {template.id ===
                      selectedJobForTemplate.interviewTemplateId && (
                      <CheckCircle className="h-5 w-5 text-indigo-600 ml-3" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {availableTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No interview templates available</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTemplateSelector(false);
                  setSelectedJobForTemplate(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                disabled={isChangingTemplate}
              >
                Cancel
              </button>
            </div>

            {isChangingTemplate && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-sm text-gray-600">
                    {selectedJobForTemplate.interviewTemplate
                      ? "Changing"
                      : "Assigning"}{" "}
                    template...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
