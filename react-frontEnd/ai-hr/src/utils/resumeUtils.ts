// Utility functions for handling resume files

export function extractFileNameFromUrl(resumeUrl: string): string {
  if (!resumeUrl) {
    return "resume.pdf";
  }

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
      
      if (cleanFileName.includes("_") && cleanFileName.includes(".")) {
        const parts = cleanFileName.split("_");
        const extension = cleanFileName.split(".").pop();
        
        const meaningfulParts = parts.filter(part => 
          /[a-zA-Z]/.test(part) && 
          !part.match(/^\d+$/) &&
          !part.match(/^[a-f0-9-]+$/i) &&
          part.length > 2
        );
        
        if (meaningfulParts.length > 0) {
          // Only add extension if the meaningful parts don't already end with it
          const reconstructed = meaningfulParts.join("_");
          if (reconstructed.endsWith(`.${extension}`)) {
            return reconstructed;
          } else {
            return `${reconstructed}.${extension}`;
          }
        }
      }
      
      return cleanFileName;
    } else {
      // Handle URLs without slashes - treat the whole URL as filename
      const cleanFileName = resumeUrl.split("?")[0];
      if (!cleanFileName.includes(".")) {
        return `${cleanFileName}.pdf`;
      }
      return cleanFileName;
    }
  } catch (error) {
    console.error("Error processing resume URL:", error);
    return "resume.pdf"; // fallback
  }
}

/**
 * Get file type from resume URL
 */
export function getFileTypeFromUrl(resumeUrl: string): string {
  if (!resumeUrl) {
    return "Unknown";
  }

  try {
    const fileName = extractFileNameFromUrl(resumeUrl);
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
      case "rtf":
        return "RTF";
      default:
        return extension?.toUpperCase() || "Unknown";
    }
  } catch (error) {
    console.warn("Failed to get file type from URL:", error);
    return "Unknown";
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return "📄";
    case "doc":
    case "docx":
      return "📝";
    case "txt":
      return "📃";
    case "rtf":
      return "📄";
    default:
      return "📎";
  }
}

/**
 * Validate if a file is a valid resume format
 */
export function isValidResumeFile(fileName: string): boolean {
  const validExtensions = [".pdf", ".doc", ".docx", ".txt", ".rtf"];
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  return validExtensions.includes(extension);
}

/**
 * Get resume file information from URL
 */
export function getResumeFileInfo(resumeUrl: string): {
  fileName: string;
  fileType: string;
  fileIcon: string;
} {
  const fileName = extractFileNameFromUrl(resumeUrl);
  const fileType = getFileTypeFromUrl(resumeUrl);
  const fileIcon = getFileIcon(fileType);

  return {
    fileName,
    fileType,
    fileIcon,
  };
}

/**
 * Create a download link for resume file
 */
export function createResumeDownloadLink(resumeUrl: string, fileName: string): string {
  if (!resumeUrl) {
    return "";
  }

  try {
    // If it's already a full URL, return as is
    if (resumeUrl.startsWith("http://") || resumeUrl.startsWith("https://")) {
      return resumeUrl;
    }

    // Parse resumeUrl to extract bucket name and file name
    // Expected format: "bucketName/fileName"
    const pathParts = resumeUrl.split("/");
    if (pathParts.length >= 2) {
      const bucketName = pathParts[0];
      const filePath = pathParts.slice(1).join("/");
      
      // Use the correct download-file endpoint
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
      return `${baseUrl}/download-file?bucketName=${encodeURIComponent(bucketName)}&fileName=${encodeURIComponent(filePath)}`;
    }

    // Fallback to original format if parsing fails
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
    return `${baseUrl}/storage/download?filePath=${encodeURIComponent(resumeUrl)}`;
  } catch (error) {
    console.warn("Failed to create download link:", error);
    return "";
  }
}

/**
 * Check if resume URL is accessible
 */
export async function isResumeAccessible(resumeUrl: string): Promise<boolean> {
  if (!resumeUrl) {
    return false;
  }

  try {
    const response = await fetch(resumeUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.warn("Resume URL not accessible:", error);
    return false;
  }
} 