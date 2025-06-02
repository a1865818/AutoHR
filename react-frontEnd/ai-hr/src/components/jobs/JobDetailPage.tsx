// // components/jobs/JobDetailsPage.tsx
// "use client";

// import {
//   ArrowLeft,
//   Briefcase,
//   Building2,
//   Calendar,
//   CheckCircle,
//   Clock,
//   DollarSign,
//   Edit,
//   Eye,
//   Globe,
//   MapPin,
//   MoreHorizontal,
//   Pause,
//   Send,
//   Share2,
//   Users,
//   XCircle,
// } from "lucide-react";
// import Link from "next/link";
// import { useState } from "react";

// interface JobDetails {
//   id: string;
//   title: string;
//   company: string;
//   location: string;
//   type: "Full-Time" | "Part-Time" | "Contract" | "Internship";
//   experience: string;
//   salary: string;
//   salaryMin: number;
//   salaryMax: number;
//   description: string;
//   responsibilities: string[];
//   requirements: string[];
//   benefits: string[];
//   postedDate: string;
//   applicants: number;
//   status: "Active" | "Paused" | "Closed";
//   urgency?: "Urgent" | "High Priority";
//   isRemote: boolean;
//   department: string;
//   reportingTo: string;
//   companySize: string;
//   industry: string;
//   website: string;
// }

// // Mock job data - in real app this would come from props or API
// const mockJobDetails: JobDetails = {
//   id: "1",
//   title: "Senior Frontend Developer",
//   company: "Figma",
//   location: "Chicago, IL",
//   type: "Full-Time",
//   experience: "5-7 Years",
//   salary: "$90k - $120k",
//   salaryMin: 90000,
//   salaryMax: 120000,
//   description:
//     "We're looking for a senior frontend developer to join our design tools team. You'll be working on the core interface that millions of designers use daily to bring their ideas to life. This is a unique opportunity to shape the future of design tools and work with a world-class team of engineers and designers.",
//   responsibilities: [
//     "Build and maintain high-performance React components for the Figma editor",
//     "Collaborate with designers and product managers to implement new features",
//     "Optimize application performance and ensure smooth user experience",
//     "Mentor junior developers and contribute to technical decisions",
//     "Write comprehensive tests and maintain code quality standards",
//     "Participate in code reviews and architectural discussions",
//   ],
//   requirements: [
//     "5+ years of experience in frontend development",
//     "Expert knowledge of React, TypeScript, and modern JavaScript",
//     "Experience with canvas-based applications or graphics programming",
//     "Strong understanding of web performance optimization",
//     "Experience with testing frameworks (Jest, React Testing Library)",
//     "Bachelor's degree in Computer Science or equivalent experience",
//     "Excellent communication and collaboration skills",
//   ],
//   benefits: [
//     "Competitive salary and equity package",
//     "Comprehensive health, dental, and vision insurance",
//     "Flexible work arrangements and remote options",
//     "Professional development budget ($2,000/year)",
//     "Catered meals and snacks in the office",
//     "State-of-the-art equipment and workspace",
//     "Generous parental leave policy",
//     "Mental health and wellness support",
//   ],
//   postedDate: "2024-05-26",
//   applicants: 24,
//   status: "Active",
//   isRemote: false,
//   department: "Engineering",
//   reportingTo: "VP of Engineering",
//   companySize: "500-1000 employees",
//   industry: "Design & Technology",
//   website: "https://figma.com",
// };

// interface JobDetailsPageProps {
//   jobId: string;
// }

// export function JobDetailsPage({ jobId }: JobDetailsPageProps) {
//   // In a real application, you would fetch job data based on jobId

//   //   const [job, setJob] = useState<JobDetails | null>(null);
//   //   useEffect(() => {
//   //     fetchJobById(jobId).then(setJob);
//   //   }, [jobId]);

//   const [job] = useState<JobDetails>({
//     ...mockJobDetails,
//     id: jobId, // Use the actual jobId from the URL
//   });
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [activeTab, setActiveTab] = useState<"overview" | "applicants">(
//     "overview"
//   );

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "Active":
//         return <CheckCircle className="h-4 w-4 text-green-600" />;
//       case "Paused":
//         return <Pause className="h-4 w-4 text-yellow-600" />;
//       case "Closed":
//         return <XCircle className="h-4 w-4 text-red-600" />;
//       default:
//         return null;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "Active":
//         return "bg-green-100 text-green-800";
//       case "Paused":
//         return "bg-yellow-100 text-yellow-800";
//       case "Closed":
//         return "bg-gray-100 text-gray-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getTypeColor = (type: string) => {
//     switch (type) {
//       case "Full-Time":
//         return "bg-blue-100 text-blue-800";
//       case "Part-Time":
//         return "bg-purple-100 text-purple-800";
//       case "Contract":
//         return "bg-orange-100 text-orange-800";
//       case "Internship":
//         return "bg-pink-100 text-pink-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   const getDaysAgo = (dateString: string) => {
//     const posted = new Date(dateString);
//     const now = new Date();
//     const diffTime = Math.abs(now.getTime() - posted.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     if (diffDays === 1) return "1 day ago";
//     if (diffDays < 7) return `${diffDays} days ago`;
//     if (diffDays < 14) return "1 week ago";
//     if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
//     return `${Math.floor(diffDays / 30)} months ago`;
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between py-4">
//             <div className="flex items-center space-x-4">
//               <Link
//                 href="/jobs"
//                 className="p-2 hover:bg-gray-100 rounded-md transition-colors"
//               >
//                 <ArrowLeft className="h-5 w-5 text-gray-600" />
//               </Link>
//               <div>
//                 <h1 className="text-2xl font-semibold text-gray-900">
//                   {job.title}
//                 </h1>
//                 <p className="text-sm text-gray-600">{job.company}</p>
//               </div>
//             </div>

//             <div className="flex items-center space-x-3">
//               <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
//                 <Share2 className="h-4 w-4 mr-2" />
//                 Share
//               </button>
//               <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
//                 <Edit className="h-4 w-4 mr-2" />
//                 Edit Job
//               </button>
//               <div className="relative">
//                 <button
//                   className="p-2 hover:bg-gray-100 rounded-md transition-colors"
//                   onClick={() => setShowDropdown(!showDropdown)}
//                 >
//                   <MoreHorizontal className="h-5 w-5 text-gray-600" />
//                 </button>
//                 {showDropdown && (
//                   <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
//                     <div className="py-1">
//                       <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
//                         Duplicate Job
//                       </button>
//                       <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
//                         Archive Job
//                       </button>
//                       <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
//                         Delete Job
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Tabs */}
//           <div className="flex space-x-8">
//             <button
//               className={`pb-4 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === "overview"
//                   ? "border-blue-500 text-blue-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700"
//               }`}
//               onClick={() => setActiveTab("overview")}
//             >
//               Job Overview
//             </button>
//             <button
//               className={`pb-4 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === "applicants"
//                   ? "border-blue-500 text-blue-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700"
//               }`}
//               onClick={() => setActiveTab("applicants")}
//             >
//               Applicants ({job.applicants})
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {activeTab === "overview" ? (
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Main Content */}
//             <div className="lg:col-span-2 space-y-8">
//               {/* Job Info Card */}
//               <div className="bg-white rounded-lg border p-6">
//                 <div className="flex items-start justify-between mb-6">
//                   <div className="flex items-center space-x-3">
//                     {getStatusIcon(job.status)}
//                     <span
//                       className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
//                         job.status
//                       )}`}
//                     >
//                       {job.status}
//                     </span>
//                     <span
//                       className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
//                         job.type
//                       )}`}
//                     >
//                       {job.type}
//                     </span>
//                     {job.urgency && (
//                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
//                         {job.urgency}
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 {/* Job Details Grid */}
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                   <div className="flex items-center text-sm text-gray-600">
//                     <MapPin className="h-4 w-4 mr-2" />
//                     <span>{job.location}</span>
//                   </div>
//                   <div className="flex items-center text-sm text-gray-600">
//                     <Briefcase className="h-4 w-4 mr-2" />
//                     <span>{job.experience}</span>
//                   </div>
//                   <div className="flex items-center text-sm text-gray-600">
//                     <DollarSign className="h-4 w-4 mr-2" />
//                     <span>{job.salary}</span>
//                   </div>
//                   <div className="flex items-center text-sm text-gray-600">
//                     <Calendar className="h-4 w-4 mr-2" />
//                     <span>Posted {getDaysAgo(job.postedDate)}</span>
//                   </div>
//                 </div>

//                 {/* Description */}
//                 <div className="mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-3">
//                     Job Description
//                   </h3>
//                   <p className="text-gray-700 leading-relaxed">
//                     {job.description}
//                   </p>
//                 </div>

//                 {/* Responsibilities */}
//                 <div className="mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-3">
//                     Key Responsibilities
//                   </h3>
//                   <ul className="space-y-2">
//                     {job.responsibilities.map((responsibility, index) => (
//                       <li key={index} className="flex items-start">
//                         <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3"></div>
//                         <span className="text-gray-700">{responsibility}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {/* Requirements */}
//                 <div className="mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-3">
//                     Requirements
//                   </h3>
//                   <ul className="space-y-2">
//                     {job.requirements.map((requirement, index) => (
//                       <li key={index} className="flex items-start">
//                         <div className="flex-shrink-0 w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3"></div>
//                         <span className="text-gray-700">{requirement}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {/* Benefits */}
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-3">
//                     Benefits & Perks
//                   </h3>
//                   <ul className="space-y-2">
//                     {job.benefits.map((benefit, index) => (
//                       <li key={index} className="flex items-start">
//                         <div className="flex-shrink-0 w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 mr-3"></div>
//                         <span className="text-gray-700">{benefit}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             </div>

//             {/* Sidebar */}
//             <div className="space-y-6">
//               {/* Quick Actions */}
//               <div className="bg-white rounded-lg border p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Quick Actions
//                 </h3>
//                 <div className="space-y-3">
//                   <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
//                     <Eye className="h-4 w-4 mr-2" />
//                     View Applicants
//                   </button>
//                   <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
//                     <Send className="h-4 w-4 mr-2" />
//                     Share Job Link
//                   </button>
//                   <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
//                     <Edit className="h-4 w-4 mr-2" />
//                     Edit Job Details
//                   </button>
//                 </div>
//               </div>

//               {/* Job Stats */}
//               <div className="bg-white rounded-lg border p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Job Statistics
//                 </h3>
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-gray-600">
//                       Total Applications
//                     </span>
//                     <span className="text-sm font-semibold text-gray-900">
//                       {job.applicants}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-gray-600">Views</span>
//                     <span className="text-sm font-semibold text-gray-900">
//                       142
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-gray-600">Days Active</span>
//                     <span className="text-sm font-semibold text-gray-900">
//                       3
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-gray-600">
//                       Application Rate
//                     </span>
//                     <span className="text-sm font-semibold text-gray-900">
//                       16.9%
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Company Info */}
//               <div className="bg-white rounded-lg border p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Company Information
//                 </h3>
//                 <div className="space-y-3">
//                   <div className="flex items-center text-sm">
//                     <Building2 className="h-4 w-4 mr-3 text-gray-400" />
//                     <div>
//                       <span className="text-gray-600">Department: </span>
//                       <span className="font-medium text-gray-900">
//                         {job.department}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex items-center text-sm">
//                     <Users className="h-4 w-4 mr-3 text-gray-400" />
//                     <div>
//                       <span className="text-gray-600">Company Size: </span>
//                       <span className="font-medium text-gray-900">
//                         {job.companySize}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex items-center text-sm">
//                     <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
//                     <div>
//                       <span className="text-gray-600">Industry: </span>
//                       <span className="font-medium text-gray-900">
//                         {job.industry}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex items-center text-sm">
//                     <Globe className="h-4 w-4 mr-3 text-gray-400" />
//                     <a
//                       href={job.website}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:text-blue-800 font-medium"
//                     >
//                       Company Website
//                     </a>
//                   </div>
//                 </div>
//               </div>

//               {/* Posted Date */}
//               <div className="bg-white rounded-lg border p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Job Timeline
//                 </h3>
//                 <div className="space-y-3">
//                   <div className="flex items-center text-sm">
//                     <Calendar className="h-4 w-4 mr-3 text-gray-400" />
//                     <div>
//                       <span className="text-gray-600">Posted: </span>
//                       <span className="font-medium text-gray-900">
//                         {formatDate(job.postedDate)}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex items-center text-sm">
//                     <Clock className="h-4 w-4 mr-3 text-gray-400" />
//                     <div>
//                       <span className="text-gray-600">Active for: </span>
//                       <span className="font-medium text-gray-900">
//                         {getDaysAgo(job.postedDate)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : (
//           /* Applicants Tab */
//           <div className="bg-white rounded-lg border p-6">
//             <div className="text-center py-12">
//               <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                 Applicant Management
//               </h3>
//               <p className="text-gray-600 mb-4">
//                 View and manage the {job.applicants} applicants for this
//                 position.
//               </p>
//               <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
//                 View All Applicants
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
// components/jobs/JobDetailsPage.tsx
"use client";

// components/jobs/JobDetailsPage.tsx
"use client";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  Globe,
  MapPin,
  MoreHorizontal,
  Pause,
  Send,
  Share2,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-Time" | "Part-Time" | "Contract" | "Internship";
  experience: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  postedDate: string;
  applicants: number;
  status: "Active" | "Paused" | "Closed";
  urgency?: "Urgent" | "High Priority";
  isRemote: boolean;
  department: string;
  reportingTo: string;
  companySize: string;
  industry: string;
  website: string;
}

// Mock job data - in real app this would come from props or API
const mockJobDetails: JobDetails = {
  id: "1",
  title: "Senior Frontend Developer",
  company: "Figma",
  location: "Chicago, IL",
  type: "Full-Time",
  experience: "5-7 Years",
  salary: "$90k - $120k",
  salaryMin: 90000,
  salaryMax: 120000,
  description:
    "We're looking for a senior frontend developer to join our design tools team. You'll be working on the core interface that millions of designers use daily to bring their ideas to life. This is a unique opportunity to shape the future of design tools and work with a world-class team of engineers and designers.",
  responsibilities: [
    "Build and maintain high-performance React components for the Figma editor",
    "Collaborate with designers and product managers to implement new features",
    "Optimize application performance and ensure smooth user experience",
    "Mentor junior developers and contribute to technical decisions",
    "Write comprehensive tests and maintain code quality standards",
    "Participate in code reviews and architectural discussions",
  ],
  requirements: [
    "5+ years of experience in frontend development",
    "Expert knowledge of React, TypeScript, and modern JavaScript",
    "Experience with canvas-based applications or graphics programming",
    "Strong understanding of web performance optimization",
    "Experience with testing frameworks (Jest, React Testing Library)",
    "Bachelor's degree in Computer Science or equivalent experience",
    "Excellent communication and collaboration skills",
  ],
  benefits: [
    "Competitive salary and equity package",
    "Comprehensive health, dental, and vision insurance",
    "Flexible work arrangements and remote options",
    "Professional development budget ($2,000/year)",
    "Catered meals and snacks in the office",
    "State-of-the-art equipment and workspace",
    "Generous parental leave policy",
    "Mental health and wellness support",
  ],
  postedDate: "2024-05-26",
  applicants: 24,
  status: "Active",
  isRemote: false,
  department: "Engineering",
  reportingTo: "VP of Engineering",
  companySize: "500-1000 employees",
  industry: "Design & Technology",
  website: "https://figma.com",
};

interface JobDetailsPageProps {
  jobId: string;
}

export function JobDetailsPage({ jobId }: JobDetailsPageProps) {
  // In a real application, you would fetch job data based on jobId
  // For now, we'll use mock data but you could do:
  // const [job, setJob] = useState<JobDetails | null>(null);
  // useEffect(() => {
  //   fetchJobById(jobId).then(setJob);
  // }, [jobId]);

  const [job] = useState<JobDetails>({
    ...mockJobDetails,
    id: jobId, // Use the actual jobId from the URL
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "applicants">(
    "overview"
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Paused":
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case "Closed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Paused":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/jobs"
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {job.title}
                </h1>
                <p className="text-sm text-gray-600">{job.company}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
              <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </button>
              <div className="relative">
                <button
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-600" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Duplicate Job
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Archive Job
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        Delete Job
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8">
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Job Overview
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "applicants"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("applicants")}
            >
              Applicants ({job.applicants})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Info Card */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        job.type
                      )}`}
                    >
                      {job.type}
                    </span>
                    {job.urgency && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {job.urgency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Job Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>{job.experience}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Posted {getDaysAgo(job.postedDate)}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Job Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Responsibilities */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Key Responsibilities
                  </h3>
                  <ul className="space-y-2">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3"></div>
                        <span className="text-gray-700">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3"></div>
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Benefits & Perks
                  </h3>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 mr-3"></div>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href={`/jobs/${job.id}/apply`}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apply for This Job
                  </Link>
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    <Eye className="h-4 w-4 mr-2" />
                    View Applicants
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    <Send className="h-4 w-4 mr-2" />
                    Share Job Link
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Job Details
                  </button>
                </div>
              </div>

              {/* Job Stats */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Job Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total Applications
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {job.applicants}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Views</span>
                    <span className="text-sm font-semibold text-gray-900">
                      142
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Days Active</span>
                    <span className="text-sm font-semibold text-gray-900">
                      3
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Application Rate
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      16.9%
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Company Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Building2 className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Department: </span>
                      <span className="font-medium text-gray-900">
                        {job.department}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Company Size: </span>
                      <span className="font-medium text-gray-900">
                        {job.companySize}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Industry: </span>
                      <span className="font-medium text-gray-900">
                        {job.industry}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Globe className="h-4 w-4 mr-3 text-gray-400" />
                    <a
                      href={job.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Company Website
                    </a>
                  </div>
                </div>
              </div>

              {/* Posted Date */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Job Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Posted: </span>
                      <span className="font-medium text-gray-900">
                        {formatDate(job.postedDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Active for: </span>
                      <span className="font-medium text-gray-900">
                        {getDaysAgo(job.postedDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Applicants Tab */
          <div className="bg-white rounded-lg border p-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Applicant Management
              </h3>
              <p className="text-gray-600 mb-4">
                View and manage the {job.applicants} applicants for this
                position.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                View All Applicants
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
