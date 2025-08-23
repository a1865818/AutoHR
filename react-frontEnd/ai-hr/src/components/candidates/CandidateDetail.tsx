import { Candidate } from "@/interfaces";
import { formatTimestampDetailed } from "@/utils/timezoneUtils";
import { Edit, Plus, X, Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { RejectionReasonModal } from "./RejectionReasonModal";
import { rejectedCandidatesService } from "@/services/rejectedCandidatesService";
import { candidateService } from "@/services/candidateService";
import { resumeService } from "@/services/resumeService";
import {
  formatExperienceForDisplay,
  formatExperiencesList,
} from "@/utils/experienceUtils";
import { getResumeFileInfo, getFileIcon } from "@/utils/resumeUtils";

interface CandidateDetailProps {
  candidate: Candidate;
  onClose: () => void;
  onAction: (candidateId: string, action: "approve" | "decline") => void;
  onReject?: (candidateId: string, reason: string, notes?: string) => void;
  note: string;
  onSaveNote: (candidateId: string, note: string) => void;
}

export function CandidateDetail({
  candidate,
  onClose,
  onAction,
  onReject,
  note,
  onSaveNote,
}: CandidateDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "info" | "interview" | "assessment" | "files" | "notes"
  >("interview");
  const [interviewData, setInterviewData] = useState({
    step1: { evaluation: 4, interviewer: "Caroline Robertson" },
    step2: { evaluation: 3, interviewer: "Matthew Curry" },
  });
  const [currentNote, setCurrentNote] = useState(note);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // State for detailed candidate data
  const [detailedCandidate, setDetailedCandidate] = useState<Candidate | null>(
    null
  );
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [resumeFileInfo, setResumeFileInfo] = useState<{
    fileName: string;
    fileType: string;
    fileIcon: string;
  } | null>(null);

  const handleTabChange = (
    tab: "info" | "interview" | "assessment" | "files" | "notes"
  ) => {
    setActiveTab(tab);
  };

  const handleSaveNote = () => {
    onSaveNote(candidate.id, currentNote);
    setIsEditingNote(false);
  };

  const handleCancelNote = () => {
    setCurrentNote(note);
    setIsEditingNote(false);
  };

  // Update current note when prop changes
  useEffect(() => {
    setCurrentNote(note);
  }, [note]);

  // Load detailed candidate information when component mounts
  useEffect(() => {
    const loadDetailedCandidateData = async () => {
      if (!candidate.id) return;

      setLoadingDetails(true);
      try {
        console.log(
          "🔄 Loading detailed candidate information for:",
          candidate.id
        );
        const detailedData = await candidateService.getCandidateDetails(
          candidate.id
        );
        setDetailedCandidate(detailedData);

        // Process resume file information
        if (detailedData.resumeUrl) {
          const fileInfo = getResumeFileInfo(detailedData.resumeUrl);
          setResumeFileInfo(fileInfo);
        }

        console.log("✅ Detailed candidate data loaded:", detailedData);
      } catch (error) {
        console.error("❌ Failed to load detailed candidate data:", error);
        // Fallback to basic candidate data
        setDetailedCandidate(candidate);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetailedCandidateData();
  }, [candidate.id]);

  const handleEvaluationChange = (
    step: "step1" | "step2",
    newEvaluation: number
  ) => {
    setInterviewData((prev) => ({
      ...prev,
      [step]: { ...prev[step], evaluation: newEvaluation },
    }));
  };

  const handleAddSpecialist = async () => {
    const { toast } = await import("@/utils/toast");
    toast.error(
      "Add specialist functionality would open a modal to select additional interviewers"
    );
  };

  const handleEditInterview = async (step: string) => {
    const { toast } = await import("@/utils/toast");
    toast.error(
      `Edit ${step} functionality would open a modal to modify interview details`
    );
  };

  const handleReject = async (reason: string, notes?: string) => {
    try {
      if (onReject) {
        await onReject(candidate.applicationId, reason, notes);
      } else {
        // Fallback to service call if no onReject prop
        await rejectedCandidatesService.rejectCandidate(
          candidate.applicationId,
          reason,
          notes
        );
        onAction(candidate.id, "decline");
      }
      setShowRejectionModal(false);
    } catch (error) {
      console.error("Failed to reject candidate:", error);
      throw error;
    }
  };

  const handleRejectClick = () => {
    if (onReject) {
      setShowRejectionModal(true);
    } else {
      onAction(candidate.id, "decline");
    }
  };

  const handleResumeDownload = async () => {
    if (!detailedCandidate?.resumeUrl || !resumeFileInfo) {
      console.warn("No resume available for download");
      return;
    }

    try {
      await resumeService.downloadResume(
        detailedCandidate.resumeUrl,
        resumeFileInfo.fileName
      );
    } catch (error) {
      console.error("Failed to download resume:", error);
      const { toast } = await import("@/utils/toast");
      toast.error("Failed to download resume. Please try again.");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <div className="space-y-4">
            {/* Rejection Information - Show if candidate is rejected */}
            {candidate.status === "Rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <h4 className="text-sm font-medium text-red-800">
                    Candidate Rejected
                  </h4>
                </div>

                {candidate.rejectionReason && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-red-700">
                      Reason:
                    </span>
                    <p className="text-sm text-red-700 mt-1">
                      {candidate.rejectionReason}
                    </p>
                  </div>
                )}

                {candidate.rejectionNotes && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-red-700">
                      Notes:
                    </span>
                    <p className="text-sm text-red-700 mt-1">
                      {candidate.rejectionNotes}
                    </p>
                  </div>
                )}

                {candidate.rejectedAt && (
                  <div>
                    <span className="text-xs font-medium text-red-700">
                      Rejected on:
                    </span>
                    <p className="text-sm text-red-700 mt-1">
                      {formatTimestampDetailed(candidate.rejectedAt)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                Contact Information
              </h4>
              {loadingDetails ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    {detailedCandidate?.email ||
                      candidate.email ||
                      "Email not available"}
                  </p>
                  <p className="text-sm text-gray-700">
                    {detailedCandidate?.phoneNumber ||
                      "Phone number not provided"}
                  </p>
                  {detailedCandidate?.location && (
                    <p className="text-sm text-gray-700">
                      {detailedCandidate.location.city &&
                      detailedCandidate.location.country
                        ? `${detailedCandidate.location.city}, ${detailedCandidate.location.country}`
                        : detailedCandidate.location.city ||
                          detailedCandidate.location.country ||
                          "Location not specified"}
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                Experience
              </h4>
              {loadingDetails ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  {detailedCandidate?.experiences &&
                  detailedCandidate.experiences.length > 0 ? (
                    <div className="space-y-2">
                      {formatExperiencesList(detailedCandidate.experiences).map(
                        (experience, index) => (
                          <p key={index} className="text-sm text-gray-700">
                            {experience}
                          </p>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">
                      No experience data available
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case "assessment":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                Overall Score
              </h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-green-500">
                  {candidate.assessment}%
                </span>
                <div className="ml-4 flex-1 h-3 bg-gray-200 rounded">
                  <div
                    className="h-3 bg-green-500 rounded"
                    style={{ width: `${candidate.assessment}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                Skills Assessment
              </h4>
              <div className="space-y-2">
                {[
                  { skill: "Design Thinking", score: 95 },
                  { skill: "Technical Skills", score: 88 },
                  { skill: "Communication", score: 92 },
                  { skill: "Problem Solving", score: 85 },
                ].map((item) => (
                  <div
                    key={item.skill}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">{item.skill}</span>
                    <div className="flex items-center w-24">
                      <div className="flex-1 h-2 bg-gray-200 rounded mr-2">
                        <div
                          className="h-2 bg-blue-500 rounded"
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {item.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "files":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                Resume & Portfolio
              </h4>
              {loadingDetails ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {detailedCandidate?.resumeUrl && resumeFileInfo ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {resumeFileInfo.fileIcon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {resumeFileInfo.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {resumeFileInfo.fileType} • Resume
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleResumeDownload}
                        className="flex items-center space-x-1 text-blue-500 text-xs hover:text-blue-700 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No resume available
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cover Letter Section */}
                  {detailedCandidate?.coverLetterText && (
                    <div className="mt-4">
                      <h5 className="text-xs font-medium text-gray-500 mb-2">
                        Cover Letter
                      </h5>
                      <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {detailedCandidate.coverLetterText}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-500">
                Candidate Notes
              </h4>
              {!isEditingNote && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-blue-500 text-xs hover:text-blue-700 flex items-center"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {currentNote ? "Edit" : "Add Note"}
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-3">
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Add your notes about this candidate..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Save Note
                  </button>
                  <button
                    onClick={handleCancelNote}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {currentNote ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {currentNote}
                      </p>
                    </div>
                    {/* FIXED: Show actual timestamps using timezone utility */}
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{currentNote.length} characters</span>
                      <span className="mx-2">•</span>
                      <span>
                        {(() => {
                          const notesUpdatedAt = (candidate as any)
                            .notesUpdatedAt;
                          const notesCreatedAt = (candidate as any)
                            .notesCreatedAt;

                          if (
                            notesUpdatedAt &&
                            notesUpdatedAt !== notesCreatedAt
                          ) {
                            return `Updated ${formatTimestampDetailed(
                              notesUpdatedAt
                            )}`;
                          } else if (notesCreatedAt) {
                            return `Created ${formatTimestampDetailed(
                              notesCreatedAt
                            )}`;
                          } else {
                            return "No timestamp available";
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="h-8 w-8 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No notes yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click &quot;Add Note&quot; to get started
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default: // interview
        return (
          <div>
            {/* Step 1 */}
            <div className="mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium text-sm">
                  15
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <h3 className="font-medium text-sm">
                      1 Step - HR interview
                    </h3>
                    <button
                      onClick={() => handleEditInterview("Step 1")}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">11:30 AM - 12:30 PM</p>
                </div>
              </div>

              <div className="mt-4 pl-11">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Interviewers
                </h4>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
                    <img
                      src="/api/placeholder/24/24"
                      alt="Caroline Robertson"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="ml-2 text-xs font-medium">
                    {interviewData.step1.interviewer}
                  </span>
                  <span className="ml-1 text-xs text-gray-500">HR Manager</span>
                </div>
              </div>

              <div className="mt-4 pl-11">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Evaluation
                </h4>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">
                    {interviewData.step1.evaluation}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-green-500 rounded cursor-pointer"
                      style={{
                        width: `${(interviewData.step1.evaluation / 5) * 100}%`,
                      }}
                      onClick={() => {
                        const newRating = Math.min(
                          5,
                          interviewData.step1.evaluation + 1
                        );
                        handleEvaluationChange("step1", newRating);
                      }}
                    ></div>
                  </div>
                  <div className="ml-2 flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleEvaluationChange("step1", rating)}
                        className={`w-4 h-4 rounded-full border ${
                          rating <= interviewData.step1.evaluation
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium text-sm">
                  18
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <h3 className="font-medium text-sm">
                      2 Step - Tech interview
                    </h3>
                    <button
                      onClick={() => handleEditInterview("Step 2")}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">1:30 PM - 2:30 PM</p>
                </div>
              </div>

              <div className="mt-4 pl-11">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Interviewers
                </h4>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
                    <img
                      src="/api/placeholder/24/24"
                      alt="Matthew Curry"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="ml-2 text-xs font-medium">
                    {interviewData.step2.interviewer}
                  </span>
                  <span className="ml-1 text-xs text-gray-500">
                    TL of Design Department
                  </span>
                </div>
                <button
                  onClick={handleAddSpecialist}
                  className="mt-2 flex items-center text-blue-500 text-xs hover:text-blue-700"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add specialist
                </button>
              </div>

              <div className="mt-4 pl-11">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Evaluation
                </h4>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">
                    {interviewData.step2.evaluation}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-yellow-500 rounded cursor-pointer"
                      style={{
                        width: `${(interviewData.step2.evaluation / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="ml-2 flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleEvaluationChange("step2", rating)}
                        className={`w-4 h-4 rounded-full border ${
                          rating <= interviewData.step2.evaluation
                            ? "bg-yellow-500 border-yellow-500"
                            : "border-gray-300 hover:border-yellow-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {/* Header with close button */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden shadow-sm">
            <img
              src={candidate.photo}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-3">
            <h2 className="font-medium text-gray-900">{candidate.name}</h2>
            <p className="text-xs text-gray-500">
              {candidate.role || `UI/UX designer at ${candidate.company}`}
            </p>
          </div>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b flex">
        {[
          { id: "info", label: "Info" },
          { id: "interview", label: "Interview" },
          { id: "assessment", label: "Assessment" },
          { id: "files", label: "Files" },
          { id: "notes", label: "Notes" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-xs font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.id === "notes" && currentNote && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="flex-1 overflow-y-auto p-4 animate-fadeIn"
        style={{ animationDelay: "0.1s" }}
      >
        {renderTabContent()}

        {/* Action buttons - only show on interview tab */}
        {activeTab === "interview" && (
          <div className="flex space-x-2 mt-8 pt-4 border-t">
            {candidate.status === "Rejected" ? (
              <div className="w-full text-center py-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700 font-medium">
                  Candidate Rejected
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {candidate.rejectionReason &&
                    `Reason: ${candidate.rejectionReason}`}
                </p>
              </div>
            ) : candidate.status === "Hired" ? (
              <div className="w-full text-center py-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 font-medium">
                  Candidate Hired
                </p>
                <p className="text-xs text-green-600 mt-1">
                  This candidate has been successfully hired
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleRejectClick}
                  className="flex-1 bg-red-500 text-white rounded-md py-2 text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onAction(candidate.id, "approve")}
                  className="flex-1 bg-green-500 text-white rounded-md py-2 text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Approve
                </button>
              </>
            )}
          </div>
        )}

        {/* Save note button - only show on notes tab when editing */}
        {activeTab === "notes" && isEditingNote && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-gray-500 mb-2">
              💡 Tip: Use notes to track interview feedback, candidate
              strengths, or follow-up actions
            </div>
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <RejectionReasonModal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          candidateId={candidate.id}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

export default CandidateDetail;
