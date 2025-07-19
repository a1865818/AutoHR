"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Download,
  Upload,
  Copy,
  Trash2,
  Star,
  Building,
  Users,
  Globe,
  Settings,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import {
  RoundConfiguration,
  DEFAULT_CONFIGURATIONS,
} from "@/services/roundConfigurationApi";

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  roundType: string;
  scope: "global" | "company" | "department" | "job";
  isDefault: boolean;
  isActive: boolean;
  configuration: Partial<RoundConfiguration>;
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
    rating: number;
    tags: string[];
    version: string;
  };
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canClone: boolean;
    canDelete: boolean;
  };
}

interface TemplateManagerProps {
  currentConfig: Partial<RoundConfiguration>;
  roundType: string;
  jobId: string;
  roundId: string;
  onConfigurationChange: (config: Partial<RoundConfiguration>) => void;
  onTemplateApplied?: (template: ConfigurationTemplate) => void;
}

export function TemplateManager({
  currentConfig,
  roundType,
  jobId,
  roundId,
  onConfigurationChange,
  onTemplateApplied,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ConfigurationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ConfigurationTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Mock templates data - in real app, this would come from API
  const mockTemplates: ConfigurationTemplate[] = [
    {
      id: "default_phone",
      name: "Standard Phone Screening",
      description: "Default phone screening template with basic questions",
      roundType: "phone_screening",
      scope: "global",
      isDefault: true,
      isActive: true,
      configuration: DEFAULT_CONFIGURATIONS.phone_screening,
      metadata: {
        createdBy: "System",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        usageCount: 245,
        rating: 4.8,
        tags: ["standard", "phone", "screening"],
        version: "1.0.0",
      },
      permissions: {
        canView: true,
        canEdit: false,
        canClone: true,
        canDelete: false,
      },
    },
    {
      id: "eng_technical",
      name: "Engineering Technical Assessment",
      description: "Comprehensive technical assessment for software engineers",
      roundType: "technical_assessment",
      scope: "department",
      isDefault: false,
      isActive: true,
      configuration: DEFAULT_CONFIGURATIONS.technical_assessment,
      metadata: {
        createdBy: "Engineering Team",
        createdAt: "2024-01-15T00:00:00Z",
        updatedAt: "2024-02-01T00:00:00Z",
        usageCount: 78,
        rating: 4.6,
        tags: ["engineering", "technical", "coding"],
        version: "2.1.0",
      },
      permissions: {
        canView: true,
        canEdit: true,
        canClone: true,
        canDelete: true,
      },
    },
  ];

  useEffect(() => {
    loadTemplates();
  }, [roundType]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const filteredTemplates = mockTemplates.filter(
        (template) =>
          template.roundType === roundType || template.scope === "global"
      );
      setTemplates(filteredTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.metadata.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesScope =
      selectedScope === "all" || template.scope === selectedScope;

    return matchesSearch && matchesScope;
  });

  const applyTemplate = (template: ConfigurationTemplate) => {
    onConfigurationChange(template.configuration);
    onTemplateApplied?.(template);
    setSelectedTemplate(null);
  };

  const saveAsTemplate = async (
    templateData: Partial<ConfigurationTemplate>
  ) => {
    const newTemplate: ConfigurationTemplate = {
      id: `template_${Date.now()}`,
      name: templateData.name || "Untitled Template",
      description: templateData.description || "",
      roundType,
      scope: templateData.scope || "job",
      isDefault: false,
      isActive: true,
      configuration: currentConfig,
      metadata: {
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        rating: 0,
        tags: templateData.metadata?.tags || [],
        version: "1.0.0",
      },
      permissions: {
        canView: true,
        canEdit: true,
        canClone: true,
        canDelete: true,
      },
    };

    setTemplates((prev) => [...prev, newTemplate]);
    setShowCreateTemplate(false);
  };

  const cloneTemplate = (template: ConfigurationTemplate) => {
    const clonedTemplate: ConfigurationTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      scope: "job",
      isDefault: false,
      metadata: {
        ...template.metadata,
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        version: "1.0.0",
      },
      permissions: {
        canView: true,
        canEdit: true,
        canClone: true,
        canDelete: true,
      },
    };

    setTemplates((prev) => [...prev, clonedTemplate]);
  };

  const deleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  };

  const exportTemplate = (template: ConfigurationTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, "_")}_template.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "global":
        return Globe;
      case "company":
        return Building;
      case "department":
        return Users;
      case "job":
        return FileText;
      default:
        return Settings;
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case "global":
        return "bg-blue-100 text-blue-800";
      case "company":
        return "bg-green-100 text-green-800";
      case "department":
        return "bg-purple-100 text-purple-800";
      case "job":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Configuration Templates
          </h3>
          <p className="text-sm text-gray-600">
            Apply existing templates or save your current configuration as a
            template
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateTemplate(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Save as Template
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <select
          value={selectedScope}
          onChange={(e) => setSelectedScope(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all">All Scopes</option>
          <option value="global">Global</option>
          <option value="company">Company</option>
          <option value="department">Department</option>
          <option value="job">Job Specific</option>
        </select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const ScopeIcon = getScopeIcon(template.scope);

            return (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {template.name}
                        </h4>
                        {template.isDefault && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <div
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getScopeColor(
                            template.scope
                          )}`}
                        >
                          <ScopeIcon className="w-3 h-3" />
                          <span className="capitalize">{template.scope}</span>
                        </div>

                        <span className="text-xs text-gray-500">
                          v{template.metadata.version}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{template.metadata.usageCount} uses</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {getRatingStars(template.metadata.rating)}
                      <span>({template.metadata.rating})</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {template.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.metadata.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.metadata.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{template.metadata.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => applyTemplate(template)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Apply
                    </button>

                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Preview
                    </button>

                    {template.permissions.canClone && (
                      <button
                        onClick={() => cloneTemplate(template)}
                        className="p-2 border border-gray-300 rounded-md text-gray-400 hover:text-gray-600"
                        title="Clone template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => exportTemplate(template)}
                      className="p-2 border border-gray-300 rounded-md text-gray-400 hover:text-gray-600"
                      title="Export template"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {template.permissions.canDelete && (
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 border border-gray-300 rounded-md text-gray-400 hover:text-red-600"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredTemplates.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No templates found</p>
          <p className="text-sm">
            Try adjusting your search or create a new template
          </p>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <CreateTemplateModal
          currentConfig={currentConfig}
          roundType={roundType}
          onSave={saveAsTemplate}
          onCancel={() => setShowCreateTemplate(false)}
        />
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onApply={() => applyTemplate(selectedTemplate)}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}

// Create Template Modal
interface CreateTemplateModalProps {
  currentConfig: Partial<RoundConfiguration>;
  roundType: string;
  onSave: (template: Partial<ConfigurationTemplate>) => void;
  onCancel: () => void;
}

function CreateTemplateModal({
  currentConfig,
  roundType,
  onSave,
  onCancel,
}: CreateTemplateModalProps) {
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    scope: "job" as const,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !templateData.tags.includes(tagInput.trim())) {
      setTemplateData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTemplateData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSave = () => {
    if (!templateData.name.trim()) return;

    onSave({
      ...templateData,
      metadata: {
        tags: templateData.tags,
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        rating: 0,
        version: "1.0.0",
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Save as Template
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={templateData.name}
              onChange={(e) =>
                setTemplateData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter template name..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={templateData.description}
              onChange={(e) =>
                setTemplateData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe this template..."
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope
            </label>
            <select
              value={templateData.scope}
              onChange={(e) =>
                setTemplateData((prev) => ({
                  ...prev,
                  scope: e.target.value as any,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="job">Job Specific</option>
              <option value="department">Department</option>
              <option value="company">Company</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag..."
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            {templateData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {templateData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!templateData.name.trim()}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

// Template Preview Modal
interface TemplatePreviewModalProps {
  template: ConfigurationTemplate;
  onApply: () => void;
  onClose: () => void;
}

function TemplatePreviewModal({
  template,
  onApply,
  onClose,
}: TemplatePreviewModalProps) {
  const ScopeIcon =
    template.scope === "global"
      ? Globe
      : template.scope === "company"
      ? Building
      : template.scope === "department"
      ? Users
      : FileText;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {template.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  template.scope === "global"
                    ? "bg-blue-100 text-blue-800"
                    : template.scope === "company"
                    ? "bg-green-100 text-green-800"
                    : template.scope === "department"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <ScopeIcon className="w-3 h-3" />
                <span className="capitalize">{template.scope}</span>
              </div>
              <span className="text-xs text-gray-500">
                v{template.metadata.version}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">{template.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Created by:</span>
              <span className="ml-2 text-gray-600">
                {template.metadata.createdBy}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Usage count:</span>
              <span className="ml-2 text-gray-600">
                {template.metadata.usageCount}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Rating:</span>
              <span className="ml-2 text-gray-600">
                {template.metadata.rating}/5
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Updated:</span>
              <span className="ml-2 text-gray-600">
                {new Date(template.metadata.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {template.metadata.tags.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {template.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="font-medium text-gray-700">
              Configuration Preview:
            </span>
            <div className="mt-2 p-3 bg-gray-50 rounded border max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-600">
                {JSON.stringify(template.configuration, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
}
