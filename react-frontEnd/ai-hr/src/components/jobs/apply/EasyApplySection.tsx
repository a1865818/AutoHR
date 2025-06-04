// components/apply/EasyApplySection.tsx
import { FileUpload } from "./FileUpload";

interface EasyApplySectionProps {
  applicationMethod: "upload" | "manual";
  setApplicationMethod: (method: "upload" | "manual") => void;
  uploadedFile: File | null;
  onFileUpload: (file: File) => void;
}

export function EasyApplySection({
  applicationMethod,
  setApplicationMethod,
  uploadedFile,
  onFileUpload,
}: EasyApplySectionProps) {
  return (
    <div className="bg-white rounded-lg border p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Easy Apply</h2>
      <p className="text-gray-600 mb-6">
        Choose an option to autocomplete your application. You can still fill
        your profile manually.
      </p>

      {/* Application Method Toggle */}
      <div className="flex space-x-4 mb-6">
        <button
          type="button"
          onClick={() => setApplicationMethod("upload")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            applicationMethod === "upload"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Upload Resume (Auto-fill)
        </button>
        <button
          type="button"
          onClick={() => setApplicationMethod("manual")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            applicationMethod === "manual"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Fill Manually
        </button>
      </div>

      {/* File Upload Area */}
      <FileUpload
        onFileSelect={onFileUpload}
        uploadedFile={uploadedFile}
        title="Choose a file or drop it here"
        description="10MB size limit"
      />

      <div className="flex items-center justify-center my-6">
        <span className="bg-white px-4 text-gray-500 text-sm">or</span>
      </div>

      <button
        type="button"
        className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors"
        onClick={() => setApplicationMethod("manual")}
      >
        Fill application manually
      </button>
    </div>
  );
}
