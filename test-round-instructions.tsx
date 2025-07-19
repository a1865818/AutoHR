import React from "react";
import { RoundInstructions } from "./react-frontEnd/ai-hr/src/components/interview_pipeline/rounds/shared/RoundInstructions";

// Test component to verify all round types work
function TestRoundInstructions() {
  const roundTypes = [
    "phone_screening",
    "video_interview",
    "technical_assessment",
    "coding_challenge",
    "behavioral_interview",
    "panel_interview",
    "final_interview",
    "culture_fit",
  ] as const;

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold">Round Instructions Test</h1>
      {roundTypes.map((roundType) => (
        <div key={roundType}>
          <h2 className="text-xl font-semibold mb-4 capitalize">
            {roundType.replace("_", " ")} Configuration
          </h2>
          <RoundInstructions roundType={roundType} />
        </div>
      ))}
    </div>
  );
}

export default TestRoundInstructions;
