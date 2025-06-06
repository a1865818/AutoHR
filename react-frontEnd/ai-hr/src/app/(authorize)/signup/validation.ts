import { JobApplicantFormData, HiringUserFormData, CompanyRegistrationData } from './types';

export const validateJobApplicantForm = (data: JobApplicantFormData) => {
  const newErrors: { [key: string]: string } = {};

  if (!data.firstName.trim()) {
    newErrors.firstName = "First name is required";
  }

  if (!data.lastName.trim()) {
    newErrors.lastName = "Last name is required";
  }

  if (!data.email) {
    newErrors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    newErrors.email = "Please enter a valid email address";
  }

  if (!data.password) {
    newErrors.password = "Password is required";
  } else if (data.password.length < 8) {
    newErrors.password = "Password must be at least 8 characters";
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
    newErrors.password = "Password must contain uppercase, lowercase, and number";
  }

  if (!data.confirmPassword) {
    newErrors.confirmPassword = "Please confirm your password";
  } else if (data.password !== data.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match";
  }

  if (!data.agreeToTerms) {
    newErrors.agreeToTerms = "You must agree to the terms and conditions";
  }

  return newErrors;
};

export const validateCompanyForm = (data: CompanyRegistrationData) => {
  console.log("🔍 Starting company form validation");
  console.log("📝 Input data:", data);
  console.log("🔍 Data type:", typeof data);
  console.log("🔍 Data keys:", data ? Object.keys(data) : 'data is null/undefined');
  
  const newErrors: { [key: string]: string } = {};

  try {
    
    if (!data.companyName || !data.companyName.trim()) {
      console.log("❌ Company name validation failed - empty");
      newErrors.companyName = "Company name is required";
    }

    
    if (!data.industry || !data.industry.trim()) {
      console.log("❌ Industry validation failed - empty");
      newErrors.industry = "Industry is required";
    }
    
    if (!data.companySize || !data.companySize.trim()) {
      console.log("❌ Company size validation failed - empty");
      newErrors.companySize = "Company size is required";
    }

    
    if (!data.website || !data.website.trim()) {
      console.log("❌ Website validation failed - empty");
      newErrors.website = "Website is required";
    } else if (!/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(data.website)) {
      console.log("❌ Website validation failed - invalid format");
      newErrors.website = "Please enter a valid website URL";
    }

    if (!data.headquartersCity || !data.headquartersCity.trim()) {
      console.log("❌ Headquarters city validation failed - empty");
      newErrors.headquartersCity = "City is required";
    }

    if (!data.headquartersState || !data.headquartersState.trim()) {
      console.log("❌ Headquarters state validation failed - empty");
      newErrors.headquartersState = "State/Province is required";
    }

    if (!data.headquartersCountry || !data.headquartersCountry.trim()) {
      console.log("❌ Headquarters country validation failed - empty");
      newErrors.headquartersCountry = "Country is required";
    }
    
    if (!data.email || !data.email.trim()) {
      console.log("❌ Email validation failed - empty");
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      console.log("❌ Email validation failed - invalid format");
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!data.description || !data.description.trim()) {
      console.log("❌ Description validation failed - empty");
      newErrors.description = "Company description is required";
    }
    
    if (!data.agreeToTerms) {
      console.log("❌ Terms agreement validation failed");
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

  } catch (error) {
    console.log("❌ VALIDATION ERROR CAUGHT:", error);
    console.log("🔍 Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error,
      error
    });
    
    // Return a general error if validation crashes
    newErrors.general = "Validation error occurred. Please check your form data.";
  }

  console.log("✅ Validation completed");
  console.log("📋 Validation errors:", newErrors);
  console.log("🔢 Number of errors:", Object.keys(newErrors).length);

  return newErrors;
};

export const validateHiringUserForm = (data: HiringUserFormData) => {
  const newErrors: { [key: string]: string } = {};

  if (!data.firstName.trim()) {
    newErrors.firstName = "First name is required";
  }

  if (!data.lastName.trim()) {
    newErrors.lastName = "Last name is required";
  }

  if (!data.email) {
    newErrors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    newErrors.email = "Please enter a valid email address";
  }

  if (!data.password) {
    newErrors.password = "Password is required";
  } else if (data.password.length < 8) {
    newErrors.password = "Password must be at least 8 characters";
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
    newErrors.password = "Password must contain uppercase, lowercase, and number";
  }

  if (!data.confirmPassword) {
    newErrors.confirmPassword = "Please confirm your password";
  } else if (data.password !== data.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match";
  }

  if (!data.company.trim()) {
    newErrors.company = "Company name is required";
  }

  if (!data.agreeToTerms) {
    newErrors.agreeToTerms = "You must agree to the terms and conditions";
  }

  return newErrors;
}; 