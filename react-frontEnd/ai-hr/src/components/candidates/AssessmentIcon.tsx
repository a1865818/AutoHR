interface AssessmentIconProps {
  score: number;
}

export function AssessmentIcon({ score }: AssessmentIconProps) {
  // Calculate stroke dash array for the progress
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Get colors and styling based on score
  const getStyles = (score: number) => {
    if (score === 100) {
      return {
        strokeColor: "#10b981", // green-500
        bgColor: "#dcfce7", // green-100
        textColor: "#059669", // green-600
        glowColor: "#10b981",
      };
    }
    if (score >= 80) {
      return {
        strokeColor: "#10b981", // green-500
        bgColor: "#f3f4f6", // gray-100
        textColor: "#059669", // green-600
        glowColor: "#10b981",
      };
    }
    if (score >= 50) {
      return {
        strokeColor: "#f59e0b", // yellow-500
        bgColor: "#f3f4f6", // gray-100
        textColor: "#d97706", // yellow-600
        glowColor: "#f59e0b",
      };
    }
    return {
      strokeColor: "#ef4444", // red-500
      bgColor: "#f3f4f6", // gray-100
      textColor: "#dc2626", // red-600
      glowColor: "#ef4444",
    };
  };

  const styles = getStyles(score);

  return (
    <div className="relative w-8 h-8">
      <svg
        className="w-8 h-8 transform -rotate-90"
        viewBox="0 0 32 32"
        style={{ filter: `drop-shadow(0 0 2px ${styles.glowColor}20)` }}
      >
        {/* Background circle */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke={styles.bgColor}
          strokeWidth="2.5"
          fill="transparent"
        />

        {/* Progress circle with animation */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke={styles.strokeColor}
          strokeWidth="2.5"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />

        {/* Inner glow effect for high scores */}
        {score >= 80 && (
          <circle
            cx="16"
            cy="16"
            r={radius - 1}
            stroke={styles.strokeColor}
            strokeWidth="0.5"
            fill="transparent"
            opacity="0.3"
          />
        )}
      </svg>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {score === 100 ? (
          <span
            className="text-sm font-bold"
            style={{
              color: styles.strokeColor,
              fontSize: "10px",
              lineHeight: "1",
            }}
          >
            100
          </span>
        ) : (
          <span
            className="text-sm font-bold"
            style={{
              color: styles.textColor,
              fontSize: "10px",
              lineHeight: "1",
              textShadow: `0 0 2px ${styles.textColor}20`,
            }}
          >
            {score}%
          </span>
        )}
      </div>
    </div>
  );
}
