"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Edit3, Trash2, Save, X, Download, Eye, AlertCircle } from "lucide-react";
import { resumeService, Resume as ResumeServiceResume } from "@/services/resumeService";

export interface Resume {
  id: string;
  originalName: string; // Changed from 'name' to match service interface
  url: string;
  type: "resume" | "cover_letter" | "portfolio" | "certificate" | "other";
  uploadedAt: string;
  isDefault?: boolean;
  description?: string;
  fileSize?: number; // Added to match service interface
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
  const [deleting, setDeleting] = useState<string | null>(null); // Track which resume is being deleted
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    resumeId: string;
    resumeName: string;
  }>({
    isOpen: false,
    resumeId: "",
    resumeName: "",
  });

  // Sync tempResumeList with incoming resumeList
  useEffect(() => {
    setTempResumeList(resumeList);
  }, [resumeList]);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (deleteConfirmModal.isOpen && event.key === 'Escape') {
        handleCancelDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmModal.isOpen]);

  const handleAddResume = () => {
    const newResume: Resume = {
      id: `temp-${Date.now()}`,
      originalName: "",
      url: "",
      type: "resume",
      uploadedAt: new Date().toISOString(),
      isDefault: false,
      description: "",
      fileSize: 0,
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

  const handleSaveResumes = async () => {
    setError(null);
    try {
      // Update parent component which will save to database
      await onUpdate(tempResumeList);
      setIsEditing(false);
      setEditingId(null);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save resume changes:", error);
      setError("Failed to save changes. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setTempResumeList(resumeList);
    setIsEditing(false);
    setEditingId(null);
    setHasChanges(false);
  };

  const handleDeleteResumeClick = (id: string) => {
    const resume = tempResumeList.find(r => r.id === id);
    if (resume) {
      setDeleteConfirmModal({
        isOpen: true,
        resumeId: id,
        resumeName: resume.originalName,
      });
    }
  };

  const handleConfirmDelete = async () => {
    const { resumeId } = deleteConfirmModal;
    
    setError(null);
    setDeleting(resumeId); // Show loading state
    setDeleteConfirmModal({ isOpen: false, resumeId: "", resumeName: "" }); // Close modal
    
    try {
      // Delete from service (which updates the database)
      const success = await resumeService.deleteResume(resumeId);
      if (success) {
        // Remove from local state
        const updatedResumeList = tempResumeList.filter(resume => resume.id !== resumeId);
        setTempResumeList(updatedResumeList);
        
        // Update the parent component immediately to reflect the change
        onUpdate(updatedResumeList);
        
        // Clear any editing state if we were editing this resume
        if (editingId === resumeId) {
          setEditingId(null);
          setIsEditing(false);
        }
        
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Failed to delete resume:", error);
      setError("Failed to delete resume. Please try again.");
    } finally {
      setDeleting(null); // Clear loading state
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmModal({ isOpen: false, resumeId: "", resumeName: "" });
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
      // Use real resume service to upload to Supabase bucket
      const uploadedResume = await resumeService.uploadResume(file);
      
      if (!uploadedResume) {
        throw new Error("Failed to upload resume");
      }
      
      if (editingId) {
        // Update the resume in local state
        setTempResumeList(prev =>
          prev.map(resume =>
            resume.id === editingId
              ? {
                  ...resume,
                  url: uploadedResume.url,
                  originalName: uploadedResume.originalName,
                  fileSize: uploadedResume.fileSize,
                  uploadedAt: uploadedResume.uploadedAt,
                  id: uploadedResume.id, // Use the real ID from the service
                }
              : resume
          )
        );

        // Since upload already saved to database via resumeService, 
        // we need to update the parent to reflect the new resume list
        const updatedList = tempResumeList.map(resume =>
          resume.id === editingId
            ? {
                ...resume,
                url: uploadedResume.url,
                originalName: uploadedResume.originalName,
                fileSize: uploadedResume.fileSize,
                uploadedAt: uploadedResume.uploadedAt,
                id: uploadedResume.id,
              }
            : resume
        );
        
        // Update parent component immediately since upload already saved to DB
        onUpdate(updatedList);
        setHasChanges(false);
      }
      
      setUploading(false);
    } catch (error) {
      console.error("File upload failed:", error);
      setUploading(false);
      // Error toast is already shown by the resume service
    }
  };

  const handleViewResume = async (resume: Resume) => {
    setError(null);
    try {
      // For viewing, we can use the same download logic but open in a new tab
      if (resume.url) {
        // If it's a full URL, open directly
        if (resume.url.startsWith('http')) {
          window.open(resume.url, '_blank');
        } else {
          // If it's a bucket path, get signed URL first
          const fileInfo = await resumeService.getResumeFileInfo(resume.url);
          if (fileInfo) {
            // Open in new tab for viewing
            window.open(resume.url, '_blank');
          }
        }
      } else {
        setError("Resume URL not available");
      }
    } catch (error) {
      console.error("Failed to view resume:", error);
      setError("Failed to view resume");
    }
  };

  const handleDownloadResume = async (resume: Resume) => {
    setError(null);
    try {
      await resumeService.downloadResume(resume.url, resume.originalName);
    } catch (error) {
      console.error("Failed to download resume:", error);
      setError("Failed to download resume");
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

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-red-700 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
                        {resume.originalName || "Untitled Document"}
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
                      {resume.fileSize && `${(resume.fileSize / 1024 / 1024).toFixed(2)} MB • `}
                      Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                    </p>
                    {resume.description && (
                      <p className="text-sm text-gray-600">{resume.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewResume(resume)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View document"
                    disabled={!resume.url}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadResume(resume)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download document"
                    disabled={!resume.url}
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
                    onClick={() => handleDeleteResumeClick(resume.id)}
                    disabled={deleting === resume.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === resume.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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
                        value={resume.originalName}
                        onChange={(e) => handleResumeChange(resume.id, "originalName", e.target.value)}
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
                        accept=".pdf"
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
                            PDF only (max 10MB)
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurry Background Overlay */}
          <div 
            className="absolute inset-0 backdrop-blur-md"
            onClick={handleCancelDelete}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4 transform transition-all duration-200 scale-100">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Delete Resume
            </h3>
            
            {/* Message */}
            <p className="text-gray-600 text-center mb-1">
              Are you sure you want to delete
            </p>
            <p className="text-gray-900 font-medium text-center mb-6">
              "{deleteConfirmModal.resumeName}"?
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              This action cannot be undone and the resume will be permanently removed from your profile.
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 