// components/jobs/edit/ListEditor.tsx
import { Plus, Trash2 } from "lucide-react";

interface ListEditorProps {
  title: string;
  items: string[];
  placeholder: string;
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  maxItems?: number;
}

export function ListEditor({
  title,
  items,
  placeholder,
  onAdd,
  onUpdate,
  onRemove,
  maxItems = 20,
}: ListEditorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          {title}
        </label>
        <button
          onClick={onAdd}
          disabled={items.length >= maxItems}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add {title.split(" ")[0]}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={placeholder}
            />
            <button
              onClick={() => onRemove(index)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
            <p className="text-sm">No {title.toLowerCase()} added yet</p>
            <button
              onClick={onAdd}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Add your first {title.split(" ")[0].toLowerCase()}
            </button>
          </div>
        )}
      </div>
      {items.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {items.length} of {maxItems} items
        </p>
      )}
    </div>
  );
}
