import { Question } from "@/components/interview_pipeline/rounds/shared/QuestionBuilder";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

export interface AssessmentSubmission {
  id: string;
  candidateId: string;
  roundId: string;
  jobId: string;
  submittedAt: string;
  pdfUrl: string;
  status: "submitted" | "graded" | "pending";
  submissionData?: any;
}

export interface QuestionScore {
  questionId: string;
  score: number;
  maxScore: number;
  notes: string;
}

export interface AssessmentGrade {
  id: string;
  submissionId: string;
  candidateId: string;
  roundId: string;
  jobId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallNotes: string;
  questionScores: QuestionScore[];
  gradedAt: string;
  gradedBy: string;
  status: "draft" | "final";
}

export interface AssessmentGradeRequest {
  submissionId: string;
  totalScore: number;
  maxScore: number;
  overallNotes: string;
  questionScores: QuestionScore[];
}

class AssessmentService {
  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      // Try to get from cookies first
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === " ") {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf("authToken=") === 0) {
          return decodeURIComponent(
            cookie.substring("authToken=".length, cookie.length)
          );
        }
      }

      // Fallback to localStorage/sessionStorage
      return (
        localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
      );
    }
    return null;
  }

  private async fetchApi(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {};

    if (options?.method && ["POST", "PUT", "PATCH"].includes(options.method)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          ...headers,
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          errorData = text
            ? JSON.parse(text)
            : { error: `HTTP ${response.status}: ${response.statusText}` };
        } catch (e) {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        if (response.status === 401) {
          console.error("🚫 Unauthorized - Token may be invalid or expired");
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            sessionStorage.removeItem("authToken");
          }
          throw new Error("Authentication required. Please log in again.");
        }

        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");

      if (!contentType || contentLength === "0") {
        return null;
      }

      if (contentType.includes("application/json")) {
        const text = await response.text();

        if (!text || text.trim() === "") {
          return null;
        }

        try {
          return JSON.parse(text);
        } catch (parseError: any) {
          console.error("❌ JSON Parse Error:", parseError);
          throw new Error(
            `Invalid JSON response from server: ${parseError.message}`
          );
        }
      }

      const text = await response.text();
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          return JSON.parse(text);
        } catch (parseError: any) {
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      }

      return text || null;
    } catch (error: any) {
      if (
        error.message &&
        (error.message.includes("JSON") || error.message.includes("HTTP"))
      ) {
        throw error;
      }

      console.error("🚨 Network/Fetch Error:", { url, error });
      throw new Error(`Network error: ${error.message || "Unknown error"}`);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Test method to check if the API is accessible
  async testApiConnection(): Promise<boolean> {
    try {
      console.log("🔍 Testing API connection...");
      const result = await this.fetchApi("/assessments/test");
      console.log("✅ API connection successful:", result);
      return true;
    } catch (error) {
      console.error("❌ API connection failed:", error);
      console.log("⚠️ Backend not available, using mock data mode");
      return false;
    }
  }

  // Save grade locally for mock submissions
  private saveMockGrade(gradeData: AssessmentGradeRequest): AssessmentGrade {
    const mockGrade: AssessmentGrade = {
      id: `mock_grade_${Date.now()}`,
      submissionId: gradeData.submissionId,
      candidateId: "mock_candidate", // Will be extracted from submission
      roundId: "mock_round", // Will be extracted from submission
      jobId: "mock_job", // Will be extracted from submission
      totalScore: gradeData.totalScore,
      maxScore: gradeData.maxScore,
      percentage:
        gradeData.maxScore > 0
          ? (gradeData.totalScore / gradeData.maxScore) * 100
          : 0,
      overallNotes: gradeData.overallNotes,
      questionScores: gradeData.questionScores,
      gradedBy: "mock_grader",
      gradedAt: new Date().toISOString(),
      status: "final",
    };

    // Save to localStorage for persistence
    const existingGrades = this.getMockGrades();
    existingGrades.push(mockGrade);
    localStorage.setItem(
      "mock_assessment_grades",
      JSON.stringify(existingGrades)
    );

    console.log("💾 Mock grade saved locally:", mockGrade);
    return mockGrade;
  }

  // Get all mock grades from localStorage
  private getMockGrades(): AssessmentGrade[] {
    try {
      const grades = localStorage.getItem("mock_assessment_grades");
      return grades ? JSON.parse(grades) : [];
    } catch (error) {
      console.error("Error reading mock grades:", error);
      return [];
    }
  }

  // Get mock grade for a specific submission
  async getMockGrade(submissionId: string): Promise<AssessmentGrade | null> {
    const grades = this.getMockGrades();
    return grades.find((grade) => grade.submissionId === submissionId) || null;
  }

  // Get all mock grades for a submission (for history)
  async getMockGradeHistory(submissionId: string): Promise<AssessmentGrade[]> {
    const grades = this.getMockGrades();
    return grades.filter((grade) => grade.submissionId === submissionId);
  }

  // Get all mock grades (for admin view)
  async getAllMockGrades(): Promise<AssessmentGrade[]> {
    return this.getMockGrades();
  }

  // Get assessment submission for a candidate and round
  async getAssessmentSubmission(
    candidateId: string,
    roundId: string
  ): Promise<AssessmentSubmission | null> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view assessment submission");
    }

    try {
      const submission = await this.fetchApi(
        `/assessments/submissions/${candidateId}/${roundId}`
      );
      return submission;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null; // No submission found
      }
      console.error("❌ Failed to load assessment submission:", error);
      throw error;
    }
  }

  // Get assessment grade for a submission
  async getAssessmentGrade(
    submissionId: string
  ): Promise<AssessmentGrade | null> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view assessment grade");
    }

    try {
      const grade = await this.fetchApi(`/assessments/grades/${submissionId}`);
      return grade;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null; // No grade found
      }
      console.error("❌ Failed to load assessment grade:", error);
      throw error;
    }
  }

  // Save assessment grade
  async saveAssessmentGrade(
    data: AssessmentGradeRequest
  ): Promise<AssessmentGrade> {
    try {
      console.log("💾 Saving assessment grade:", data);
      console.log("💾 API URL:", `${API_BASE_URL}/assessments/grades`);
      console.log("💾 Request body:", JSON.stringify(data, null, 2));

      // Always try to save to backend first
      const grade = await this.fetchApi("/assessments/grades", {
        method: "POST",
        body: JSON.stringify(data),
      });

      console.log("✅ Assessment grade saved successfully:", grade);
      return grade;
    } catch (error) {
      console.error("❌ Error saving assessment grade:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check if it's a 404 error (backend not running)
      if (error instanceof Error && error.message.includes("404")) {
        console.log("🔄 Backend not running (404), saving locally as fallback");
        const mockGrade = this.saveMockGrade(data);
        console.log("✅ Grade saved locally:", mockGrade);
        return mockGrade;
      }

      // For other errors, still save locally as fallback
      console.log("🔄 Backend error, saving locally as fallback");
      return this.saveMockGrade(data);
    }
  }

  // Update assessment grade
  async updateAssessmentGrade(
    gradeId: string,
    data: Partial<AssessmentGradeRequest>
  ): Promise<AssessmentGrade> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to update assessment grade");
    }

    try {
      const grade = await this.fetchApi(`/assessments/grades/${gradeId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return grade;
    } catch (error) {
      console.error("❌ Failed to update assessment grade:", error);
      throw error;
    }
  }

  // Get all assessment submissions for a job
  async getJobAssessmentSubmissions(
    jobId: string
  ): Promise<AssessmentSubmission[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view assessment submissions");
    }

    try {
      const submissions = await this.fetchApi(
        `/assessments/submissions/job/${jobId}`
      );
      return submissions || [];
    } catch (error) {
      console.error("❌ Failed to load job assessment submissions:", error);
      throw error;
    }
  }

  // Get all assessment submissions for a round
  async getRoundAssessmentSubmissions(
    roundId: string
  ): Promise<AssessmentSubmission[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to view assessment submissions");
    }

    try {
      const submissions = await this.fetchApi(
        `/assessments/submissions/round/${roundId}`
      );
      return submissions || [];
    } catch (error) {
      console.error("❌ Failed to load round assessment submissions:", error);
      throw error;
    }
  }

  // Create a submission for testing (will be replaced with real submission later)
  async createMockSubmission(
    candidateId: string,
    roundId: string,
    jobId: string
  ): Promise<AssessmentSubmission> {
    if (!this.isAuthenticated()) {
      throw new Error(
        "Authentication required to create assessment submission"
      );
    }

    try {
      const submissionData = {
        candidateId,
        roundId,
        jobId,
        pdfUrl: "/interview-faq.pdf", // Using the attached PDF for now
        submissionData: {
          mock: true,
          createdAt: new Date().toISOString(),
        },
      };

      const submission = await this.fetchApi("/assessments/submissions", {
        method: "POST",
        body: JSON.stringify(submissionData),
      });

      console.log("📝 Created submission:", submission);
      return submission;
    } catch (error) {
      console.error("❌ Failed to create assessment submission:", error);
      throw error;
    }
  }

  // Create a new assessment submission
  async createSubmission(
    candidateId: string,
    roundId: string,
    jobId: string,
    pdfUrl: string,
    submissionData: any
  ): Promise<AssessmentSubmission> {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required to create assessment submission");
    }

    try {
      const requestBody = {
        CandidateId: candidateId,
        candidateId: candidateId,
        RoundId: roundId,
        roundId: roundId,
        JobId: jobId,
        jobId: jobId,
        PdfUrl: pdfUrl, 
        SubmissionData: submissionData,
        submissionData: submissionData,
      };
      console.log('[AssessmentService] Submitting assessment:', requestBody);
      const submission = await this.fetchApi("/assessments/submissions", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return submission;
    } catch (error) {
      console.error("❌ Failed to create assessment submission:", error);
      throw error;
    }
  }

  // Mock method to get questions for a round
  async getRoundQuestions(jobId: string, roundId: string): Promise<Question[]> {
    // This would normally fetch from the round configuration
    // For now, return mock questions
    const mockQuestions: Question[] = [
      {
        id: "q1",
        text: "Explain the difference between synchronous and asynchronous programming. Provide examples of when you would use each approach.",
        type: "open",
        category: "Technical",
        difficulty: "medium",
        points: 20,
        required: true,
      },
      {
        id: "q2",
        text: "Describe the SOLID principles of object-oriented design. How do you apply these principles in your code?",
        type: "open",
        category: "Technical",
        difficulty: "hard",
        points: 25,
        required: true,
      },
      {
        id: "q3",
        text: "What is the time complexity of a binary search algorithm? Explain why and provide a brief implementation.",
        type: "open",
        category: "Technical",
        difficulty: "medium",
        points: 15,
        required: true,
      },
      {
        id: "q4",
        text: "How would you handle a situation where a critical bug is discovered in production? Walk through your debugging and deployment process.",
        type: "scenario",
        category: "Experience",
        difficulty: "medium",
        points: 20,
        required: true,
      },
      {
        id: "q5",
        text: "Rate your experience with the following technologies (1-5 scale): JavaScript, React, Node.js, TypeScript, SQL",
        type: "rating",
        category: "Technical",
        difficulty: "easy",
        points: 10,
        required: true,
      },
    ];

    return mockQuestions;
  }
}

export const assessmentService = new AssessmentService();
