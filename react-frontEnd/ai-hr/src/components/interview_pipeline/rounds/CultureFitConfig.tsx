"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Heart,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  UserCheck,
  Loader2,
  Clock,
  X,
} from "lucide-react";
import { useRoundConfiguration } from "@/hooks/useRoundConfiguration";
import { cleanJsonObject } from "@/utils/jsonUtils";
import { Pagination } from "@/components/ui/Pagination";

interface CompanyValue {
  id: string;
  name: string;
  description: string;
  weight: number; // 1-5
  indicators: string[];
}

interface CultureQuestion {
  id: string;
  text: string;
  trait: string; // which company value this question assesses
  type: "multiple_choice" | "rank_scenario" | "slider" | "open_ended";
  weight: number;
  maxScore: number;
  options?: McqOption[] | RankScenarioOption[];
  leftLabel?: string;
  rightLabel?: string;
  targetRange?: [number, number];
  scoring?: "exact" | "position_diff" | "weighted";
}

interface CulturalScenario {
  id: string;
  title: string;
  scenario: string;
  category: string; // Will be the company value name
  expectedResponse: string;
  evaluationCriteria: string[];
  timeLimitMinutes: number; // Time limit for this specific scenario
  wordLimit: {
    min: number;
    max: number;
  };
}

interface TeamDynamics {
  id: string;
  aspect: string;
  description: string;
  assessmentMethod: "interview" | "scenario" | "reference" | "exercise";
  indicators: string[];
}

interface CultureFitConfiguration {
  name: string;
  description: string;
  companyValues: CompanyValue[];
  cultureQuestions: CultureQuestion[];
  culturalScenarios: CulturalScenario[];
  teamDynamics: TeamDynamics[];
  duration: number;
  assessmentMethods: {
    valuesAlignment: boolean;
    personalityAssessment: boolean;
    teamExercise: boolean;
    cultureScenarios: boolean;
    peerInterview: boolean;
  };
  scoringMethod: "weighted" | "balanced" | "holistic";
  passingThreshold: number; // percentage
  assessmentSettings: AssessmentSettings;
  redFlags: string[];
  instructions: string;
  evaluationCriteria: string;
}

type GameQuestionType = "multiple_choice" | "rank_scenario" | "slider";

interface GameQuestionBase {
  id: string;
  trait: string;
  prompt: string;
  type: GameQuestionType;
  weight: number;
  maxScore: number;
}

interface McqOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  score?: number;
}

interface RankScenarioOption {
  id: string;
  text: string;
  desiredOrder?: number;
}

type GameQuestion =
  | (GameQuestionBase & {
      type: "multiple_choice";
      options: McqOption[];
      multipleSelection?: boolean;
    })
  | (GameQuestionBase & {
      type: "rank_scenario";
      options: RankScenarioOption[];
      scoring: "exact" | "position_diff" | "weighted";
    })
  | (GameQuestionBase & {
      type: "slider";
      leftLabel: string;
      rightLabel: string;
      targetRange?: [number, number];
    });

interface AssessmentSettings {
  timePerQuestionSeconds: number;
  shuffleQuestions: boolean;
  showExplanations: boolean;
  scenarioWordLimitMin?: number;
  scenarioWordLimitMax?: number;
}

interface CultureFitConfigProps {
  jobId: string;
  roundId: string;
  onConfigurationChange: (newConfig: CultureFitConfiguration) => void;
}

const defaultCompanyValues: CompanyValue[] = [
  {
    id: "cv1",
    name: "Innovation",
    description: "Embracing new ideas and creative solutions to drive progress",
    weight: 4,
    indicators: [
      "Proposes creative solutions",
      "Embraces new technologies",
      "Challenges status quo",
      "Takes calculated risks",
    ],
  },
  {
    id: "cv2",
    name: "Collaboration",
    description: "Working effectively with others to achieve shared goals",
    weight: 5,
    indicators: [
      "Shares knowledge freely",
      "Seeks input from others",
      "Supports team success",
      "Communicates openly",
    ],
  },
  {
    id: "cv3",
    name: "Integrity",
    description: "Acting with honesty and maintaining strong moral principles",
    weight: 5,
    indicators: [
      "Takes responsibility for mistakes",
      "Acts transparently",
      "Maintains confidentiality",
      "Speaks up for what is right",
    ],
  },
];

const defaultScenarios: CulturalScenario[] = [
  {
    id: "cs1",
    title: "Deadline Pressure",
    scenario:
      "Your team is facing a tight deadline and a colleague suggests cutting corners on quality to meet it. How would you respond?",
    category: "Integrity",
    expectedResponse:
      "Should discuss concerns openly, propose alternatives, escalate if necessary",
    evaluationCriteria: [
      "Maintains quality standards",
      "Communicates concerns effectively",
      "Seeks collaborative solutions",
      "Shows integrity under pressure",
    ],
    timeLimitMinutes: 5,
    wordLimit: {
      min: 200,
      max: 300,
    },
  },
  {
    id: "cs2",
    title: "Team Conflict",
    scenario:
      "Two team members have a disagreement about the direction of a project and ask for your input. How do you handle this?",
    category: "Collaboration",
    expectedResponse:
      "Listen to both sides, facilitate discussion, focus on project goals",
    evaluationCriteria: [
      "Remains neutral and objective",
      "Facilitates open communication",
      "Focuses on solutions",
      "Considers all perspectives",
    ],
    timeLimitMinutes: 5,
    wordLimit: {
      min: 200,
      max: 300,
    },
  },
];

// Calculate initial duration based on default values
const calculateInitialDuration = (): number => {
  const gameQuestionsTime = 0 * (60 / 60); // 0 questions × 60 seconds = 0 minutes
  const scenariosTime = defaultScenarios.reduce((total: number, scenario: CulturalScenario) => {
    return total + scenario.timeLimitMinutes;
  }, 0);
  const totalMinutes = Math.ceil(gameQuestionsTime + scenariosTime);
  
  
  
  return totalMinutes;
};

export function CultureFitConfig({
  jobId,
  roundId,
  onConfigurationChange,
}: CultureFitConfigProps) {
  const {
    config: savedConfig,
    loading,
    error,
    saveConfiguration,
  } = useRoundConfiguration(jobId, roundId);
  const [config, setConfig] = useState<CultureFitConfiguration>({
    name: "Culture Fit",
    description: "Comprehensive culture fit assessment evaluating company values alignment, team dynamics, and cultural scenarios.",
    companyValues: defaultCompanyValues,
    cultureQuestions: [],
    culturalScenarios: defaultScenarios,
    teamDynamics: [],
    // This will be calculated based on the number of questions and scenarios
    duration: calculateInitialDuration(),
    assessmentMethods: {
      valuesAlignment: true,
      personalityAssessment: false,
      teamExercise: true,
      cultureScenarios: true,
      peerInterview: false,
    },
    scoringMethod: "weighted",
    passingThreshold: 75,
    assessmentSettings: {
      timePerQuestionSeconds: 60,
      shuffleQuestions: true,
      showExplanations: false,
    },
    redFlags: [
      "Negative attitude toward collaboration",
      "Resistance to feedback",
      "Poor communication skills",
      "Conflicting values with company mission",
    ],
    instructions:
      "This culture fit assessment evaluates how well the candidate aligns with our company values and team dynamics. Focus on behavioral examples and cultural scenarios.",
    evaluationCriteria:
      "Assess candidates on values alignment, team collaboration potential, communication style, and cultural adaptability.",
  });
  const [saving, setSaving] = useState(false);

  // Suggested values for quick add
  const suggestedValues: Array<Pick<CompanyValue, "name" | "description" | "weight">> = [
    { name: "Collaboration", description: "Works well with others and enables team success", weight: 5 },
    { name: "Integrity", description: "Acts with honesty and strong moral principles", weight: 5 },
    { name: "Ownership", description: "Takes responsibility and follows through on commitments", weight: 4 },
    { name: "Customer Obsession", description: "Puts customer outcomes at the center of decisions", weight: 4 },
    { name: "Bias for Action", description: "Prefers action and learning over prolonged debate", weight: 3 },
    { name: "Innovation", description: "Seeks creative solutions and challenges the status quo", weight: 4 },
    { name: "Growth Mindset", description: "Learns from feedback and embraces challenges", weight: 4 },
    { name: "Communication", description: "Shares information clearly and listens actively", weight: 4 },
    { name: "Inclusivity", description: "Welcomes diverse perspectives and fosters belonging", weight: 4 },
    { name: "Accountability", description: "Holds self and others to high standards", weight: 4 },
    { name: "Excellence", description: "Strives for the highest quality in everything", weight: 5 },
    { name: "Adaptability", description: "Embraces change and learns quickly from new situations", weight: 4 },
    { name: "Empathy", description: "Understands and considers others' perspectives and feelings", weight: 4 },
    { name: "Resilience", description: "Perseveres through challenges and maintains positive attitude", weight: 4 },
    { name: "Transparency", description: "Shares information openly and builds trust", weight: 4 },
    { name: "Efficiency", description: "Optimizes processes and resources for maximum impact", weight: 3 },
    { name: "Curiosity", description: "Asks questions and seeks to understand deeply", weight: 3 },
    { name: "Humility", description: "Recognizes limitations and values others' contributions", weight: 4 },
    { name: "Courage", description: "Takes calculated risks and stands up for what's right", weight: 4 },
    { name: "Sustainability", description: "Considers long-term impact and environmental responsibility", weight: 3 },
    { name: "Diversity", description: "Values different backgrounds, experiences, and perspectives", weight: 4 },
    { name: "Learning", description: "Continuously develops skills and knowledge", weight: 4 },
    { name: "Trust", description: "Builds and maintains reliable relationships", weight: 5 },
    { name: "Passion", description: "Shows enthusiasm and commitment to work", weight: 4 },
    { name: "Balance", description: "Maintains healthy work-life integration", weight: 3 },
    {name: "Pressure", description: "Handles tight deadlines and high-stress situations", weight: 5},
    {name: "Conflict Resolution", description: "Resolves conflicts effectively and maintains harmony", weight: 4},
    {name:"Problem Solving", description: "Analyzes problems and finds effective solutions", weight: 5},
  ];


  const [mcqOptions, setMcqOptions] = useState<McqOption[]>([
    { id: `opt_${Date.now()}_1`, text: "Option A", isCorrect: true, score: 10 },
    { id: `opt_${Date.now()}_2`, text: "Option B", isCorrect: false, score: 0 },
  ]);
  const [rankOptions, setRankOptions] = useState<RankScenarioOption[]>([
    { id: `rank_${Date.now()}_1`, text: "Option 1", desiredOrder: 1 },
    { id: `rank_${Date.now()}_2`, text: "Option 2", desiredOrder: 2 },
    { id: `rank_${Date.now()}_3`, text: "Option 3", desiredOrder: 3 },
  ]);
  const [rankScoring, setRankScoring] = useState<"exact" | "position_diff" | "weighted">("position_diff");
  const [sliderLeftLabel, setSliderLeftLabel] = useState<string>("Disagree");
  const [sliderRightLabel, setSliderRightLabel] = useState<string>("Agree");
  const [sliderTargetMin, setSliderTargetMin] = useState<number>(7);
  const [sliderTargetMax, setSliderTargetMax] = useState<number>(10);

  // Cultural Scenarios time management
  const [scenariosEnabled, setScenariosEnabled] = useState<boolean>(true);

  
  // Scenario criteria editing
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingCriteria, setEditingCriteria] = useState<string[]>([]);
  const [editingScenario, setEditingScenario] = useState<CulturalScenario | null>(null);

  // Load configuration from the backend when available
  useEffect(() => {
    if (savedConfig) {
      // Create a clean merged config directly from saved data
      if (
        savedConfig.configurationData &&
        typeof savedConfig.configurationData === "object"
      ) {
        // Use raw data directly to avoid cleaning issues
        const rawConfigData = savedConfig.configurationData;

        // Create a clean merged config with saved data taking precedence
        const mergedConfig = {
          ...config, // Start with default config
          ...rawConfigData, // Override with raw saved data
          name: savedConfig.name || config.name,
          description: savedConfig.description || config.description,
          duration: savedConfig.duration || config.duration,
          assessmentSettings: rawConfigData.assessmentSettings || config.assessmentSettings,
        };
        
        // Always recalculate duration based on current questions and scenarios
        const gameQuestionsTime = mergedConfig.cultureQuestions.length * (mergedConfig.assessmentSettings.timePerQuestionSeconds / 60);
        const scenariosTime = mergedConfig.culturalScenarios.reduce((total: number, scenario: CulturalScenario) => {
          return total + scenario.timeLimitMinutes;
        }, 0);
        const totalMinutes = Math.ceil(gameQuestionsTime + scenariosTime);
        
        // Update duration directly in the merged config
        if (totalMinutes > 0) {
          mergedConfig.duration = totalMinutes;
        }
        
        setConfig(mergedConfig);
      } else {
        // Set config with just the top-level properties from savedConfig
        const baseConfig = {
          ...config,
          name: savedConfig.name || config.name,
          description: savedConfig.description || config.description,
          duration: savedConfig.duration || config.duration,
        };
        setConfig(baseConfig);
        
        // Always recalculate duration for default config
        const gameQuestionsTime = baseConfig.cultureQuestions.length * (baseConfig.assessmentSettings.timePerQuestionSeconds / 60);
        const scenariosTime = baseConfig.culturalScenarios.reduce((total: number, scenario: CulturalScenario) => {
          return total + scenario.timeLimitMinutes;
        }, 0);
        const totalMinutes = Math.ceil(gameQuestionsTime + scenariosTime);
        
        // Update duration directly in the base config
        if (totalMinutes > 0) {
          baseConfig.duration = totalMinutes;
        }
        
        setConfig(baseConfig);
      }
    }
  }, [savedConfig]);


  const [expandedSections, setExpandedSections] = useState({
    values: true,
    questions: true,
    scenarios: true,
    assessment: true,
    scoring: false,
  });

  const [newValue, setNewValue] = useState({
    name: "",
    description: "",
    weight: 3,
    indicators: [""],
  });

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    trait: "",
    type: "multiple_choice" as CultureQuestion["type"],
    weight: 3,
    maxScore: 10,
  });

  const [newScenario, setNewScenario] = useState({
    title: "",
    scenario: "",
    category: "",
    expectedResponse: "",
    evaluationCriteria: [""],
    timeLimitMinutes: 5,
    wordLimitMin: 200,
    wordLimitMax: 300,
  });

  const [showAddValue, setShowAddValue] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<CompanyValue | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<CultureQuestion | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<Array<{name: string, questions: CultureQuestion[]}>>([]);
  
  // Track when user has attempted to submit forms
  const [hasAttemptedValueSubmit, setHasAttemptedValueSubmit] = useState(false);
  const [hasAttemptedQuestionSubmit, setHasAttemptedQuestionSubmit] = useState(false);
  const [hasAttemptedScenarioSubmit, setHasAttemptedScenarioSubmit] = useState(false);

  // Question list UX improvements
  const [selectedTrait, setSelectedTrait] = useState<string>("all");
  const [questionsPerPage] = useState(5);
  const [currentQuestionPage, setCurrentQuestionPage] = useState(1);

  const handleConfigChange = (updates: Partial<CultureFitConfiguration>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigurationChange(newConfig);
  };

  // Calculate total duration based on questions and scenarios
  const calculateTotalDuration = (): number => {
    // Calculate time for game questions
    const gameQuestionsTime = config.cultureQuestions.length * (config.assessmentSettings.timePerQuestionSeconds / 60);
    
    // Calculate time for scenarios
    const scenariosTime = config.culturalScenarios.reduce((total, scenario) => {
      return total + scenario.timeLimitMinutes;
    }, 0);
    
    // Round up to nearest minute
    const totalMinutes = Math.ceil(gameQuestionsTime + scenariosTime);
    
    console.log(`Duration calculation: ${config.cultureQuestions.length} questions × ${config.assessmentSettings.timePerQuestionSeconds}s = ${gameQuestionsTime.toFixed(1)}min, ${config.culturalScenarios.length} scenarios = ${scenariosTime}min, total = ${totalMinutes}min`);
    
    return totalMinutes;
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);

    // Calculate the total duration
    const calculatedDuration = calculateTotalDuration();

    // Create a clean configuration data object with only the properties we need
    const configDataToSave = {
      name: config.name,
      description: config.description,
      companyValues: config.companyValues,
      cultureQuestions: config.cultureQuestions,
      culturalScenarios: config.culturalScenarios,
      teamDynamics: config.teamDynamics,
      assessmentMethods: config.assessmentMethods,
      scoringMethod: config.scoringMethod,
      passingThreshold: config.passingThreshold,
      assessmentSettings: config.assessmentSettings,
      redFlags: config.redFlags,
      instructions: config.instructions,
      evaluationCriteria: config.evaluationCriteria,
    };

    // Clean the configuration data using our utility function
    const cleanConfigData = cleanJsonObject(configDataToSave);

    // Create the request object to send to the backend
    const configToSave = {
      name: config.name,
      description: config.description,
      duration: calculatedDuration,
      status: savedConfig?.status || "draft",
      configurationData: cleanConfigData,
    };

    try {
      const result = await saveConfiguration(configToSave);
      if (!result) {
        console.error("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
    } finally {
      setSaving(false);
    }
  };

  // Helpers
  const addSuggestedValue = (name: string, description: string, weight: number) => {
    const exists = config.companyValues.some((v) => v.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    const value: CompanyValue = {
      id: `cv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      description,
      weight,
      indicators: [],
    };
    handleConfigChange({ companyValues: [...config.companyValues, value] });
  };

  const addMcqOption = () => {
    const next = { id: `opt_${Date.now()}_${mcqOptions.length + 1}`, text: "", isCorrect: false, score: 0 } as McqOption;
    setMcqOptions((prev) => [...prev, next]);
  };

  const removeMcqOption = (id: string) => setMcqOptions((prev) => prev.filter((o) => o.id !== id));

  const addRankOption = () => {
    const next = { id: `rank_${Date.now()}_${rankOptions.length + 1}`, text: "", desiredOrder: rankOptions.length + 1 } as RankScenarioOption;
    setRankOptions((prev) => [...prev, next]);
  };

  const removeRankOption = (id: string) => setRankOptions((prev) => prev.filter((o) => o.id !== id));

  const resetNewQuestionForm = () => {
    setNewQuestion({
      text: "",
      trait: "",
      type: "multiple_choice",
      weight: 3,
      maxScore: 10,
    });
    setMcqOptions([
      { id: `opt_${Date.now()}_1`, text: "Option A", isCorrect: true, score: 10 },
      { id: `opt_${Date.now()}_2`, text: "Option B", isCorrect: false, score: 0 },
    ]);
    setRankOptions([
      { id: `rank_${Date.now()}_1`, text: "Option 1", desiredOrder: 1 },
      { id: `rank_${Date.now()}_2`, text: "Option 2", desiredOrder: 2 },
      { id: `rank_${Date.now()}_3`, text: "Option 3", desiredOrder: 3 },
    ]);
    setRankScoring("position_diff");
    setSliderLeftLabel("Disagree");
    setSliderRightLabel("Agree");
    setSliderTargetMin(7);
    setSliderTargetMax(10);
  };



  // Non-AI generator
  const [generatorSelectedTraits, setGeneratorSelectedTraits] = useState<string[]>([]);
  const [generatorCounts, setGeneratorCounts] = useState({ mcq: 2, rank: 1, slider: 1 });

  const toggleGeneratorTrait = (name: string) => {
    setGeneratorSelectedTraits((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const generateSampleQuestions = () => {
    const newQs: CultureQuestion[] = [];
    const now = Date.now();
    const take = (count: number) => Array.from({ length: count }).map((_, i) => i);

    generatorSelectedTraits.forEach((trait) => {
      // MCQ
      take(generatorCounts.mcq).forEach((i) => {
        const idBase = `${now}_${trait.replace(/\s+/g, "_")}_mcq_${i + 1}`;
        newQs.push({
          id: `cq_${idBase}`,
          text: `Which action best reflects ${trait} in a tough situation?`,
          trait,
          type: "multiple_choice",
          weight: 3,
          maxScore: 10,
          options: [
            { id: `${idBase}_a`, text: `Demonstrate ${trait} with a concrete step`, isCorrect: true, score: 10 },
            { id: `${idBase}_b`, text: "Avoid taking responsibility", isCorrect: false, score: 0 },
            { id: `${idBase}_c`, text: "Delay decision until told", isCorrect: false, score: 0 },
          ],
        });
      });
      // Rank
      take(generatorCounts.rank).forEach((i) => {
        const idBase = `${now}_${trait.replace(/\s+/g, "_")}_rank_${i + 1}`;
        newQs.push({
          id: `cq_${idBase}`,
          text: `Order these responses from most to least aligned with ${trait}.`,
          trait,
          type: "rank_scenario",
          weight: 3,
          maxScore: 10,
          scoring: "position_diff",
          options: [
            { id: `${idBase}_1`, text: `Proactively show ${trait}`, desiredOrder: 1 },
            { id: `${idBase}_2`, text: "Neutral response", desiredOrder: 2 },
            { id: `${idBase}_3`, text: `Oppose ${trait}`, desiredOrder: 3 },
          ],
        });
      });
      // Slider
      take(generatorCounts.slider).forEach((i) => {
        const idBase = `${now}_${trait.replace(/\s+/g, "_")}_slider_${i + 1}`;
        newQs.push({
          id: `cq_${idBase}`,
          text: `On a scale of 1-10, how important is ${trait} to you in daily work?`,
          trait,
          type: "slider",
          weight: 2,
          maxScore: 10,
          leftLabel: "Not important",
          rightLabel: "Extremely important",
          targetRange: [7, 10],
        });
      });
    });

    if (newQs.length > 0) {
      handleConfigChange({ cultureQuestions: [...config.cultureQuestions, ...newQs] });
    }
  };
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addCompanyValue = () => {
    setHasAttemptedValueSubmit(true);
    
    if (!newValue.name.trim()) return;

    const value: CompanyValue = {
      id: `cv_${Date.now()}`,
      name: newValue.name,
      description: newValue.description,
      weight: newValue.weight,
      indicators: newValue.indicators.filter(
        (i) => i.trim() !== ""
      ),
    };

    handleConfigChange({
      companyValues: [...config.companyValues, value],
    });

    setNewValue({
      name: "",
      description: "",
      weight: 3,
      indicators: [""],
    });
    setShowAddValue(false);
    setHasAttemptedValueSubmit(false);
  };

  const removeCompanyValue = (valueId: string) => {
    handleConfigChange({
      companyValues: config.companyValues.filter((v) => v.id !== valueId),
    });
  };

  const startEditingValue = (value: CompanyValue) => {
    setEditingValueId(value.id);
    setEditingValue({ ...value });
  };

  const cancelEditingValue = () => {
    setEditingValueId(null);
    setEditingValue(null);
  };

  const saveEditingValue = () => {
    if (!editingValue) return;
    
    handleConfigChange({
      companyValues: config.companyValues.map((v) =>
        v.id === editingValue.id ? editingValue : v
      ),
    });
    
    setEditingValueId(null);
    setEditingValue(null);
  };

  const updateEditingValue = (updates: Partial<CompanyValue>) => {
    if (!editingValue) return;
    setEditingValue({ ...editingValue, ...updates });
  };

  const addIndicatorToEditing = () => {
    if (!editingValue) return;
    updateEditingValue({
      indicators: [...editingValue.indicators, ""],
    });
  };

  const removeIndicatorFromEditing = (index: number) => {
    if (!editingValue) return;
    updateEditingValue({
      indicators: editingValue.indicators.filter((_, i) => i !== index),
    });
  };

  const updateIndicatorInEditing = (index: number, value: string) => {
    if (!editingValue) return;
    const newIndicators = [...editingValue.indicators];
    newIndicators[index] = value;
    updateEditingValue({ indicators: newIndicators });
  };

  // Question editing functions
  const startEditingQuestion = (question: CultureQuestion) => {
    setEditingQuestionId(question.id);
    setEditingQuestion({ ...question });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionId(null);
    setEditingQuestion(null);
  };

  const saveEditingQuestion = () => {
    if (!editingQuestion) return;
    
    handleConfigChange({
      cultureQuestions: config.cultureQuestions.map((q) =>
        q.id === editingQuestion.id ? editingQuestion : q
      ),
    });
    
    setEditingQuestionId(null);
    setEditingQuestion(null);
  };

  const updateEditingQuestion = (updates: Partial<CultureQuestion>) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, ...updates });
  };

  const addMcqOptionToEditing = () => {
    if (!editingQuestion || editingQuestion.type !== "multiple_choice") return;
    const newOption: McqOption = {
      id: `opt_${Date.now()}_${(editingQuestion.options as McqOption[])?.length + 1 || 1}`,
      text: "",
      isCorrect: false,
      score: 0,
    };
    updateEditingQuestion({
      options: [...(editingQuestion.options as McqOption[] || []), newOption],
    });
  };

  const removeMcqOptionFromEditing = (optionId: string) => {
    if (!editingQuestion || editingQuestion.type !== "multiple_choice") return;
    updateEditingQuestion({
      options: (editingQuestion.options as McqOption[]).filter((o) => o.id !== optionId),
    });
  };

  const updateMcqOptionInEditing = (optionId: string, updates: Partial<McqOption>) => {
    if (!editingQuestion || editingQuestion.type !== "multiple_choice") return;
    const newOptions = (editingQuestion.options as McqOption[]).map((o) =>
      o.id === optionId ? { ...o, ...updates } : o
    );
    updateEditingQuestion({ options: newOptions });
  };

  const addRankOptionToEditing = () => {
    if (!editingQuestion || editingQuestion.type !== "rank_scenario") return;
    const newOption: RankScenarioOption = {
      id: `rank_${Date.now()}_${(editingQuestion.options as RankScenarioOption[])?.length + 1 || 1}`,
      text: "",
      desiredOrder: (editingQuestion.options as RankScenarioOption[])?.length + 1 || 1,
    };
    updateEditingQuestion({
      options: [...(editingQuestion.options as RankScenarioOption[] || []), newOption],
    });
  };

  const removeRankOptionFromEditing = (optionId: string) => {
    if (!editingQuestion || editingQuestion.type !== "rank_scenario") return;
    updateEditingQuestion({
      options: (editingQuestion.options as RankScenarioOption[]).filter((o) => o.id !== optionId),
    });
  };

  const updateRankOptionInEditing = (optionId: string, updates: Partial<RankScenarioOption>) => {
    if (!editingQuestion || editingQuestion.type !== "rank_scenario") return;
    const newOptions = (editingQuestion.options as RankScenarioOption[]).map((o) =>
      o.id === optionId ? { ...o, ...updates } : o
    );
    updateEditingQuestion({ options: newOptions });
  };

  // Scenario editing functions
  const startEditingScenario = (scenario: CulturalScenario) => {
    setEditingScenarioId(scenario.id);
    setEditingScenario({ ...scenario });
  };

  const cancelEditingScenario = () => {
    setEditingScenarioId(null);
    setEditingScenario(null);
  };

  const saveEditingScenario = () => {
    if (!editingScenario) return;
    
    handleConfigChange({
      culturalScenarios: config.culturalScenarios.map((s) =>
        s.id === editingScenario.id ? editingScenario : s
      ),
    });
    
    setEditingScenarioId(null);
    setEditingScenario(null);
  };

  const updateEditingScenario = (updates: Partial<CulturalScenario>) => {
    if (!editingScenario) return;
    setEditingScenario({ ...editingScenario, ...updates });
  };

  // Template management functions
  const clearAllQuestions = () => {
    if (window.confirm("Are you sure you want to clear all questions? This action cannot be undone.")) {
      handleConfigChange({ cultureQuestions: [] });
    }
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }
    
    if (config.cultureQuestions.length === 0) {
      alert("No questions to save as template");
      return;
    }

    const newTemplate = {
      name: templateName.trim(),
      questions: [...config.cultureQuestions]
    };

    setSavedTemplates(prev => [...prev, newTemplate]);
    setTemplateName("");
    setShowSaveTemplate(false);
    
    // Save to localStorage for persistence
    const templatesToSave = [...savedTemplates, newTemplate];
    localStorage.setItem('cultureQuestionTemplates', JSON.stringify(templatesToSave));
    
    alert(`Template "${templateName}" saved successfully!`);
  };

  const loadTemplate = (template: {name: string, questions: CultureQuestion[]}) => {
    if (window.confirm(`Load template "${template.name}"? This will replace all current questions.`)) {
      // Generate new IDs for the loaded questions to avoid conflicts
      const questionsWithNewIds = template.questions.map(q => ({
        ...q,
        id: `cq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      }));
      
      handleConfigChange({ cultureQuestions: questionsWithNewIds });
      alert(`Template "${template.name}" loaded successfully!`);
    }
  };

  const deleteTemplate = (templateName: string) => {
    if (window.confirm(`Delete template "${templateName}"?`)) {
      const updatedTemplates = savedTemplates.filter(t => t.name !== templateName);
      setSavedTemplates(updatedTemplates);
      
      // Update localStorage
      localStorage.setItem('cultureQuestionTemplates', JSON.stringify(updatedTemplates));
    }
  };



  // Validation functions for required fields
  const validateCompanyValue = (value: Partial<CompanyValue>) => {
    const errors: string[] = [];
    if (!value.name?.trim()) errors.push("Company value name is required");
    if (!value.description?.trim()) errors.push("Company value description is required");
    if (!value.weight || value.weight < 1 || value.weight > 5) errors.push("Weight must be between 1-5");
    if (!value.indicators?.length || value.indicators.every(i => !i.trim())) errors.push("At least one behavioral indicator is required");
    return errors;
  };

  const validateCultureQuestion = (question: Partial<CultureQuestion>) => {
    const errors: string[] = [];
    if (!question.text?.trim()) errors.push("Question text is required");
    if (!question.trait?.trim()) errors.push("Associated company value is required");
    if (!question.weight || question.weight < 1 || question.weight > 5) errors.push("Weight must be between 1-5");
    if (!question.maxScore || question.maxScore < 1) errors.push("Max score must be greater than 0");
    
    if (question.type === "multiple_choice" && (!question.options || question.options.length < 2)) {
      errors.push("Multiple choice questions need at least 2 options");
    }
    if (question.type === "rank_scenario" && (!question.options || question.options.length < 2)) {
      errors.push("Rank scenario questions need at least 2 options");
    }
    return errors;
  };

  const validateCulturalScenario = (scenario: Partial<CulturalScenario>) => {
    const errors: string[] = [];
    if (!scenario.title?.trim()) errors.push("Scenario title is required");
    if (!scenario.category?.trim()) errors.push("Company value category is required");
    if (!scenario.scenario?.trim()) errors.push("Scenario description is required");
    if (!scenario.expectedResponse?.trim()) errors.push("Expected response is required");
    if (!scenario.evaluationCriteria?.length || scenario.evaluationCriteria.every(c => !c.trim())) {
      errors.push("At least one evaluation criteria is required");
    }
    if (!scenario.timeLimitMinutes || scenario.timeLimitMinutes < 1) errors.push("Time limit must be at least 1 minute");
    if (!scenario.wordLimit?.min || !scenario.wordLimit?.max || scenario.wordLimit.min >= scenario.wordLimit.max) {
      errors.push("Word limit must have valid min/max values");
    }
    return errors;
  };

  // Scenario criteria editing functions
  const startEditingScenarioCriteria = (scenarioId: string) => {
    const scenario = config.culturalScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setEditingScenarioId(scenarioId);
      setEditingCriteria([...scenario.evaluationCriteria]);
    }
  };

  const cancelEditingScenarioCriteria = () => {
    setEditingScenarioId(null);
    setEditingCriteria([]);
  };

  const saveEditingScenarioCriteria = () => {
    if (editingScenarioId) {
      const updatedScenarios = config.culturalScenarios.map(scenario =>
        scenario.id === editingScenarioId
          ? { ...scenario, evaluationCriteria: editingCriteria.filter(c => c.trim() !== "") }
          : scenario
      );
      handleConfigChange({ culturalScenarios: updatedScenarios });
      setEditingScenarioId(null);
      setEditingCriteria([]);
    }
  };

  const addCriteriaToEditing = () => {
    setEditingCriteria([...editingCriteria, ""]);
  };

  const removeCriteriaFromEditing = (index: number) => {
    setEditingCriteria(editingCriteria.filter((_, i) => i !== index));
  };

  const updateCriteriaInEditing = (index: number, value: string) => {
    const updatedCriteria = [...editingCriteria];
    updatedCriteria[index] = value;
    setEditingCriteria(updatedCriteria);
  };

  // Load saved templates from localStorage on component mount
  useEffect(() => {
    const savedTemplatesData = localStorage.getItem('cultureQuestionTemplates');
    if (savedTemplatesData) {
      try {
        const templates = JSON.parse(savedTemplatesData);
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Error loading saved templates:', error);
      }
    }
  }, []);





  // Question list UX helper functions
  const getUniqueTraits = () => {
    const traits = config.cultureQuestions.map(q => q.trait);
    return [...new Set(traits)].sort();
  };

  const getFilteredQuestions = () => {
    if (selectedTrait === "all") {
      return config.cultureQuestions;
    }
    return config.cultureQuestions.filter(q => q.trait === selectedTrait);
  };

  const getPaginatedQuestions = () => {
    const filteredQuestions = getFilteredQuestions();
    const startIndex = (currentQuestionPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return filteredQuestions.slice(startIndex, endIndex);
  };

  const getTotalQuestionPages = () => {
    const filteredQuestions = getFilteredQuestions();
    return Math.ceil(filteredQuestions.length / questionsPerPage);
  };

  const handleTraitChange = (trait: string) => {
    setSelectedTrait(trait);
    setCurrentQuestionPage(1); // Reset to first page when changing trait
  };

  const handleQuestionPageChange = (page: number) => {
    setCurrentQuestionPage(page);
  };

  const addCultureQuestion = () => {
    setHasAttemptedQuestionSubmit(true);
    
    if (!newQuestion.text.trim() || !newQuestion.trait.trim()) return;

    let question: CultureQuestion;
    
    if (newQuestion.type === "multiple_choice") {
      question = {
      id: `cq_${Date.now()}`,
      text: newQuestion.text,
        trait: newQuestion.trait,
        type: newQuestion.type,
        weight: newQuestion.weight,
        maxScore: newQuestion.maxScore,
        options: mcqOptions,
      };
    } else if (newQuestion.type === "rank_scenario") {
      question = {
        id: `cq_${Date.now()}`,
        text: newQuestion.text,
        trait: newQuestion.trait,
        type: newQuestion.type,
        weight: newQuestion.weight,
        maxScore: newQuestion.maxScore,
        options: rankOptions,
        scoring: rankScoring,
      };
    } else if (newQuestion.type === "slider") {
      question = {
        id: `cq_${Date.now()}`,
        text: newQuestion.text,
        trait: newQuestion.trait,
        type: newQuestion.type,
        weight: newQuestion.weight,
        maxScore: newQuestion.maxScore,
        leftLabel: sliderLeftLabel,
        rightLabel: sliderRightLabel,
        targetRange: [sliderTargetMin, sliderTargetMax],
      };
    } else {
      // open_ended
      question = {
        id: `cq_${Date.now()}`,
        text: newQuestion.text,
        trait: newQuestion.trait,
        type: newQuestion.type,
        weight: newQuestion.weight,
        maxScore: newQuestion.maxScore,
      };
    }

    handleConfigChange({
      cultureQuestions: [...config.cultureQuestions, question],
    });

    resetNewQuestionForm();
    setHasAttemptedQuestionSubmit(false);
  };

  const addCulturalScenario = () => {
    setHasAttemptedScenarioSubmit(true);
    
    if (!newScenario.title.trim() || !newScenario.category.trim() || !newScenario.scenario.trim()) return;

    const scenario: CulturalScenario = {
      id: `cs_${Date.now()}`,
      title: newScenario.title,
      scenario: newScenario.scenario,
      category: newScenario.category,
      expectedResponse: newScenario.expectedResponse,
      evaluationCriteria: newScenario.evaluationCriteria.filter(
        (c) => c.trim() !== ""
      ),
      timeLimitMinutes: newScenario.timeLimitMinutes,
      wordLimit: {
        min: newScenario.wordLimitMin,
        max: newScenario.wordLimitMax,
      },
    };

    handleConfigChange({
      culturalScenarios: [...config.culturalScenarios, scenario],
    });

    setNewScenario({
      title: "",
      scenario: "",
      category: "",
      expectedResponse: "",
      evaluationCriteria: [""],
      timeLimitMinutes: 5, // Default 5 minutes for new scenarios
      wordLimitMin: 200,
      wordLimitMax: 300,
    });
    setShowAddScenario(false);
    setHasAttemptedScenarioSubmit(false);
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 4) return "bg-red-100 text-red-800";
    if (weight >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getCategoryColor = (category: string) => {
    // Create a consistent color based on the category name
    const colorMap = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800", 
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-red-100 text-red-800",
      "bg-indigo-100 text-indigo-800",
      "bg-teal-100 text-teal-800",
      "bg-cyan-100 text-cyan-800",
      "bg-amber-100 text-amber-800",
      "bg-emerald-100 text-emerald-800",
      "bg-violet-100 text-violet-800",
      "bg-rose-100 text-rose-800",
      "bg-sky-100 text-sky-800",
      "bg-lime-100 text-lime-800"
    ];
    
    // Use the category name to generate a consistent index
    const index = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorMap.length;
    return colorMap[index] || "bg-gray-100 text-gray-800";
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <p className="font-medium">Error loading configuration</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Culture Fit Configuration
        </h2>
      </div>

      {/* Configuration Name */}
      <div className="mb-4">
        <label
          htmlFor="configName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Configuration Name
        </label>
        <input
          type="text"
          id="configName"
          value={config.name}
          onChange={(e) => handleConfigChange({ name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter configuration name"
        />
        <p className="mt-1 text-xs text-gray-500">
          Give your culture fit configuration a descriptive name
        </p>
      </div>

      {/* Configuration Description */}
      <div className="mb-4">
        <label
          htmlFor="configDescription"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="configDescription"
          value={config.description}
          onChange={(e) => handleConfigChange({ description: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Describe the purpose and focus of this culture fit assessment"
          rows={3}
        />
        <p className="mt-1 text-xs text-gray-500">
          Provide a brief description of what this assessment evaluates
        </p>
      </div>



      {/* Company Values */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("values")}
        >
          <div className="flex items-center space-x-3">
            <Heart className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Company Values
            </h3>
            <span className="text-sm text-gray-500">
              ({config.companyValues.length} values)
            </span>
          </div>
          {expandedSections.values ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.values && (
          <div className="p-3 border-t border-gray-200 space-y-3">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Values</h4>
              <div className="flex flex-wrap gap-2">
                {suggestedValues
                  .filter((s) => !config.companyValues.some((v) => v.name.toLowerCase() === s.name.toLowerCase()))
                  .map((s) => (
                    <button
                      key={s.name}
                      onClick={() => addSuggestedValue(s.name, s.description, s.weight)}
                      className="px-2 py-1 text-xs rounded-full border border-gray-300 hover:border-indigo-300 hover:text-indigo-700"
                      title={s.description}
                    >
                      + {s.name} (w:{s.weight})
                    </button>
                  ))}
              </div>
            </div>
            {config.companyValues.map((value) => (
              <div
                key={value.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                {editingValueId === value.id && editingValue ? (
                  // Editing mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">Editing: {value.name}</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEditingValue}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditingValue}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value Name
                        </label>
                        <input
                          type="text"
                          value={editingValue.name}
                          onChange={(e) => updateEditingValue({ name: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editingValue.description}
                          onChange={(e) => updateEditingValue({ description: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight (1-5)
                        </label>
                        <select
                          value={editingValue.weight}
                          onChange={(e) => updateEditingValue({ weight: parseInt(e.target.value) })}
                          className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white relative z-10"
                        >
                          <option value={1}>1 - Low</option>
                          <option value={2}>2 - Below Average</option>
                          <option value={3}>3 - Average</option>
                          <option value={4}>4 - High</option>
                          <option value={5}>5 - Critical</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Behavioral Indicators
                          </label>
                          <button
                            onClick={addIndicatorToEditing}
                            className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50"
                          >
                            + Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {editingValue.indicators.map((indicator, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={indicator}
                                onChange={(e) => updateIndicatorInEditing(index, e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter behavioral indicator..."
                              />
                              <button
                                onClick={() => removeIndicatorFromEditing(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">
                      {value.name}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getWeightColor(
                        value.weight
                      )}`}
                    >
                      Weight {value.weight}
                    </span>
                  </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditingValue(value)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit value"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                  <button
                    onClick={() => removeCompanyValue(value.id)}
                    className="text-red-600 hover:text-red-800"
                          title="Delete value"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                      </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {value.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Behavioral Indicators
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {value.indicators.map((indicator, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                  </div>
                )}
              </div>
            ))}

            {showAddValue ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Value Name
                      {!newValue.name?.trim() && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={newValue.name}
                      onChange={(e) =>
                        setNewValue({ ...newValue, name: e.target.value })
                      }
                                              className={`w-full p-1.5 text-sm border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                          hasAttemptedValueSubmit && !newValue.name?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="e.g., Innovation"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Weight
                    </label>
                    <select
                      value={newValue.weight}
                      onChange={(e) =>
                        setNewValue({
                          ...newValue,
                          weight: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={1}>1 - Low</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={3}>3 - Average</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Critical</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                      {!newValue.description?.trim() && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      value={newValue.description}
                      onChange={(e) =>
                        setNewValue({
                          ...newValue,
                          description: e.target.value,
                        })
                      }
                                              className={`w-full p-1.5 text-sm border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                          hasAttemptedValueSubmit && !newValue.description?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      rows={2}
                      placeholder="Describe what this value means..."
                    />
                  </div>

                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Behavioral Indicators
                        {(!newValue.indicators?.length || newValue.indicators.every(i => !i.trim())) && <span className="text-red-500 ml-1">*</span>}
                    </label>
                      <button
                        onClick={() => setNewValue({ ...newValue, indicators: [...newValue.indicators, ""] })}
                        className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {newValue.indicators.map((indicator, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={indicator}
                            onChange={(e) => {
                              const newIndicators = [...newValue.indicators];
                              newIndicators[index] = e.target.value;
                              setNewValue({ ...newValue, indicators: newIndicators });
                            }}
                            className="flex-1 p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter behavioral indicator..."
                          />
                          <button
                            onClick={() => {
                              const newIndicators = newValue.indicators.filter((_, i) => i !== index);
                              setNewValue({ ...newValue, indicators: newIndicators });
                            }}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addCompanyValue}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Add Value
                    </button>
                    <button
                      onClick={() => setShowAddValue(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                
                {hasAttemptedValueSubmit && validateCompanyValue(newValue).length > 0 && (
                  <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <span className="font-medium">⚠️ </span>
                    {validateCompanyValue(newValue).join(" • ")}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAddValue(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add Company Value
              </button>
            )}
          </div>
        )}
      </div>

      {/* Culture Questions */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("questions")}
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Culture Assessment Questions
            </h3>
            <span className="text-sm text-gray-500">
              ({config.cultureQuestions.length} questions)
            </span>
          </div>
          {expandedSections.questions ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.questions && (
          <div className="p-3 border-t border-gray-200 space-y-4">
            {/* Question Management Overview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h4 className="text-base font-semibold text-blue-900">Question Management</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    {config.cultureQuestions.length} Questions
                  </span>
                  <button 
                    onClick={clearAllQuestions} 
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={config.cultureQuestions.length === 0}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <p className="text-xs text-blue-700">
                Create questions to assess candidates on your company values. Use the generator for quick setup or add questions manually.
              </p>
            </div>

            {/* Question Generator Section */}
            <div className="border border-gray-200 rounded-lg p-3 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">⚡</span>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">Quick Question Generator</h4>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => alert("AI question generation coming soon ✨")} 
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300"
                  >
                    🤖 AI Generate
                  </button>
                  <button 
                    onClick={generateSampleQuestions} 
                    className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    🚀 Generate
                  </button>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <div className="xl:col-span-2">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Select Company Values:</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {config.companyValues.map((v) => (
                  <button
                        key={v.id}
                        onClick={() => toggleGeneratorTrait(v.name)}
                        className={`px-2 py-1 text-xs rounded-md border transition-all ${
                          generatorSelectedTraits.includes(v.name) 
                            ? "border-indigo-400 bg-indigo-100 text-indigo-700 shadow-sm" 
                            : "border-gray-300 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {v.name}
                  </button>
                    ))}
                  </div>
                </div>
                <div className="xl:col-span-2">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Question Types & Counts:</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">MCQ</label>
                      <input 
                        type="number" 
                        value={generatorCounts.mcq} 
                        min={0} 
                        max={5} 
                        onChange={(e) => setGeneratorCounts((c) => ({ ...c, mcq: Math.max(0, Math.min(5, parseInt(e.target.value || "0"))) }))} 
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Rank</label>
                      <input 
                        type="number" 
                        value={generatorCounts.rank} 
                        min={0} 
                        max={5} 
                        onChange={(e) => setGeneratorCounts((c) => ({ ...c, rank: Math.max(0, Math.min(5, parseInt(e.target.value || "0"))) }))} 
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Slider</label>
                      <input 
                        type="number" 
                        value={generatorCounts.slider} 
                        min={0} 
                        max={5} 
                        onChange={(e) => setGeneratorCounts((c) => ({ ...c, slider: Math.max(0, Math.min(5, parseInt(e.target.value || "0"))) }))} 
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                </div>
              </div>
                </div>

            {/* Template Management Section - Show when there are questions to save or existing templates */}
            {(config.cultureQuestions.length > 0 || savedTemplates.length > 0 || showSaveTemplate) && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📁</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Question Templates</h4>
                  </div>
                  <button 
                    onClick={() => setShowSaveTemplate(true)} 
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={config.cultureQuestions.length === 0}
                  >
                    💾 Save Current as Template
                  </button>
                </div>

                {/* Save Template Modal */}
                {showSaveTemplate && (
                  <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4 shadow-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Save Question Template</h5>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter a descriptive template name..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        onKeyPress={(e) => e.key === 'Enter' && saveAsTemplate()}
                      />
                      <button 
                        onClick={saveAsTemplate}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setShowSaveTemplate(false);
                          setTemplateName("");
                        }}
                        className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Saved Templates List */}
                {savedTemplates.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                      Saved Templates
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {savedTemplates.map((template, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-blue-300 transition-all duration-200 max-w-xs group">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">{template.name}</span>
                              <span className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-100">
                                {template.questions.length}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => loadTemplate(template)}
                                className="flex-1 px-2 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
                              >
                                <span className="text-xs">📂</span>
                                <span>Load</span>
                              </button>
                              <button 
                                onClick={() => deleteTemplate(template.name)}
                                className="px-2 py-1.5 text-xs bg-gradient-to-r from-red-600 to-red-700 text-white rounded-md hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
                              >
                                <span className="text-xs">🗑️</span>
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
              </div>
            ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Question Addition Section */}
            <div className={`border border-gray-200 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 ${
              showAddQuestion ? 'p-4' : 'p-3'
            }`}>
              <div className={`flex items-center justify-between ${
                showAddQuestion ? 'mb-4' : 'mb-0'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✏️</span>
                  </div>
                  <h4 className={`font-semibold text-gray-900 ${
                    showAddQuestion ? 'text-lg' : 'text-base'
                  }`}>Manual Question Builder</h4>
                </div>
                {!showAddQuestion && (
                  <button
                    onClick={() => setShowAddQuestion(true)}
                    className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    ➕ Add Question Manually
                  </button>
                )}
              </div>

            {showAddQuestion ? (
                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-medium text-gray-900">Create New Question</h5>
                    <button
                      onClick={() => setShowAddQuestion(false)}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newQuestion.type}
                      onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as CultureQuestion["type"] })}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white relative z-10"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="rank_scenario">Rank Scenario</option>
                      <option value="slider">Slider (1-10)</option>
                      <option value="open_ended">Open Ended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Trait
                      {hasAttemptedQuestionSubmit && !newQuestion.trait?.trim() && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      value={newQuestion.trait}
                      onChange={(e) => setNewQuestion({ ...newQuestion, trait: e.target.value })}
                                              className={`w-full p-1.5 text-sm border rounded-md focus:ring-indigo-500 focus:border-indigo-500 relative z-10 ${
                          hasAttemptedQuestionSubmit && !newQuestion.trait?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                    >
                      <option value="">Select value</option>
                      {config.companyValues.map((v) => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                    <select
                      value={newQuestion.weight}
                      onChange={(e) => setNewQuestion({ ...newQuestion, weight: parseInt(e.target.value) })}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white relative z-10"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Score</label>
                    <input
                      type="number"
                      value={newQuestion.maxScore}
                      onChange={(e) => setNewQuestion({ ...newQuestion, maxScore: parseInt(e.target.value) })}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Question Text
                      {hasAttemptedQuestionSubmit && !newQuestion.text?.trim() && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                              className={`w-full p-1.5 text-sm border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                          hasAttemptedQuestionSubmit && !newQuestion.text?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      rows={2}
                      placeholder="Write the question..."
                    />
                  </div>

                </div>

                {/* Question Type Specific Options */}
                {newQuestion.type === "multiple_choice" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-medium text-gray-700">Options</h5>
                      <button onClick={addMcqOption} className="text-xs px-2 py-1 border rounded-md">+ Add option</button>
                    </div>
                    <div className="space-y-2">
                      {mcqOptions.map((opt, idx) => (
                        <div key={opt.id} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                          <input
                            value={opt.text}
                            onChange={(e) => setMcqOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)))}
                            placeholder={`Option ${idx + 1}`}
                            className="md:col-span-5 p-1.5 text-sm border border-gray-300 rounded-md"
                          />
                          <label className="md:col-span-1 flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={!!opt.isCorrect}
                              onChange={(e) => setMcqOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, isCorrect: e.target.checked } : o)))}
                              className="mr-1"
                            />
                            Correct
                          </label>
                          <input
                            type="number"
                            value={opt.score ?? 0}
                            onChange={(e) => setMcqOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, score: parseInt(e.target.value || "0") } : o)))}
                            className="md:col-span-1 p-1.5 text-sm border border-gray-300 rounded-md"
                            min={0}
                            max={newQuestion.maxScore}
                          />
                          <button onClick={() => removeMcqOption(opt.id)} className="md:col-span-1 text-red-600 text-xs">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newQuestion.type === "rank_scenario" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-medium text-gray-700">Options (top = most desirable)</h5>
                      <button onClick={addRankOption} className="text-xs px-2 py-1 border rounded-md">+ Add option</button>
                    </div>
                    <div className="space-y-2">
                      {rankOptions.map((opt, idx) => (
                        <div key={opt.id} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                          <input
                            value={opt.text}
                            onChange={(e) => setRankOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)))}
                            placeholder={`Option ${idx + 1}`}
                            className="md:col-span-6 p-1.5 text-sm border border-gray-300 rounded-md"
                          />
                          <input
                            type="number"
                            value={opt.desiredOrder ?? idx + 1}
                            onChange={(e) => setRankOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, desiredOrder: parseInt(e.target.value || "1") } : o)))}
                            className="md:col-span-1 p-1.5 text-sm border border-gray-300 rounded-md"
                            min={1}
                            max={rankOptions.length}
                          />
                          <button onClick={() => removeRankOption(opt.id)} className="md:col-span-1 text-red-600 text-xs">Remove</button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Scoring Method</label>
                      <select
                        value={rankScoring}
                        onChange={(e) => setRankScoring(e.target.value as any)}
                        className="w-48 p-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="position_diff">By position difference</option>
                        <option value="exact">Exact match only</option>
                        <option value="weighted">Weighted by option position</option>
                      </select>
                    </div>
                  </div>
                )}

                {newQuestion.type === "slider" && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Left Label</label>
                      <input
                        value={sliderLeftLabel}
                        onChange={(e) => setSliderLeftLabel(e.target.value)}
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                        placeholder="e.g., Disagree"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Right Label</label>
                      <input
                        value={sliderRightLabel}
                        onChange={(e) => setSliderRightLabel(e.target.value)}
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                        placeholder="e.g., Agree"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Target Min</label>
                      <input
                        type="number"
                        value={sliderTargetMin}
                        min={1}
                        max={10}
                        onChange={(e) => setSliderTargetMin(Math.max(1, Math.min(10, parseInt(e.target.value || "7"))))}
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Target Max</label>
                      <input
                        type="number"
                        value={sliderTargetMax}
                        min={1}
                        max={10}
                        onChange={(e) => setSliderTargetMax(Math.max(1, Math.min(10, parseInt(e.target.value || "10"))))}
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button onClick={addCultureQuestion} className="px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm">➕ Add Question</button>
                  <button onClick={resetNewQuestionForm} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">🔄 Reset</button>
                </div>
                
                              {hasAttemptedQuestionSubmit && validateCultureQuestion(newQuestion).length > 0 && (
                <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <span className="font-medium">⚠️ </span>
                  {validateCultureQuestion(newQuestion).join(" • ")}
                </div>
              )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✏️</div>
                <p className="text-gray-600 text-sm">Create custom questions tailored to your specific needs</p>
              </div>
            )}
            </div>

            {/* Questions List Section - Improved UX */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📋</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Questions List</h4>
                </div>
                <span className="text-sm text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  {config.cultureQuestions.length} Questions
                </span>
              </div>
              
              {config.cultureQuestions.length > 0 ? (
                <div className="space-y-4">
                  {/* Trait Filter */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Filter by Trait:</h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTraitChange("all")}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          selectedTrait === "all"
                            ? "bg-purple-100 border-purple-300 text-purple-700"
                            : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        All Traits ({config.cultureQuestions.length})
                      </button>
                      {getUniqueTraits().map((trait) => {
                        const traitCount = config.cultureQuestions.filter(q => q.trait === trait).length;
                        return (
                          <button
                            key={trait}
                            onClick={() => handleTraitChange(trait)}
                            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                              selectedTrait === trait
                                ? "bg-purple-100 border-purple-300 text-purple-700"
                                : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {trait} ({traitCount})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Questions Display */}
                  <div className="space-y-3">
                    {getPaginatedQuestions().map((question, index) => (
                      <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        {editingQuestionId === question.id && editingQuestion ? (
                          // Editing mode
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-medium text-gray-900">Editing Question</h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={saveEditingQuestion}
                                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingQuestion}
                                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Question Type
                                </label>
                                <select
                                  value={editingQuestion.type}
                                  onChange={(e) => updateEditingQuestion({ type: e.target.value as CultureQuestion["type"] })}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white relative z-10"
                                >
                                  <option value="multiple_choice">Multiple Choice</option>
                                  <option value="rank_scenario">Rank Scenario</option>
                                  <option value="slider">Slider</option>
                                  <option value="open_ended">Open Ended</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Trait
                                </label>
                                <select
                                  value={editingQuestion.trait}
                                  onChange={(e) => updateEditingQuestion({ trait: e.target.value })}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white relative z-10"
                                >
                                  <option value="">Select a trait...</option>
                                  {config.companyValues.map((value) => (
                                    <option key={value.id} value={value.name}>
                                      {value.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Question Text
                    </label>
                    <textarea
                                  value={editingQuestion.text}
                                  onChange={(e) => updateEditingQuestion({ text: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                    />
                  </div>

                              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Weight
                    </label>
                    <select
                                    value={editingQuestion.weight}
                                    onChange={(e) => updateEditingQuestion({ weight: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white relative z-10"
                    >
                                    <option value={1}>1 - Low</option>
                                    <option value={2}>2 - Below Average</option>
                                    <option value={3}>3 - Average</option>
                                    <option value={4}>4 - High</option>
                                    <option value={5}>5 - Critical</option>
                    </select>
                  </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Score
                                  </label>
                                  <input
                                    type="number"
                                    value={editingQuestion.maxScore}
                                    onChange={(e) => updateEditingQuestion({ maxScore: parseInt(e.target.value) })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    min="1"
                                    max="100"
                                  />
                                </div>
                              </div>

                              {/* Type-specific options */}
                              {editingQuestion.type === "multiple_choice" && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      Multiple Choice Options
                                    </label>
                    <button
                                      onClick={addMcqOptionToEditing}
                                      className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50"
                    >
                                      + Add Option
                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(editingQuestion.options as McqOption[])?.map((option) => (
                                      <div key={option.id} className="flex items-center space-x-2">
                                        <input
                                          type="text"
                                          value={option.text}
                                          onChange={(e) => updateMcqOptionInEditing(option.id, { text: e.target.value })}
                                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                          placeholder="Option text..."
                                        />
                                        <input
                                          type="number"
                                          value={option.score || 0}
                                          onChange={(e) => updateMcqOptionInEditing(option.id, { score: parseInt(e.target.value) })}
                                          className="w-20 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                          placeholder="Score"
                                        />
                                        <label className="flex items-center space-x-1">
                                          <input
                                            type="checkbox"
                                            checked={option.isCorrect || false}
                                            onChange={(e) => updateMcqOptionInEditing(option.id, { isCorrect: e.target.checked })}
                                            className="rounded"
                                          />
                                          <span className="text-xs">Correct</span>
                                        </label>
                    <button
                                          onClick={() => removeMcqOptionFromEditing(option.id)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                    >
                                          Remove
                    </button>
                  </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {editingQuestion.type === "rank_scenario" && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      Rank Scenario Options
                                    </label>
                                    <button
                                      onClick={addRankOptionToEditing}
                                      className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50"
                                    >
                                      + Add Option
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(editingQuestion.options as RankScenarioOption[])?.map((option) => (
                                      <div key={option.id} className="flex items-center space-x-2">
                                        <input
                                          type="text"
                                          value={option.text}
                                          onChange={(e) => updateRankOptionInEditing(option.id, { text: e.target.value })}
                                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                          placeholder="Option text..."
                                        />
                                        <input
                                          type="number"
                                          value={option.desiredOrder || 1}
                                          onChange={(e) => updateRankOptionInEditing(option.id, { desiredOrder: parseInt(e.target.value) })}
                                          className="w-20 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                          placeholder="Order"
                                          min="1"
                                        />
                                        <button
                                          onClick={() => removeRankOptionFromEditing(option.id)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Scoring Method
                                    </label>
                                    <select
                                      value={editingQuestion.scoring || "position_diff"}
                                      onChange={(e) => updateEditingQuestion({ scoring: e.target.value as "exact" | "position_diff" | "weighted" })}
                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="exact">Exact Match</option>
                                      <option value="position_diff">Position Difference</option>
                                      <option value="weighted">Weighted</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {editingQuestion.type === "slider" && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Left Label
                                    </label>
                                    <input
                                      type="text"
                                      value={editingQuestion.leftLabel || ""}
                                      onChange={(e) => updateEditingQuestion({ leftLabel: e.target.value })}
                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="e.g., Disagree"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Right Label
                                    </label>
                                    <input
                                      type="text"
                                      value={editingQuestion.rightLabel || ""}
                                      onChange={(e) => updateEditingQuestion({ rightLabel: e.target.value })}
                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="e.g., Agree"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Target Min
                                      </label>
                                      <input
                                        type="number"
                                        value={editingQuestion.targetRange?.[0] || 1}
                                        onChange={(e) => updateEditingQuestion({ 
                                          targetRange: [parseInt(e.target.value), editingQuestion.targetRange?.[1] || 10] 
                                        })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        min="1"
                                        max="10"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Target Max
                                      </label>
                                      <input
                                        type="number"
                                        value={editingQuestion.targetRange?.[1] || 10}
                                        onChange={(e) => updateEditingQuestion({ 
                                          targetRange: [editingQuestion.targetRange?.[0] || 1, parseInt(e.target.value)] 
                                        })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        min="1"
                                        max="10"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                </div>
              </div>
            ) : (
                          // View mode
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' :
                                    question.type === 'rank_scenario' ? 'bg-green-100 text-green-800' :
                                    question.type === 'slider' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {question.type.replace("_", " ").toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    #{index + 1}
                                  </span>
                                </div>
                                <h5 className="text-sm font-medium text-gray-900 mb-1">{question.text}</h5>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>🎯 {question.trait}</span>
                                  <span>⚖️ Weight: {question.weight}</span>
                                  <span>📊 Max: {question.maxScore}</span>
                                </div>
                              </div>
                              <div className="flex space-x-2 ml-4">
              <button
                                  onClick={() => startEditingQuestion(question)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                  title="Edit question"
              >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
              </button>
                                <button 
                                  onClick={() => handleConfigChange({
                                    cultureQuestions: config.cultureQuestions.filter((q) => q.id !== question.id)
                                  })} 
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                  title="Delete question"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {question.type === "multiple_choice" && question.options && (
                              <ul className="text-xs text-gray-600 list-disc ml-5">
                                {(question.options as McqOption[]).map((o) => (
                                  <li key={o.id}>{o.text} {o.isCorrect ? "(correct)" : ""} {typeof o.score === "number" ? `• score ${o.score}` : ""}</li>
                                ))}
                              </ul>
                            )}
                            {question.type === "rank_scenario" && question.options && (
                              <ol className="text-xs text-gray-600 list-decimal ml-5">
                                {(question.options as RankScenarioOption[]).slice().sort((a, b) => (a.desiredOrder ?? 0) - (b.desiredOrder ?? 0)).map((o) => (
                                  <li key={o.id}>{o.text}</li>
                                ))}
                              </ol>
                            )}
                            {question.type === "slider" && (
                              <div className="text-xs text-gray-600">Range target: {question.targetRange?.[0]} - {question.targetRange?.[1]}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {getTotalQuestionPages() > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={currentQuestionPage}
                        totalPages={getTotalQuestionPages()}
                        onPageChange={handleQuestionPageChange}
                        totalItems={getFilteredQuestions().length}
                        itemsPerPage={questionsPerPage}
                        showInfo={true}
                        className=""
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-gray-600 mb-4">No questions created yet. Use the generator above or add questions manually.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cultural Scenarios */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("scenarios")}
        >
          <div className="flex items-center space-x-3">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Cultural Scenarios
            </h3>
            <span className="text-sm text-gray-500">
              ({config.culturalScenarios.length} scenarios)
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={scenariosEnabled}
                onChange={(e) => {
                  setScenariosEnabled(e.target.checked);
                }}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-700">Enable Scenarios</span>
            </label>
          {expandedSections.scenarios ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
          </div>
        </div>

        {expandedSections.scenarios && (
          <div className="p-4 border-t border-gray-200 space-y-4">

            {scenariosEnabled && config.culturalScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                {editingScenarioId === scenario.id && editingScenario ? (
                  // Editing mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">Editing: {scenario.title}</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEditingScenario}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditingScenario}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Scenario Title
                        </label>
                        <input
                          type="text"
                          value={editingScenario.title}
                          onChange={(e) => updateEditingScenario({ title: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., Team Conflict Resolution"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={editingScenario.category}
                          onChange={(e) => updateEditingScenario({ category: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white relative z-10"
                        >
                          <option value="">Select a company value...</option>
                          {config.companyValues.map((value) => (
                            <option key={value.id} value={value.name}>
                              {value.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Scenario Description
                        </label>
                        <textarea
                          value={editingScenario.scenario}
                          onChange={(e) => updateEditingScenario({ scenario: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          rows={3}
                          placeholder="Describe the scenario..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Response
                        </label>
                        <textarea
                          value={editingScenario.expectedResponse}
                          onChange={(e) => updateEditingScenario({ expectedResponse: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          rows={2}
                          placeholder="Describe what you expect from the candidate..."
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time Limit (min)
                          </label>
                          <input
                            type="number"
                            value={editingScenario.timeLimitMinutes}
                            onChange={(e) => updateEditingScenario({ timeLimitMinutes: parseInt(e.target.value) || 0 })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            min="1"
                            max="60"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Words
                          </label>
                          <input
                            type="number"
                            value={editingScenario.wordLimit.min}
                            onChange={(e) => updateEditingScenario({ 
                              wordLimit: { 
                                ...editingScenario.wordLimit, 
                                min: parseInt(e.target.value) || 0 
                              } 
                            })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            min="50"
                            max="1000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Words
                          </label>
                          <input
                            type="number"
                            value={editingScenario.wordLimit.max}
                            onChange={(e) => updateEditingScenario({ 
                              wordLimit: { 
                                ...editingScenario.wordLimit, 
                                max: parseInt(e.target.value) || 0 
                              } 
                            })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            min="100"
                            max="2000"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Evaluation Criteria
                          </label>
                          <button
                            onClick={() => {
                              const newCriteria = [...editingScenario.evaluationCriteria, ""];
                              updateEditingScenario({ evaluationCriteria: newCriteria });
                            }}
                            className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50"
                          >
                            + Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {editingScenario.evaluationCriteria.map((criteria, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={criteria}
                                onChange={(e) => {
                                  const newCriteria = [...editingScenario.evaluationCriteria];
                                  newCriteria[index] = e.target.value;
                                  updateEditingScenario({ evaluationCriteria: newCriteria });
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter evaluation criteria..."
                              />
                              <button
                                onClick={() => {
                                  const newCriteria = editingScenario.evaluationCriteria.filter((_, i) => i !== index);
                                  updateEditingScenario({ evaluationCriteria: newCriteria });
                                }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {scenario.title}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        scenario.category
                      )}`}
                    >
                      {scenario.category.replace("_", " ")}
                    </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          ⏱️ {scenario.timeLimitMinutes} min
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          📝 {scenario.wordLimit.min}-{scenario.wordLimit.max} words
                  </div>
                        <button
                          onClick={() => startEditingScenario(scenario)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit scenario"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                  <button
                    onClick={() =>
                      handleConfigChange({
                        culturalScenarios: config.culturalScenarios.filter(
                          (s) => s.id !== scenario.id
                        ),
                      })
                    }
                    className="text-red-600 hover:text-red-800"
                          title="Delete scenario"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                      </div>
                </div>

                <div className="text-sm text-gray-700 mb-3">
                  <strong>Scenario:</strong> {scenario.scenario}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <strong>Expected Response:</strong>{" "}
                  {scenario.expectedResponse}
                </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Evaluation Criteria
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {scenario.evaluationCriteria.map((criteria, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {criteria}
                            </span>
                          ))}
                </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}






            {scenariosEnabled && showAddScenario ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scenario Title
                      {hasAttemptedScenarioSubmit && !newScenario.title?.trim() && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={newScenario.title}
                      onChange={(e) =>
                        setNewScenario({
                          ...newScenario,
                          title: e.target.value,
                        })
                      }
                      className={`w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                        hasAttemptedScenarioSubmit && !newScenario.title?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Team Conflict Resolution"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scenario Description
                      {hasAttemptedScenarioSubmit && !newScenario.scenario?.trim() && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      value={newScenario.scenario}
                      onChange={(e) =>
                        setNewScenario({
                          ...newScenario,
                          scenario: e.target.value,
                        })
                      }
                      className={`w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                        hasAttemptedScenarioSubmit && !newScenario.scenario?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="Describe the scenario..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                      {hasAttemptedScenarioSubmit && !newScenario.category?.trim() && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      value={newScenario.category}
                      onChange={(e) =>
                        setNewScenario({
                          ...newScenario,
                          category: e.target.value,
                        })
                      }
                      className={`w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 relative z-10 ${
                        hasAttemptedScenarioSubmit && !newScenario.category?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                    >
                      <option value="">Select a company value...</option>
                      {config.companyValues.map((value) => (
                        <option key={value.id} value={value.name}>
                          {value.name}
                      </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Response
                      {hasAttemptedScenarioSubmit && !newScenario.expectedResponse?.trim() && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      value={newScenario.expectedResponse}
                      onChange={(e) =>
                        setNewScenario({
                          ...newScenario,
                          expectedResponse: e.target.value,
                        })
                      }
                      className={`w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                        hasAttemptedScenarioSubmit && !newScenario.expectedResponse?.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="Describe what an ideal response would look like..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        value={newScenario.timeLimitMinutes}
                        onChange={(e) =>
                          setNewScenario({
                            ...newScenario,
                            timeLimitMinutes: parseInt(e.target.value) || 5,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min={1}
                        max={30}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Words
                      </label>
                      <input
                        type="number"
                        value={newScenario.wordLimitMin}
                        onChange={(e) =>
                          setNewScenario({
                            ...newScenario,
                            wordLimitMin: parseInt(e.target.value) || 200,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min={50}
                        max={500}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Words
                      </label>
                      <input
                        type="number"
                        value={newScenario.wordLimitMax}
                        onChange={(e) =>
                          setNewScenario({
                            ...newScenario,
                            wordLimitMax: parseInt(e.target.value) || 300,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        min={100}
                        max={1000}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addCulturalScenario}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Add Scenario
                    </button>
                    <button
                      onClick={() => setShowAddScenario(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {hasAttemptedScenarioSubmit && validateCulturalScenario(newScenario).length > 0 && (
                    <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <span className="font-medium">⚠️ </span>
                      {validateCulturalScenario(newScenario).join(" • ")}
                </div>
                  )}
              </div>
              </div>
            ) : scenariosEnabled ? (
              <button
                onClick={() => setShowAddScenario(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add Cultural Scenario
              </button>
            ) : null}

            {!scenariosEnabled && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm">Cultural Scenarios are currently disabled. Enable them to add scenario-based questions.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assessment Methods */}
      <div className="border border-gray-200 rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("assessment")}
        >
          <div className="flex items-center space-x-3">
            <UserCheck className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Assessment Methods
            </h3>
          </div>
          {expandedSections.assessment ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.assessment && (
          <div className="p-4 border-t border-gray-200 space-y-4">

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Assessment Components
              </h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.assessmentMethods.valuesAlignment}
                    onChange={(e) =>
                      handleConfigChange({
                        assessmentMethods: {
                          ...config.assessmentMethods,
                          valuesAlignment: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Values alignment assessment
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.assessmentMethods.teamExercise}
                    onChange={(e) =>
                      handleConfigChange({
                        assessmentMethods: {
                          ...config.assessmentMethods,
                          teamExercise: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Team collaboration exercise
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.assessmentMethods.cultureScenarios}
                    onChange={(e) =>
                      handleConfigChange({
                        assessmentMethods: {
                          ...config.assessmentMethods,
                          cultureScenarios: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Cultural scenario discussions
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.assessmentMethods.personalityAssessment}
                    onChange={(e) =>
                      handleConfigChange({
                        assessmentMethods: {
                          ...config.assessmentMethods,
                          personalityAssessment: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Personality assessment
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.assessmentMethods.peerInterview}
                    onChange={(e) =>
                      handleConfigChange({
                        assessmentMethods: {
                          ...config.assessmentMethods,
                          peerInterview: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Peer interview session
                  </span>
                </label>
              </div>
            </div>

            {/* Time Configuration */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Time Configuration</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time per Game Question (seconds)
                </label>
                <input
                  type="number"
                  value={config.assessmentSettings.timePerQuestionSeconds}
                  onChange={(e) =>
                    handleConfigChange({
                      assessmentSettings: {
                        ...config.assessmentSettings,
                        timePerQuestionSeconds: parseInt(e.target.value) || 60,
                      },
                    })
                  }
                  className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="60"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time limit for each culture assessment question (MCQ, Rank, Slider). Each scenario has its own individual time limit.
                </p>
              </div>
            </div>

            {/* Total Duration */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Total Duration</h4>
              
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Duration (minutes)
                  </label>
                  <input
                    type="number"
                    //Show manually edited value if it exists, otherwise show calculated value
                    value={config.duration > 0 ? config.duration : calculateTotalDuration()}
                    onChange={(e) => handleConfigChange({ duration: parseInt(e.target.value) || 0 })}
                    className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                    max="480"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => handleConfigChange({ duration: calculateTotalDuration() })}
                    className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    Recalculate
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total duration based on current time settings. You can edit this value manually or recalculate it automatically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scoring Method
                </label>
                <select
                  value={config.scoringMethod}
                  onChange={(e) =>
                    handleConfigChange({
                      scoringMethod: e.target.value as
                        | "weighted"
                        | "balanced"
                        | "holistic",
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white relative z-10"
                >
                  <option value="weighted">Weighted by Value Importance</option>
                  <option value="balanced">Balanced Assessment</option>
                  <option value="holistic">Holistic Evaluation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Threshold (%)
                </label>
                <input
                  type="number"
                  value={config.passingThreshold}
                  onChange={(e) => {
                    // Allow the field to be cleared for typing
                    if (e.target.value === "") {
                      handleConfigChange({ passingThreshold: 50 });
                    } else {
                      const value = parseInt(e.target.value);
                      // Handle NaN and enforce min/max
                      if (!isNaN(value)) {
                        const validValue = Math.max(50, Math.min(100, value));
                        handleConfigChange({ passingThreshold: validValue });
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="50"
                  max="100"
                />
              </div>
            </div>



            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-700">Shuffle Questions</label>
                <input
                  type="checkbox"
                  checked={config.assessmentSettings.shuffleQuestions}
                  onChange={(e) =>
                    handleConfigChange({
                      assessmentSettings: {
                        ...config.assessmentSettings,
                        shuffleQuestions: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="text-sm text-gray-700 ml-4">Show Explanations After Answer</label>
                <input
                  type="checkbox"
                  checked={config.assessmentSettings.showExplanations}
                  onChange={(e) =>
                    handleConfigChange({
                      assessmentSettings: {
                        ...config.assessmentSettings,
                        showExplanations: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultural Red Flags (one per line)
              </label>
              <textarea
                value={config.redFlags.join("\n")}
                onChange={(e) =>
                  handleConfigChange({
                    redFlags: e.target.value
                      .split("\n")
                      .filter((flag) => flag.trim() !== ""),
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Behaviors or attitudes that would be concerning..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Instructions
            </label>
            <textarea
              value={config.instructions}
              onChange={(e) =>
                handleConfigChange({ instructions: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Instructions for conducting the culture fit assessment..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evaluation Criteria
            </label>
            <textarea
              value={config.evaluationCriteria}
              onChange={(e) =>
                handleConfigChange({ evaluationCriteria: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="How to evaluate cultural fit..."
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-900">
              Culture Fit Assessment Summary
            </h4>
            <div className="mt-2 text-sm text-red-700 space-y-1">
              <p>
                • {config.companyValues.length} company values with{" "}
                {config.cultureQuestions.length} assessment questions
              </p>
              <p>
                • {config.culturalScenarios.length} cultural scenarios for
                evaluation
              </p>
              <p>
                • {config.duration} minute assessment using{" "}
                {config.scoringMethod} scoring method
              </p>
              <p>
                • {config.passingThreshold}% threshold with{" "}
                {Object.values(config.assessmentMethods).filter(Boolean).length}{" "}
                assessment components
              </p>
              <p>• {config.redFlags.length} cultural red flags identified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
