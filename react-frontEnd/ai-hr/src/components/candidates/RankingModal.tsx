// import { CandidateWithJobDetails } from "@/interfaces";
// import {
//   Brain,
//   Briefcase,
//   Calendar,
//   CheckCircle2,
//   Crown,
//   Phone,
//   Star,
//   Target,
//   TrendingUp,
//   User,
//   Users,
//   X,
// } from "lucide-react";
// import { AssessmentIcon } from "./AssessmentIcon";

// interface RankingModalProps {
//   candidate: CandidateWithJobDetails | null;
//   isOpen: boolean;
//   onClose: () => void;
//   rank: number;
// }

// export function RankingModal({
//   candidate,
//   isOpen,
//   onClose,
//   rank,
// }: RankingModalProps) {
//   if (!isOpen || !candidate) return null;

//   // Generate mock AI analysis data based on the candidate's assessment score
//   const generateMockAnalysis = (baseScore: number) => {
//     const variance = (Math.random() - 0.5) * 10; // ±5 variance
//     return {
//       skillMatch: Math.max(0, Math.min(100, Math.round(baseScore + variance))),
//       experienceMatch: Math.max(
//         0,
//         Math.min(100, Math.round(baseScore + variance * 0.8))
//       ),
//       cultureMatch: Math.max(
//         0,
//         Math.min(100, Math.round(baseScore + variance * 0.6))
//       ),
//       communicationScore: Math.max(
//         0,
//         Math.min(100, Math.round(baseScore + variance * 0.4))
//       ),
//     };
//   };

//   const generateDetailedScores = (baseScore: number) => {
//     const variance = (Math.random() - 0.5) * 8;
//     return {
//       technical: Math.max(0, Math.min(100, Math.round(baseScore + variance))),
//       design: Math.max(
//         0,
//         Math.min(100, Math.round(baseScore + variance * 0.9))
//       ),
//       leadership: Math.max(
//         0,
//         Math.min(100, Math.round(baseScore + variance * 0.7))
//       ),
//       communication: Math.max(
//         0,
//         Math.min(100, Math.round(baseScore + variance * 0.5))
//       ),
//       problemSolving: Math.max(
//         0,
//         Math.min(100, Math.round(baseScore + variance * 0.8))
//       ),
//     };
//   };

//   const aiAnalysis = generateMockAnalysis(candidate.assessment);
//   const detailedScores = generateDetailedScores(candidate.assessment);

//   const ScoreCard = ({
//     title,
//     score,
//     icon,
//     description,
//   }: {
//     title: string;
//     score: number;
//     icon: React.ReactNode;
//     description: string;
//   }) => (
//     <div className="bg-white p-4 rounded-lg border shadow-sm">
//       <div className="flex items-center justify-between mb-2">
//         <div className="flex items-center space-x-2">
//           {icon}
//           <h4 className="font-medium text-gray-900">{title}</h4>
//         </div>
//         <span
//           className={`text-2xl font-bold ${
//             score >= 90
//               ? "text-green-600"
//               : score >= 80
//               ? "text-blue-600"
//               : score >= 70
//               ? "text-yellow-600"
//               : "text-red-600"
//           }`}
//         >
//           {score}%
//         </span>
//       </div>
//       <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
//         <div
//           className={`h-2 rounded-full ${
//             score >= 90
//               ? "bg-green-500"
//               : score >= 80
//               ? "bg-blue-500"
//               : score >= 70
//               ? "bg-yellow-500"
//               : "bg-red-500"
//           }`}
//           style={{ width: `${score}%` }}
//         ></div>
//       </div>
//       <p className="text-sm text-gray-600">{description}</p>
//     </div>
//   );

//   return (
//     <>
//       {/* Backdrop with blur effect */}
//       <div
//         className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
//         onClick={onClose}
//       />

//       {/* Modal */}
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//         <div
//           className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
//           onClick={(e) => e.stopPropagation()}
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-2">
//                 <Crown className="h-8 w-8 text-yellow-500" />
//                 <span className="text-2xl font-bold text-gray-900">
//                   #{rank}
//                 </span>
//               </div>
//               <img
//                 src={
//                   candidate.photo ||
//                   `https://ui-avatars.com/api/?name=${encodeURIComponent(
//                     candidate.name
//                   )}&size=64&background=e5e7eb&color=374151&rounded=true`
//                 }
//                 alt={candidate.name}
//                 className="w-16 h-16 rounded-full object-cover"
//               />
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">
//                   {candidate.name}
//                 </h2>
//                 <p className="text-gray-600">
//                   {candidate.role || candidate.jobTitle}
//                 </p>
//                 <p className="text-sm text-gray-500">{candidate.company}</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 transition-colors"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>

//           {/* Content */}
//           <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
//             {/* Overall Score Section */}
//             <div className="mb-8">
//               <h3 className="text-xl font-semibold text-gray-900 mb-4">
//                 Overall Assessment
//               </h3>
//               <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <span className="text-lg font-medium text-gray-900">
//                     Total Score
//                   </span>
//                   <div className="scale-150">
//                     <AssessmentIcon score={candidate.assessment} />
//                   </div>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-4">
//                   <div
//                     className={`h-4 rounded-full transition-all ${
//                       candidate.assessment === 100
//                         ? "bg-green-500"
//                         : candidate.assessment >= 80
//                         ? "bg-green-500"
//                         : candidate.assessment >= 50
//                         ? "bg-yellow-500"
//                         : "bg-red-500"
//                     }`}
//                     style={{ width: `${candidate.assessment}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>

//             {/* AI Analysis Breakdown */}
//             <div className="mb-8">
//               <h3 className="text-xl font-semibold text-gray-900 mb-4">
//                 AI Analysis Breakdown
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <ScoreCard
//                   title="Skill Match"
//                   score={aiAnalysis.skillMatch}
//                   icon={<Target className="h-5 w-5 text-blue-500" />}
//                   description="How well the candidate's skills match job requirements"
//                 />
//                 <ScoreCard
//                   title="Experience Match"
//                   score={aiAnalysis.experienceMatch}
//                   icon={<Briefcase className="h-5 w-5 text-green-500" />}
//                   description="Relevance and depth of professional experience"
//                 />
//                 <ScoreCard
//                   title="Culture Match"
//                   score={aiAnalysis.cultureMatch}
//                   icon={<Users className="h-5 w-5 text-purple-500" />}
//                   description="Alignment with company values and culture"
//                 />
//                 <ScoreCard
//                   title="Communication"
//                   score={aiAnalysis.communicationScore}
//                   icon={<Phone className="h-5 w-5 text-orange-500" />}
//                   description="Communication skills assessment"
//                 />
//               </div>
//             </div>

//             {/* AI Analysis Text */}
//             <div className="mb-8">
//               <h3 className="text-xl font-semibold text-gray-900 mb-4">
//                 AI Analysis Summary
//               </h3>
//               <div className="bg-gray-50 rounded-lg p-6">
//                 <div className="prose prose-sm max-w-none">
//                   <div className="mb-4">
//                     <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
//                       <Brain className="h-4 w-4 mr-2 text-indigo-500" />
//                       Overall Assessment
//                     </h4>
//                     <p className="text-gray-700 leading-relaxed">
//                       {candidate.name} demonstrates{" "}
//                       {candidate.assessment >= 90
//                         ? "exceptional"
//                         : candidate.assessment >= 80
//                         ? "strong"
//                         : candidate.assessment >= 70
//                         ? "adequate"
//                         : "developing"}{" "}
//                       potential for this role with an overall score of{" "}
//                       {candidate.assessment}%.
//                       {candidate.assessment >= 85
//                         ? " This candidate shows outstanding qualifications and would be an excellent addition to the team."
//                         : candidate.assessment >= 70
//                         ? " This candidate meets most requirements and shows good potential for growth."
//                         : " This candidate may need additional development but shows promise in key areas."}
//                     </p>
//                   </div>

//                   <div className="mb-4">
//                     <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
//                       <Target className="h-4 w-4 mr-2 text-blue-500" />
//                       Skills & Experience Analysis
//                     </h4>
//                     <p className="text-gray-700 leading-relaxed">
//                       The candidate&apos;s skill set shows a{" "}
//                       {aiAnalysis.skillMatch >= 85
//                         ? "strong"
//                         : aiAnalysis.skillMatch >= 70
//                         ? "good"
//                         : "moderate"}{" "}
//                       match ({aiAnalysis.skillMatch}%) with the job
//                       requirements. Their professional experience demonstrates{" "}
//                       {aiAnalysis.experienceMatch >= 85
//                         ? "highly relevant"
//                         : aiAnalysis.experienceMatch >= 70
//                         ? "relevant"
//                         : "some relevant"}{" "}
//                       background ({aiAnalysis.experienceMatch}%) in{" "}
//                       {candidate.jobDepartment || "the required field"}.
//                       {aiAnalysis.skillMatch >= 80 &&
//                       aiAnalysis.experienceMatch >= 80
//                         ? " The combination of skills and experience makes them a strong candidate for immediate contribution."
//                         : " With proper onboarding, they should be able to contribute effectively to the team."}
//                     </p>
//                   </div>

//                   <div className="mb-4">
//                     <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
//                       <Users className="h-4 w-4 mr-2 text-purple-500" />
//                       Cultural Fit Assessment
//                     </h4>
//                     <p className="text-gray-700 leading-relaxed">
//                       Based on their application materials and background,{" "}
//                       {candidate.name} shows{" "}
//                       {aiAnalysis.cultureMatch >= 85
//                         ? "excellent"
//                         : aiAnalysis.cultureMatch >= 70
//                         ? "good"
//                         : "potential"}{" "}
//                       alignment ({aiAnalysis.cultureMatch}%) with company values
//                       and culture.
//                       {aiAnalysis.cultureMatch >= 80
//                         ? " They appear to share similar work values and would likely integrate well with the existing team dynamics."
//                         : " Further discussion during interviews would help assess cultural alignment more thoroughly."}
//                     </p>
//                   </div>

//                   <div className="mb-4">
//                     <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
//                       <Phone className="h-4 w-4 mr-2 text-orange-500" />
//                       Communication & Collaboration
//                     </h4>
//                     <p className="text-gray-700 leading-relaxed">
//                       The candidate&apos;s communication skills are assessed at{" "}
//                       {aiAnalysis.communicationScore}%, indicating{" "}
//                       {aiAnalysis.communicationScore >= 85
//                         ? "strong"
//                         : aiAnalysis.communicationScore >= 70
//                         ? "adequate"
//                         : "developing"}{" "}
//                       ability to express ideas clearly and collaborate
//                       effectively.
//                       {candidate.coverLetterText
//                         ? " Their cover letter demonstrates clear written communication and thoughtful presentation of their qualifications."
//                         : " A cover letter was not provided, which may indicate areas for improvement in written communication."}
//                     </p>
//                   </div>

//                   <div>
//                     <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
//                       <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
//                       Recommendation
//                     </h4>
//                     <p className="text-gray-700 leading-relaxed font-medium">
//                       {candidate.assessment >= 85
//                         ? `🌟 Highly Recommended: ${candidate.name} is an excellent candidate who should proceed to the next interview round immediately.`
//                         : candidate.assessment >= 70
//                         ? `✅ Recommended: ${candidate.name} meets the job requirements and should be considered for further evaluation.`
//                         : `⚠️ Consider with Caution: ${candidate.name} shows potential but may need additional assessment to determine fit.`}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Detailed Scores */}
//             <div className="mb-8">
//               <h3 className="text-xl font-semibold text-gray-900 mb-4">
//                 Detailed Score Analysis
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <ScoreCard
//                   title="Technical Skills"
//                   score={detailedScores.technical}
//                   icon={<Brain className="h-5 w-5 text-blue-500" />}
//                   description="Technical proficiency and expertise"
//                 />
//                 <ScoreCard
//                   title="Design Skills"
//                   score={detailedScores.design}
//                   icon={<Star className="h-5 w-5 text-pink-500" />}
//                   description="Design thinking and creativity"
//                 />
//                 <ScoreCard
//                   title="Leadership"
//                   score={detailedScores.leadership}
//                   icon={<Crown className="h-5 w-5 text-yellow-500" />}
//                   description="Leadership potential and experience"
//                 />
//                 <ScoreCard
//                   title="Communication"
//                   score={detailedScores.communication}
//                   icon={<Phone className="h-5 w-5 text-green-500" />}
//                   description="Written and verbal communication"
//                 />
//                 <ScoreCard
//                   title="Problem Solving"
//                   score={detailedScores.problemSolving}
//                   icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
//                   description="Analytical and problem-solving abilities"
//                 />
//               </div>
//             </div>

//             {/* Application Details */}
//             <div>
//               <h3 className="text-xl font-semibold text-gray-900 mb-4">
//                 Application Details
//               </h3>
//               <div className="bg-gray-50 p-4 rounded-lg space-y-3">
//                 <div className="flex items-center space-x-2">
//                   <Calendar className="h-4 w-4 text-gray-500" />
//                   <span className="text-sm text-gray-600">
//                     Applied:{" "}
//                     {new Date(candidate.appliedAt).toLocaleDateString()}
//                   </span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <User className="h-4 w-4 text-gray-500" />
//                   <span className="text-sm text-gray-600">
//                     Stage: {candidate.stage}
//                   </span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <CheckCircle2 className="h-4 w-4 text-gray-500" />
//                   <span className="text-sm text-gray-600">
//                     Status: {candidate.status}
//                   </span>
//                 </div>
//                 {candidate.jobDepartment && (
//                   <div className="flex items-center space-x-2">
//                     <Briefcase className="h-4 w-4 text-gray-500" />
//                     <span className="text-sm text-gray-600">
//                       Department: {candidate.jobDepartment}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default RankingModal;

import { CandidateWithJobDetails } from "@/interfaces";
import {
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  Crown,
  GraduationCap,
  Star,
  Target,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
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
  if (!isOpen || !candidate) return null;

  // Generate mock AI analysis data based on the candidate's assessment score
  const generateMockAnalysis = (baseScore: number) => {
    const variance = (Math.random() - 0.5) * 10; // ±5 variance
    return {
      skillMatch: Math.max(0, Math.min(100, Math.round(baseScore + variance))),
      experienceMatch: Math.max(
        0,
        Math.min(100, Math.round(baseScore + variance * 0.8))
      ),
      cultureMatch: Math.max(
        0,
        Math.min(100, Math.round(baseScore + variance * 0.6))
      ),
      educationScore: Math.max(
        0,
        Math.min(100, Math.round(baseScore + variance * 0.4))
      ),
    };
  };

  const generateDetailedScores = (baseScore: number) => {
    const variance = (Math.random() - 0.5) * 8;
    return {
      technical: Math.max(0, Math.min(100, Math.round(baseScore + variance))),
      design: Math.max(
        0,
        Math.min(100, Math.round(baseScore + variance * 0.9))
      ),
      leadership: Math.max(
        0,
        Math.min(100, Math.round(baseScore + variance * 0.7))
      ),
      communication: Math.max(
        0,
        Math.min(100, Math.round(baseScore + variance * 0.5))
      ),
      problemSolving: Math.max(
        0,
        Math.min(100, Math.round(baseScore + variance * 0.8))
      ),
    };
  };

  const aiAnalysis = generateMockAnalysis(candidate.assessment);
  const detailedScores = generateDetailedScores(candidate.assessment);

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
                  title="Education"
                  score={aiAnalysis.educationScore}
                  icon={<GraduationCap className="h-5 w-5 text-orange-500" />}
                  description="Educational background and qualifications assessment"
                />
              </div>
            </div>

            {/* AI Analysis Text */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI Analysis Summary
              </h3>
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
                      <GraduationCap className="h-4 w-4 mr-2 text-orange-500" />
                      Education & Qualifications
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      The candidate&apos;s educational background shows a{" "}
                      {aiAnalysis.educationScore >= 85
                        ? "strong"
                        : aiAnalysis.educationScore >= 70
                        ? "good"
                        : "adequate"}{" "}
                      match ({aiAnalysis.educationScore}%) with the job
                      requirements.
                      {aiAnalysis.educationScore >= 80
                        ? " Their academic credentials and qualifications align well with the role expectations and demonstrate a solid foundation for success."
                        : " Their educational background provides a reasonable foundation, though additional training or experience may be beneficial."}
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

            {/* Detailed Scores */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Detailed Score Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ScoreCard
                  title="Technical Skills"
                  score={detailedScores.technical}
                  icon={<Brain className="h-5 w-5 text-blue-500" />}
                  description="Technical proficiency and expertise"
                />
                <ScoreCard
                  title="Design Skills"
                  score={detailedScores.design}
                  icon={<Star className="h-5 w-5 text-pink-500" />}
                  description="Design thinking and creativity"
                />
                <ScoreCard
                  title="Leadership"
                  score={detailedScores.leadership}
                  icon={<Crown className="h-5 w-5 text-yellow-500" />}
                  description="Leadership potential and experience"
                />
                <ScoreCard
                  title="Communication"
                  score={detailedScores.communication}
                  icon={<GraduationCap className="h-5 w-5 text-green-500" />}
                  description="Written and verbal communication"
                />
                <ScoreCard
                  title="Problem Solving"
                  score={detailedScores.problemSolving}
                  icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
                  description="Analytical and problem-solving abilities"
                />
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
