"use client";

import React from "react";
import {
  Phone,
  Video,
  Code,
  MessageSquare,
  Users,
  Crown,
  Heart,
  FileText,
  Info,
  Lightbulb,
  Target,
  CheckCircle,
  Settings,
} from "lucide-react";

export type RoundType =
  | "phone_screening"
  | "video_interview"
  | "technical_assessment"
  | "coding_challenge"
  | "final_interview"
  | "culture_fit";

interface RoundInstructionsProps {
  roundType: RoundType;
  className?: string;
}

interface RoundInstructionData {
  icon: React.ComponentType<any>;
  title: string;
  purpose: string;
  description: string;
  configurationTips: string[];
  bestPractices: string[];
  keyMetrics: string[];
}

const ROUND_INSTRUCTIONS: Record<RoundType, RoundInstructionData> = {
  phone_screening: {
    icon: Phone,
    title: "Phone Screening",
    purpose: "Initial qualification call to assess basic fit and interest",
    description:
      "The phone screening is typically the first human interaction with candidates. It's designed to quickly assess basic qualifications, gauge genuine interest, and filter out candidates who clearly don't meet minimum requirements before investing time in more intensive interviews.",
    configurationTips: [
      "Keep duration between 15-30 minutes to respect everyone's time",
      "Focus on 3-5 key qualifying questions rather than many shallow ones",
      "Include salary expectations early to avoid misalignment later",
      "Ask about availability and notice period for logistics planning",
      "Test communication skills as this indicates phone/remote work ability",
    ],
    bestPractices: [
      "Start with a warm greeting and brief company/role overview",
      "Allow candidate to ask questions - their questions reveal engagement",
      "Take detailed notes for later reference and handoff to next interviewer",
      "End with clear next steps and timeline expectations",
      "Use this time to 'sell' your company to qualified candidates",
    ],
    keyMetrics: [
      "Relevant experience match",
      "Communication clarity",
      "Genuine interest level",
      "Salary alignment",
      "Availability fit",
    ],
  },
  video_interview: {
    icon: Video,
    title: "Video Interview",
    purpose:
      "In-depth conversation to assess skills, experience, and cultural fit",
    description:
      "Video interviews provide face-to-face interaction while maintaining efficiency. They allow for deeper behavioral assessment, portfolio review, and give candidates a better sense of the team. This format works well for most roles and provides visual cues that phone calls lack.",
    configurationTips: [
      "Plan for 45-90 minutes depending on role seniority and complexity",
      "Prepare 8-12 questions with natural follow-up opportunities",
      "Include time for candidate questions (10-15 minutes minimum)",
      "Test technology beforehand and have backup communication method",
      "Structure questions from general experience to specific scenarios",
    ],
    bestPractices: [
      "Ensure good lighting and professional background for both parties",
      "Start with ice-breaker to put candidate at ease",
      "Use screen sharing for portfolio reviews or technical discussions",
      "Pay attention to non-verbal communication and engagement",
      "Record key quotes and specific examples for accurate evaluation",
    ],
    keyMetrics: [
      "Technical competency",
      "Problem-solving approach",
      "Communication effectiveness",
      "Cultural alignment",
      "Relevant experience depth",
    ],
  },
  technical_assessment: {
    icon: Code,
    title: "Technical Assessment",
    purpose:
      "Evaluate technical knowledge, problem-solving, and domain expertise",
    description:
      "Technical assessments provide objective evaluation of a candidate's technical skills through practical problems, case studies, or knowledge-based questions. They help predict on-the-job performance and ensure technical competency before investment in further interviews.",
    configurationTips: [
      "Create realistic scenarios that mirror actual work challenges",
      "Include questions at varying difficulty levels to accommodate different experience",
      "Allow 60-120 minutes depending on assessment complexity",
      "Provide clear instructions and success criteria upfront",
      "Include both theoretical knowledge and practical application",
    ],
    bestPractices: [
      "Use problems relevant to the specific role and industry",
      "Focus on thought process and approach, not just correct answers",
      "Provide sample data or realistic constraints to guide solutions",
      "Allow candidates to ask clarifying questions during assessment",
      "Consider providing feedback regardless of pass/fail to maintain candidate experience",
    ],
    keyMetrics: [
      "Technical accuracy",
      "Problem decomposition",
      "Solution efficiency",
      "Code quality (if applicable)",
      "Practical application ability",
    ],
  },
  coding_challenge: {
    icon: Code,
    title: "Coding Challenge",
    purpose:
      "Assess programming skills, code quality, and software engineering practices",
    description:
      "Coding challenges evaluate hands-on programming ability through live coding sessions or take-home projects. They reveal coding style, debugging skills, testing practices, and ability to work under time pressure. Essential for engineering roles.",
    configurationTips: [
      "Choose problems that can be solved in allocated time with room for optimization",
      "Allow multiple programming languages candidates are comfortable with",
      "Include test cases and example inputs/outputs for clarity",
      "Set realistic time limits: 1-3 hours for take-home, 45-90 minutes for live coding",
      "Specify whether to focus on correctness, optimization, or code quality",
    ],
    bestPractices: [
      "Start with problem clarification and edge case discussion",
      "Encourage thinking out loud during live coding sessions",
      "Focus on problem-solving approach and code organization over perfect syntax",
      "Ask candidates to test their solution with provided examples",
      "Discuss time/space complexity and potential optimizations",
    ],
    keyMetrics: [
      "Algorithm correctness",
      "Code readability and structure",
      "Testing and debugging approach",
      "Time and space complexity awareness",
      "Communication during problem-solving",
    ],
  },
  final_interview: {
    icon: Crown,
    title: "Final Interview",
    purpose:
      "Executive-level decision making and final cultural/strategic fit assessment",
    description:
      "The final interview is the last step before an offer, typically conducted by senior leadership. It focuses on strategic fit, leadership potential, long-term goals alignment, and final decision-making. This is also where offer negotiations may begin.",
    configurationTips: [
      "Include senior stakeholders who will work closely with the role",
      "Focus on strategic thinking, leadership potential, and long-term vision",
      "Discuss compensation, benefits, and career growth opportunities",
      "Allow significant time for candidate questions about company direction",
      "Plan for 45-60 minutes to ensure thorough final evaluation",
    ],
    bestPractices: [
      "Discuss company vision, goals, and how the role contributes to success",
      "Assess strategic thinking and ability to influence at senior levels",
      "Address any remaining concerns or questions from previous interviews",
      "Begin relationship building and excitement about potential offer",
      "Ensure clear timeline for decision and next steps communication",
    ],
    keyMetrics: [
      "Strategic thinking ability",
      "Leadership potential",
      "Cultural and values alignment",
      "Long-term commitment potential",
      "Executive presence and communication",
    ],
  },
  culture_fit: {
    icon: Heart,
    title: "Culture Fit Assessment",
    purpose:
      "Evaluate alignment with company values, work style, and team dynamics",
    description:
      "Culture fit interviews assess how well candidates align with company values, work environment, and team dynamics. They help predict long-term satisfaction, retention, and team harmony. This is crucial for roles requiring high collaboration or representing company culture.",
    configurationTips: [
      "Define specific company values and cultural attributes to evaluate",
      "Use behavioral questions that reveal authentic personality and values",
      "Include team members who represent the culture candidate will join",
      "Ask about work style preferences, motivation, and ideal environment",
      "Focus on fit rather than forcing candidates to conform to stereotypes",
    ],
    bestPractices: [
      "Share authentic examples of company culture in action",
      "Ask about previous work environments they thrived or struggled in",
      "Discuss work-life balance, collaboration style, and feedback preferences",
      "Include informal elements like team lunch or office tour if possible",
      "Ensure cultural assessment doesn't introduce bias against diverse backgrounds",
    ],
    keyMetrics: [
      "Values alignment",
      "Work style compatibility",
      "Team collaboration potential",
      "Communication style fit",
      "Long-term cultural contribution potential",
    ],
  },
};

export function RoundInstructions({
  roundType,
  className = "",
}: RoundInstructionsProps) {
  const instruction = ROUND_INSTRUCTIONS[roundType];

  if (!instruction) {
    return null;
  }

  const IconComponent = instruction.icon;

  return (
    <div
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
          <IconComponent className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {instruction.title}
          </h3>
          <p className="text-sm text-blue-600 font-medium">
            {instruction.purpose}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed">
          {instruction.description}
        </p>
      </div>

      {/* Three columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Tips */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            <h4 className="font-semibold text-gray-900 text-sm">
              Configuration Tips
            </h4>
          </div>
          <ul className="space-y-2">
            {instruction.configurationTips.map((tip, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Best Practices */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-green-600" />
            <h4 className="font-semibold text-gray-900 text-sm">
              Best Practices
            </h4>
          </div>
          <ul className="space-y-2">
            {instruction.bestPractices.map((practice, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">{practice}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Metrics */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-600" />
            <h4 className="font-semibold text-gray-900 text-sm">
              Key Evaluation Areas
            </h4>
          </div>
          <ul className="space-y-2">
            {instruction.keyMetrics.map((metric, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">{metric}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom note */}
      <div className="mt-6 flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          <strong>Remember:</strong> These guidelines help ensure consistency
          and effectiveness. Adapt them based on your specific role
          requirements, company culture, and candidate feedback.
        </p>
      </div>
    </div>
  );
}
