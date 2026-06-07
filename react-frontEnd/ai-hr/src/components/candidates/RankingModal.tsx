import { CandidateWithJobDetails } from "@/interfaces";
import {
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  Phone,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { AssessmentIcon } from "./AssessmentIcon";

interface RankingModalProps {
  candidate: CandidateWithJobDetails | null;
  isOpen: boolean;
  onClose: () => void;
  rank: number;
}

export function RankingModal({
  candidate,
  isOpen,
  onClose,
  rank,
}: RankingModalProps) {
  const [showFullFeedback, setShowFullFeedback] = useState(false);

  if (!isOpen || !candidate) return null;

  // Real per-dimension scores from the resume_ranker AI analysis. Falls back to
  // the overall assessment score for candidates ranked via the heuristic
  // (no aiAnalysisData persisted).
  const a = (candidate.aiAnalysisData ?? {}) as Record<string, number | string>;
  const aiAnalysis = {
    skillMatch: Math.round(Number(a.skillMatch ?? candidate.assessment)),
    experienceMatch: Math.round(Number(a.experienceMatch ?? candidate.assessment)),
    cultureMatch: Math.round(Number(a.cultureMatch ?? candidate.assessment)),
    communicationScore: Math.round(
      Number(a.communicationScore ?? a.cultureMatch ?? candidate.assessment)
    ),
  };

  // Rich written justification from the resume_ranker, when present.
  const detailedFeedback =
    typeof a.detailedFeedback === "string" ? a.detailedFeedback.trim() : "";

  const ScoreCard = ({
    title,
    score,
    icon,
    description,
  }: {
    title: string;
    score: number;
    icon: React.ReactNode;
    description: string;
  }) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <span
          className={`text-2xl font-bold ${
            score >= 90
              ? "text-green-600"
              : score >= 80
              ? "text-blue-600"
              : score >= 70
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {score}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${
            score >= 90
              ? "bg-green-500"
              : score >= 80
              ? "bg-blue-500"
              : score >= 70
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  return (
    <>
      {/* Backdrop with blur effect */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">
                  #{rank}
                </span>
              </div>
              <img
                src={
                  candidate.photo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    candidate.name
                  )}&size=64&background=e5e7eb&color=374151&rounded=true`
                }
                alt={candidate.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {candidate.name}
                </h2>
                <p className="text-gray-600">
                  {candidate.role || candidate.jobTitle}
                </p>
                <p className="text-sm text-gray-500">{candidate.company}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Overall Score Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Overall Assessment
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium text-gray-900">
                    Total Score
                  </span>
                  <div className="scale-150">
                    <AssessmentIcon score={candidate.assessment} />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      candidate.assessment === 100
                        ? "bg-green-500"
                        : candidate.assessment >= 80
                        ? "bg-green-500"
                        : candidate.assessment >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${candidate.assessment}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* AI Analysis Breakdown */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI Analysis Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScoreCard
                  title="Skill Match"
                  score={aiAnalysis.skillMatch}
                  icon={<Target className="h-5 w-5 text-blue-500" />}
                  description="How well the candidate's skills match job requirements"
                />
                <ScoreCard
                  title="Experience Match"
                  score={aiAnalysis.experienceMatch}
                  icon={<Briefcase className="h-5 w-5 text-green-500" />}
                  description="Relevance and depth of professional experience"
                />
                <ScoreCard
                  title="Culture Match"
                  score={aiAnalysis.cultureMatch}
                  icon={<Users className="h-5 w-5 text-purple-500" />}
                  description="Alignment with company values and culture"
                />
                <ScoreCard
                  title="Communication"
                  score={aiAnalysis.communicationScore}
                  icon={<Phone className="h-5 w-5 text-orange-500" />}
                  description="Communication skills assessment"
                />
              </div>
            </div>

            {/* AI Analysis Text */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI Analysis Summary
              </h3>

              {/* Real, AI-written detailed feedback from resume_ranker (when present) */}
              {detailedFeedback && (
                <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                    AI-Generated Detailed Feedback
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {showFullFeedback || detailedFeedback.length <= 320
                      ? detailedFeedback
                      : `${detailedFeedback.slice(0, 320).trimEnd()}…`}
                  </p>
                  {detailedFeedback.length > 320 && (
                    <button
                      onClick={() => setShowFullFeedback((prev) => !prev)}
                      className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {showFullFeedback ? (
                        <>
                          Show less <ChevronUp className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="prose prose-sm max-w-none">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <Brain className="h-4 w-4 mr-2 text-indigo-500" />
                      Overall Assessment
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {candidate.name} demonstrates{" "}
                      {candidate.assessment >= 90
                        ? "exceptional"
                        : candidate.assessment >= 80
                        ? "strong"
                        : candidate.assessment >= 70
                        ? "adequate"
                        : "developing"}{" "}
                      potential for this role with an overall score of{" "}
                      {candidate.assessment}%.
                      {candidate.assessment >= 85
                        ? " This candidate shows outstanding qualifications and would be an excellent addition to the team."
                        : candidate.assessment >= 70
                        ? " This candidate meets most requirements and shows good potential for growth."
                        : " This candidate may need additional development but shows promise in key areas."}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-blue-500" />
                      Skills & Experience Analysis
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      The candidate&apos;s skill set shows a{" "}
                      {aiAnalysis.skillMatch >= 85
                        ? "strong"
                        : aiAnalysis.skillMatch >= 70
                        ? "good"
                        : "moderate"}{" "}
                      match ({aiAnalysis.skillMatch}%) with the job
                      requirements. Their professional experience demonstrates{" "}
                      {aiAnalysis.experienceMatch >= 85
                        ? "highly relevant"
                        : aiAnalysis.experienceMatch >= 70
                        ? "relevant"
                        : "some relevant"}{" "}
                      background ({aiAnalysis.experienceMatch}%) in{" "}
                      {candidate.jobDepartment || "the required field"}.
                      {aiAnalysis.skillMatch >= 80 &&
                      aiAnalysis.experienceMatch >= 80
                        ? " The combination of skills and experience makes them a strong candidate for immediate contribution."
                        : " With proper onboarding, they should be able to contribute effectively to the team."}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-500" />
                      Cultural Fit Assessment
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      Based on their application materials and background,{" "}
                      {candidate.name} shows{" "}
                      {aiAnalysis.cultureMatch >= 85
                        ? "excellent"
                        : aiAnalysis.cultureMatch >= 70
                        ? "good"
                        : "potential"}{" "}
                      alignment ({aiAnalysis.cultureMatch}%) with company values
                      and culture.
                      {aiAnalysis.cultureMatch >= 80
                        ? " They appear to share similar work values and would likely integrate well with the existing team dynamics."
                        : " Further discussion during interviews would help assess cultural alignment more thoroughly."}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-orange-500" />
                      Communication & Collaboration
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      The candidate&apos;s communication skills are assessed at{" "}
                      {aiAnalysis.communicationScore}%, indicating{" "}
                      {aiAnalysis.communicationScore >= 85
                        ? "strong"
                        : aiAnalysis.communicationScore >= 70
                        ? "adequate"
                        : "developing"}{" "}
                      ability to express ideas clearly and collaborate
                      effectively.
                      {candidate.coverLetterText
                        ? " Their cover letter demonstrates clear written communication and thoughtful presentation of their qualifications."
                        : " A cover letter was not provided, which may indicate areas for improvement in written communication."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                      Recommendation
                    </h4>
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {candidate.assessment >= 85
                        ? `🌟 Highly Recommended: ${candidate.name} is an excellent candidate who should proceed to the next interview round immediately.`
                        : candidate.assessment >= 70
                        ? `✅ Recommended: ${candidate.name} meets the job requirements and should be considered for further evaluation.`
                        : `⚠️ Consider with Caution: ${candidate.name} shows potential but may need additional assessment to determine fit.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Application Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Applied:{" "}
                    {new Date(candidate.appliedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Stage: {candidate.stage}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Status: {candidate.status}
                  </span>
                </div>
                {candidate.jobDepartment && (
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Department: {candidate.jobDepartment}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default RankingModal;
