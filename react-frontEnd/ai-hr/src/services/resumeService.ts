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
}

export const resumeService = new ResumeService(); 