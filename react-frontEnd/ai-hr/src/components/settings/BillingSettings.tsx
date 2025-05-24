import { useState } from "react";
import { Calendar, CreditCard, Download, TrendingUp } from "lucide-react";
import { PlanSelectionModal } from "./PlanSelectionModal";

interface BillingSettingsProps {
  onChangePlan: (planId: string, billingCycle: "monthly" | "yearly") => void;
  onUpdatePayment: () => void;
  onDownloadInvoice: (invoiceId: string) => void;
  currentPlan?: string;
  isLoading?: boolean;
}

export function BillingSettings({
  onChangePlan,
  onUpdatePayment,
  onDownloadInvoice,
  currentPlan = "professional",
  isLoading = false,
}: BillingSettingsProps) {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const handleChangePlanClick = () => {
    setIsPlanModalOpen(true);
  };

  const handlePlanSelection = (
    planId: string,
    billingCycle: "monthly" | "yearly"
  ) => {
    onChangePlan(planId, billingCycle);
    setIsPlanModalOpen(false);
  };

  const handleClosePlanModal = () => {
    setIsPlanModalOpen(false);
  };

  const getPlanDetails = () => {
    switch (currentPlan) {
      case "starter":
        return { name: "Starter", price: "$29", color: "text-green-600" };
      case "professional":
        return { name: "Professional", price: "$99", color: "text-blue-600" };
      case "enterprise":
        return { name: "Enterprise", price: "$299", color: "text-purple-600" };
      default:
        return { name: "Professional", price: "$99", color: "text-blue-600" };
    }
  };

  const planDetails = getPlanDetails();

  const invoices = [
    { id: "INV-0001", date: "Dec 1, 2024", amount: "$99.00" },
    { id: "INV-0002", date: "Dec 2, 2024", amount: "$99.00" },
    { id: "INV-0003", date: "Dec 3, 2024", amount: "$99.00" },
  ];

  const usageStats = [
    { label: "Job postings", value: "250", type: "limit" },
    { label: "Applications", value: "5,000", type: "limit" },
    { label: "Team members", value: "Unlimited", type: "unlimited" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Billing & Subscription
      </h3>

      <div className="bg-white p-6 rounded-lg border">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-medium text-gray-900">Current Plan</h4>
            <p className={`text-2xl font-bold mt-1 ${planDetails.color}`}>
              {planDetails.name}
            </p>
            <p className="text-sm text-gray-500">
              {planDetails.price}/month • Billed monthly
            </p>
          </div>
          <button
            onClick={handleChangePlanClick}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Change Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {usageStats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <h5 className="font-medium text-gray-900 mb-3">Payment Method</h5>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-12 bg-blue-600 rounded flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div>
                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                <p className="text-xs text-gray-500">Expires 12/25</p>
              </div>
            </div>
            <button
              onClick={onUpdatePayment}
              className="text-primary hover:text-blue-600 text-sm"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h4 className="font-medium text-gray-900 mb-4">Billing History</h4>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex justify-between items-center py-2 border-b last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium">Invoice #{invoice.id}</p>
                <p className="text-xs text-gray-500">{invoice.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{invoice.amount}</p>
                <button
                  onClick={() => onDownloadInvoice(invoice.id)}
                  className="text-xs text-primary hover:text-blue-600"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PlanSelectionModal
        isOpen={isPlanModalOpen}
        onClose={handleClosePlanModal}
        onSelectPlan={handlePlanSelection}
        currentPlan={currentPlan}
        isLoading={isLoading}
      />
    </div>
  );
}
