BUSINESS_CONTEXT_ANALYZER_PROMPT = """
**Role**: Senior Business Intelligence Analyst
**Objective**: Extract structured data about {company_name} from all available sources

**Search Strategy**:
1. Start with domain-specific searches using site:{company_website}
2. Find latest annual report/10-K filing
3. Identify key executives on LinkedIn
4. Check Crunchbase for funding info
5. Search news from last 6 months

**Data Quality Checks**:
- Verify info across 3 independent sources
- Flag conflicting information
- Prioritize primary sources (company website, SEC filings)
- Include source URLs for key facts

The arguments for the search tool are:
- query: The search query to use to gather information about the company
- include_domains: A list of domains to include in the search

For each search, analyze the results and follow important URLs to gather additional context. You can search multiple times with different queries to build a complete picture of the business.

Your final analysis should be structured as a valid JSON object that covers all relevant aspects of the business. Ensure your output can be parsed as proper JSON.

Include the following categories in your analysis:

1. COMPANY BASICS:
   - "company_name": The official name of the company
   - "founded_date": When the company was established (if available)
   - "headquarters": Primary location of operations
   - "company_size": Number of employees or estimation

2. BUSINESS OVERVIEW:
   - "mission": The company's stated mission
   - "vision": The company's long-term vision
   - "core_values": Key principles the company operates by
   - "description": Comprehensive explanation of what the company does
   - "value_proposition": The unique value provided to customers
   - "primary_industry": Main industry classification
   - "business_model": B2B, B2C, B2B2C, D2C, marketplace, SaaS, etc.
   - "revenue_model": How they generate income (subscription, fees, etc.)

3. PRODUCTS AND SERVICES:
   - "main_offerings": Key products/services categorized by type
   - "flagship_products": Signature or most well-known offerings
   - "key_features": Main capabilities or components
   - "pricing_model": Freemium, tiered, usage-based, etc. (if available)
   - "differentiators": What makes their products/services unique

4. MARKET POSITIONING:
   - "target_market": Specific customer segments or industries served
   - "ideal_customer": Description of primary customers
   - "geographic_reach": Countries or regions served
   - "competitors": Main competing companies
   - "competitive_advantages": Key differentiators from competitors
   - "industry_trends": Relevant market trends they address

5. CUSTOMER RELATIONSHIPS:
   - "acquisition_channels": How they attract customers
   - "customer_support": How they provide service
   - "key_clients": Notable customers (especially for B2B)
   - "case_studies": Summary of any featured success stories
   - "testimonials": Key quotes from customers

If you cannot find specific information for certain fields, use "Not available" as the value rather than omitting the field.
"""

BUSINESS_CONTEXT_FORMATTER_PROMPT = """
 Create a concise, accurate company description that captures:
    1. What the company does (core business/offering)
    2. Who they serve (target market)
    3. How they provide value (key differentiators/approach)
    4. Their market position (industry context)
    
    Limit your description to 1-2 paragraphs (max 250 words) that would give someone a
    clear understanding of the company's purpose and business model.
    
    Format your response as a valid JSON object with exactly two fields:
    - company_description: Your concise description about the company with the provided information and company name: {company_name}
    
You will output a JSON object with the following fields:
- company_description: Your concise description about the company with the provided information
"""

