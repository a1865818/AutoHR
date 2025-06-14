import { storageBucketService } from './storageBucketService';

export interface Resume {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  fileSize: number;
  uploadedAt: string;
}

export interface ResumeListResponse {
  resumes: Resume[];
}

class ResumeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";
  }

  private getHeaders(): HeadersInit {
    const token = 
      localStorage.getItem('authToken') || 
      sessionStorage.getItem('authToken');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private getAuthData() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const userCategory = localStorage.getItem('userCategory') || sessionStorage.getItem('userCategory');

    return { token, userId, userCategory };
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
      console.error('Resume API request failed:', error);
      throw error;
    }
  }

  // Upload new resume and add to user's resume list
  async uploadResume(file: File): Promise<Resume> {
    const { userId } = this.getAuthData();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Upload file to storage bucket
      const uploadResult = await storageBucketService.uploadResume(file, userId);
      
      // Create resume object
      const newResume: Resume = {
        id: `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: `${userId}_${Date.now()}_${file.name}`,
        originalName: file.name,
        url: uploadResult.url,
        fileSize: uploadResult.fileSize,
        uploadedAt: uploadResult.uploadedAt,
      };

      // Add to user's resume list
      await this.addResumeToUserList(newResume);

      return newResume;
    } catch (error) {
      console.error('Resume upload failed:', error);
      throw new Error(`Resume upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add resume to user's ResumeList in database
  private async addResumeToUserList(resume: Resume): Promise<void> {
    try {
      // Get current user's resume list
      const currentResumes = await this.getUserResumes();
      
      // Add new resume to the list
      const updatedResumes = [...currentResumes, resume];
      
      // Update user profile with new resume list
      await this.updateUserResumeList(updatedResumes);
    } catch (error) {
      console.error('Failed to add resume to user list:', error);
      throw error;
    }
  }

  // Get user's current resume list
  async getUserResumes(): Promise<Resume[]> {
    try {
      const userProfile = await this.makeRequest<any>('/auth/me');
      
      if (!userProfile.resumeList || !Array.isArray(userProfile.resumeList)) {
        return [];
      }

      return userProfile.resumeList.map((item: any) => ({
        id: item.id || `resume_${Date.now()}`,
        fileName: item.fileName || '',
        originalName: item.originalName || item.fileName || 'Unknown',
        url: item.url || '',
        fileSize: item.fileSize || 0,
        uploadedAt: item.uploadedAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to get user resumes:', error);
      return [];
    }
  }

  // Update user's resume list in database
  private async updateUserResumeList(resumes: Resume[]): Promise<void> {
    try {
      const resumeListData = resumes.map(resume => ({
        id: resume.id,
        fileName: resume.fileName,
        originalName: resume.originalName,
        url: resume.url,
        fileSize: resume.fileSize,
        uploadedAt: resume.uploadedAt,
      }));
      
      await this.makeRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ResumeList: resumeListData
        }),
      });
    } catch (error) {
      console.error('Failed to update user resume list:', error);
      throw error;
    }
  }

  // Delete resume from user's list and storage
  async deleteResume(resumeId: string): Promise<void> {
    try {
      // Get current resumes
      const currentResumes = await this.getUserResumes();
      
      // Find the resume to delete
      const resumeToDelete = currentResumes.find(r => r.id === resumeId);
      if (!resumeToDelete) {
        throw new Error('Resume not found');
      }

      // Remove from storage bucket
      try {
        const bucketName = 'resumes';
        await storageBucketService.deleteFile(bucketName, resumeToDelete.fileName);
      } catch (storageError) {
        console.warn('Failed to delete from storage, continuing with database cleanup:', storageError);
      }

      // Remove from user's list
      const updatedResumes = currentResumes.filter(r => r.id !== resumeId);
      await this.updateUserResumeList(updatedResumes);
    } catch (error) {
      console.error('Failed to delete resume:', error);
      throw error;
    }
  }

  // Get resume download URL
  async getResumeDownloadUrl(resume: Resume): Promise<string> {
    try {
      if (resume.url.startsWith('http')) {
        return resume.url; // Already a full URL
      }

      // Get signed URL from storage
      const bucketName = 'resumes';
      const urlResponse = await storageBucketService.getFileUrl(bucketName, resume.fileName);
      
      return urlResponse.signedURL || resume.url;
    } catch (error) {
      console.error('Failed to get download URL:', error);
      return resume.url; // Fallback to original URL
    }
  }

  // Validate resume file
  validateResumeFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only PDF and Word documents are allowed'
      };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    return { isValid: true };
  }
}

export const resumeService = new ResumeService(); 