"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  FileText,
  XCircle,
  Save,
  RotateCcw,
  CheckCircle,
  Heart,
} from "lucide-react";
import {
  assessmentService,
  AssessmentSubmission,
  QuestionScore,
} from "@/services/assessmentService";
import { Question } from "@/components/interview_pipeline/rounds/shared/QuestionBuilder";
import { candidateService } from "@/services/candidateService";

export default function CultureFitAssessmentMarkingPage() {
  const params = useParams();
  const router = useRouter();
  const { jobId, roundId, candidateUserId } = params as unknown as {
    jobId: string;
    roundId: string;
    candidateUserId: string;
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    if (typeof window === "undefined") {
      return { "Content-Type": "application/json" };
    }

    // Get token from cookies, localStorage, or sessionStorage
    let token = null;
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf("authToken=") === 0) {
        token = decodeURIComponent(
          cookie.substring("authToken=".length, cookie.length)
        );
        break;
      }
    }

    if (!token) {
      token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  // Helper function to render different types of answers in a user-friendly way
  const renderAnswer = (answer: any, questionId: string) => {
    console.log("🔍 renderAnswer function called with:", { answer, questionId, answerType: typeof answer, isArray: Array.isArray(answer) });
    
    if (answer === null || answer === undefined) {
      console.log("🔍 Answer is null or undefined");
      return <span className="text-gray-500 italic">No answer provided</span>;
    }

    // Handle arrays FIRST (for ranking questions) - this is the key fix!
    if (Array.isArray(answer)) {
      console.log("🔍 Answer is an array, handling as ranking answer:", answer);
      // Handle ranking answers - try to get the actual text for each option
      const question = questions.find(q => q.id === questionId);
      console.log("🔍 Found question for ranking:", question);
      console.log("🔍 Question options:", (question as any)?.options);
      console.log("🔍 Available questions:", questions.map(q => ({ id: q.id, type: (q as any).type })));
      
      if (question && (question as any).options && (question as any).options.length > 0) {
        console.log("🔍 Rendering ranking answer with options");
        return (
          <div className="space-y-1">
            {answer.map((optionId, index) => {
              const option = (question as any).options.find((opt: any) => opt.id === optionId);
              console.log(`🔍 Option ${index + 1}:`, { optionId, option });
              return (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <span className="text-gray-800">
                    {option ? option.text : optionId}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }
      
      // Enhanced fallback: Create options on-the-fly based on the answer data
      console.log("🔍 Using enhanced fallback rendering for ranking answer (no question options found)");
      console.log("🔍 Creating options from answer data:", answer);
      
      return (
        <div className="space-y-1">
          {answer.map((optionId, index) => {
            // Create more meaningful option text from the optionId
            let optionText = optionId;
            
            // Parse the optionId to extract meaningful information
            // Pattern: 1755946138972_Integrity_rank_1_2
            if (optionId.includes('_rank_')) {
              const parts = optionId.split('_');
              if (parts.length >= 4) {
                const category = parts[1]; // "Integrity"
                const rankSet = parts[3]; // "1"
                const optionNumber = parts[4]; // "2"
                
                // Create a more descriptive text based on the pattern
                optionText = `${category} Response ${optionNumber}`;
                
                // Add more context if we can determine what this represents
                if (category === 'Integrity') {
                  optionText = `Integrity Response ${optionNumber}`;
                } else if (category === 'Collaboration') {
                  optionText = `Collaboration Response ${optionNumber}`;
                } else if (category === 'Innovation') {
                  optionText = `Innovation Response ${optionNumber}`;
                } else if (category === 'Excellence') {
                  optionText = `Excellence Response ${optionNumber}`;
                } else {
                  optionText = `${category} Response ${optionNumber}`;
                }
              }
            }
            
            return (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {index + 1}
                </span>
                <span className="text-gray-800 font-medium">
                  {optionText}
                </span>
                <span className="text-xs text-gray-500">
                  (ID: {optionId})
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    // Handle object answers that might have null answer field
    if (typeof answer === 'object' && answer !== null) {
      // If the object has an answer field that is null, treat it as no answer
      if (answer.answer === null || answer.answer === undefined) {
        return <span className="text-gray-500 italic">No answer provided</span>;
      }
      
      // If the object has a value field (for slider questions), use that
      if (answer.value !== undefined) {
        return (
          <div className="space-y-1">
            <div className="text-sm text-gray-800">
              <span className="font-medium">Value:</span> {answer.value}
            </div>
            {answer.score !== undefined && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Score:</span> {answer.score}
              </div>
            )}
            {answer.withinTargetRange !== undefined && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Within Target:</span> 
                <span className={answer.withinTargetRange ? "text-green-600" : "text-red-600"}>
                  {answer.withinTargetRange ? " Yes" : " No"}
                </span>
              </div>
            )}
          </div>
        );
      }

      // Handle object answers (like multiple choice with selected option)
      if (answer.selectedOptionId) {
        const question = questions.find(q => q.id === questionId);
        if (question && (question as any).options) {
          const selectedOption = (question as any).options.find((opt: any) => opt.id === answer.selectedOptionId);
          return (
            <div className="space-y-1">
              {selectedOption && (
                <div className="text-sm text-gray-800 bg-green-50 p-2 rounded">
                  {selectedOption.text}
                </div>
              )}
              {answer.score !== undefined && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Score:</span> {answer.score}
                </div>
              )}
            </div>
          );
        }
      }

      // Handle ranking answers with rankedOptions structure (legacy format)
      if (answer.rankedOptions) {
        console.log("🔍 Found rankedOptions structure:", answer.rankedOptions);
        const question = questions.find(q => q.id === questionId);
        if (question && (question as any).options) {
          return (
            <div className="space-y-1">
              {answer.rankedOptions.map((option: any, index: number) => {
                const optionConfig = (question as any).options.find((opt: any) => opt.id === option.id);
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Rank {option.order}
                    </span>
                    <span className="text-gray-800">
                      {optionConfig ? optionConfig.text : option.id}
                    </span>
                  </div>
                );
              })}
              {answer.score !== undefined && (
                <div className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Score:</span> {answer.score}
                </div>
              )}
            </div>
          );
        }
      }

      // Fallback for other object types
      return <pre className="text-xs text-gray-600">{JSON.stringify(answer, null, 2)}</pre>;
    }

    if (typeof answer === 'string') {
      // Try to find the question configuration to get the actual answer text
      const question = questions.find(q => q.id === questionId);
      if (question && (question as any).options) {
        const selectedOption = (question as any).options.find((opt: any) => opt.id === answer);
        if (selectedOption) {
          return (
            <div className="text-sm text-gray-800 bg-green-50 p-2 rounded">
              {selectedOption.text}
            </div>
          );
        }
      }
      return <span className="text-gray-800">{answer}</span>;
    }

    if (typeof answer === 'number') {
      return <span className="text-gray-800">{answer}</span>;
    }



    return <span className="text-gray-800">{String(answer)}</span>;
  };

  // Early validation - redirect if any required param is invalid
  useEffect(() => {
    if (
      !jobId ||
      jobId === "undefined" ||
      !roundId ||
      roundId === "undefined" ||
      !candidateUserId ||
      candidateUserId === "undefined"
    ) {
      console.error("❌ Invalid URL parameters detected:", {
        jobId,
        roundId,
        candidateUserId,
      });
      router.push("/interview-pipeline");
      return;
    }
  }, [jobId, roundId, candidateUserId, router]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [pdfZoom, setPdfZoom] = useState(1);
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(
    null
  );
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [submissionCheckLoading, setSubmissionCheckLoading] =
    useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false); // true = review existing grade, false = grade new submission
  const [isRegrading, setIsRegrading] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string | null>(null);

  useEffect(() => {
    loadAssessmentData();
  }, [jobId, roundId]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setSubmissionCheckLoading(true);
      setError(null);
      setIsReviewMode(false); // Reset to grading mode by default

      // Load round configuration to get culture fit questions
      console.log("🔍 Loading round configuration for culture fit questions...");
      const configResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189"}/assessments/${roundId}/configuration`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!configResponse.ok) {
        throw new Error(`Failed to load round configuration: ${configResponse.status}`);
      }

      const configData = await configResponse.json();
      console.log("✅ Round configuration loaded:", configData);

      // Extract culture fit questions from configuration
      // The assessment configuration endpoint returns data directly, not nested under data.configurationData
      const configurationData = configData.data || configData;
      console.log("🔍 Configuration data structure:", configurationData);
      console.log("🔍 Configuration data keys:", Object.keys(configurationData));
      console.log("🔍 Full configuration data:", JSON.stringify(configurationData, null, 2));
      
      // Try different possible field names for culture fit questions
      let cultureQuestions = configurationData.cultureQuestions || configurationData.questions || [];
      let culturalScenarios = configurationData.culturalScenarios || configurationData.scenarios || [];
      
      // Also check if questions are directly in the data
      const directQuestions = configData.data?.questions || [];
      const directScenarios = configData.data?.scenarios || [];

      console.log("🔍 Found culture questions:", cultureQuestions.length);
      console.log("🔍 Found cultural scenarios:", culturalScenarios.length);
    
      
      // Log the actual question data
      if (cultureQuestions.length > 0) {
        console.log("🔍 Culture questions data:", cultureQuestions);
      }
      if (culturalScenarios.length > 0) {
        console.log("🔍 Cultural scenarios data:", culturalScenarios);
      }

      // If no questions found from assessment configuration, try the round configuration endpoint
      if (cultureQuestions.length === 0 && culturalScenarios.length === 0) {
        console.log("⚠️ No questions found in assessment configuration, trying round configuration endpoint...");
        
        try {
          const roundConfigResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189"}/api/jobs/${jobId}/rounds/${roundId}/configuration`,
            {
              method: "GET",
              headers: getAuthHeaders(),
            }
          );

          if (roundConfigResponse.ok) {
            const roundConfigData = await roundConfigResponse.json();
            console.log("✅ Round configuration loaded as fallback:", roundConfigData);
            
            const roundConfigurationData = roundConfigData.data?.configurationData || {};
            console.log("🔍 Round configuration data keys:", Object.keys(roundConfigurationData));
            
            cultureQuestions = roundConfigurationData.cultureQuestions || roundConfigurationData.questions || [];
            culturalScenarios = roundConfigurationData.culturalScenarios || roundConfigurationData.scenarios || [];
            
            console.log("🔍 Found culture questions from round config:", cultureQuestions.length);
            console.log("🔍 Found cultural scenarios from round config:", culturalScenarios.length);
          }
        } catch (fallbackError) {
          console.log("⚠️ Fallback to round configuration failed:", fallbackError);
        }
      }

      // Combine game questions and scenario questions
      const allQuestions: Question[] = [];

      // Add game questions from all possible sources
      const allGameQuestions = [
        ...cultureQuestions,
        ...directQuestions
      ];
      
      allGameQuestions.forEach((q: any, index: number) => {
        let options = q.options || [];
        
        // For ranking questions, ensure we have options
        if (q.type === 'rank_scenario' && (!options || options.length === 0)) {
          console.log(`⚠️ Ranking question ${q.id} has no options, creating fallback options`);
          // Create fallback options based on the question ID pattern
          // Extract category from question ID if possible
          let category = 'Response';
          if (q.id.includes('Integrity')) {
            category = 'Integrity';
          } else if (q.id.includes('Collaboration')) {
            category = 'Collaboration';
          } else if (q.id.includes('Innovation')) {
            category = 'Innovation';
          } else if (q.id.includes('Excellence')) {
            category = 'Excellence';
          }
          
          options = [
            { id: `${q.id}_1`, text: `${category} Response 1` },
            { id: `${q.id}_2`, text: `${category} Response 2` },
            { id: `${q.id}_3`, text: `${category} Response 3` },
            { id: `${q.id}_4`, text: `${category} Response 4` },
            { id: `${q.id}_5`, text: `${category} Response 5` }
          ];
        }
        
        allQuestions.push({
          id: q.id || `game_${index}`,
          text: q.text || q.question || `Game Question ${index + 1}`,
          type: q.type || "multiple_choice",
          category: "Culture Game",
          difficulty: "medium",
          points: q.weight || q.points || 10,
          required: true,
          options: options, // Include the options for answer text lookup
        } as any); // Use type assertion to handle the options field
      });

      // Add scenario questions from all possible sources
      const allScenarioQuestions = [
        ...culturalScenarios,
        ...directScenarios
      ];
      
      allScenarioQuestions.forEach((s: any, index: number) => {
        allQuestions.push({
          id: s.id || s.scenarioId || `scenario_${index}`,
          text: s.scenario || s.title || s.text || `Cultural Scenario ${index + 1}`,
          type: "scenario",
          category: "Cultural Scenario",
          difficulty: "medium",
          points: s.points || 15, // Default points for scenarios
          required: true,
        } as any);
      });

      console.log("✅ Total questions for grading:", allQuestions.length);
      
      // Debug: Log all questions to see their structure
      allQuestions.forEach((q, index) => {
        console.log(`🔍 Question ${index + 1}:`, {
          id: q.id,
          text: q.text,
          type: q.type,
          category: q.category,
          options: (q as any).options,
          optionsCount: (q as any).options?.length || 0
        });
        
        // Special debugging for ranking questions
        if ((q as any).type === 'rank_scenario') {
          console.log(`🔍 RANKING QUESTION DETAILS for ${q.id}:`, {
            options: (q as any).options,
            optionsCount: (q as any).options?.length || 0,
            optionIds: (q as any).options?.map((opt: any) => opt.id) || [],
            optionTexts: (q as any).options?.map((opt: any) => opt.text) || []
          });
          
          // Check if options have meaningful text
          const optionsWithText = (q as any).options?.filter((opt: any) => opt.text && opt.text !== `Option ${opt.id}`) || [];
          console.log(`🔍 Options with meaningful text:`, optionsWithText);
        }
      });

      // If no questions found, create some default ones based on the submission data
      if (allQuestions.length === 0) {
        console.log("⚠️ No questions found in configuration, creating default questions based on submission data");
        
        // We'll create default questions after we load the submission data
        // For now, just set an empty array
        setQuestions([]);
        setQuestionScores([]);
      } else {
        setQuestions(allQuestions);

        // Initialize question scores
        const initialScores: QuestionScore[] = allQuestions.map((question) => ({
          questionId: question.id,
          score: 0,
          maxScore: question.points || 10,
          notes: "",
        }));
        setQuestionScores(initialScores);
      }

      // Check if candidate has submitted an assessment
      console.log("🔍 Checking if candidate has submitted culture fit assessment...");
      const candidateSubmitted = await assessmentService.hasSubmittedAssessment(
        candidateUserId as string,
        roundId as string
      );

      setHasSubmitted(candidateSubmitted);

      if (candidateSubmitted) {
        // Load the actual submission
        const existingSubmission =
          await assessmentService.getAssessmentSubmission(
            candidateUserId as string,
            roundId as string
          );

        if (existingSubmission) {
          setSubmission(existingSubmission);
          console.log("✅ Found existing submission:", existingSubmission);
          console.log("🔍 Submission data structure:", {
            gameAnswersCount: (existingSubmission.submissionData as any)?.gameAnswers?.length || 0,
            scenarioAnswersCount: (existingSubmission.submissionData as any)?.scenarioAnswers?.length || 0,
            gameAnswers: (existingSubmission.submissionData as any)?.gameAnswers?.map((a: any) => ({ questionId: a.questionId, answer: a.answer })) || [],
            scenarioAnswers: (existingSubmission.submissionData as any)?.scenarioAnswers?.map((a: any) => ({ scenarioId: a.scenarioId, response: a.response?.substring(0, 50) + '...' })) || []
          });

          // Enhance ranking questions with options based on actual answer data
          if (existingSubmission.submissionData) {
            const submissionData = existingSubmission.submissionData as any;
            
            // Find ranking questions that need options
            const rankingQuestions = allQuestions.filter(q => (q as any).type === 'rank_scenario');
            console.log("🔍 Found ranking questions:", rankingQuestions.length);
            
            rankingQuestions.forEach((question) => {
              // Find the answer for this ranking question
              const rankingAnswer = submissionData.gameAnswers?.find((answer: any) => 
                answer.questionId === question.id && Array.isArray(answer.answer)
              );
              
              if (rankingAnswer && Array.isArray(rankingAnswer.answer)) {
                console.log(`🔍 Found ranking answer for question ${question.id}:`, rankingAnswer.answer);
                
                // Try to get the actual option text from the original question configuration
                const originalQuestion = allGameQuestions.find((q: any) => q.id === question.id);
                let options = [];
                
                if (originalQuestion && originalQuestion.options && originalQuestion.options.length > 0) {
                  console.log(`🔍 Found original question options for ${question.id}:`, originalQuestion.options);
                  
                  // Use the original options but ensure they match the answer IDs
                  options = rankingAnswer.answer.map((optionId: string) => {
                    const originalOption = originalQuestion.options.find((opt: any) => opt.id === optionId);
                    if (originalOption && originalOption.text) {
                      console.log(`🔍 Found original option text for ${optionId}:`, originalOption.text);
                      return {
                        id: optionId,
                        text: originalOption.text
                      };
                    } else {
                      // Fallback to generated text
                      return generateOptionText(optionId);
                    }
                  });
                } else {
                  console.log(`🔍 No original options found for ${question.id}, generating fallback options`);
                  
                  // Generate fallback options
                  options = rankingAnswer.answer.map((optionId: string) => generateOptionText(optionId));
                }
                
                // Update the question with the options
                (question as any).options = options;
                console.log(`✅ Enhanced ranking question ${question.id} with ${options.length} options:`, options);
              }
            });
          }
          
          // Helper function to generate option text
          const generateOptionText = (optionId: string) => {
            let optionText = `Option ${optionId}`;
            
            if (optionId.includes('_rank_')) {
              const parts = optionId.split('_');
              if (parts.length >= 4) {
                const category = parts[1]; // "Integrity"
                const optionNumber = parts[4]; // "2"
                
                // Create descriptive text based on category
                if (category === 'Integrity') {
                  optionText = `Integrity Response ${optionNumber}`;
                } else if (category === 'Collaboration') {
                  optionText = `Collaboration Response ${optionNumber}`;
                } else if (category === 'Innovation') {
                  optionText = `Innovation Response ${optionNumber}`;
                } else if (category === 'Excellence') {
                  optionText = `Excellence Response ${optionNumber}`;
                } else {
                  optionText = `${category} Response ${optionNumber}`;
                }
              }
            }
            
            return {
              id: optionId,
              text: optionText
            };
          };

          // If no questions were found in configuration, create default ones based on submission data
          if (allQuestions.length === 0 && existingSubmission.submissionData) {
            console.log("🔍 Creating default questions based on submission data");
            const submissionData = existingSubmission.submissionData;
            
            const defaultQuestions: Question[] = [];
            
            // Create questions for game answers
            if (submissionData.gameAnswers && Array.isArray(submissionData.gameAnswers)) {
              submissionData.gameAnswers.forEach((answer: any, index: number) => {
                defaultQuestions.push({
                  id: `game_${index}`,
                  text: `Game Question ${index + 1}`,
                  type: "multiple_choice",
                  category: "Culture Game",
                  difficulty: "medium",
                  points: 10,
                  required: true,
                });
              });
            }
            
            // Create questions for scenario answers
            if (submissionData.scenarioAnswers && Array.isArray(submissionData.scenarioAnswers)) {
              submissionData.scenarioAnswers.forEach((answer: any, index: number) => {
                defaultQuestions.push({
                  id: answer.scenarioId || `scenario_${index}`,
                  text: `Cultural Scenario ${index + 1}`,
                  type: "scenario",
                  category: "Cultural Scenario",
                  difficulty: "medium",
                  points: 15,
                  required: true,
                });
              });
            }
            
            console.log("✅ Created default questions:", defaultQuestions.length);
            setQuestions(defaultQuestions);
            
            // Initialize question scores for default questions
            const defaultScores: QuestionScore[] = defaultQuestions.map((question) => ({
              questionId: question.id,
              score: 0,
              maxScore: question.points || 10,
              notes: "",
            }));
            setQuestionScores(defaultScores);
          }

          // Check if there's an existing grade - only check if we have reason to believe a grade exists
          // For new submissions, we skip this check to avoid 404 errors
          if (existingSubmission.status === 'graded') {
            try {
              const existingGrade = await assessmentService.getAssessmentGrade(
                existingSubmission.id
              );
              if (existingGrade) {
                console.log("✅ Found existing grade:", existingGrade);
                setIsReviewMode(true);
                setGradeId(existingGrade.id);

                // Load existing scores
                if (existingGrade.questionScores) {
                  setQuestionScores(existingGrade.questionScores);
                }
                if (existingGrade.overallNotes) {
                  setOverallNotes(existingGrade.overallNotes);
                }
              } else {
                console.log("📝 No existing grade found despite 'graded' status");
              }
            } catch (gradeError) {
              console.log("📝 Error checking for existing grade:", gradeError);
            }
          } else {
            console.log("📝 Submission status is 'submitted' - no grade check needed for new submissions");
          }
        }
      } else {
        console.log("❌ No submission found for candidate");
        setError("No culture fit assessment submission found for this candidate");
      }

      // Load candidate name
      try {
        const jobCandidates = await candidateService.getCandidatesForJob(jobId);
        const candidate = jobCandidates.find(c => c.candidateUserId === candidateUserId);
        if (candidate) {
          setCandidateName(candidate.name);
        } else {
          setCandidateName("Unknown Candidate");
        }
      } catch (error) {
        console.warn("Failed to load candidate name:", error);
        setCandidateName("Unknown Candidate");
      }
      
    } catch (error) {
      console.error("Error loading assessment data:", error);
      setError("Failed to load assessment data");
    } finally {
      setLoading(false);
      setSubmissionCheckLoading(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!submission) {
      setError("No submission to grade");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const totalScore = questionScores.reduce((sum, qs) => sum + qs.score, 0);
      const maxScore = questionScores.reduce((sum, qs) => sum + qs.maxScore, 0);
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      const gradeData = {
        submissionId: submission.id,
        totalScore,
        maxScore,
        overallNotes,
        questionScores,
      };

      if (isReviewMode && gradeId) {
        // Update existing grade
        await assessmentService.updateAssessmentGrade(gradeId, {
          totalScore,
          maxScore,
          overallNotes,
          questionScores,
        });
        setSuccessMessage("Grade updated successfully!");
      } else {
        // Create new grade
        const newGrade = await assessmentService.saveAssessmentGrade(gradeData);
        setGradeId(newGrade.id);
        setIsReviewMode(true);
        setSuccessMessage("Grade saved successfully!");
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving grade:", error);
      setError("Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const handleRegrade = () => {
    setIsRegrading(true);
    setIsReviewMode(false);
    setQuestionScores(questionScores.map(qs => ({ ...qs, score: 0 })));
    setOverallNotes("");
  };

  const handleDeleteGrade = async () => {
    if (!gradeId) return;

    try {
      setDeleting(true);
      await assessmentService.deleteAssessmentGrade(gradeId);
      setGradeId(null);
      setIsReviewMode(false);
      setQuestionScores(questionScores.map(qs => ({ ...qs, score: 0 })));
      setOverallNotes("");
      setShowDeleteModal(false);
      setSuccessMessage("Grade deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting grade:", error);
      setError("Failed to delete grade");
    } finally {
      setDeleting(false);
    }
  };

  const getRankingAnswer = (questionId: string) => {
    if (!submission?.submissionData) return null;

    const submissionData = submission.submissionData as any;
    console.log("🔍 getRankingAnswer called for questionId:", questionId);
    
    if (submissionData.gameAnswers && Array.isArray(submissionData.gameAnswers)) {
      console.log("🔍 Looking for ranking answer in gameAnswers");
      console.log("🔍 Available game answers:", submissionData.gameAnswers.length);
      
      const rankingAnswer = submissionData.gameAnswers.find((answer: any) => {
        // Check if this is the right question and the answer is an array (ranking answers are arrays)
        const isRankingQuestion = answer.questionId === questionId && Array.isArray(answer.answer);
        console.log(`🔍 Checking answer: ${answer.questionId} === ${questionId} && Array.isArray(${answer.answer}) = ${isRankingQuestion}`);
        console.log(`🔍 Answer structure:`, answer);
        return isRankingQuestion;
      });
      
      if (rankingAnswer) {
        console.log("✅ Found ranking answer:", rankingAnswer);
        return rankingAnswer;
      } else {
        console.log("❌ No ranking answer found for questionId:", questionId);
        // Let's also check if there's an answer with the right questionId but different structure
        const anyAnswer = submissionData.gameAnswers.find((answer: any) => answer.questionId === questionId);
        if (anyAnswer) {
          console.log("🔍 Found answer with right questionId but wrong structure:", anyAnswer);
        }
      }
    } else {
      console.log("❌ No gameAnswers array found");
    }
    
    return null;
  };

  const getCandidateAnswer = (questionId: string) => {
    if (!submission?.submissionData) return null;

    const submissionData = submission.submissionData as any;
    console.log("🔍 getCandidateAnswer called for questionId:", questionId);
    console.log("🔍 Available game answers:", submissionData.gameAnswers?.length || 0);
    console.log("🔍 Available scenario answers:", submissionData.scenarioAnswers?.length || 0);

    // Check if this is a ranking question first
    const question = questions.find(q => q.id === questionId);
    console.log("🔍 Found question for ranking check:", question);
    console.log("🔍 Question type:", (question as any)?.type);
    console.log("🔍 Question type comparison:", (question as any)?.type === 'rank_scenario');
    console.log("🔍 Question exists:", !!question);
    console.log("🔍 Is ranking question?", question && (question as any).type === 'rank_scenario');
    
    if (question && (question as any).type === 'rank_scenario') {
      console.log("🔍 This is a ranking question, using getRankingAnswer");
      return getRankingAnswer(questionId);
    } else {
      console.log("🔍 Not a ranking question or condition not met");
    }

    // Try to find the answer by matching question ID patterns
    if (submissionData.gameAnswers && Array.isArray(submissionData.gameAnswers)) {
      const gameAnswer = submissionData.gameAnswers.find((answer: any) => 
        answer.questionId === questionId || answer.id === questionId
      );
      if (gameAnswer) {
        console.log("✅ Found game answer for questionId:", questionId);
        return gameAnswer;
      }
    }

    if (submissionData.scenarioAnswers && Array.isArray(submissionData.scenarioAnswers)) {
      const scenarioAnswer = submissionData.scenarioAnswers.find((answer: any) => 
        answer.scenarioId === questionId || answer.id === questionId
      );
      if (scenarioAnswer) {
        console.log("✅ Found scenario answer for questionId:", questionId);
        return scenarioAnswer;
      }
    }

    // Fallback: try to find by index if question ID starts with game_ or scenario_
    if (questionId.startsWith('game_')) {
      const index = parseInt(questionId.replace('game_', ''), 10);
      const fallbackAnswer = submissionData.gameAnswers && Array.isArray(submissionData.gameAnswers) ? submissionData.gameAnswers[index] : null;
      if (fallbackAnswer) {
        console.log("✅ Found game answer by index for questionId:", questionId);
        return fallbackAnswer;
      }
    } else if (questionId.startsWith('scenario_')) {
      const index = parseInt(questionId.replace('scenario_', ''), 10);
      const fallbackAnswer = submissionData.scenarioAnswers && Array.isArray(submissionData.scenarioAnswers) ? submissionData.scenarioAnswers[index] : null;
      if (fallbackAnswer) {
        console.log("✅ Found scenario answer by index for questionId:", questionId);
        return fallbackAnswer;
      }
    }

    console.log("❌ No answer found for questionId:", questionId);
    return null;
  };

  const handleScoreChange = (questionId: string, score: number) => {
    setQuestionScores(prev => {
      const existing = prev.find(qs => qs.questionId === questionId);
      if (existing) {
        return prev.map(qs => 
          qs.questionId === questionId ? { ...qs, score: score } : qs
        );
      } else {
        const question = questions.find(q => q.id === questionId);
        return [...prev, {
          questionId,
          score,
          maxScore: question?.points || 10,
          notes: ""
        }];
      }
    });
  };

  const handleNotesChange = (questionId: string, notes: string) => {
    setQuestionScores(prev => {
      const existing = prev.find(qs => qs.questionId === questionId);
      if (existing) {
        return prev.map(qs => 
          qs.questionId === questionId ? { ...qs, notes: notes } : qs
        );
      } else {
        const question = questions.find(q => q.id === questionId);
        return [...prev, {
          questionId,
          score: 0,
          maxScore: question?.points || 10,
          notes
        }];
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading culture fit assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/interview-pipeline/${jobId}`)}
            className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-accent"
          >
            Back to Pipeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/interview-pipeline/${jobId}`)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Pipeline</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Culture Fit Assessment Marking
                </h1>
                <p className="text-sm text-gray-500">
                  {candidateName} • Round {roundId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {successMessage && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm">{successMessage}</span>
                </div>
              )}

              {isReviewMode && !isRegrading && (
                <button
                  onClick={handleRegrade}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Regrade</span>
                </button>
              )}

              {isReviewMode && gradeId && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Delete Grade</span>
                </button>
              )}

              <button
                onClick={handleSaveGrade}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-accent disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Grade"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Culture Fit Assessment Grading
            </h1>
            <p className="text-gray-600">
              Grade the culture fit assessment for {candidateName || "Candidate"}
            </p>
            {submission && (
              <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Completed:</span>
                    <span className="text-blue-800 ml-2">
                      {(submission.submissionData as any).completedAt 
                        ? new Date((submission.submissionData as any).completedAt).toLocaleString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Total Time:</span>
                    <span className="text-blue-800 ml-2">
                      {(submission.submissionData as any).totalTimeSpent 
                        ? `${Math.floor((submission.submissionData as any).totalTimeSpent / 60)}m ${(submission.submissionData as any).totalTimeSpent % 60}s`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questions and Grading */}
          <div className="space-y-4">
            {questions.map((question, index) => {
              const candidateAnswer = getCandidateAnswer(question.id);
              const questionScore = questionScores.find(qs => qs.questionId === question.id);
              
              return (
                <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        Question {index + 1}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        question.category === "Culture Game" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {question.category}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      Max: {question.points} points
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="mb-3">
                    <h3 className="text-base font-medium text-gray-900">
                      {question.text}
                    </h3>
                  </div>

                  {/* Candidate's Answer */}
                  {candidateAnswer && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Candidate's Answer:</h4>
                      <div className="text-sm text-gray-800">
                        {(() => {
                          const answerData = candidateAnswer.answer || candidateAnswer.response || candidateAnswer;
                          const questionIdForRender = candidateAnswer.questionId || question.id;
                          const questionType = (question as any)?.type;
                          const isRankingQuestion = questionType === 'rank_scenario';
                          const isAnswerArray = Array.isArray(answerData);
                          
                          console.log("🔍 renderAnswer called with:", {
                            answerData,
                            questionIdForRender,
                            candidateAnswer,
                            questionType,
                            isRankingQuestion,
                            isAnswerArray,
                            answerDataLength: isAnswerArray ? answerData.length : 'N/A'
                          });
                          
                          // Special handling for ranking questions
                          if (isRankingQuestion && isAnswerArray) {
                            console.log("🔍 This is a ranking question with array answer - should display properly");
                          }
                          
                          return renderAnswer(answerData, questionIdForRender);
                        })()}
                      </div>
                      {candidateAnswer.timeSpent && (
                        <div className="text-xs text-gray-600 mt-2">
                          Time spent: {candidateAnswer.timeSpent}s
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grading Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={question.points}
                        value={questionScore?.score || 0}
                        onChange={(e) => handleScoreChange(question.id, parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={questionScore?.notes || ""}
                        onChange={(e) => handleNotesChange(question.id, e.target.value)}
                        placeholder="Add notes..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Notes */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Overall Assessment Notes</h3>
            <textarea
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              placeholder="Add overall feedback and notes for this candidate..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
          </div>

          {/* Score Summary */}
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Score Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Total Score:</span>
                <div className="text-xl font-bold text-gray-900">
                  {questionScores.reduce((sum, qs) => sum + qs.score, 0)} / {questionScores.reduce((sum, qs) => sum + qs.maxScore, 0)}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Percentage:</span>
                <div className="text-xl font-bold text-gray-900">
                  {(() => {
                    const total = questionScores.reduce((sum, qs) => sum + qs.score, 0);
                    const max = questionScores.reduce((sum, qs) => sum + qs.maxScore, 0);
                    return max > 0 ? Math.round((total / max) * 100) : 0;
                  })()}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Grade
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this grade? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGrade}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
