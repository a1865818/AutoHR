import { ApiCompany, ApiJob } from "@/interfaces";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

export interface PublicCompany extends ApiCompany {
  jobCount: number;
}

export interface PublicCompanyDetails extends PublicCompany {
  jobs: ApiJob[];
}

class PublicCompanyService {
  // Get all public companies (no authentication required)
  async getPublicCompanies(filters?: {
    industry?: string;
  }): Promise<PublicCompany[]> {
    try {
      console.log("🌍 Fetching public companies...");

      const params = new URLSearchParams();
      if (filters?.industry) params.append("industry", filters.industry);

      const response = await fetch(
        `${API_BASE_URL}/public/companies${params.toString() ? `?${params.toString()}` : ""}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const companies = await response.json();
      console.log(`✅ Fetched ${companies.length} public companies`);
      return companies;
    } catch (error) {
      console.error("❌ Error fetching public companies:", error);
      throw new Error("Failed to fetch public companies");
    }
  }

  // Get a specific public company by ID with their jobs (no authentication required)
  async getPublicCompanyById(companyId: string): Promise<PublicCompanyDetails> {
    try {
      console.log(`🌍 Fetching public company: ${companyId}`);

      const response = await fetch(`${API_BASE_URL}/public/companies/${companyId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Company not found or is not available for public viewing");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const company = await response.json();
      console.log(`✅ Fetched public company: ${company.name}`);
      return company;
    } catch (error) {
      console.error(`❌ Error fetching public company ${companyId}:`, error);
      throw error;
    }
  }

  // Get unique industries from public companies for filtering
  async getPublicIndustries(): Promise<string[]> {
    try {
      const companies = await this.getPublicCompanies();
      const industries = companies
        .map(company => company.industry)
        .filter((industry, index, self) => industry && self.indexOf(industry) === index)
        .sort();
      
      return industries;
    } catch (error) {
      console.error("❌ Error fetching industries:", error);
      return [];
    }
  }
}

export const publicCompanyService = new PublicCompanyService();
export default publicCompanyService; 