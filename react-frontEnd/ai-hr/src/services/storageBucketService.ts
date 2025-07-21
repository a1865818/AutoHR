// services/storageBucketService.ts
interface StorageBucketResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface FileUploadResponse {
  url?: string;
  path?: string;
  fullPath?: string;
  id?: string;
}

interface SignedUrlResponse {
  url?: string;
  token?: string;
  error?: string;
}

class StorageBucketService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
  }

  private getHeaders(): HeadersInit {
    const token = 
      localStorage.getItem('authToken') || 
      sessionStorage.getItem('authToken');
    
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText || response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      }

      return {} as T;
    } catch (error) {
      console.error('Storage API request failed:', error);
      throw error;
    }
  }

  // Create storage bucket
  async createBucket(bucketName: string): Promise<StorageBucketResponse> {
    return this.makeRequest<StorageBucketResponse>(`/create-bucket?bucketName=${encodeURIComponent(bucketName)}`, {
      method: 'POST',
    });
  }

  // Upload file to bucket
  async uploadFile(
    bucketName: string, 
    fileName: string, 
    file: File
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('fileContent', file);

    const response = await fetch(
      `${this.baseUrl}/upload-file?bucketName=${encodeURIComponent(bucketName)}&fileName=${encodeURIComponent(fileName)}`, 
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    return response.json();
  }

  // Upload file with content (for text/binary content)
  async uploadFileContent(
    bucketName: string, 
    fileName: string, 
    fileContent: string
  ): Promise<FileUploadResponse> {
    return this.makeRequest<FileUploadResponse>(
      `/upload-file?bucketName=${encodeURIComponent(bucketName)}&fileName=${encodeURIComponent(fileName)}&fileContent=${encodeURIComponent(fileContent)}`, 
      {
        method: 'POST',
      }
    );
  }

  // Get signed URL for file access
  async getFileUrl(bucketName: string, fileName: string): Promise<SignedUrlResponse> {
    return this.makeRequest<SignedUrlResponse>(
      `/get-file-url?bucketName=${encodeURIComponent(bucketName)}&fileName=${encodeURIComponent(fileName)}`
    );
  }

  // List files in bucket
  async listFiles(bucketName: string): Promise<any[]> {
    const response = await this.makeRequest<any>(`/list-files?bucketName=${encodeURIComponent(bucketName)}`);
    return response?.files || response || [];
  }

  // Download file
  async downloadFile(bucketName: string, fileName: string): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/download-file?bucketName=${encodeURIComponent(bucketName)}&fileName=${encodeURIComponent(fileName)}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Delete file
  async deleteFile(bucketName: string, fileName: string): Promise<StorageBucketResponse> {
    return this.makeRequest<StorageBucketResponse>(
      `/delete-file?bucketName=${encodeURIComponent(bucketName)}&fileName=${encodeURIComponent(fileName)}`
    );
  }

  // Helper method to upload PDF resume
  async uploadResume(file: File, userId: string): Promise<{
    url: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
  }> {
    // Validate file
    if (!file.type.includes('pdf') && !file.type.includes('doc')) {
      throw new Error('Only PDF and DOC files are supported for resume upload');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }

    const bucketName =  process.env.BUCKET_NAME || 'resume-storage';
    console.log('bucketName', bucketName);
    const fileName = `${userId}_${Date.now()}_${file.name}`;

    try {

      // Upload file
      const uploadResponse = await this.uploadFile(bucketName, fileName, file);
      
      // Get public URL
      const urlResponse = await this.getFileUrl(bucketName, fileName);

      return {
        url: urlResponse.url || `${bucketName}/${fileName}`,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Resume upload failed:', error);
      throw new Error(`Resume upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const storageBucketService = new StorageBucketService(); 