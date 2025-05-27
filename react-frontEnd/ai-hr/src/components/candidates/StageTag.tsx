interface StageTagProps {
  stage: string;
}

export function StageTag({ stage }: StageTagProps) {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Applied":
        return "bg-green-500 text-white";
      case "Interview":
        return "bg-yellow-500 text-white";
      case "Offer":
        return "bg-blue-500 text-white";
      case "Hired":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(
        stage
      )}`}
    >
      {stage}
    </span>
  );
}
