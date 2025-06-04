// "use client";
// import {
//   Education,
//   Experience,
//   PersonalInfoAppliedForm,
//   SocialProfiles,
// } from "@/interfaces";
// import React, { useState } from "react";
// import { CoverLetterForm } from "./CoverLetterForm";
// import { EasyApplySection } from "./EasyApplySection";
// import { EducationSection } from "./EducationSection";
// import { ExperienceSection } from "./ExperienceSection";
// import { FileUpload } from "./FileUpload";
// import { PersonalInfoForm } from "./PersonalInfoForm";
// import { SocialProfilesForm } from "./SocialProfilesForm";

// interface JobData {
//   id: string;
//   title: string;
//   company: string;
//   location: string;
//   type: string;
//   experience: string;
//   salary: {
//     min: number;
//     max: number;
//     currency: string;
//     period: string;
//   };
//   department: string;
//   applicants: number;
//   postedDate: string;
//   status: string;
// }

// interface JobApplicationFormProps {
//   jobData?: JobData;
// }

// export default function JobApplicationForm({
//   jobData,
// }: JobApplicationFormProps) {
//   const [applicationMethod, setApplicationMethod] = useState<
//     "upload" | "manual"
//   >("upload");
//   const [uploadedFile, setUploadedFile] = useState<File | null>(null);
//   const [resumeFile, setResumeFile] = useState<File | null>(null);
//   const [profileImage, setProfileImage] = useState<string | null>(null);

//   // Form data states
//   const [personalInfo, setPersonalInfo] = useState<PersonalInfoAppliedForm>({
//     firstName: "",
//     lastName: "",
//     email: "",
//     confirmEmail: "",
//     city: "",
//     phoneNumber: "",
//     countryCode: "+61",
//   });

//   const [experiences, setExperiences] = useState<Experience[]>([]);
//   const [education, setEducation] = useState<Education[]>([]);
//   const [profiles, setProfiles] = useState<SocialProfiles>({
//     linkedin: "",
//     facebook: "",
//     twitter: "",
//     website: "",
//   });
//   const [coverLetter, setCoverLetter] = useState("");

//   // Show forms by default
//   const [showExperienceForm, setShowExperienceForm] = useState(true);
//   const [showEducationForm, setShowEducationForm] = useState(true);
//   const [editingExperience, setEditingExperience] = useState<Experience | null>(
//     null
//   );
//   const [editingEducation, setEditingEducation] = useState<Education | null>(
//     null
//   );

//   const handleAutoFillUpload = (file: File) => {
//     setUploadedFile(file);
//     // Simulate auto-fill after upload
//     setTimeout(() => {
//       setPersonalInfo({
//         firstName: "John",
//         lastName: "Doe",
//         email: "john.doe@email.com",
//         confirmEmail: "john.doe@email.com",
//         city: "Chicago",
//         phoneNumber: "555-0123",
//         countryCode: "+1",
//       });
//       // Add sample experience and education
//       setExperiences([
//         {
//           id: "1",
//           title: "Senior Frontend Developer",
//           company: "Tech Corp",
//           location: "Chicago, IL",
//           description: "Led development of React applications...",
//           startDate: "2022-01",
//           endDate: "",
//           isCurrent: true,
//         },
//       ]);
//       setEducation([
//         {
//           id: "1",
//           institution: "University of Chicago",
//           major: "Computer Science",
//           degree: "Bachelor of Science",
//           location: "Chicago, IL",
//           description: "Focused on software engineering and algorithms",
//           startDate: "2018-09",
//           endDate: "2022-05",
//           isCurrentlyAttending: false,
//         },
//       ]);
//       // Hide the default forms after auto-fill
//       setShowExperienceForm(false);
//       setShowEducationForm(false);
//     }, 1500);
//   };

//   const handleResumeUpload = (file: File) => {
//     setResumeFile(file);
//   };

//   const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setProfileImage(e.target?.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const addExperience = (experience: Omit<Experience, "id">) => {
//     const newExperience = { ...experience, id: Date.now().toString() };
//     setExperiences([...experiences, newExperience]);
//     setShowExperienceForm(false);
//   };

//   const updateExperience = (experience: Experience) => {
//     setExperiences(
//       experiences.map((exp) => (exp.id === experience.id ? experience : exp))
//     );
//     setEditingExperience(null);
//     setShowExperienceForm(false);
//   };

//   const removeExperience = (id: string) => {
//     setExperiences(experiences.filter((exp) => exp.id !== id));
//   };

//   const addEducation = (educationItem: Omit<Education, "id">) => {
//     const newEducation = { ...educationItem, id: Date.now().toString() };
//     setEducation([...education, newEducation]);
//     setShowEducationForm(false);
//   };

//   const updateEducation = (educationItem: Education) => {
//     setEducation(
//       education.map((edu) =>
//         edu.id === educationItem.id ? educationItem : edu
//       )
//     );
//     setEditingEducation(null);
//     setShowEducationForm(false);
//   };

//   const removeEducation = (id: string) => {
//     setEducation(education.filter((edu) => edu.id !== id));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     console.log("Application submitted:", {
//       method: applicationMethod,
//       personalInfo,
//       experiences,
//       education,
//       profiles,
//       coverLetter,
//       files: { uploadedFile, resumeFile },
//     });
//     // Handle form submission
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b">
//         <div className="max-w-4xl mx-auto px-6 py-4">
//           <h1 className="text-2xl font-semibold text-gray-900">
//             Apply for Senior Frontend Developer
//           </h1>
//           <p className="text-sm text-gray-600 mt-1">Figma • Chicago, IL</p>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-4xl mx-auto px-6 py-8">
//         <form onSubmit={handleSubmit} className="space-y-8">
//           {/* Easy Apply Section */}
//           <EasyApplySection
//             applicationMethod={applicationMethod}
//             setApplicationMethod={setApplicationMethod}
//             uploadedFile={uploadedFile}
//             onFileUpload={handleAutoFillUpload}
//           />

//           {/* Personal Information */}
//           <PersonalInfoForm
//             personalInfo={personalInfo}
//             setPersonalInfo={setPersonalInfo}
//             profileImage={profileImage}
//             onImageUpload={handleImageUpload}
//           />

//           {/* Experience Section */}
//           <ExperienceSection
//             experiences={experiences}
//             showExperienceForm={showExperienceForm}
//             editingExperience={editingExperience}
//             setShowExperienceForm={setShowExperienceForm}
//             setEditingExperience={setEditingExperience}
//             addExperience={addExperience}
//             updateExperience={updateExperience}
//             removeExperience={removeExperience}
//           />

//           {/* Education Section */}
//           <EducationSection
//             education={education}
//             showEducationForm={showEducationForm}
//             editingEducation={editingEducation}
//             setShowEducationForm={setShowEducationForm}
//             setEditingEducation={setEditingEducation}
//             addEducation={addEducation}
//             updateEducation={updateEducation}
//             removeEducation={removeEducation}
//           />

//           {/* Social Profiles */}
//           <SocialProfilesForm profiles={profiles} setProfiles={setProfiles} />

//           {/* Resume Upload (for manual method) */}
//           {applicationMethod === "manual" && (
//             <div className="bg-white rounded-lg border p-8">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">
//                 Resume <span className="text-red-500">*</span>
//               </h2>

//               <FileUpload
//                 onFileSelect={handleResumeUpload}
//                 uploadedFile={resumeFile}
//                 title="Choose a file or drop it here"
//                 description="10MB size limit"
//                 required={true}
//               />
//             </div>
//           )}

//           {/* Cover Letter */}
//           <CoverLetterForm
//             coverLetter={coverLetter}
//             setCoverLetter={setCoverLetter}
//           />

//           {/* Submit Button */}
//           <div className="flex justify-end space-x-4">
//             <button
//               type="button"
//               className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
//             >
//               Save Draft
//             </button>
//             <button
//               type="submit"
//               className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//             >
//               Submit Application
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
"use client";
import {
  Education,
  Experience,
  PersonalInfoAppliedForm,
  PreliminaryData,
  SocialProfiles,
} from "@/interfaces";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { CoverLetterForm } from "./CoverLetterForm";
import { EasyApplySection } from "./EasyApplySection";
import { EducationSection } from "./EducationSection";
import { ExperienceSection } from "./ExperienceSection";
import { FileUpload } from "./FileUpload";
import { PersonalInfoForm } from "./PersonalInfoForm";
import PreliminaryQuestionsForm from "./PreliminaryQuestionsForm";
import { SocialProfilesForm } from "./SocialProfilesForm";

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  department: string;
  applicants: number;
  postedDate: string;
  status: string;
}

interface JobApplicationFormProps {
  jobData?: JobData;
}

export default function JobApplicationForm({
  jobData,
}: JobApplicationFormProps) {
  // Track application step
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [applicationMethod, setApplicationMethod] = useState<
    "upload" | "manual"
  >("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Form data states
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoAppliedForm>({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    city: "",
    phoneNumber: "",
    countryCode: "+61",
  });

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [profiles, setProfiles] = useState<SocialProfiles>({
    linkedin: "",
    facebook: "",
    twitter: "",
    website: "",
  });
  const [coverLetter, setCoverLetter] = useState("");

  // Preliminary questions state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [preliminaryData, setPreliminaryData] = useState<PreliminaryData>({
    preferredName: "",
    pronouns: "",
    workingStatus: "",
    workingRights: "",
    raceEthnicity: "",
    genderIdentity: "",
    privacyConsent: false,
  });

  // Show forms by default
  const [showExperienceForm, setShowExperienceForm] = useState(true);
  const [showEducationForm, setShowEducationForm] = useState(true);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(
    null
  );
  const [editingEducation, setEditingEducation] = useState<Education | null>(
    null
  );

  // Default job data if none provided
  const defaultJobData: JobData = {
    id: "1",
    title: "Senior Frontend Developer",
    company: "Figma",
    location: "Chicago, IL",
    type: "Full-Time",
    experience: "5-7 Years",
    salary: {
      min: 90000,
      max: 120000,
      currency: "USD",
      period: "per year",
    },
    department: "Engineering",
    applicants: 24,
    postedDate: "2024-05-26",
    status: "Active",
  };

  const job = jobData || defaultJobData;

  const formatSalary = (salary: JobData["salary"]) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)} ${
      salary.period
    }`;
  };

  const getDaysAgo = (dateString: string) => {
    const posted = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Full-Time":
        return "bg-blue-100 text-blue-800";
      case "Part-Time":
        return "bg-purple-100 text-purple-800";
      case "Contract":
        return "bg-orange-100 text-orange-800";
      case "Internship":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAutoFillUpload = (file: File, shouldAutoFill = true) => {
    setUploadedFile(file);

    // Only auto-fill if using the upload method with auto-fill enabled
    if (applicationMethod === "upload" && shouldAutoFill) {
      // Simulate auto-fill after upload
      setTimeout(() => {
        setPersonalInfo({
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          confirmEmail: "john.doe@email.com",
          city: "Chicago",
          phoneNumber: "555-0123",
          countryCode: "+1",
        });
        // Add sample experience and education
        setExperiences([
          {
            id: "1",
            title: "Senior Frontend Developer",
            company: "Tech Corp",
            location: "Chicago, IL",
            description: "Led development of React applications...",
            startDate: "2022-01",
            endDate: "",
            isCurrent: true,
          },
        ]);
        setEducation([
          {
            id: "1",
            institution: "University of Chicago",
            major: "Computer Science",
            degree: "Bachelor of Science",
            location: "Chicago, IL",
            description: "Focused on software engineering and algorithms",
            startDate: "2018-09",
            endDate: "2022-05",
            isCurrentlyAttending: false,
          },
        ]);
        // Hide the default forms after auto-fill
        setShowExperienceForm(false);
        setShowEducationForm(false);
      }, 1500);
    }
  };

  const handleResumeUpload = (file: File) => {
    setResumeFile(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addExperience = (experience: Omit<Experience, "id">) => {
    const newExperience = { ...experience, id: Date.now().toString() };
    setExperiences([...experiences, newExperience]);
    setShowExperienceForm(false);
  };

  const updateExperience = (experience: Experience) => {
    setExperiences(
      experiences.map((exp) => (exp.id === experience.id ? experience : exp))
    );
    setEditingExperience(null);
    setShowExperienceForm(false);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const addEducation = (educationItem: Omit<Education, "id">) => {
    const newEducation = { ...educationItem, id: Date.now().toString() };
    setEducation([...education, newEducation]);
    setShowEducationForm(false);
  };

  const updateEducation = (educationItem: Education) => {
    setEducation(
      education.map((edu) =>
        edu.id === educationItem.id ? educationItem : edu
      )
    );
    setEditingEducation(null);
    setShowEducationForm(false);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  // Go to preliminary questions step
  const handleNextStep = () => {
    // Validate first step if needed
    setCurrentStep(2);
  };

  // Go back to first step
  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // Handle preliminary questions submission
  const handlePreliminarySubmit = (data: PreliminaryData) => {
    setPreliminaryData(data);

    // Here you would submit the complete application
    console.log("Final application submitted:", {
      jobId: job.id,
      method: applicationMethod,
      personalInfo,
      experiences,
      education,
      profiles,
      coverLetter,
      files: { uploadedFile, resumeFile },
      preliminaryData: data,
    });

    // Redirect or show success message
  };

  const handleSubmitFirstStep = (e: React.FormEvent) => {
    e.preventDefault();
    handleNextStep();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          {/* Navigation */}
          <div className="flex items-center py-4">
            {currentStep === 1 ? (
              <Link
                href={`/jobs/${job.id}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Back to Job Details</span>
              </Link>
            ) : (
              <button
                onClick={handlePrevStep}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  Back to Application Form
                </span>
              </button>
            )}
          </div>

          {/* Job Header */}
          <div className="pb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg mr-4">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      Apply for {job.title}
                    </h1>
                    <p className="text-lg text-gray-600 font-medium">
                      {job.company}
                    </p>
                  </div>
                </div>

                {/* Job Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{job.experience}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatSalary(job.salary)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Posted {getDaysAgo(job.postedDate)}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-3 mt-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                      job.type
                    )}`}
                  >
                    {job.type}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {job.department}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {job.applicants} applicants
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-gray-700">
                    Featured Job
                  </span>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {job.status}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Application Progress
                </span>
                <span className="text-sm text-gray-500">
                  Step {currentStep} of 2
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentStep * 50}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {currentStep === 1 ? (
          <form onSubmit={handleSubmitFirstStep} className="space-y-8">
            {/* Easy Apply Section */}
            <EasyApplySection
              applicationMethod={applicationMethod}
              setApplicationMethod={setApplicationMethod}
              uploadedFile={uploadedFile}
              onFileUpload={handleAutoFillUpload}
            />

            {/* Personal Information */}
            <PersonalInfoForm
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              profileImage={profileImage}
              onImageUpload={handleImageUpload}
            />

            {/* Experience Section */}
            <ExperienceSection
              experiences={experiences}
              showExperienceForm={showExperienceForm}
              editingExperience={editingExperience}
              setShowExperienceForm={setShowExperienceForm}
              setEditingExperience={setEditingExperience}
              addExperience={addExperience}
              updateExperience={updateExperience}
              removeExperience={removeExperience}
            />

            {/* Education Section */}
            <EducationSection
              education={education}
              showEducationForm={showEducationForm}
              editingEducation={editingEducation}
              setShowEducationForm={setShowEducationForm}
              setEditingEducation={setEditingEducation}
              addEducation={addEducation}
              updateEducation={updateEducation}
              removeEducation={removeEducation}
            />

            {/* Social Profiles */}
            <SocialProfilesForm profiles={profiles} setProfiles={setProfiles} />

            {/* Resume Upload (for manual method) */}
            {applicationMethod === "manual" && (
              <div className="bg-white rounded-lg border p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Resume <span className="text-red-500">*</span>
                </h2>

                <FileUpload
                  onFileSelect={handleResumeUpload}
                  uploadedFile={resumeFile}
                  title="Choose a file or drop it here"
                  description="10MB size limit"
                  required={true}
                />
              </div>
            )}

            {/* Cover Letter */}
            <CoverLetterForm
              coverLetter={coverLetter}
              setCoverLetter={setCoverLetter}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          <PreliminaryQuestionsForm
            jobData={{
              title: job.title,
              company: job.company,
              location: job.location,
            }}
            onBack={handlePrevStep}
            onSubmit={handlePreliminarySubmit}
          />
        )}
      </div>
    </div>
  );
}
