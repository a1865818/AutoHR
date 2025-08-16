import { AssessmentGrade } from '@/interfaces/assessment';

export interface RoundAssessmentScore {
  score: number;
  isHRGraded: boolean;
  gradedAt?: string;
  status: 'not_attempted' | 'submitted' | 'graded' | 'auto_generated';
  maxScore: number;
  percentage: number;
}

export interface CandidateAssessmentScores {
  [roundId: string]: RoundAssessmentScore;
}

export interface JobAssessmentScores {
  [candidateId: string]: CandidateAssessmentScores;
}

class AssessmentScoreService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  private getAuthData() {
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

  /**
   * Fetch assessment scores for all candidates in a job
   */
  async getAssessmentScoresForJob(jobId: string): Promise<JobAssessmentScores> {
    try {
      const response = await fetch(
        `${this.baseUrl}/assessments/scores/job/${jobId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {};
        }
        throw new Error(`Failed to fetch assessment scores: ${response.statusText}`);
      }

      const scores = await response.json();
      return scores;
    } catch (error) {
      console.error("❌ Failed to fetch assessment scores for job:", error);
      return {};
    }
  }

  /**
   * Fetch assessment scores for a specific candidate in a job
   */
  async getAssessmentScoresForCandidate(
    jobId: string,
    candidateUserId: string
  ): Promise<CandidateAssessmentScores> {
    try {
      const response = await fetch(
        `${this.baseUrl}/assessments/scores/job/${jobId}/candidate/${candidateUserId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {};
        }
        throw new Error(`Failed to fetch candidate assessment scores: ${response.statusText}`);
      }

      const scores = await response.json();
      return scores;
    } catch (error) {
      console.error("❌ Failed to fetch candidate assessment scores:", error);
      return {};
    }
  }

  /**
   * Fetch assessment score for a specific candidate in a specific round
   */
  async getAssessmentScoreForRound(
    jobId: string,
    candidateUserId: string,
    roundId: string
  ): Promise<RoundAssessmentScore | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/assessments/scores/job/${jobId}/candidate/${candidateUserId}/round/${roundId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch round assessment score: ${response.statusText}`);
      }

      const score = await response.json();
      return score;
    } catch (error) {
      console.error("❌ Failed to fetch round assessment score:", error);
      return null;
    }
  }

  /**
   * Get the appropriate assessment score for display based on stage and round
   */
  getDisplayScore(
    candidateStage: string,
    currentRoundId: string,
    assessmentScores: CandidateAssessmentScores,
    autoGeneratedScore: number = 75
  ): {
    score: number;
    isHRGraded: boolean;
    status: string;
  } {
    // For Applied stage, use auto-generated score
    if (candidateStage === 'Applied') {
      return {
        score: autoGeneratedScore,
        isHRGraded: false,
        status: 'auto_generated'
      };
    }

    // For other stages, check if we have HR-graded score
    const roundScore = assessmentScores[currentRoundId];
    if (roundScore && roundScore.isHRGraded) {
      return {
        score: roundScore.score,
        isHRGraded: true,
        status: 'graded'
      };
    }

    // If no HR grade, check if assessment was submitted
    if (roundScore && roundScore.status === 'submitted') {
      return {
        score: 0,
        isHRGraded: false,
        status: 'pending_grading'
      };
    }

    // Default to auto-generated for ungraded assessments
    return {
      score: autoGeneratedScore,
      isHRGraded: false,
      status: 'auto_generated'
    };
  }
}

export const assessmentScoreService = new AssessmentScoreService();
