import { toast } from '@/utils/toast';

// Resume interface that matches what ResumeSelector expects
export interface Resume {
  id: string;
  originalName: string; // This is what the component expects
  url: string;
  fileSize: number;
  uploadedAt: string;
  type?: "resume" | "cover_letter" | "portfolio" | "certificate" | "other";
  isDefault?: boolean;
  description?: string;
}

class ResumeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
  }

  private getAuthData() {
    if (typeof window === "undefined") {
      return { token: null, userId: null, userCategory: null, companyId: null };
    }

    // Check cookies first, then localStorage and sessionStorage
    let token = null;
    let userCategory = null;
    let userId = null;
    let companyId = null;

    // Try to get from cookies first
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf("authToken=") === 0) {
        token = decodeURIComponent(
          cookie.substring("authToken=".length, cookie.length)
        );
      } else if (cookie.indexOf("userCategory=") === 0) {
        userCategory = decodeURIComponent(
          cookie.substring("userCategory=".length, cookie.length)
        );
      } else if (cookie.indexOf("userData=") === 0) {
        try {
          const userData = JSON.parse(
            decodeURIComponent(
              cookie.substring("userData=".length, cookie.length)
            )
          );
          userId = userData.id;
          companyId = userData.companyId;
        } catch (error) {
          console.warn("Failed to parse userData from cookie:", error);
        }
      }
    }

    // Fallback to localStorage/sessionStorage if not found in cookies
    if (!token) {
      token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
    }
    if (!userCategory) {
      userCategory =
        localStorage.getItem("userCategory") ||
        sessionStorage.getItem("userCategory");
    }
    if (!userId || !companyId) {
      const currentUserStr =
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          if (!userId) userId = currentUser.id;
          if (!companyId) companyId = currentUser.companyId;
        } catch (error) {
          console.warn("Failed to parse currentUser from storage:", error);
        }
      }
    }

    return { token, userId, userCategory, companyId };
  }

  private getHeaders(): HeadersInit {
    const { token } = this.getAuthData();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Download resume file
  async downloadResume(resumeUrl: string, fileName: string): Promise<boolean> {
    const { token, userCategory } = this.getAuthData();
    
    if (!token) {
      toast.error("Please log in to download resumes");
      return false;
    }

    if (userCategory === "ApplicationUser") {
      toast.error("Access denied - only hiring users can download resumes");
      return false;
    }

    console.log("📤 Downloading resume:", { resumeUrl, fileName });

    try {
      // Parse resumeUrl to extract bucket name and file name
      // Expected format: "bucketName/fileName" or full URL
      let bucketName: string;
      let filePath: string;

      if (resumeUrl.startsWith("http")) {
        // Handle full URLs - extract the path
        const url = new URL(resumeUrl);
        const pathParts = url.pathname.split("/").filter(Boolean);
        if (pathParts.length >= 2) {
          bucketName = pathParts[0];
          filePath = pathParts.slice(1).join("/");
        } else {
          toast.error("Invalid resume URL format");
          return false;
        }
      } else {
        // Handle relative paths like "resume-storage/fileName"
        const pathParts = resumeUrl.split("/");
        if (pathParts.length >= 2) {
          bucketName = pathParts[0];
          filePath = pathParts.slice(1).join("/");
        } else {
          toast.error("Invalid resume URL format");
          return false;
        }
      }

      console.log("📁 Parsed resume URL:", { bucketName, filePath });

      // Use the storage bucket service to download the file
      const { storageBucketService } = await import('./storageBucketService');
      const blob = await storageBucketService.downloadFile(bucketName, filePath);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("✅ Resume downloaded successfully:", fileName);
      toast.success(`Resume "${fileName}" downloaded successfully`);
      return true;
    } catch (error) {
      console.error("❌ Failed to download resume:", error);
      toast.error("Failed to download resume. Please try again.");
      return false;
    }
  }

  // Get resume file information
  async getResumeFileInfo(resumeUrl: string): Promise<{
    fileName: string;
    fileType: string;
    fileSize?: string;
  } | null> {
    if (!resumeUrl) {
      toast.error("Resume URL is required");
      return null;
    }

    try {
      // Extract file information from URL
      const fileName = this.extractFileNameFromUrl(resumeUrl);
      const fileType = this.getFileTypeFromUrl(resumeUrl);

      return {
        fileName,
        fileType,
        fileSize: "Unknown", // File size would require additional API call
      };
    } catch (error) {
      console.error("❌ Failed to get resume file info:", error);
      toast.error("Failed to get resume file information");
      return null;
    }
  }

  // Extract file name from resume URL
  private extractFileNameFromUrl(resumeUrl: string): string {
    try {
      // Handle different URL formats
      if (resumeUrl.includes("/")) {
        const parts = resumeUrl.split("/");
        const fileName = parts[parts.length - 1];
        
        // Remove any query parameters
        const cleanFileName = fileName.split("?")[0];
        
        // If no extension, assume it's a PDF
        if (!cleanFileName.includes(".")) {
          return `${cleanFileName}.pdf`;
        }
        
        return cleanFileName;
      }
      
      return resumeUrl;
    } catch (error) {
      console.warn("Failed to extract file name from URL:", error);
      return "resume.pdf";
    }
  }

  // Get file type from resume URL
  private getFileTypeFromUrl(resumeUrl: string): string {
    try {
      const fileName = this.extractFileNameFromUrl(resumeUrl);
      const extension = fileName.split(".").pop()?.toLowerCase();
      
      switch (extension) {
        case "pdf":
          return "PDF";
        case "doc":
          return "DOC";
        case "docx":
          return "DOCX";
        case "txt":
          return "TXT";
        default:
          return extension?.toUpperCase() || "Unknown";
      }
    } catch (error) {
      console.warn("Failed to get file type from URL:", error);
      return "Unknown";
    }
  }

  // Get user's resumes
  async getUserResumes(): Promise<Resume[]> {
    const { token, userId } = this.getAuthData();
    
    if (!token || !userId) {
      toast.error("Please log in to view your resumes");
      return [];
    }

    try {
      // Get current user profile which contains the ResumeList
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        toast.error("Failed to load your resumes. Please try again.");
        return [];
      }

      const userData = await response.json();
      const resumeList = userData.resumeList || [];

      // Convert the backend resume format to our frontend format
      const resumes: Resume[] = resumeList.map((resume: any) => ({
        id: resume.id || `resume_${Date.now()}`,
        originalName: resume.originalName || resume.fileName || "Unknown",
        url: resume.url || resume.fileName || "",
        fileSize: resume.fileSize || 0,
        uploadedAt: resume.uploadedAt || new Date().toISOString(),
        type: "resume",
        isDefault: false,
        description: resume.description || "",
      }));

      return resumes;
    } catch (error) {
      console.error("❌ Failed to fetch user resumes:", error);
      toast.error("Failed to load your resumes. Please try again.");
      return [];
    }
  }

  // Validate resume file
  validateResumeFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = [
      "application/pdf"
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Please upload a PDF or Word document",
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 10MB",
      };
    }

    return { isValid: true };
  }

  // Upload resume
  async uploadResume(file: File): Promise<Resume | null> {
    const { token, userId } = this.getAuthData();
    
    if (!token || !userId) {
      toast.error("Please log in to upload a resume");
      return null;
    }

    // Validate file first
    const validation = this.validateResumeFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return null;
    }

    try {
      // Use storage bucket service to upload
      const { storageBucketService } = await import('./storageBucketService');
      const uploadResult = await storageBucketService.uploadResume(file, userId);

      // Create resume object
      const newResume: Resume = {
        id: `resume_${Date.now()}`,
        originalName: file.name,
        url: uploadResult.url,
        fileSize: uploadResult.fileSize,
        uploadedAt: uploadResult.uploadedAt,
        type: "resume",
        isDefault: false,
      };

      // Get current user profile to update ResumeList
      const currentResumes = await this.getUserResumes();
      const updatedResumeList = [...currentResumes, newResume];

      // Save to user profile using the existing API
      const { apiService } = await import('./api');
      await apiService.updateApplicationUserProfile({
        resumeList: updatedResumeList.map(resume => ({
          id: resume.id,
          originalName: resume.originalName,
          url: resume.url,
          fileSize: resume.fileSize,
          uploadedAt: resume.uploadedAt,
          type: resume.type,
          isDefault: resume.isDefault,
          description: resume.description,
        }))
      });

      console.log("✅ Resume uploaded successfully:", newResume);
      toast.success(`Resume "${file.name}" uploaded successfully`);

      return newResume;
    } catch (error) {
      console.error("❌ Failed to upload resume:", error);
      toast.error("Failed to upload resume. Please try again.");
      return null;
    }
  }

  // Delete resume
  async deleteResume(resumeId: string): Promise<boolean> {
    const { token, userId } = this.getAuthData();
    
    if (!token || !userId) {
      toast.error("Please log in to delete resumes");
      return false;
    }

    try {
      // Get current resumes
      const currentResumes = await this.getUserResumes();
      const updatedResumeList = currentResumes.filter(r => r.id !== resumeId);

      // Update user profile with the filtered resume list
      const { apiService } = await import('./api');
      await apiService.updateApplicationUserProfile({
        resumeList: updatedResumeList.map(resume => ({
          id: resume.id,
          originalName: resume.originalName,
          url: resume.url,
          fileSize: resume.fileSize,
          uploadedAt: resume.uploadedAt,
          type: resume.type,
          isDefault: resume.isDefault,
          description: resume.description,
        }))
      });

      console.log("✅ Resume deleted successfully:", resumeId);
      toast.success("Resume deleted successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to delete resume:", error);
      toast.error("Failed to delete resume. Please try again.");
      return false;
    }
  }

  // Download resume file (alias for existing method)
  async downloadResumeFile(resume: Resume): Promise<boolean> {
    return this.downloadResume(resume.url, resume.originalName);
  }
}

export const resumeService = new ResumeService(); 