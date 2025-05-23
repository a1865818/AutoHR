import { Check } from "lucide-react";

interface AssessmentIconProps {
  score: number;
}

export function AssessmentIcon({ score }: AssessmentIconProps) {
  if (score === 100) {
    return (
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="h-4 w-4 text-green-500" />
      </div>
    );
  }

  if (score >= 80) {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
        <div className="font-medium text-xs text-green-500">{score}%</div>
      </div>
    );
  }

  if (score >= 50) {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center">
        <div className="font-medium text-xs text-yellow-500">{score}%</div>
      </div>
    );
  }

  return (
    <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
      <div className="font-medium text-xs text-red-500">{score}%</div>
    </div>
  );
}
