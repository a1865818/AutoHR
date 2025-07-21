"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Check,
  AlertCircle,
  Plus,
} from "lucide-react";
import { resumeService, Resume } from "@/services/resumeService";

interface ResumeSelectorProps {
  selectedResumeUrl?: string;
  onResumeSelect: (resumeUrl: string, resumeName: string) => void;
  onResumeUpload?: (resume: Resume) => void;
  required?: boolean;
  className?: string;
}

export default function ResumeSelector({
  selectedResumeUrl,
  onResumeSelect,
  onResumeUpload,
  required = false,
  className = "",
}: ResumeSelectorProps) {
  const [mode, setMode] = useState<"select" | "upload">("select");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load user's existing resumes
  useEffect(() => {
    loadResumes();
  }, []);

  // Set initial selected resume based on URL
  useEffect(() => {
    if (selectedResumeUrl && resumes.length > 0) {
      const matchingResume = resumes.find(
        (resume) => resume.url === selectedResumeUrl
      );
      if (matchingResume) {
        setSelectedResumeId(matchingResume.id);
      }
    }
  }, [selectedResumeUrl, resumes]);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const userResumes = await resumeService.getUserResumes();
      setResumes(userResumes);

      // If user has no resumes, default to upload mode
      if (userResumes.length === 0) {
        setMode("upload");
      }
    } catch (error) {
      console.error("Failed to load resumes:", error);
      setError("Failed to load your resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = resumeService.validateResumeFile(file);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload resume
      const newResume = await resumeService.uploadResume(file);

      // Update local state
      const updatedResumes = [...resumes, newResume];
      setResumes(updatedResumes);

      // Select the newly uploaded resume
      setSelectedResumeId(newResume.id);
      onResumeSelect(newResume.url, newResume.originalName);

      // Notify parent component
      if (onResumeUpload) {
        onResumeUpload(newResume);
      }

      // Switch to select mode to show the uploaded resume
      setMode("select");
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleResumeSelection = (resume: Resume) => {
    setSelectedResumeId(resume.id);
    onResumeSelect(resume.url, resume.originalName);
  };

  const handleDeleteResume = async (
    resumeId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (!confirm("Are you sure you want to delete this resume?")) {
      return;
    }

    try {
      await resumeService.deleteResume(resumeId);

      // Update local state
      const updatedResumes = resumes.filter((r) => r.id !== resumeId);
      setResumes(updatedResumes);

      // Clear selection if deleted resume was selected
      if (selectedResumeId === resumeId) {
        setSelectedResumeId(null);
        onResumeSelect("", "");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setError("Failed to delete resume");
    }
  };

  const handleDownloadResume = async (
    resume: Resume,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    try {
      await resumeService.downloadResumeFile(resume);
    } catch (error) {
      console.error("Download failed:", error);
      setError("Failed to download resume");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Resume {required && <span className="text-red-500">*</span>}
        </h2>

        <div className="flex space-x-2">
          <button
            onClick={() => setMode("select")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              mode === "select"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
            disabled={resumes.length === 0}
          >
            Select Existing
          </button>
          <button
            onClick={() => setMode("upload")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              mode === "upload"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Upload New
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {mode === "select" && (
        <div>
          {resumes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No resumes uploaded yet</p>
              <button
                onClick={() => setMode("upload")}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload your first resume
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  onClick={() => handleResumeSelection(resume)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedResumeId === resume.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded ${
                          selectedResumeId === resume.id
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {resume.originalName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(resume.fileSize)} • Uploaded{" "}
                          {formatDate(resume.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {selectedResumeId === resume.id && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                      <button
                        onClick={(e) => handleDownloadResume(resume, e)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteResume(resume.id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "upload" && (
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />

            <label htmlFor="resume-upload" className="cursor-pointer">
              <div
                className={`mx-auto mb-4 ${uploading ? "animate-pulse" : ""}`}
              >
                {uploading ? (
                  <div className="h-12 w-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                )}
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {uploading ? "Uploading..." : "Upload Resume"}
              </h3>

              <p className="text-gray-600 mb-2">
                {uploading
                  ? "Please wait while we upload your resume"
                  : "Click to browse or drag and drop"}
              </p>

              <p className="text-sm text-gray-500">
                PDF, DOC, or DOCX (max 10MB)
              </p>
            </label>
          </div>

          {resumes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setMode("select")}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <FileText className="h-4 w-4 mr-1" />
                Or choose from {resumes.length} existing resume
                {resumes.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
