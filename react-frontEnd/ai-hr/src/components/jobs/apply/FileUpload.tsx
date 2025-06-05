// components/apply/FileUpload.tsx
import { Check, FileText, Upload } from "lucide-react";
import React from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  uploadedFile: File | null;
  title: string;
  description?: string;
  required?: boolean;
}

export function FileUpload({
  onFileSelect,
  uploadedFile,
  title,
  description = "10MB size limit",
  required = false,
}: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const inputId = `file-upload-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
      <input
        type="file"
        id={inputId}
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"

        // Note: The `required` prop is commented out because file inputs cannot be required in the same way as text inputs.
        // We need to implement file upload logic.
        // required={required}
      />
      <label htmlFor={inputId} className="cursor-pointer">
        {title.includes("Resume") ? (
          <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        ) : (
          <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        )}
        <p className="text-blue-600 font-medium mb-2">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </label>
      {uploadedFile && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-green-600">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">
            {uploadedFile.name} uploaded successfully
          </span>
        </div>
      )}
    </div>
  );
}
