import { Question } from "@/components/interview_pipeline/rounds/shared/QuestionBuilder";
import { toast } from "@/utils/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

export interface AssessmentSubmission {
  id: string;
  candidateId: string;
  roundId: string;
  jobId: string;
  submittedAt: string;
  pdfUrl?: string | null;
  githubUrl?: string | null;
  status: "submitted" | "graded" | "pending";
  submissionData?: Record<string, unknown>;
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
        } catch {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            sessionStorage.removeItem("authToken");
          }
          toast.error("Your session has expired. Please log in again.");
          return null;
        }

        const errorMessage = errorData.error || `Request failed with status ${response.status}`;
        toast.error(errorMessage);
        return null;
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
        } catch (parseError: unknown) {
          console.error("❌ JSON Parse Error:", parseError);
          toast.error("Received invalid response from server. Please try again.");
          return null;
        }
      }

      const text = await response.text();
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          return JSON.parse(text);
        } catch (parseError: unknown) {
          toast.error("Received invalid response format. Please try again.");
          return null;
        }
      }

      return text || null;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes("JSON") || error.message.includes("HTTP"))
      ) {
        throw error;
      }

      console.error("🚨 Network/Fetch Error:", { url, error });
      toast.error("Network connection failed. Please check your connection and try again.");
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Diagnostic method to check what's causing the 500 error
  async diagnoseSubmissionError(): Promise<{
    candidateExists: boolean;
    roundExists: boolean;
    jobExists: boolean;
    authValid: boolean;
    issues: string[];
  }> {
    const diagnosis = {
      candidateExists: false,
      roundExists: false,
      jobExists: false,
      authValid: false,
      issues: [] as string[],
    };

    try {
      // Check authentication by testing the API
      await this.fetchApi("/assessments/test");
      diagnosis.authValid = true;
      console.log("✅ Authentication is valid");
    } catch (error) {
      diagnosis.authValid = false;
      diagnosis.issues.push("Authentication failed - invalid or expired token");
      console.error("❌ Authentication test failed:", error);
    }

    // Note: We can't directly check if candidate/round/job exist without specific endpoints
    // But we can provide guidance based on the error
    console.log("🔍 Diagnosis complete:", diagnosis);

    if (!diagnosis.authValid) {
      diagnosis.issues.push("Try logging out and logging back in");
    }

    return diagnosis;
  }

  // Get assessment submission for a candidate and round
  async getAssessmentSubmission(
    candidateId: string,
    roundId: string
  ): Promise<AssessmentSubmission | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view assessment submission");
      return null;
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
      toast.error("Unable to load assessment submission. Please try again.");
      return null;
    }
  }

  // Get assessment grade for a submission
  async getAssessmentGrade(
    submissionId: string
  ): Promise<AssessmentGrade | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view assessment grade");
      return null;
    }

    try {
      const grade = await this.fetchApi(`/assessments/grades/${submissionId}`);
      return grade;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null; // No grade found
      }
      console.error("❌ Failed to load assessment grade:", error);
      toast.error("Unable to load assessment grade. Please try again.");
      return null;
    }
  }

  // Save assessment grade
  async saveAssessmentGrade(
    data: AssessmentGradeRequest
  ): Promise<AssessmentGrade | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to save assessment grade");
      return null;
    }

    try {
      console.log("💾 Saving assessment grade:", data);
      console.log("💾 API URL:", `${API_BASE_URL}/assessments/grades`);
      console.log("💾 Request body:", JSON.stringify(data, null, 2));

      const grade = await this.fetchApi("/assessments/grades", {
        method: "POST",
        body: JSON.stringify(data),
      });

      console.log("✅ Assessment grade saved successfully:", grade);
      toast.success("Assessment grade saved successfully!");
      return grade;
    } catch (error) {
      console.error("❌ Error saving assessment grade:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error("Failed to save assessment grade. Please try again.");
      return null;
    }
  }

  // Update assessment grade
  async updateAssessmentGrade(
    gradeId: string,
    data: Partial<AssessmentGradeRequest>
  ): Promise<AssessmentGrade | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to update assessment grade");
      return null;
    }

    try {
      const grade = await this.fetchApi(`/assessments/grades/${gradeId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      toast.success("Assessment grade updated successfully!");
      return grade;
    } catch (error) {
      console.error("❌ Failed to update assessment grade:", error);
      toast.error("Failed to update assessment grade. Please try again.");
      return null;
    }
  }

  // Delete assessment grade by grade ID
  async deleteAssessmentGrade(gradeId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to delete assessment grade");
      return false;
    }
    try {
      await this.fetchApi(`/assessments/grades/${gradeId}`, {
        method: "DELETE",
      });
      console.log("✅ Assessment grade deleted successfully");
      toast.success("Assessment grade deleted successfully!");
      return true;
    } catch (error) {
      console.error("❌ Failed to delete assessment grade:", error);
      toast.error("Failed to delete assessment grade. Please try again.");
      return false;
    }
  }

  // Get all assessment submissions for a job
  async getJobAssessmentSubmissions(
    jobId: string
  ): Promise<AssessmentSubmission[]> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view assessment submissions");
      return [];
    }

    try {
      const submissions = await this.fetchApi(
        `/assessments/submissions/job/${jobId}`
      );
      return submissions || [];
    } catch (error) {
      console.error("❌ Failed to load job assessment submissions:", error);
      toast.error("Unable to load assessment submissions for this job. Please try again.");
      return [];
    }
  }

  // Get all assessment submissions for a round
  async getRoundAssessmentSubmissions(
    roundId: string
  ): Promise<AssessmentSubmission[]> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view assessment submissions");
      return [];
    }

    try {
      const submissions = await this.fetchApi(
        `/assessments/submissions/round/${roundId}`
      );
      return submissions || [];
    } catch (error) {
      console.error("❌ Failed to load round assessment submissions:", error);
      toast.error("Unable to load assessment submissions for this round. Please try again.");
      return [];
    }
  }

  // Check if candidate has submitted an assessment for this round
  async hasSubmittedAssessment(
    candidateId: string,
    roundId: string
  ): Promise<boolean> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to check submission status");
      return false;
    }

    try {
      console.log("🔍 Checking submission status for:", {
        candidateId,
        roundId,
        candidateIdType: typeof candidateId,
        roundIdType: typeof roundId,
        candidateIdLength: candidateId?.length,
        roundIdLength: roundId?.length,
        endpoint: `/assessments/submissions/${candidateId}/${roundId}`,
        apiBaseUrl: API_BASE_URL,
      });

      const submission = await this.getAssessmentSubmission(
        candidateId,
        roundId
      );

      console.log("🔍 Submission check result:", {
        candidateId,
        roundId,
        foundSubmission: !!submission,
        submissionStatus: submission?.status,
        submissionData: submission,
      });

      return (
        submission !== null &&
        (submission.status === "submitted" || submission.status === "graded")
      );
    } catch (error) {
      console.error("❌ Failed to check submission status:", error);
      console.error("❌ Error details:", {
        candidateId,
        roundId,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  // Check if a submission has been graded by verifying actual grade record exists
  async isSubmissionGraded(
    candidateId: string,
    roundId: string
  ): Promise<boolean> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to check grading status");
      return false;
    }

    try {
      console.log("🔍 Checking if submission is graded for:", {
        candidateId,
        roundId,
      });

      // First, get the submission
      const submission = await this.getAssessmentSubmission(
        candidateId,
        roundId
      );

      if (!submission) {
        console.log("📝 No submission found - not graded");
        return false;
      }

      // Then, check if an actual grade record exists for this submission
      try {
        const grade = await this.getAssessmentGrade(submission.id);
        const isGraded = grade !== null;

        console.log("🔍 Grade check result:", {
          candidateId,
          roundId,
          submissionId: submission.id,
          submissionStatus: submission.status,
          gradeExists: isGraded,
          gradeData: grade,
        });

        return isGraded;
      } catch (gradeError) {
        // If we get a 404 for the grade, it means no grade exists
        if (gradeError instanceof Error && gradeError.message.includes("404")) {
          console.log("📝 No grade record found - submission not graded");
          return false;
        }
        throw gradeError;
      }
    } catch (error) {
      console.error("❌ Failed to check grading status:", error);
      return false;
    }
  }

  // Create a new assessment submission
  async createSubmission(
    candidateId: string,
    roundId: string,
    jobId: string,
    pdfUrl: string | null,
    submissionData: Record<string, unknown>,
    githubUrl?: string | null
  ): Promise<AssessmentSubmission | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to submit your assessment");
      return null;
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
        pdfUrl: pdfUrl,
        GithubUrl: githubUrl ?? null,
        githubUrl: githubUrl ?? null,
        SubmissionData: submissionData,
        submissionData: submissionData,
      };
      console.log("[AssessmentService] Submitting assessment:", requestBody);
      const submission = await this.fetchApi("/assessments/submissions", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      toast.success("Assessment submitted successfully!");
      return submission;
    } catch (error) {
      console.error("❌ Failed to create assessment submission:", error);
      toast.error("Failed to submit assessment. Please try again.");
      return null;
    }
  }

  // Get submission data for a candidate and round
  async getSubmission(
    candidateId: string,
    roundId: string
  ): Promise<(AssessmentSubmission & { grade?: AssessmentGrade }) | null> {
    if (!this.isAuthenticated()) {
      toast.error("Please log in to view submission");
      return null;
    }

    try {
      console.log(
        `[AssessmentService] Fetching submission for candidate ${candidateId} in round ${roundId}`
      );

      // Fetch submission data
      const submission = await this.fetchApi(
        `/assessments/submissions/${candidateId}/${roundId}`
      );

      // Try to fetch grade data if submission exists
      let grade = null;
      try {
        grade = await this.fetchApi(
          `/assessments/grades/${submission.id}`
        );
      } catch (gradeError) {
        console.log("No grade found for this submission:", gradeError);
      }

      return {
        ...submission,
        grade,
      };
    } catch (error) {
      console.error("❌ Failed to fetch submission:", error);
      
      // Check if it's a 404 error (no submission found)
      if (error instanceof Error && error.message.includes("404")) {
        console.log("📭 No submission found for this candidate and round");
        return null; // Return null to indicate no submission
      }
      
      toast.error("Failed to load submission details. Please try again.");
      return null;
    }
  }

  // Mock method to get questions for a round
  async getRoundQuestions(): Promise<Question[]> {
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
