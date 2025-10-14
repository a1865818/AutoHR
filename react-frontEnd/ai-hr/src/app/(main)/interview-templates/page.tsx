"use client";

import {
  InterviewStats,
  InterviewTemplate,
  InterviewType,
} from "@/interfaces/interview";
import { interviewService } from "@/services/interviewService";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Code,
  Copy,
  Crown,
  Edit,
  Filter,
  Heart,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/ui/LoadingState";

export default function InterviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "default" | "custom"
  >("all");
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [stats, setStats] = useState<InterviewStats>({
    totalTemplates: 0,
    activeInterviews: 0,
    successRate: 0,
    averageDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<InterviewTemplate | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Wait for authentication to be loaded and user to be authenticated before trying to load data
    if (!authLoading && user) {
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);

          const [templatesData, statsData] = await Promise.all([
            interviewService.getInterviewTemplates(),
            interviewService.getInterviewStats(),
          ]);

          // Only update state if we received valid data
          if (templatesData) {
            setTemplates(templatesData);
          }
          if (statsData) {
            setStats(statsData);
          }
        } catch (err) {
          console.error("Error loading interview data:", err);
          setError("Failed to load interview data");
        } finally {
          setLoading(false);
        }
      };

      loadData();
    } else if (!authLoading && !user) {
      // User is not authenticated, don't try to load data
      setLoading(false);
    }
  }, [authLoading, user]);

  const handleCloneTemplate = async (
    templateId: string,
    templateName: string
  ) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(template);
    setCloneName(`${templateName} (Copy)`);
    setShowCloneModal(true);
  };

  const confirmCloneTemplate = async () => {
    if (!selectedTemplate || !cloneName.trim()) return;

    setActionLoading(selectedTemplate.id);
    setError(null);
    setShowCloneModal(false);

    const clonedTemplate = await interviewService.cloneInterviewTemplate(
      selectedTemplate.id,
      cloneName.trim()
    );

    if (clonedTemplate) {
      setTemplates((prev) => [clonedTemplate, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalTemplates: prev.totalTemplates + 1,
      }));

      // Navigate to edit page for the cloned template
      router.push(`/interview-templates/edit?id=${clonedTemplate.id}`);
    } else {
      setError("Failed to clone template");
    }

    setActionLoading(null);
    setSelectedTemplate(null);
    setCloneName("");
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  const handleSetDefaultTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setActionLoading(templateId);
    setError(null);

    const updatedTemplate = await interviewService.setDefaultInterviewTemplate(
      templateId
    );

    if (updatedTemplate) {
      // Update the templates list to reflect the change
      setTemplates((prev) =>
        prev.map((t) => ({
          ...t,
          isDefault: t.id === templateId, // Only the selected template is default
        }))
      );

      setShowSuccessMessage(
        `Template "${template.name}" set as default successfully!`
      );
      setTimeout(() => setShowSuccessMessage(null), 4000);
    } else {
      setError("Failed to set default template");
    }

    setActionLoading(null);
  };

  const confirmDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    setActionLoading(selectedTemplate.id);
    setError(null);
    setShowDeleteModal(false);

    const deleteResult = await interviewService.deleteInterviewTemplate(
      selectedTemplate.id
    );

    if (deleteResult) {
      setTemplates((prev) => prev.filter((t) => t.id !== selectedTemplate.id));
      setStats((prev) => ({
        ...prev,
        totalTemplates: prev.totalTemplates - 1,
      }));

      setShowSuccessMessage(
        `Template "${selectedTemplate.name}" deleted successfully!`
      );
      setTimeout(() => setShowSuccessMessage(null), 4000);
    } else {
      setError("Failed to delete template");
    }

    setActionLoading(null);
    setSelectedTemplate(null);
  };

  const getInterviewTypeIcon = (type: InterviewType) => {
    const iconMap = {
      phone_screening: Phone,
      video_interview: Video,
      technical_assessment: Code,
      coding_challenge: Code,
      final_interview: Crown,
      culture_fit: Heart,
    };
    return iconMap[type] || Users;
  };

  const getInterviewTypeColor = (type: InterviewType) => {
    const colorMap = {
      phone_screening:
        "text-blue-700 bg-blue-50 border border-blue-200",
      video_interview:
        "text-purple-700 bg-purple-50 border border-purple-200",
      technical_assessment:
        "text-orange-700 bg-orange-50 border border-orange-200",
      coding_challenge:
        "text-cyan-700 bg-cyan-50 border border-cyan-200",
      final_interview:
        "text-amber-700 bg-amber-50 border border-amber-200",
      culture_fit: "text-rose-700 bg-rose-50 border border-rose-200",
    };
    return colorMap[type] || "text-gray-600 bg-gray-100";
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "default" && template.isDefault) ||
      (selectedFilter === "custom" && !template.isDefault);
    return matchesSearch && matchesFilter;
  });

  const totalDuration = (template: InterviewTemplate) =>
    template.rounds.reduce((sum, round) => sum + round.duration, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Loading State */}
      {loading && (
        <LoadingState
          message="Loading interview templates..."
          minHeightClass="min-h-screen"
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-800">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Only render the content when not loading */}
      {!loading && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#066046]/5 to-[#267a54]/5 border border-[#066046]/10 rounded-xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#066046]/10 rounded-lg">
                  <svg
                    className="w-8 h-8 text-[#066046]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Interview Templates
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Design and manage your interview processes with customizable
                    templates
                  </p>
                </div>
              </div>
              <Link
                href="/interview-templates/create"
                className="bg-[#066046] hover:bg-[#267a54] text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>Create Template</span>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalTemplates}
                  </p>
                </div>
                <div className="p-3 bg-[#066046]/10 rounded-full">
                  <Calendar className="w-6 h-6 text-[#066046]" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Interviews
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeInterviews}
                  </p>
                </div>
                <div className="p-3 bg-[#267a54]/10 rounded-full">
                  <Users className="w-6 h-6 text-[#267a54]" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.successRate}%
                  </p>
                </div>
                <div className="p-3 bg-[#384252]/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-[#384252]" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg Duration
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.averageDuration / 60)}h
                  </p>
                </div>
                <div className="p-3 bg-[#066046]/15 rounded-full">
                  <Clock className="w-6 h-6 text-[#066046]" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066046] focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedFilter}
                    onChange={(e) =>
                      setSelectedFilter(
                        e.target.value as "all" | "default" | "custom"
                      )
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#066046] focus:border-transparent"
                  >
                    <option value="all">All Templates</option>
                    <option value="default">Default Templates</option>
                    <option value="custom">Custom Templates</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="space-y-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
              >
                <div className="p-6">
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.isDefault && (
                          <span className="px-2 py-1 bg-[#066046]/15 text-[#066046] border border-[#066046]/20 text-xs font-medium rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">
                        {template.description}
                      </p>

                      {/* Template Stats */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>Used by {template.usageCount} jobs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span>{template.averageRating}/5 rating</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{template.successRate}% success</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {Math.round(totalDuration(template) / 60)}h total
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleCloneTemplate(template.id, template.name)
                        }
                        disabled={loading || actionLoading === template.id}
                        className="p-2 text-gray-400 hover:text-[#066046] hover:bg-[#066046]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clone template"
                      >
                        {actionLoading === template.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      {!template.isDefault && (
                        <button
                          onClick={() => handleSetDefaultTemplate(template.id)}
                          disabled={loading || actionLoading === template.id}
                          className="p-2 text-gray-400 hover:text-[#267a54] hover:bg-[#267a54]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Set as default template"
                        >
                          {actionLoading === template.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Star className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <Link
                        href={`/interview-templates/edit?id=${template.id}`}
                        className="p-2 text-gray-400 hover:text-[#066046] hover:bg-[#066046]/10 rounded-lg transition-colors"
                        title="Edit template"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      {!template.isDefault && (
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={loading || actionLoading === template.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete template"
                        >
                          {actionLoading === template.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Interview Flow */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Interview Flow
                    </h4>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                      {template.rounds.map((round, index) => {
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
                                  {round.duration}min
                                </span>
                              </div>
                            </div>
                            {index < template.rounds.length - 1 && (
                              <div className="flex-shrink-0 text-gray-400">
                                <span>→</span>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No interview templates found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search terms or filters"
                  : "Create your first interview template to get started"}
              </p>
              <Link
                href="/interview-templates/create"
                className="inline-flex items-center px-6 py-3 bg-[#066046] text-white rounded-lg hover:bg-[#267a54] transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Template
              </Link>
            </div>
          )}
        </>
      )}

      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-green-800 font-medium">
                {showSuccessMessage}
              </span>
              <button
                onClick={() => setShowSuccessMessage(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Template Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            {/* Blurred Background overlay */}
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-200"
              onClick={() => setShowCloneModal(false)}
            ></div>

            {/* Modal - Centered with animation */}
            <div className="relative z-10 inline-block bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-lg sm:w-full animate-in fade-in zoom-in duration-200">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[#066046]/10 sm:mx-0 sm:h-10 sm:w-10">
                    <Copy className="h-6 w-6 text-[#066046]" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Clone Template
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        Create a copy of "{selectedTemplate?.name}" and
                        customize it in the editor.
                      </p>
                      <input
                        type="text"
                        value={cloneName}
                        onChange={(e) => setCloneName(e.target.value)}
                        placeholder="Enter template name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#066046] focus:border-transparent"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmCloneTemplate();
                          if (e.key === "Escape") setShowCloneModal(false);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmCloneTemplate}
                  disabled={!cloneName.trim()}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#066046] text-base font-medium text-white hover:bg-[#267a54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#066046] sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Clone & Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#066046] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            {/* Blurred Background overlay */}
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-200"
              onClick={() => setShowDeleteModal(false)}
            ></div>

            {/* Modal - Centered with animation */}
            <div className="relative z-10 inline-block bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-lg sm:w-full animate-in fade-in zoom-in duration-200">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Template
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "
                        {selectedTemplate?.name}"? This action cannot be undone
                        and will remove the template permanently.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDeleteTemplate}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete Template
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#066046] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
