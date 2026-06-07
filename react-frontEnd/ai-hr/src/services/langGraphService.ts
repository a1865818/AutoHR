import { apiService } from "./api";

/**
 * Input expected by the `job_description_generator` graph. The backend forwards
 * this object (JSON-encoded) to the graph, which `json.loads()` it and pulls
 * each field out by name — so the keys must match exactly (snake_case).
 */
export interface JdGeneratorInput {
  company_name: string;
  company_description: string;
  job_title: string;
  required_experience: string;
  required_technical_skills: string[];
  soft_skills: string[];
  working_conditions: string;
  education_requirements: string;
  key_responsibilities: string[];
}

/** Shape of the per-graph LangGraph feature endpoints: `{ data, success }`. */
interface LangGraphDataResponse<T> {
  data: T;
  success: boolean;
}

class LangGraphService {
  /**
   * Generate a job description via the `job_description_generator` graph.
   *
   * The backend takes `inputString` as a URL-encoded JSON **query param** (not a
   * body) and runs the graph synchronously. The graph is slow (~20-40s), so the
   * caller should keep a spinner up for the duration. Errors are surfaced via the
   * shared request layer's toast; this returns `null` on any failure.
   */
  async generateJobDescription(
    input: JdGeneratorInput,
    recursionLimit = 200,
    timeoutMs = 120000
  ): Promise<string | null> {
    const inputString = encodeURIComponent(JSON.stringify(input));
    const endpoint = `/langgraph/jd-generator?inputString=${inputString}&recursionLimit=${recursionLimit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await apiService.makeRequest<LangGraphDataResponse<string>>(
        endpoint,
        { method: "POST", signal: controller.signal }
      );

      if (response && response.success && typeof response.data === "string") {
        return response.data;
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Run the `business_context_analyzer` graph and return the markdown research
   * report. Very slow (~1-3 min: Tavily search + multi-step research), so give it
   * a generous timeout and an async/loading UX.
   */
  async analyzeBusinessContext(
    companyName: string,
    companyUrl: string,
    locale = "en-US",
    timeoutMs = 240000
  ): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await apiService.makeRequest<LangGraphDataResponse<string>>(
        "/langgraph/business-context",
        {
          method: "POST",
          body: JSON.stringify({ companyName, companyUrl, locale }),
          signal: controller.signal,
        }
      );

      if (response && response.success && typeof response.data === "string") {
        return response.data;
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const langGraphService = new LangGraphService();
