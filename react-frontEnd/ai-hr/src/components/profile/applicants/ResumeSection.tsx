"use client";

import { useState } from "react";
import { FileText, Plus, Edit3, Trash2, Save, X, Download, Eye } from "lucide-react";

interface Resume {
  id: string;
  name: string;
  url: string;
  type: "resume" | "cover_letter" | "portfolio" | "certificate" | "other";
  uploadedAt: string;
  isDefault?: boolean;
  description?: string;
}

interface ResumeSectionProps {
  resumeList: Resume[];
  onUpdate: (resumeList: Resume[]) => void;
  isLoading?: boolean;
}

export function ResumeSection({
  resumeList,
  onUpdate,
  isLoading = false,
}: ResumeSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempResumeList, setTempResumeList] = useState<Resume[]>(resumeList);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAddResume = () => {
    const newResume: Resume = {
      id: `temp-${Date.now()}`,
      name: "",
      url: "",
      type: "resume",
      uploadedAt: new Date().toISOString(),
      isDefault: false,
      description: "",
    };
    setTempResumeList([...tempResumeList, newResume]);
    setEditingId(newResume.id);
    setIsEditing(true);
    setHasChanges(true);
  };

  const handleEditResume = (id: string) => {
    setEditingId(id);
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleSaveResumes = () => {
    onUpdate(tempResumeList);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setTempResumeList(resumeList);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleDeleteResume = (id: string) => {
    const updatedResumeList = tempResumeList.filter(resume => resume.id !== id);
    setTempResumeList(updatedResumeList);
    setHasChanges(true);
  };

  const handleResumeChange = (id: string, field: keyof Resume, value: any) => {
    setTempResumeList(prev =>
      prev.map(resume =>
        resume.id === id ? { ...resume, [field]: value } : resume
      )
    );
    setHasChanges(true);
  };

  const handleSetDefault = (id: string) => {
    setTempResumeList(prev =>
      prev.map(resume => ({
        ...resume,
        isDefault: resume.id === id
      }))
    );
    setHasChanges(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      // Simulate file upload - in real implementation, this would upload to your storage service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const uploadedUrl = `https://example.com/uploads/${file.name}`;
      
      if (editingId) {
        handleResumeChange(editingId, "url", uploadedUrl);
        handleResumeChange(editingId, "name", file.name);
      }
      
      setUploading(false);
    } catch (error) {
      console.error("File upload failed:", error);
      setUploading(false);
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "resume":
        return "📄";
      case "cover_letter":
        return "✉️";
      case "portfolio":
        return "🎨";
      case "certificate":
        return "🏆";
      default:
        return "📎";
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "resume":
        return "bg-blue-100 text-blue-800";
      case "cover_letter":
        return "bg-green-100 text-green-800";
      case "portfolio":
        return "bg-purple-100 text-purple-800";
      case "certificate":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const documentTypes = [
    { value: "resume", label: "Resume" },
    { value: "cover_letter", label: "Cover Letter" },
    { value: "portfolio", label: "Portfolio" },
    { value: "certificate", label: "Certificate" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <FileText className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Resume & Documents</h3>
          <p className="text-sm text-gray-600">
            Upload and manage your resumes, cover letters, and other documents
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Documents List */}
        <div className="space-y-4">
          {tempResumeList.map((resume) => (
            <div
              key={resume.id}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-2xl">
                    {getFileTypeIcon(resume.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {resume.name || "Untitled Document"}
                      </h4>
                      {resume.isDefault && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Default
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getFileTypeColor(
                          resume.type
                        )}`}
                      >
                        {documentTypes.find(t => t.value === resume.type)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                    </p>
                    {resume.description && (
                      <p className="text-sm text-gray-600">{resume.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(resume.url, '_blank')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.open(resume.url, '_blank')}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditResume(resume.id)}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteResume(resume.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingId === resume.id && (
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Name *
                      </label>
                      <input
                        type="text"
                        value={resume.name}
                        onChange={(e) => handleResumeChange(resume.id, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="e.g., My Resume 2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Type *
                      </label>
                      <select
                        value={resume.type}
                        onChange={(e) => handleResumeChange(resume.id, "type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        {documentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                          }
                        }}
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        id={`file-upload-${resume.id}`}
                      />
                      <label
                        htmlFor={`file-upload-${resume.id}`}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col items-center">
                          <FileText className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, DOC, DOCX, TXT (max 10MB)
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={resume.description || ""}
                      onChange={(e) => handleResumeChange(resume.id, "description", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="Add a description of this document..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`default-${resume.id}`}
                      checked={resume.isDefault || false}
                      onChange={(e) => handleSetDefault(resume.id)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`default-${resume.id}`} className="ml-2 text-sm text-gray-700">
                      Set as default document for applications
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Document Button */}
        <button
          onClick={handleAddResume}
          disabled={isLoading}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600 font-medium">Add Document</span>
          </div>
        </button>

        {/* Tips Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Document Tips</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Keep your resume updated with your latest experience and skills</li>
            <li>• Use PDF format for better compatibility across different systems</li>
            <li>• Include a cover letter template that you can customize for different jobs</li>
            <li>• Add certificates and portfolios to showcase your expertise</li>
            <li>• Set a default resume that will be used for quick applications</li>
          </ul>
        </div>

        {/* Edit Mode Controls */}
        {isEditing && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
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
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveResumes}
                  disabled={!hasChanges || isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 