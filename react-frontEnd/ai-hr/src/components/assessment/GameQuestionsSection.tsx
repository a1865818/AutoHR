"use client";

import React, { useState, useEffect } from "react";
import { MultipleChoiceQuestion } from "./questions/MultipleChoiceQuestion";
import { RankScenarioQuestion } from "./questions/RankScenarioQuestion";
import { SliderQuestion } from "./questions/SliderQuestion";
import { OpenEndedQuestion } from "./questions/OpenEndedQuestion";
import { QuestionTimer } from "./QuestionTimer";

interface Question {
  id: string;
  text: string;
  trait: string;
  type: "multiple_choice" | "rank_scenario" | "slider" | "open_ended";
  weight: number;
  maxScore: number;
  options?: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
    score?: number;
  }>;
}

interface GameAnswer {
  questionId: string;
  answer: any;
  timeSpent: number;
}

interface GameQuestionsSectionProps {
  questions: Question[];
  timePerQuestion: number;
  onComplete: (answers: GameAnswer[]) => void;
  onTimeUp: () => void;
}

export function GameQuestionsSection({ 
  questions, 
  timePerQuestion, 
  onComplete, 
  onTimeUp 
}: GameQuestionsSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  // Shuffle questions if needed
  useEffect(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, [questions]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const handleAnswer = (answer: any) => {
    const timeSpent = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);
    
    const newAnswer: GameAnswer = {
      questionId: currentQuestion.id,
      answer,
      timeSpent,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    // Move to next question or complete
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(new Date());
    } else {
      onComplete(newAnswers);
    }
  };

  const handleQuestionTimeUp = () => {
    // Auto-submit current question with empty answer
    handleAnswer(null);
  };

  const handleSkip = () => {
    handleAnswer(null);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const commonProps = {
      question: currentQuestion,
      onAnswer: handleAnswer,
      onSkip: handleSkip,
    };

    switch (currentQuestion.type) {
      case "multiple_choice":
        return <MultipleChoiceQuestion {...commonProps} />;
      case "rank_scenario":
        return <RankScenarioQuestion {...commonProps} />;
      case "slider":
        return <SliderQuestion {...commonProps} />;
      case "open_ended":
        return <OpenEndedQuestion {...commonProps} />;
      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
            </h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {currentQuestion.trait}
            </span>
          </div>
          <QuestionTimer
            duration={timePerQuestion}
            onTimeUp={handleQuestionTimeUp}
            key={currentQuestion.id} // Reset timer for each question
          />
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        {renderQuestion()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
