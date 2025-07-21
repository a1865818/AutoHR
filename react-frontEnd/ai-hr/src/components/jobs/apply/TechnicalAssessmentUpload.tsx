"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Download,
  Eye,
} from "lucide-react";
import { storageBucketService } from "@/services/storageBucketService";
import { assessmentService } from "@/services/assessmentService";

interface TechnicalAssessmentUploadProps {
  candidateId: string;
  roundId: string;
  jobId: string;
  onUploadSuccess?: (fileUrl: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  existingAssessment?: {
    url: string;
    fileName: string;
    uploadedAt: string;
  };
}

export function TechnicalAssessmentUpload({
  candidateId,
  roundId,
  jobId,
  onUploadSuccess,
  onUploadError,
  existingAssessment,
}: TechnicalAssessmentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("pdf")) {
      setError("Please select a PDF file for your technical assessment.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setError(null);
    setUploadedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const bucketName = "technical-assessments";

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("bucketName", bucketName);
      // Add timestamp to filename to ensure uniqueness
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const uploadedFileName = uploadedFile.name;
      const fileName = `${uploadedFileName}_${timestamp}.pdf`;
      formData.append("fileName", fileName);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file using existing upload endpoint
      const uploadResponse = await storageBucketService.uploadFile(
        bucketName,
        fileName,
        uploadedFile
      );

      const fileUrl = bucketName + "/" + fileName;
      // Create assessment submission record

      const submissionData = {
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        uploadedAt: new Date().toISOString(),
      };

      await assessmentService.createSubmission(
        candidateId,
        roundId,
        jobId,
        fileUrl,
        submissionData
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Call success callback
      onUploadSuccess?.(fileUrl, uploadedFile.name);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadedFile(null);

      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      onUploadError?.(error || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    if (existingAssessment?.url) {
      // Use the same logic as in ApplicationSuccessPage to extract bucket and file name
      let bucket = "technical-assessments"; // fallback default
      let url = existingAssessment.url;
      let file = url.split("/").pop() || "";
      console.log("file:", file);

      try {
        const blob = await storageBucketService.downloadFile(bucket, file);
        const typedBlob = new Blob([blob], { type: "application/pdf" });
        const downloadUrl = window.URL.createObjectURL(typedBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = file;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        setError("Failed to download file");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-blue-100 rounded-lg mr-3">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Technical Assessment
          </h3>
          <p className="text-sm text-gray-600">
            Upload your completed technical assessment (PDF only)
          </p>
        </div>
      </div>

      {/* Existing Assessment */}
      {existingAssessment?.url && existingAssessment.url.trim() !== "" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-900">
                  Assessment Submitted
                </p>
                <p className="text-sm text-green-700">
                  {existingAssessment.fileName} • Uploaded{" "}
                  {new Date(existingAssessment.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
              <button
                onClick={async () => {
                  if (existingAssessment?.url) {
                    let bucket = "technical-assessments";
                    let url = existingAssessment.url;
                    let file = url.split("/").pop() || "";
                    try {
                      const res = await storageBucketService.getFileUrl(
                        bucket,
                        file
                      );
                      const signedUrl = res.url;
                      if (signedUrl) {
                        window.open(signedUrl, "_blank");
                      } else {
                        setError("Failed to get viewable link");
                      }
                    } catch (err) {
                      setError("Failed to get viewable link");
                    }
                  }
                }}
                className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!existingAssessment && (
        <>
          {/* File Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Assessment File
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </button>
              {uploadedFile && (
                <span className="text-sm text-gray-600">
                  {uploadedFile.name} (
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              )}
            </div>
          </div>

          {/* Selected File */}
          {uploadedFile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">
                    {uploadedFile.name}
                  </span>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Uploading...
                </span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!uploadedFile || isUploading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Assessment
              </>
            )}
          </button>
        </>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Assessment Guidelines:
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Only PDF files are accepted</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Ensure your name and application ID are clearly visible</li>
          <li>• Complete all required sections before uploading</li>
        </ul>
      </div>
    </div>
  );
}
