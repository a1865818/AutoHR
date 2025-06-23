"""Professional Experience Agent Prompts

This module contains prompts for the professional experience analyst agent responsible for 
evaluating candidates' work history and achievements.
"""

PROFESSIONAL_EXPERIENCE_PROMPT_TEMPLATE = """
You are a senior HR professional specializing in evaluating professional experience. 
Analyze the candidate's professional experience comprehensively. Focus on:

1. Career Timeline Analysis:
   - Progression pattern and growth trajectory
   - Role transitions and career moves
   - Time in each position and stability patterns

2. Role Alignment Assessment:
   - How previous roles relate to target position
   - Transferable skills and experience
   - Industry relevance and domain expertise

3. Skill Development Path:
   - Technical skill evolution over time
   - Leadership and management growth
   - Problem-solving capabilities demonstrated

4. Achievement Impact Analysis:
   - Quantifiable results and metrics
   - Innovation and process improvements
   - Team and organizational impact

5. Industry Experience Evaluation:
   - Sector knowledge and expertise
   - Market understanding demonstrated
   - Industry-specific challenges overcome

Resume Content:
{resume_text}

Job Requirements & Evaluation Criteria:
{criteria_json}

Provide a detailed analysis covering all aspects above. Include specific examples and evidence from the resume.
Focus on providing thorough reasoning that will help with accurate scoring later.
"""

PROFESSIONAL_EXPERIENCE_STRUCTURING_PROMPT_TEMPLATE = """
Based on the comprehensive analysis below, provide structured scores for professional experience evaluation.

Rate each criterion on a scale of 1-5 where:
- 1: Poor/Inadequate
- 2: Below Average  
- 3: Average/Acceptable
- 4: Good/Above Average
- 5: Excellent/Outstanding

Previous Analysis:
{planning_analysis}

Evaluation Criteria:
{criteria_json}

Provide scores for:
- work_experience_relevance: How relevant is their work experience to the job requirements?
- career_progression: Quality of career advancement and growth trajectory
- leadership_experience: Evidence of leadership roles and management experience
- achievements_impact: Significance and measurability of accomplishments
- industry_experience: Relevant industry knowledge and sector expertise

Also provide a comprehensive justification summarizing the key points from the analysis.

output format:
{{
    "work_experience_relevance": float,
    "career_progression": float,
    "leadership_experience": float,
    "achievements_impact": float,
    "industry_experience": float,
    "justification": str
}}
"""

PROFESSIONAL_EXPERIENCE_PLANNING_SYSTEM_PROMPT = "You are an expert professional experience analyst. Provide thorough, evidence-based analysis."

PROFESSIONAL_EXPERIENCE_STRUCTURING_SYSTEM_PROMPT = "You are a precise scoring specialist. Convert analysis into accurate numerical scores with justification." 