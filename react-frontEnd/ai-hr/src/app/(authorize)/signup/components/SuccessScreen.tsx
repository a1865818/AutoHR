import React from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { UserType } from "../types";

interface SuccessScreenProps {
  selectedUserType: UserType | null;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ selectedUserType }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Created!
          </h2>
          <p className="text-gray-600 mb-4">
            Welcome to AutoHR! Your{" "}
            {selectedUserType === "application" ? "AutoHR" : "hiring"}{" "}
            account has been successfully created. You'll be redirected to your
            dashboard shortly.
          </p>
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
