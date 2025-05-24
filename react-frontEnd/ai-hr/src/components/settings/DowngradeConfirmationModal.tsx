import { AlertTriangle, X, ArrowDown } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
}

interface DowngradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: Plan;
  selectedPlan: Plan;
  billingCycle: "monthly" | "yearly";
  isLoading?: boolean;
}

export function DowngradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  selectedPlan,
  billingCycle,
  isLoading = false,
}: DowngradeConfirmationModalProps) {
  if (!isOpen) return null;

  const getCurrentPrice = (plan: Plan) => {
    return billingCycle === "yearly" ? plan.yearlyPrice : plan.price;
  };

  const getMonthlySavings = () => {
    const currentPrice = getCurrentPrice(currentPlan);
    const newPrice = getCurrentPrice(selectedPlan);
    return currentPrice - newPrice;
  };

  const getFeaturesToLose = () => {
    const featureMap: Record<string, string[]> = {
      enterprise: [
        "Custom integrations",
        "Advanced security features",
        "Dedicated account manager",
        "Custom SLA",
        "Advanced analytics",
        "Multi-location support",
        "API access",
        "Custom reporting",
        "SSO integration",
        "24/7 dedicated support",
      ],
      professional: [
        "Unlimited job postings",
        "Advanced candidate screening",
        "Custom workflows",
        "Analytics dashboard",
        "Integration with popular tools",
        "Priority support",
        "Bulk actions",
        "Custom branding",
        "AI-powered screening",
      ],
    };

    const currentFeatures = featureMap[currentPlan.id] || [];
    const selectedFeatures = featureMap[selectedPlan.id] || [];

    return currentFeatures.filter(
      (feature) => !selectedFeatures.includes(feature)
    );
  };

  const featuresToLose = getFeaturesToLose();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full z-10">
          <div className="p-6">
            <div className="flex items-start">
              {/* Warning Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                <AlertTriangle className="h-7 w-7 text-orange-600" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Plan Downgrade
                  </h3>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Plan Change Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">
                        {currentPlan.name}
                      </p>
                      <p className="text-gray-600">
                        ${getCurrentPrice(currentPlan)}/month
                      </p>
                    </div>
                    <ArrowDown className="h-5 w-5 text-orange-500 mx-3" />
                    <div className="text-center">
                      <p className="font-medium text-gray-900">
                        {selectedPlan.name}
                      </p>
                      <p className="text-gray-600">
                        ${getCurrentPrice(selectedPlan)}/month
                      </p>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-sm text-green-600 font-medium">
                      💰 Save ${getMonthlySavings()}/month
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-3">
                    Are you sure you want to downgrade your plan? You will lose
                    access to the following features:
                  </p>

                  {featuresToLose.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        ⚠️ Features you'll lose:
                      </h4>
                      <ul className="space-y-1">
                        {featuresToLose.slice(0, 4).map((feature, index) => (
                          <li
                            key={index}
                            className="text-xs text-red-700 flex items-center"
                          >
                            <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                        {featuresToLose.length > 4 && (
                          <li className="text-xs text-red-600 font-medium">
                            +{featuresToLose.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> Your downgrade will take effect
                      immediately. You can upgrade back to a higher plan at any
                      time.
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Keep Current Plan
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Confirm Downgrade"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
