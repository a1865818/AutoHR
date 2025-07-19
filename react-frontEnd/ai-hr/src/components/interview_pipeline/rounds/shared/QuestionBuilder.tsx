"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Clock,
  Target,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export interface Question {
  id: string;
  text: string;
  type: "open" | "multiple_choice" | "rating" | "coding" | "scenario";
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  timeLimit?: number; // in minutes
  points?: number;
  required?: boolean;
  followUpQuestions?: string[];
  options?: string[]; // for multiple choice
  correctAnswer?: string | number;
  guidelines?: string;
  tags?: string[];
}

interface QuestionBuilderProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  availableCategories?: string[];
  allowedTypes?: Question["type"][];
  showPointsSystem?: boolean;
  showTimeLimit?: boolean;
  showDifficulty?: boolean;
  maxQuestions?: number;
  placeholder?: string;
}

export function QuestionBuilder({
  questions,
  onQuestionsChange,
  availableCategories = ["General", "Technical", "Experience"],
  allowedTypes = ["open", "multiple_choice", "rating"],
  showPointsSystem = true,
  showTimeLimit = true,
  showDifficulty = true,
  maxQuestions = 20,
  placeholder = "Enter your question...",
}: QuestionBuilderProps) {
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: "",
    type: "open",
    category: availableCategories[0],
    difficulty: "medium",
    timeLimit: 5,
    points: 10,
    required: false,
    followUpQuestions: [],
    options: [],
    tags: [],
  });

  const questionTypeOptions = [
    {
      value: "open",
      label: "Open-ended",
      icon: FileText,
      description: "Narrative response question",
    },
    {
      value: "multiple_choice",
      label: "Multiple Choice",
      icon: CheckCircle,
      description: "Select from options",
    },
    {
      value: "rating",
      label: "Rating Scale",
      icon: Target,
      description: "Numeric rating system",
    },
    {
      value: "coding",
      label: "Coding Challenge",
      icon: FileText,
      description: "Programming problem",
    },
    {
      value: "scenario",
      label: "Scenario",
      icon: Users,
      description: "Situational question",
    },
  ];

  const addQuestion = () => {
    if (!newQuestion.text?.trim()) return;

    const question: Question = {
      id: `q_${Date.now()}`,
      text: newQuestion.text,
      type: newQuestion.type || "open",
      category: newQuestion.category,
      difficulty: newQuestion.difficulty,
      timeLimit: newQuestion.timeLimit,
      points: newQuestion.points,
      required: newQuestion.required || false,
      followUpQuestions: newQuestion.followUpQuestions || [],
      options: newQuestion.options || [],
      guidelines: newQuestion.guidelines,
      tags: newQuestion.tags || [],
    };

    onQuestionsChange([...questions, question]);
    setNewQuestion({
      text: "",
      type: "open",
      category: availableCategories[0],
      difficulty: "medium",
      timeLimit: 5,
      points: 10,
      required: false,
      followUpQuestions: [],
      options: [],
      tags: [],
    });
    setIsAddingQuestion(false);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onQuestionsChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
    setEditingQuestion(null);
  };

  const deleteQuestion = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    const currentIndex = questions.findIndex((q) => q.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[currentIndex], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[currentIndex],
    ];

    onQuestionsChange(newQuestions);
  };

  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedQuestion(questionId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault();

    if (!draggedQuestion || draggedQuestion === targetQuestionId) {
      setDraggedQuestion(null);
      return;
    }

    const draggedIndex = questions.findIndex((q) => q.id === draggedQuestion);
    const targetIndex = questions.findIndex((q) => q.id === targetQuestionId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedQuestion(null);
      return;
    }

    const newQuestions = [...questions];
    const [draggedItem] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, draggedItem);

    onQuestionsChange(newQuestions);
    setDraggedQuestion(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = questionTypeOptions.find((t) => t.value === type);
    return typeConfig?.icon || FileText;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
          <p className="text-sm text-gray-600">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
            {maxQuestions && ` (max ${maxQuestions})`}
          </p>
        </div>

        <button
          onClick={() => setIsAddingQuestion(true)}
          disabled={maxQuestions ? questions.length >= maxQuestions : false}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => {
          const TypeIcon = getTypeIcon(question.type);
          const isEditing = editingQuestion === question.id;

          return (
            <div
              key={question.id}
              draggable
              onDragStart={(e) => handleDragStart(e, question.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, question.id)}
              className={`border border-gray-200 rounded-lg p-4 transition-all ${
                draggedQuestion === question.id
                  ? "opacity-50 scale-95"
                  : "hover:shadow-md"
              }`}
            >
              {isEditing ? (
                <QuestionEditor
                  question={question}
                  availableCategories={availableCategories}
                  allowedTypes={allowedTypes}
                  showPointsSystem={showPointsSystem}
                  showTimeLimit={showTimeLimit}
                  showDifficulty={showDifficulty}
                  onSave={(updates) => updateQuestion(question.id, updates)}
                  onCancel={() => setEditingQuestion(null)}
                />
              ) : (
                <div className="space-y-3">
                  {/* Question Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center justify-center mt-1">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                            Q{index + 1}
                          </span>
                          <div className="flex items-center space-x-1">
                            <TypeIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500 capitalize">
                              {question.type.replace("_", " ")}
                            </span>
                          </div>
                          {question.required && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              Required
                            </span>
                          )}
                          {showDifficulty && question.difficulty && (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                                question.difficulty
                              )}`}
                            >
                              {question.difficulty}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-900 font-medium mb-2">
                          {question.text}
                        </p>

                        {question.guidelines && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Guidelines:</strong> {question.guidelines}
                          </p>
                        )}

                        {/* Question Details */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {question.category && (
                            <span>{question.category}</span>
                          )}
                          {showTimeLimit && question.timeLimit && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{question.timeLimit}min</span>
                            </div>
                          )}
                          {showPointsSystem && question.points && (
                            <div className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>{question.points}pts</span>
                            </div>
                          )}
                        </div>

                        {/* Multiple Choice Options */}
                        {question.type === "multiple_choice" &&
                          question.options &&
                          question.options.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">
                                Options:
                              </p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {question.options.map((option, optionIndex) => (
                                  <li
                                    key={optionIndex}
                                    className="flex items-center space-x-2"
                                  >
                                    <span className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center text-xs">
                                      {String.fromCharCode(65 + optionIndex)}
                                    </span>
                                    <span>{option}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {/* Follow-up Questions */}
                        {question.followUpQuestions &&
                          question.followUpQuestions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">
                                Follow-up questions:
                              </p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {question.followUpQuestions.map(
                                  (followUp, followUpIndex) => (
                                    <li key={followUpIndex}>• {followUp}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveQuestion(question.id, "up")}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveQuestion(question.id, "down")}
                        disabled={index === questions.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingQuestion(question.id)}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Question Form */}
      {isAddingQuestion && (
        <div className="border border-dashed border-gray-300 rounded-lg p-4">
          <QuestionEditor
            question={newQuestion}
            availableCategories={availableCategories}
            allowedTypes={allowedTypes}
            showPointsSystem={showPointsSystem}
            showTimeLimit={showTimeLimit}
            showDifficulty={showDifficulty}
            onSave={addQuestion}
            onCancel={() => setIsAddingQuestion(false)}
            isNew={true}
            placeholder={placeholder}
          />
        </div>
      )}

      {questions.length === 0 && !isAddingQuestion && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No questions added yet</p>
          <p className="text-sm">Click "Add Question" to get started</p>
        </div>
      )}
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: Partial<Question>;
  availableCategories: string[];
  allowedTypes: Question["type"][];
  showPointsSystem: boolean;
  showTimeLimit: boolean;
  showDifficulty: boolean;
  onSave: (question?: any) => void;
  onCancel: () => void;
  isNew?: boolean;
  placeholder?: string;
}

function QuestionEditor({
  question,
  availableCategories,
  allowedTypes,
  showPointsSystem,
  showTimeLimit,
  showDifficulty,
  onSave,
  onCancel,
  isNew = false,
  placeholder = "Enter your question...",
}: QuestionEditorProps) {
  const [editedQuestion, setEditedQuestion] =
    useState<Partial<Question>>(question);

  const questionTypeOptions = [
    { value: "open", label: "Open-ended", icon: FileText },
    { value: "multiple_choice", label: "Multiple Choice", icon: CheckCircle },
    { value: "rating", label: "Rating Scale", icon: Target },
    { value: "coding", label: "Coding Challenge", icon: FileText },
    { value: "scenario", label: "Scenario", icon: Users },
  ].filter((type) => allowedTypes.includes(type.value as Question["type"]));

  const handleSave = () => {
    if (!editedQuestion.text?.trim()) return;
    onSave(isNew ? undefined : editedQuestion);
  };

  const addOption = () => {
    setEditedQuestion((prev) => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }));
  };

  const updateOption = (index: number, value: string) => {
    setEditedQuestion((prev) => ({
      ...prev,
      options: prev.options?.map((opt, i) => (i === index ? value : opt)) || [],
    }));
  };

  const removeOption = (index: number) => {
    setEditedQuestion((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || [],
    }));
  };

  const addFollowUp = () => {
    setEditedQuestion((prev) => ({
      ...prev,
      followUpQuestions: [...(prev.followUpQuestions || []), ""],
    }));
  };

  const updateFollowUp = (index: number, value: string) => {
    setEditedQuestion((prev) => ({
      ...prev,
      followUpQuestions:
        prev.followUpQuestions?.map((q, i) => (i === index ? value : q)) || [],
    }));
  };

  const removeFollowUp = (index: number) => {
    setEditedQuestion((prev) => ({
      ...prev,
      followUpQuestions:
        prev.followUpQuestions?.filter((_, i) => i !== index) || [],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question *
        </label>
        <textarea
          value={editedQuestion.text || ""}
          onChange={(e) =>
            setEditedQuestion((prev) => ({ ...prev, text: e.target.value }))
          }
          placeholder={placeholder}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Question Type & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Type
          </label>
          <select
            value={editedQuestion.type || "open"}
            onChange={(e) =>
              setEditedQuestion((prev) => ({
                ...prev,
                type: e.target.value as Question["type"],
              }))
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {questionTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={editedQuestion.category || availableCategories[0]}
            onChange={(e) =>
              setEditedQuestion((prev) => ({
                ...prev,
                category: e.target.value,
              }))
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="grid grid-cols-3 gap-4">
        {showDifficulty && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={editedQuestion.difficulty || "medium"}
              onChange={(e) =>
                setEditedQuestion((prev) => ({
                  ...prev,
                  difficulty: e.target.value as "easy" | "medium" | "hard",
                }))
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        )}

        {showTimeLimit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit (min)
            </label>
            <input
              type="number"
              value={editedQuestion.timeLimit || 5}
              onChange={(e) =>
                setEditedQuestion((prev) => ({
                  ...prev,
                  timeLimit: parseInt(e.target.value) || 5,
                }))
              }
              min="1"
              max="60"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        {showPointsSystem && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points
            </label>
            <input
              type="number"
              value={editedQuestion.points || 10}
              onChange={(e) =>
                setEditedQuestion((prev) => ({
                  ...prev,
                  points: parseInt(e.target.value) || 10,
                }))
              }
              min="1"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Multiple Choice Options */}
      {editedQuestion.type === "multiple_choice" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Answer Options
            </label>
            <button
              onClick={addOption}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              + Add Option
            </button>
          </div>
          <div className="space-y-2">
            {(editedQuestion.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center text-xs">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeOption(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interviewer Guidelines (optional)
        </label>
        <textarea
          value={editedQuestion.guidelines || ""}
          onChange={(e) =>
            setEditedQuestion((prev) => ({
              ...prev,
              guidelines: e.target.value,
            }))
          }
          placeholder="Guidelines for the interviewer on how to ask or evaluate this question..."
          rows={2}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Follow-up Questions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Follow-up Questions (optional)
          </label>
          <button
            onClick={addFollowUp}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            + Add Follow-up
          </button>
        </div>
        <div className="space-y-2">
          {(editedQuestion.followUpQuestions || []).map((followUp, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={followUp}
                onChange={(e) => updateFollowUp(index, e.target.value)}
                placeholder="Follow-up question..."
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => removeFollowUp(index)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Required Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="required"
          checked={editedQuestion.required || false}
          onChange={(e) =>
            setEditedQuestion((prev) => ({
              ...prev,
              required: e.target.checked,
            }))
          }
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="required" className="ml-2 text-sm text-gray-700">
          Required question
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!editedQuestion.text?.trim()}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isNew ? "Add Question" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
