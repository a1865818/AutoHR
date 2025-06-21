"""Cultural Fit Agent Prompts

This module contains prompts for the cultural fit agent responsible for 
evaluating candidates' alignment with company culture and values.
"""

CULTURAL_FIT_PROMPT_TEMPLATE = """
You are a senior cultural fit assessment specialist with expertise in organizational psychology.
Analyze the candidate's cultural fit potential comprehensively. Focus on:

1. Values Alignment Assessment:
   - Personal values expressed through resume language
   - Alignment with company values and mission
   - Evidence of value-driven decision making
   - Cultural indicators in career choices

2. Communication Style Analysis:
   - Writing style and professionalism
   - Clarity and structure of information presentation
   - Evidence of effective communication skills
   - Adaptability in communication approaches

3. Work Environment Fit Evaluation:
   - Preference indicators for work environments
   - Team vs individual work patterns
   - Adaptability to different organizational structures
   - Remote/hybrid work capability evidence

4. Team Collaboration Indicators:
   - Evidence of successful teamwork
   - Leadership in collaborative projects
   - Cross-functional collaboration experience
   - Mentoring and knowledge sharing patterns

5. Cultural Adaptability Assessment:
   - Experience in diverse environments
   - Adaptability to change and new challenges
   - Growth mindset indicators
   - Innovation and creativity markers

Resume Content:
{resume_text}

Company Information:
{company_info}

Job Requirements & Evaluation Criteria:
{criteria_json}

Provide a detailed analysis covering all aspects above. Include specific examples from the resume.
Focus on providing thorough reasoning that will help with accurate scoring later.
"""

CULTURAL_FIT_STRUCTURING_PROMPT_TEMPLATE = """
Based on the comprehensive cultural fit analysis below, provide structured scores for evaluation.

Rate each criterion on a scale of 1-5 where:
- 1: Poor/Inadequate
- 2: Below Average  
- 3: Average/Acceptable
- 4: Good/Above Average
- 5: Excellent/Outstanding

Previous Analysis:
{planning_analysis}

Company Information:
{company_info}

Evaluation Criteria:
{criteria_json}

Provide scores for:
- values_alignment: Alignment between candidate and company values
- communication_style: Fit of communication style with company culture
- work_environment_fit: Compatibility with company work environment
- team_collaboration: Potential for effective team collaboration
- cultural_adaptability: Ability to adapt to and thrive in company culture

Also provide a comprehensive justification summarizing the key points from the analysis.

output format:
{{
    "values_alignment": float,
    "communication_style": float,
    "work_environment_fit": float,
    "team_collaboration": float,
    "cultural_adaptability": float,
    "justification": str
}}
"""

CULTURAL_FIT_PLANNING_SYSTEM_PROMPT = "You are an expert cultural fit analyst. Provide thorough, evidence-based analysis."

CULTURAL_FIT_STRUCTURING_SYSTEM_PROMPT = "You are a precise scoring specialist. Convert analysis into accurate numerical scores with justification." 