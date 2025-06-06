// components/jobs/edit/JobDetailsSection.tsx
import { JobFormData } from "@/interfaces";
import { ListEditor } from "./ListEditor";

interface JobDetailsSectionProps {
  formData: JobFormData;
  updateFormData: (field: keyof JobFormData, value: any) => void;
  updateListItem: (
    field: keyof JobFormData,
    index: number,
    value: string
  ) => void;
  addListItem: (field: keyof JobFormData) => void;
  removeListItem: (field: keyof JobFormData, index: number) => void;
}

export function JobDetailsSection({
  formData,
  updateFormData,
  updateListItem,
  addListItem,
  removeListItem,
}: JobDetailsSectionProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Job Details
        </h2>

        {/* Responsibilities */}
        <ListEditor
          title="Key Responsibilities"
          items={formData.responsibilities}
          placeholder="Enter a key responsibility..."
          onAdd={() => addListItem("responsibilities")}
          onUpdate={(index, value) =>
            updateListItem("responsibilities", index, value)
          }
          onRemove={(index) => removeListItem("responsibilities", index)}
          maxItems={15}
        />

        {/* Requirements */}
        <ListEditor
          title="Requirements"
          items={formData.requirements}
          placeholder="Enter a requirement..."
          onAdd={() => addListItem("requirements")}
          onUpdate={(index, value) =>
            updateListItem("requirements", index, value)
          }
          onRemove={(index) => removeListItem("requirements", index)}
          maxItems={15}
        />

        {/* Qualifications */}
        <ListEditor
          title="Qualifications"
          items={formData.qualifications}
          placeholder="Enter a qualification..."
          onAdd={() => addListItem("qualifications")}
          onUpdate={(index, value) =>
            updateListItem("qualifications", index, value)
          }
          onRemove={(index) => removeListItem("qualifications", index)}
          maxItems={10}
        />

        {/* Skills */}
        <ListEditor
          title="Required Skills"
          items={formData.skills || []}
          placeholder="Enter a required skill..."
          onAdd={() => addListItem("skills")}
          onUpdate={(index, value) => updateListItem("skills", index, value)}
          onRemove={(index) => removeListItem("skills", index)}
          maxItems={20}
        />

        {/* Benefits */}
        <ListEditor
          title="Benefits & Perks"
          items={formData.benefits}
          placeholder="Enter a benefit..."
          onAdd={() => addListItem("benefits")}
          onUpdate={(index, value) => updateListItem("benefits", index, value)}
          onRemove={(index) => removeListItem("benefits", index)}
          maxItems={15}
        />
      </div>
    </div>
  );
}
