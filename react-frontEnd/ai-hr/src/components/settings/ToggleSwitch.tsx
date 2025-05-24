interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = "md",
}: ToggleSwitchProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "w-8 h-4",
          knob: "h-3 w-3 after:top-[2px] after:left-[2px]",
          translate: "peer-checked:after:translate-x-4",
        };
      case "lg":
        return {
          container: "w-14 h-8",
          knob: "h-7 w-7 after:top-[2px] after:left-[2px]",
          translate: "peer-checked:after:translate-x-6",
        };
      default: // md
        return {
          container: "w-11 h-6",
          knob: "h-5 w-5 after:top-[2px] after:left-[2px]",
          translate: "peer-checked:after:translate-x-full",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <label
      className={`relative inline-flex items-center ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } group`}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div
        className={`
          ${sizeClasses.container}
          ${
            checked ? "bg-green-600 shadow-lg" : "bg-gray-300 hover:bg-gray-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}
          peer-focus:outline-none 
          peer-focus:ring-4 
          ${checked ? "peer-focus:ring-green-200" : "peer-focus:ring-gray-200"}
          rounded-full 
          peer 
          ${sizeClasses.translate}
          ${
            checked
              ? "peer-checked:after:bg-green-600 peer-checked:after:border-green-600"
              : "peer-checked:after:border-white"
          }
          after:content-[''] 
          after:absolute 
          ${sizeClasses.knob}
          ${
            checked
              ? "after:bg-green-600 after:border-green-600"
              : "after:bg-white after:border-gray-300"
          }
          after:border 
          after:rounded-full 
          after:transition-all 
          after:duration-200
          after:shadow-sm
          transition-all 
          duration-200
        `}
      >
        {/* Status indicators */}
        <div
          className={`absolute inset-0 flex items-center justify-between px-1 text-xs font-medium transition-opacity duration-200 ${
            size === "sm"
              ? "text-[8px]"
              : size === "lg"
              ? "text-xs"
              : "text-[10px]"
          }`}
        >
          <span
            className={`text-white transition-opacity duration-200 ${
              checked ? "opacity-100" : "opacity-0"
            }`}
          >
            {size === "sm" ? "✓" : "ON"}
          </span>
          <span
            className={`text-gray-600 transition-opacity duration-200 ${
              !checked ? "opacity-100" : "opacity-0"
            }`}
          >
            {size === "sm" ? "✕" : "OFF"}
          </span>
        </div>
      </div>

      {/* Status text for accessibility */}
      <span className="sr-only">{checked ? "Enabled" : "Disabled"}</span>
    </label>
  );
}
