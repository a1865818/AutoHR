import { JobFormData, JobFormErrors } from "@/interfaces/job";
interface CompensationSectionProps {
  formData: JobFormData;
  errors: JobFormErrors;
  updateNestedFormData: (
    parentField: string,
    childField: string,
    value: any
  ) => void;
}

export function CompensationSection({
  formData,
  errors,
  updateNestedFormData,
}: CompensationSectionProps) {
  const formatSalaryDisplay = () => {
    const { min, max, currency, period } = formData.salary;

    if (!min && !max) return "No salary range specified";

    const formatNumber = (num?: number) =>
      num ? num.toLocaleString() : "Not specified";
    const minStr = formatNumber(min);
    const maxStr = formatNumber(max);

    if (min && max) {
      return `${currency} ${minStr} - ${currency} ${maxStr}${
        period ? ` ${period}` : ""
      }`;
    } else if (min) {
      return `${currency} ${minStr}+${period ? ` ${period}` : ""}`;
    } else if (max) {
      return `Up to ${currency} ${maxStr}${period ? ` ${period}` : ""}`;
    }

    return "No salary range specified";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Compensation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.salary.currency}
              onChange={(e) =>
                updateNestedFormData("salary", "currency", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#066046]"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CNY">CNY (¥)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay Period
            </label>
            <select
              value={formData.salary.period || ""}
              onChange={(e) =>
                updateNestedFormData("salary", "period", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#066046]"
            >
              <option value="">Select period</option>
              <option value="per year">Per Year</option>
              <option value="per month">Per Month</option>
              <option value="per week">Per Week</option>
              <option value="per day">Per Day</option>
              <option value="per hour">Per Hour</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Salary
            </label>
            <input
              type="number"
              value={formData.salary.min || ""}
              onChange={(e) =>
                updateNestedFormData(
                  "salary",
                  "min",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#066046]"
              placeholder="e.g. 90000"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Salary
            </label>
            <input
              type="number"
              value={formData.salary.max || ""}
              onChange={(e) =>
                updateNestedFormData(
                  "salary",
                  "max",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#066046]"
              placeholder="e.g. 120000"
              min="0"
            />
          </div>
        </div>

        {errors.salary && (
          <p className="text-xs text-red-600 mb-4">{errors.salary}</p>
        )}

        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-700">
            <strong>Salary Range Preview:</strong> {formatSalaryDisplay()}
          </p>
        </div>

        <div className="mt-4 p-4 rounded-md" style={{backgroundColor: '#06604620'}}>
          <h4 className="text-sm font-medium mb-2" style={{color: '#066046'}}>
            💡 Salary Tips
          </h4>
          <ul className="text-xs space-y-1" style={{color: '#066046'}}>
            <li>
              • Include salary ranges to attract more qualified candidates
            </li>
            <li>• Consider total compensation including benefits and equity</li>
            <li>• Research market rates for similar positions in your area</li>
            <li>• Leave blank if you prefer to discuss during interviews</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
