"use client";

import { useState, useEffect } from "react";
import { Save, X, Edit3, Building2, Sparkles, Loader2 } from "lucide-react";
import { langGraphService } from "@/services/langGraphService";
import { toast } from "@/utils/toast";

interface CompanyData {
  name: string;
  website: string;
  industry: string;
  size: string;
  description: string;
  logo: string;
}

interface CompanySettingsProps {
  companyData: CompanyData;
  onChange: (data: CompanyData) => void;
}

export function CompanySettings({
  companyData,
  onChange,
}: CompanySettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState<CompanyData>(companyData);
  const [hasChanges, setHasChanges] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchReport, setResearchReport] = useState<string | null>(null);

  useEffect(() => {
    setTempData(companyData);
  }, [companyData]);

  useEffect(() => {
    if (isEditing) {
      const dataChanged =
        tempData.name !== companyData.name ||
        tempData.website !== companyData.website ||
        tempData.industry !== companyData.industry ||
        tempData.size !== companyData.size ||
        tempData.description !== companyData.description;
      setHasChanges(dataChanged);
    }
  }, [tempData, companyData, isEditing]);

  const handleTempChange = (field: keyof CompanyData, value: string) => {
    setTempData({ ...tempData, [field]: value });
  };

  const handleStartEdit = () => {
    setTempData(companyData);
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleSaveChanges = () => {
    onChange(tempData);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setTempData(companyData);
    setIsEditing(false);
    setHasChanges(false);
  };

  // Run the business_context_analyzer graph to research the company from its
  // name + website. Slow (~1-3 min: web search + multi-step research).
  const handleResearchCompany = async () => {
    const name = (isEditing ? tempData.name : companyData.name)?.trim();
    const website = (isEditing ? tempData.website : companyData.website)?.trim() || "";

    if (!name) {
      toast.error("Add a company name first to run AI research.");
      return;
    }

    setIsResearching(true);
    setResearchReport(null);
    try {
      const report = await langGraphService.analyzeBusinessContext(
        name,
        website,
        "en-US"
      );
      if (report) {
        setResearchReport(report);
        toast.success("Company research report ready.");
      }
      // On failure the request layer already surfaced a toast.
    } catch (error) {
      console.error("Company research failed:", error);
      toast.error(
        "Couldn't research the company right now. Please try again."
      );
    } finally {
      setIsResearching(false);
    }
  };

  const researchDisabled =
    isResearching || !(isEditing ? tempData.name : companyData.name)?.trim();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#066046]/10 rounded-lg">
            <Building2 className="h-6 w-6 text-[#066046]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Company Information
            </h3>
            <p className="text-sm text-gray-600">
              Manage your company details and profile information
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-2 bg-[#066046] rounded-full mr-3"></div>
              Company Details
            </h4>
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#066046] hover:text-[#267a54] hover:bg-[#066046]/10 rounded-lg transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Edit Information
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                value={isEditing ? tempData.name : companyData.name}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("name", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-[#066046]/30 focus:ring-[#066046] bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                value={isEditing ? tempData.website : companyData.website}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("website", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-[#066046]/30 focus:ring-[#066046] bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
                placeholder="https://yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                value={isEditing ? tempData.industry : companyData.industry}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("industry", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-[#066046]/30 focus:ring-[#066046] bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
              >
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Consulting">Consulting</option>
                <option value="Media">Media & Entertainment</option>
                <option value="Non-profit">Non-profit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Company Size
              </label>
              <select
                value={isEditing ? tempData.size : companyData.size}
                onChange={(e) => {
                  if (isEditing) {
                    handleTempChange("size", e.target.value);
                  }
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  isEditing
                    ? "border-[#066046]/30 focus:ring-[#066046] bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                }`}
              >
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Company Description
            </label>
            <textarea
              rows={4}
              value={isEditing ? tempData.description : companyData.description}
              onChange={(e) => {
                if (isEditing) {
                  handleTempChange("description", e.target.value);
                }
              }}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-none ${
                isEditing
                  ? "border-[#066046]/30 focus:ring-[#066046] bg-white"
                  : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
              }`}
              placeholder="Describe your company, its mission, and what makes it unique..."
            />
            <p className="text-xs text-gray-500">
              This description will be visible to candidates on job postings
            </p>
          </div>

          {/* Edit Mode Controls */}
          {isEditing && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Unsaved changes
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#066046] hover:bg-[#267a54] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Company Research (business_context_analyzer graph) */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-[#066046]" />
                AI Company Research
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Generate an AI research report on your company from its name and
                website. This can take 1–3 minutes.
              </p>
            </div>
            <button
              onClick={handleResearchCompany}
              disabled={researchDisabled}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#066046] hover:bg-[#267a54] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
            >
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Researching…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Research company
                </>
              )}
            </button>
          </div>

          {isResearching && (
            <div className="text-sm text-gray-500">
              Researching {companyData.name || "your company"}… the AI is
              gathering and analyzing public information. Please keep this page
              open.
            </div>
          )}

          {researchReport && !isResearching && (
            <div className="mt-2 rounded-lg border border-[#066046]/20 bg-[#066046]/5 p-4">
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
                {researchReport}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
