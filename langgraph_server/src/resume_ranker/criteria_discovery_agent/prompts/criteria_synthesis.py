"""Criteria Synthesis Agent Prompts

This module contains prompts for the criteria synthesis agent responsible for 
generating weighted evaluation criteria based on job analysis.
"""

SYSTEM_PROMPT = """You are an expert in HR evaluation frameworks, specializing in creating weighted assessment criteria for candidate evaluation.

Your task is to synthesize job requirements and company information into a structured evaluation framework with:
1. 6-12 specific evaluation criteria covering both technical and soft skills
2. Intelligent weights for each criterion based on role criticality and impact
3. Detailed scoring rubrics for consistent evaluation
4. Adaptations based on role seniority and requirements

Create criteria that are specific, measurable, and directly relevant to success in the role.
Ensure weights reflect the true priorities of the position, not just what's mentioned most frequently."""

PLANNING_PROMPT_TEMPLATE = """
Based on the comprehensive job analysis and company information provided, develop a strategic approach for creating evaluation criteria.

JOB ANALYSIS:
{job_analysis}

COMPANY INFORMATION:
{company_info}

Please provide a comprehensive planning analysis that includes:

1. **CRITERIA STRATEGY**:
   - Overall approach for evaluating candidates for this role
   - Key dimensions to assess (technical skills, soft skills, experience, cultural fit, etc.)
   - Prioritization strategy based on role criticality and impact

2. **WEIGHT DISTRIBUTION PHILOSOPHY**:
   - How to balance technical vs. soft skills requirements
   - Considerations for experience level requirements
   - Impact of company culture and values on weighting
   - Role-specific priorities that should influence weights

3. **EVALUATION DIMENSIONS ANALYSIS**:
   - Technical requirements and their relative importance
   - Soft skills crucial for success in this role
   - Experience and background factors
   - Cultural fit and company-specific factors
   - Growth potential and adaptability considerations

4. **RUBRIC DESIGN PRINCIPLES**:
   - How to make scoring criteria specific and measurable
   - Differentiating factors between performance levels
   - Role-specific success indicators
   - Objective vs. subjective assessment considerations

5. **QUALITY ASSURANCE STRATEGY**:
   - How to ensure criteria are comprehensive but not redundant
   - Balancing specificity with practicality
   - Ensuring unbiased and fair evaluation framework

Provide detailed reasoning for your strategic recommendations. Focus on creating an evaluation framework that accurately predicts success in this specific role and company context.
"""

STRUCTURING_PROMPT_TEMPLATE = """
Based on the strategic planning analysis below, create a structured set of evaluation criteria.

STRATEGIC PLANNING ANALYSIS:
{planning_analysis}

Convert this strategic analysis into 6-12 specific evaluation criteria with the following structure:

**REQUIREMENTS FOR EACH CRITERION:**

1. **Name**: Clear, concise criterion name
2. **Description**: Detailed explanation of what this criterion evaluates
3. **Weight**: Numerical weight (all weights must sum to 1.0)

**CRITERIA DEVELOPMENT GUIDELINES:**

- Create diverse criteria covering technical skills, soft skills, experience, and cultural fit
- Ensure weights reflect the strategic priorities identified in planning
- Avoid redundancy between criteria
- Consider both current capabilities and growth potential
- Include company-specific and role-specific factors

**QUALITY CHECKS:**
- Verify all weights sum to exactly 1.0
- Ensure each criterion has clear differentiation between scoring levels
- Confirm criteria are comprehensive but not overlapping
- Validate that high-priority areas from job analysis are adequately weighted

Extract and structure the evaluation framework based on the strategic analysis provided.

Please create:

1. 4-8 specific evaluation criteria (both technical and soft skills)
2. Weight each criterion (weights should sum to 1.0)

Format your response as a structured JSON object with this schema:
[
  {{
    "name": "Criterion Name 1",
    "description": "Detailed description of what this criterion evaluates",
    "weight": 0.XX,
  }},
  {{
    "name": "Criterion Name 2",
    "description": "Detailed description of what this criterion evaluates",
    "weight": 0.XX,
  }},
  ...
]
"""
