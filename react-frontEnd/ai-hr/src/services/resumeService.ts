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
  async downloadResume(resumeUrl: string, fileName: string): Promise<void> {
    const { token, userCategory } = this.getAuthData();
    
    if (!token) {
      throw new Error("User not authenticated");
    }

    if (userCategory === "ApplicationUser") {
      throw new Error("Access denied - only hiring users can download resumes");
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
          throw new Error("Invalid resume URL format");
        }
      } else {
        // Handle relative paths like "resume-storage/fileName"
        const pathParts = resumeUrl.split("/");
        if (pathParts.length >= 2) {
          bucketName = pathParts[0];
          filePath = pathParts.slice(1).join("/");
        } else {
          throw new Error("Invalid resume URL format");
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
    } catch (error) {
      console.error("❌ Failed to download resume:", error);
      throw error;
    }
  }

  // Get resume file information
  async getResumeFileInfo(resumeUrl: string): Promise<{
    fileName: string;
    fileType: string;
    fileSize?: string;
  }> {
    if (!resumeUrl) {
      throw new Error("Resume URL is required");
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
      throw error;
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
      throw new Error("User not authenticated");
    }

    try {
      // Get current user profile which contains the ResumeList
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
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
      throw error;
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
  async uploadResume(file: File): Promise<Resume> {
    const { token, userId } = this.getAuthData();
    
    if (!token || !userId) {
      throw new Error("User not authenticated");
    }

    // Validate file first
    const validation = this.validateResumeFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid file");
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

      return newResume;
    } catch (error) {
      console.error("❌ Failed to upload resume:", error);
      throw error;
    }
  }

  // Delete resume
  async deleteResume(resumeId: string): Promise<void> {
    const { token, userId } = this.getAuthData();
    
    if (!token || !userId) {
      throw new Error("User not authenticated");
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
    } catch (error) {
      console.error("❌ Failed to delete resume:", error);
      throw error;
    }
  }

  // Download resume file (alias for existing method)
  async downloadResumeFile(resume: Resume): Promise<void> {
    return this.downloadResume(resume.url, resume.originalName);
  }
}

export const resumeService = new ResumeService(); 