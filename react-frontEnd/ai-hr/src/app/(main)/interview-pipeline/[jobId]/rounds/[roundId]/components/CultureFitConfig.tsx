"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Heart,
  Users,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Star,
  Lightbulb,
  UserCheck,
} from "lucide-react";

interface CompanyValue {
  id: string;
  name: string;
  description: string;
  weight: number; // 1-5
  assessmentQuestions: string[];
  behavioralIndicators: string[];
}

interface CultureQuestion {
  id: string;
  text: string;
  category: "values" | "teamwork" | "communication" | "adaptability" | "growth";
  valueIds: string[]; // which company values this question assesses
  followUpQuestions: string[];
  scoringCriteria: string[];
}

interface CulturalScenario {
  id: string;
  title: string;
  scenario: string;
  category:
    | "conflict_resolution"
    | "decision_making"
    | "collaboration"
    | "innovation"
    | "pressure";
  expectedResponse: string;
  evaluationCriteria: string[];
}

interface TeamDynamics {
  id: string;
  aspect: string;
  description: string;
  assessmentMethod: "interview" | "scenario" | "reference" | "exercise";
  indicators: string[];
}

interface CultureFitConfiguration {
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
  redFlags: string[];
  instructions: string;
  evaluationCriteria: string;
}

interface CultureFitConfigProps {
  jobId: string;
  roundId: string;
  round: any;
  onConfigurationChange: (newConfig: any) => void;
}

const defaultCompanyValues: CompanyValue[] = [
  {
    id: "cv1",
    name: "Innovation",
    description: "Embracing new ideas and creative solutions to drive progress",
    weight: 4,
    assessmentQuestions: [
      "Tell me about a time when you came up with a creative solution to a problem",
      "How do you stay current with industry trends and innovations?",
    ],
    behavioralIndicators: [
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
    assessmentQuestions: [
      "Describe your ideal team environment",
      "How do you handle disagreements with team members?",
    ],
    behavioralIndicators: [
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
    assessmentQuestions: [
      "Tell me about a time when you had to make a difficult ethical decision",
      "How do you handle situations where you disagree with company policies?",
    ],
    behavioralIndicators: [
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
    category: "pressure",
    expectedResponse:
      "Should discuss concerns openly, propose alternatives, escalate if necessary",
    evaluationCriteria: [
      "Maintains quality standards",
      "Communicates concerns effectively",
      "Seeks collaborative solutions",
      "Shows integrity under pressure",
    ],
  },
  {
    id: "cs2",
    title: "Team Conflict",
    scenario:
      "Two team members have a disagreement about the direction of a project and ask for your input. How do you handle this?",
    category: "conflict_resolution",
    expectedResponse:
      "Listen to both sides, facilitate discussion, focus on project goals",
    evaluationCriteria: [
      "Remains neutral and objective",
      "Facilitates open communication",
      "Focuses on solutions",
      "Considers all perspectives",
    ],
  },
];

export function CultureFitConfig({
  jobId,
  roundId,
  round,
  onConfigurationChange,
}: CultureFitConfigProps) {
  const [config, setConfig] = useState<CultureFitConfiguration>({
    companyValues: defaultCompanyValues,
    cultureQuestions: [],
    culturalScenarios: defaultScenarios,
    teamDynamics: [],
    duration: 45,
    assessmentMethods: {
      valuesAlignment: true,
      personalityAssessment: false,
      teamExercise: true,
      cultureScenarios: true,
      peerInterview: false,
    },
    scoringMethod: "weighted",
    passingThreshold: 75,
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
    assessmentQuestions: [""],
    behavioralIndicators: [""],
  });

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    category: "values" as CultureQuestion["category"],
    valueIds: [] as string[],
    followUpQuestions: [""],
    scoringCriteria: [""],
  });

  const [newScenario, setNewScenario] = useState({
    title: "",
    scenario: "",
    category: "collaboration" as CulturalScenario["category"],
    expectedResponse: "",
    evaluationCriteria: [""],
  });

  const [showAddValue, setShowAddValue] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddScenario, setShowAddScenario] = useState(false);

  const handleConfigChange = (updates: Partial<CultureFitConfiguration>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigurationChange(newConfig);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addCompanyValue = () => {
    if (!newValue.name.trim()) return;

    const value: CompanyValue = {
      id: `cv_${Date.now()}`,
      name: newValue.name,
      description: newValue.description,
      weight: newValue.weight,
      assessmentQuestions: newValue.assessmentQuestions.filter(
        (q) => q.trim() !== ""
      ),
      behavioralIndicators: newValue.behavioralIndicators.filter(
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
      assessmentQuestions: [""],
      behavioralIndicators: [""],
    });
    setShowAddValue(false);
  };

  const removeCompanyValue = (valueId: string) => {
    handleConfigChange({
      companyValues: config.companyValues.filter((v) => v.id !== valueId),
    });
  };

  const updateCompanyValue = (
    valueId: string,
    updates: Partial<CompanyValue>
  ) => {
    handleConfigChange({
      companyValues: config.companyValues.map((v) =>
        v.id === valueId ? { ...v, ...updates } : v
      ),
    });
  };

  const addCultureQuestion = () => {
    if (!newQuestion.text.trim()) return;

    const question: CultureQuestion = {
      id: `cq_${Date.now()}`,
      text: newQuestion.text,
      category: newQuestion.category,
      valueIds: newQuestion.valueIds,
      followUpQuestions: newQuestion.followUpQuestions.filter(
        (q) => q.trim() !== ""
      ),
      scoringCriteria: newQuestion.scoringCriteria.filter(
        (c) => c.trim() !== ""
      ),
    };

    handleConfigChange({
      cultureQuestions: [...config.cultureQuestions, question],
    });

    setNewQuestion({
      text: "",
      category: "values",
      valueIds: [],
      followUpQuestions: [""],
      scoringCriteria: [""],
    });
    setShowAddQuestion(false);
  };

  const addCulturalScenario = () => {
    if (!newScenario.title.trim() || !newScenario.scenario.trim()) return;

    const scenario: CulturalScenario = {
      id: `cs_${Date.now()}`,
      title: newScenario.title,
      scenario: newScenario.scenario,
      category: newScenario.category,
      expectedResponse: newScenario.expectedResponse,
      evaluationCriteria: newScenario.evaluationCriteria.filter(
        (c) => c.trim() !== ""
      ),
    };

    handleConfigChange({
      culturalScenarios: [...config.culturalScenarios, scenario],
    });

    setNewScenario({
      title: "",
      scenario: "",
      category: "collaboration",
      expectedResponse: "",
      evaluationCriteria: [""],
    });
    setShowAddScenario(false);
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 4) return "bg-red-100 text-red-800";
    if (weight >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      values: "bg-blue-100 text-blue-800",
      teamwork: "bg-green-100 text-green-800",
      communication: "bg-purple-100 text-purple-800",
      adaptability: "bg-orange-100 text-orange-800",
      growth: "bg-pink-100 text-pink-800",
      conflict_resolution: "bg-red-100 text-red-800",
      decision_making: "bg-indigo-100 text-indigo-800",
      collaboration: "bg-teal-100 text-teal-800",
      innovation: "bg-cyan-100 text-cyan-800",
      pressure: "bg-amber-100 text-amber-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <div className="p-6 space-y-8">
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
          <div className="p-4 border-t border-gray-200 space-y-4">
            {config.companyValues.map((value) => (
              <div
                key={value.id}
                className="border border-gray-200 rounded-lg p-4"
              >
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
                  <button
                    onClick={() => removeCompanyValue(value.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {value.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Assessment Questions
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {value.assessmentQuestions.map((question, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Behavioral Indicators
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {value.behavioralIndicators.map((indicator, index) => (
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
            ))}

            {showAddValue ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value Name
                    </label>
                    <input
                      type="text"
                      value={newValue.name}
                      onChange={(e) =>
                        setNewValue({ ...newValue, name: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Innovation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newValue.description}
                      onChange={(e) =>
                        setNewValue({
                          ...newValue,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      placeholder="Describe what this value means..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (1-5)
                    </label>
                    <select
                      value={newValue.weight}
                      onChange={(e) =>
                        setNewValue({
                          ...newValue,
                          weight: parseInt(e.target.value),
                        })
                      }
                      className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={1}>1 - Low</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={3}>3 - Average</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Critical</option>
                    </select>
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
          <div className="p-4 border-t border-gray-200 space-y-4">
            {config.cultureQuestions.map((question) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        question.category
                      )}`}
                    >
                      {question.category.replace("_", " ")}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleConfigChange({
                        cultureQuestions: config.cultureQuestions.filter(
                          (q) => q.id !== question.id
                        ),
                      })
                    }
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-900 mb-2">
                  {question.text}
                </div>

                {question.followUpQuestions.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Follow-ups: {question.followUpQuestions.join(", ")}
                  </div>
                )}
              </div>
            ))}

            {showAddQuestion ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    <textarea
                      value={newQuestion.text}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, text: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      placeholder="Enter your culture assessment question..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newQuestion.category}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          category: e.target
                            .value as CultureQuestion["category"],
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="values">Values</option>
                      <option value="teamwork">Teamwork</option>
                      <option value="communication">Communication</option>
                      <option value="adaptability">Adaptability</option>
                      <option value="growth">Growth</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addCultureQuestion}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Add Question
                    </button>
                    <button
                      onClick={() => setShowAddQuestion(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddQuestion(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add Culture Question
              </button>
            )}
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
          {expandedSections.scenarios ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {expandedSections.scenarios && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {config.culturalScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="border border-gray-200 rounded-lg p-4"
              >
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
                  <button
                    onClick={() =>
                      handleConfigChange({
                        culturalScenarios: config.culturalScenarios.filter(
                          (s) => s.id !== scenario.id
                        ),
                      })
                    }
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-700 mb-3">
                  <strong>Scenario:</strong> {scenario.scenario}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <strong>Expected Response:</strong>{" "}
                  {scenario.expectedResponse}
                </div>

                <div className="text-xs text-gray-500">
                  <strong>Evaluation Criteria:</strong>{" "}
                  {scenario.evaluationCriteria.join(", ")}
                </div>
              </div>
            ))}

            {showAddScenario ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scenario Title
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Team Conflict Resolution"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scenario Description
                    </label>
                    <textarea
                      value={newScenario.scenario}
                      onChange={(e) =>
                        setNewScenario({
                          ...newScenario,
                          scenario: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Describe the scenario..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newScenario.category}
                      onChange={(e) =>
                        setNewScenario({
                          ...newScenario,
                          category: e.target
                            .value as CulturalScenario["category"],
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="collaboration">Collaboration</option>
                      <option value="conflict_resolution">
                        Conflict Resolution
                      </option>
                      <option value="decision_making">Decision Making</option>
                      <option value="innovation">Innovation</option>
                      <option value="pressure">Pressure</option>
                    </select>
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
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddScenario(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="h-5 w-5 mx-auto mb-2" />
                Add Cultural Scenario
              </button>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Duration (minutes)
              </label>
              <input
                type="number"
                value={config.duration}
                onChange={(e) =>
                  handleConfigChange({ duration: parseInt(e.target.value) })
                }
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="30"
                max="120"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scoring Method
                </label>
                <select
                  value={config.scoringMethod}
                  onChange={(e) =>
                    handleConfigChange({ scoringMethod: e.target.value as any })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
                  onChange={(e) =>
                    handleConfigChange({
                      passingThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="50"
                  max="100"
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
