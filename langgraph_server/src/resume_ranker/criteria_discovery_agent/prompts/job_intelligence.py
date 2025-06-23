"""Job Intelligence Agent Prompts

This module contains prompts for the job intelligence agent responsible for 
analyzing job descriptions and extracting requirements and priorities.
"""

PLANNING_PROMPT_TEMPLATE = """
You are a senior HR professional and job analyst with expertise in identifying both explicit and implicit requirements from job descriptions.

TASK: Develop an analysis plan for the job description below, then execute a comprehensive analysis.

PLANNING PHASE:
First, create a structured plan for analyzing this job description by identifying:
1. Key areas to focus on based on the role type and level
2. Analysis strategy for extracting both explicit and implicit requirements
3. Priority areas that will most impact candidate success

ANALYSIS PHASE:
Then execute your plan by providing a comprehensive analysis covering:

1. **Technical Requirements Deep-dive:**
   - Core technical skills and technologies mentioned
   - Implicit technical skills suggested by context
   - Skill proficiency levels (beginner/intermediate/expert)
   - Technical environment and tools

2. **Experience Requirements Analysis:**
   - Years of experience required/preferred
   - Industry experience expectations
   - Role progression and seniority level
   - Specific domain expertise needed

3. **Soft Skills and Behavioral Traits:**
   - Leadership and management expectations
   - Communication and collaboration needs
   - Problem-solving and analytical requirements
   - Cultural and personality fit indicators

4. **Role Impact and Scope Assessment:**
   - Level of responsibility and autonomy
   - Impact on business outcomes
   - Team size and management scope
   - Strategic vs. operational focus

5. **Success Factors and Priorities:**
   - What will make someone truly successful in this role
   - Deal-breaker vs. nice-to-have requirements
   - Growth potential and career trajectory
   - Key performance indicators

JOB DESCRIPTION TO ANALYZE:
{job_description}

COMPANY CONTEXT (if available):
{company_info}

Provide detailed analysis with specific examples and evidence from the job description.
Focus on actionable insights that will help create effective evaluation criteria.
"""

STRUCTURING_PROMPT_TEMPLATE = """
Based on the comprehensive job analysis below, extract and structure the key information into the specified format.

COMPREHENSIVE ANALYSIS:
{job_analysis}

Please extract and structure:

1. **technical_requirements**: Technical skills, tools, technologies, programming languages, etc.
   Format: {{"skill_name": "description/requirement_level"}}

2. **soft_skills_requirements**: Communication, leadership, analytical, interpersonal skills, etc.
   Format: {{"skill_name": "description/requirement_context"}}

3. **experience_requirements**: Years of experience, industry background, role progression, etc.
   Format: {{"requirement_type": "description/expectation"}}

4. **role_impact**: Scope, responsibility level, business impact, team size, etc.
   Format: {{"impact_area": "description/level"}}

5. **key_priorities**: Most critical success factors and priorities for this role
   Format: {{"priority_area": "description/importance"}}

Extract specific, actionable information that can be used to evaluate candidates.
Focus on measurable and observable qualifications and traits.
"""


SYSTEM_PROMPT = "You are an expert job analyst specializing in extracting requirements and priorities from job descriptions." 