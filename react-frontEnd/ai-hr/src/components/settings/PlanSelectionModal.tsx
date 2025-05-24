import { useState } from "react";
import { X, Check, Crown, Star, Zap } from "lucide-react";
import { DowngradeConfirmationModal } from "./DowngradeConfirmationModal";

interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  recommended?: boolean;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  limits: {
    jobPostings: string;
    applications: string;
    teamMembers: string;
    aiScreening: string;
    integrations: string;
    support: string;
  };
}

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string, billingCycle: "monthly" | "yearly") => void;
  currentPlan: string;
  isLoading?: boolean;
}

export function PlanSelectionModal({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlan,
  isLoading = false,
}: PlanSelectionModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan);
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);

  const plans: Plan[] = [
    {
      id: "starter",
      name: "Starter",
      price: 29,
      yearlyPrice: 24,
      description: "Perfect for small teams getting started",
      icon: Zap,
      color: "text-green-600",
      bgColor: "bg-green-100",
      features: [
        "Basic job posting",
        "Candidate tracking",
        "Email notifications",
        "Basic reporting",
        "Standard support",
      ],
      limits: {
        jobPostings: "10 active",
        applications: "500/month",
        teamMembers: "5 users",
        aiScreening: "Basic filters",
        integrations: "Email only",
        support: "Email support",
      },
    },
    {
      id: "professional",
      name: "Professional",
      price: 99,
      yearlyPrice: 79,
      description: "For growing companies with advanced needs",
      icon: Star,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      recommended: true,
      features: [
        "Unlimited job postings",
        "Advanced candidate screening",
        "Custom workflows",
        "Analytics dashboard",
        "Integration with popular tools",
        "Priority support",
        "Bulk actions",
        "Custom branding",
      ],
      limits: {
        jobPostings: "Unlimited",
        applications: "5,000/month",
        teamMembers: "25 users",
        aiScreening: "AI-powered",
        integrations: "All integrations",
        support: "Priority support",
      },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 299,
      yearlyPrice: 249,
      description: "For large organizations with custom requirements",
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      features: [
        "Everything in Professional",
        "Custom integrations",
        "Advanced security features",
        "Dedicated account manager",
        "Custom SLA",
        "Advanced analytics",
        "Multi-location support",
        "API access",
        "Custom reporting",
        "SSO integration",
      ],
      limits: {
        jobPostings: "Unlimited",
        applications: "Unlimited",
        teamMembers: "Unlimited",
        aiScreening: "Advanced AI",
        integrations: "Custom APIs",
        support: "24/7 dedicated",
      },
    },
  ];

  const handleSelectPlan = () => {
    if (selectedPlan && selectedPlan !== currentPlan) {
      if (isDowngrade(currentPlan, selectedPlan)) {
        setIsDowngradeModalOpen(true);
      } else {
        onSelectPlan(selectedPlan, billingCycle);
      }
    }
  };

  const handleConfirmDowngrade = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan, billingCycle);
      setIsDowngradeModalOpen(false);
    }
  };

  const handleCloseDowngradeModal = () => {
    setIsDowngradeModalOpen(false);
  };

  const getCurrentPlanPrice = (plan: Plan) => {
    return billingCycle === "yearly" ? plan.yearlyPrice : plan.price;
  };

  const getSavingsPercentage = (plan: Plan) => {
    return Math.round(((plan.price - plan.yearlyPrice) / plan.price) * 100);
  };

  const getPlanTier = (planId: string) => {
    const tierMap: Record<string, number> = {
      starter: 1,
      professional: 2,
      enterprise: 3,
    };
    return tierMap[planId] || 0;
  };

  const isDowngrade = (fromPlan: string, toPlan: string) => {
    return getPlanTier(fromPlan) > getPlanTier(toPlan);
  };

  const isUpgrade = (fromPlan: string, toPlan: string) => {
    return getPlanTier(fromPlan) < getPlanTier(toPlan);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Choose Your Plan
                </h3>
                <p className="text-gray-600 mt-1">
                  Select the perfect plan for your team's needs
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Billing cycle toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === "monthly"
                      ? "bg-white text-gray-900 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === "yearly"
                      ? "bg-white text-gray-900 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Yearly
                  <span className="ml-1 text-green-600 font-bold">
                    (Save up to 20%)
                  </span>
                </button>
              </div>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => {
                const IconComponent = plan.icon;
                const isCurrentPlan = plan.id === currentPlan;
                const isSelected = plan.id === selectedPlan;
                const price = getCurrentPlanPrice(plan);
                const savings = getSavingsPercentage(plan);

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                      isSelected
                        ? "border-blue-500 shadow-lg bg-blue-50 ring-2 ring-blue-200"
                        : isCurrentPlan
                        ? "border-green-400 shadow-md bg-green-50"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-md bg-white"
                    } ${
                      plan.recommended && !isCurrentPlan
                        ? "ring-2 ring-blue-400"
                        : ""
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.recommended && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
                          ⭐ Recommended
                        </span>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-4 z-10">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
                          ✓ Current Plan
                        </span>
                      </div>
                    )}

                    {isSelected && !isCurrentPlan && (
                      <div className="absolute -top-3 left-4 z-10">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
                          → Selected
                        </span>
                      </div>
                    )}

                    <div className="flex items-start mb-4">
                      <div
                        className={`p-3 rounded-xl ${plan.bgColor} mr-4 shadow-sm`}
                      >
                        <IconComponent className={`h-7 w-7 ${plan.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-1">
                          {plan.name}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900">
                          ${price}
                        </span>
                        <span className="text-gray-500 ml-2 text-lg">
                          /month
                        </span>
                      </div>
                      {billingCycle === "yearly" && (
                        <div className="text-center mt-2">
                          <p className="text-sm text-green-600 font-semibold">
                            💰 Save {savings}% with yearly billing
                          </p>
                          <p className="text-xs text-gray-500">
                            ${plan.price * 12 - plan.yearlyPrice * 12} saved per
                            year
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mb-6">
                      <h5 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        ✨ Key Features
                      </h5>
                      <ul className="space-y-3">
                        {plan.features.slice(0, 5).map((feature, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                              <Check className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-gray-700 leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                        {plan.features.length > 5 && (
                          <li className="text-sm text-blue-600 font-medium ml-8">
                            +{plan.features.length - 5} more features included
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Plan Limits
                      </h6>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Job Postings:</span>
                          <span className="font-semibold text-gray-900">
                            {plan.limits.jobPostings}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Applications:</span>
                          <span className="font-semibold text-gray-900">
                            {plan.limits.applications}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Team Members:</span>
                          <span className="font-semibold text-gray-900">
                            {plan.limits.teamMembers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Support:</span>
                          <span className="font-semibold text-gray-900">
                            {plan.limits.support}
                          </span>
                        </div>
                      </div>

                      {/* Select Plan Button */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        {isCurrentPlan ? (
                          <button
                            disabled
                            className="w-full py-3 px-4 bg-green-100 text-green-700 rounded-lg font-semibold text-sm cursor-not-allowed"
                          >
                            ✓ Your Current Plan
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlan(plan.id);
                              if (isDowngrade(currentPlan, plan.id)) {
                                setIsDowngradeModalOpen(true);
                              } else {
                                onSelectPlan(plan.id, billingCycle);
                              }
                            }}
                            disabled={isLoading}
                            className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                              isSelected
                                ? isDowngrade(currentPlan, plan.id)
                                  ? "bg-orange-600 text-white shadow-lg"
                                  : "bg-blue-600 text-white shadow-lg"
                                : isDowngrade(currentPlan, plan.id)
                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isLoading
                              ? "Processing..."
                              : isSelected
                              ? isDowngrade(currentPlan, plan.id)
                                ? "⬇️ Downgrade Now"
                                : "🚀 Upgrade Now"
                              : isDowngrade(currentPlan, plan.id)
                              ? "⬇️ Downgrade to This Plan"
                              : "Choose This Plan"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedPlan && selectedPlan !== currentPlan && (
                  <>
                    Selected:{" "}
                    <span className="font-semibold text-gray-900">
                      {plans.find((p) => p.id === selectedPlan)?.name}
                    </span>
                    <span className="text-gray-500">
                      ($
                      {getCurrentPlanPrice(
                        plans.find((p) => p.id === selectedPlan)!
                      )}
                      /{billingCycle === "yearly" ? "month" : "month"})
                    </span>
                  </>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Close
                </button>
                {selectedPlan && selectedPlan !== currentPlan && (
                  <button
                    type="button"
                    onClick={handleSelectPlan}
                    disabled={isLoading}
                    className={`px-8 py-2 text-white rounded-lg transition-all duration-200 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDowngrade(currentPlan, selectedPlan)
                        ? "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
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
                    ) : isDowngrade(currentPlan, selectedPlan) ? (
                      `⬇️ Downgrade to ${
                        plans.find((p) => p.id === selectedPlan)?.name
                      }`
                    ) : (
                      `🚀 Upgrade to ${
                        plans.find((p) => p.id === selectedPlan)?.name
                      }`
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DowngradeConfirmationModal
        isOpen={isDowngradeModalOpen}
        onClose={handleCloseDowngradeModal}
        onConfirm={handleConfirmDowngrade}
        currentPlan={plans.find((p) => p.id === currentPlan)!}
        selectedPlan={plans.find((p) => p.id === selectedPlan)!}
        billingCycle={billingCycle}
        isLoading={isLoading}
      />
    </div>
  );
}
