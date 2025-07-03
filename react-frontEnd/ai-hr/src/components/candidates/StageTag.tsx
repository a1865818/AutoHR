import { CandidateStage } from "@/interfaces";

interface StageTagProps {
  stage: CandidateStage | string;
}

export function StageTag({ stage }: StageTagProps) {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Applied":
        return "bg-gray-500 text-white";
      case "Phone Screening":
        return "bg-green-500 text-white";
      case "Video Interview":
        return "bg-blue-500 text-white";
      case "Technical Assessment":
        return "bg-purple-500 text-white";
      case "Coding Challenge":
        return "bg-orange-500 text-white";
      case "Behavioral Interview":
        return "bg-pink-500 text-white";
      case "Panel Interview":
        return "bg-indigo-500 text-white";
      case "Final Interview":
        return "bg-yellow-500 text-white";
      case "Culture Fit":
        return "bg-red-500 text-white";
      case "Offer":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Determine if the stage text is long and needs special styling
  const isLongText = stage.length > 15;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
        isLongText ? "text-[11px]" : "text-xs"
      } ${getStageColor(stage)}`}
    >
      {stage}
    </span>
  );
}
