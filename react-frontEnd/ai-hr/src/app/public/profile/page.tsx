"use client";

import Link from "next/link";
import {
  User,
  Briefcase,
  TrendingUp,
  Target,
  CheckCircle,
  Star,
  Building2,
  ArrowRight,
  Trophy,
  BarChart3,
  Heart,
  Globe,
  Users,
  Zap,
} from "lucide-react";

export default function ProfileMarketingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <User className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Stand Out to
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Top Employers
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Create a comprehensive profile that showcases your skills, tracks
              your job applications, and gets you personalized recommendations.
              Join thousands of professionals who found their dream jobs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg"
              >
                Create Your Profile Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Create a Profile?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get access to powerful features that give you an edge in your job
              search
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Job Tracking */}
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="bg-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Track Your Applications
              </h3>
              <p className="text-gray-600 mb-6">
                Never lose track of your job applications again. Monitor status,
                deadlines, and follow up at the right time with our smart
                tracking system.
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Application status tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Interview reminders
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Follow-up notifications
                </li>
              </ul>
            </div>

            {/* AI Recommendations */}
            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="bg-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                AI-Powered Recommendations
              </h3>
              <p className="text-gray-600 mb-6">
                Get personalized job recommendations based on your skills,
                experience, and career goals. Our AI finds opportunities you
                might miss.
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Personalized job matches
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Skill gap analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Career growth insights
                </li>
              </ul>
            </div>

            {/* Professional Visibility */}
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="bg-green-600 p-4 rounded-full w-16 h-16 mx-auto mb-6">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Stand Out to Employers
              </h3>
              <p className="text-gray-600 mb-6">
                Create a comprehensive profile that showcases your achievements,
                skills, and experience. Be discovered by top employers.
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Professional portfolio
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Skills verification
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Employer visibility
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring Banner Section */}
      <div className="py-16 bg-gradient-to-r from-orange-500 to-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <Building2 className="h-8 w-8 text-orange-600 mr-3" />
                  <span className="text-orange-600 font-semibold text-lg">
                    For Employers
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Find Top Talent Faster
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Access our pool of qualified candidates with verified
                  profiles. Post jobs, review applications, and hire the best
                  talent with our comprehensive hiring platform.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Access to verified candidate profiles
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    AI-powered candidate matching
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Streamlined hiring process
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Advanced analytics and reporting
                  </li>
                </ul>
                <Link
                  href="/login"
                  className="inline-flex items-center px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg"
                >
                  Start Hiring Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-orange-100 to-red-100 p-8 rounded-xl">
                  <Users className="h-24 w-24 text-orange-600 mx-auto mb-6" />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        50k+
                      </div>
                      <div className="text-gray-600">Active Candidates</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        1000+
                      </div>
                      <div className="text-gray-600">Companies Hiring</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        95%
                      </div>
                      <div className="text-gray-600">Success Rate</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        24h
                      </div>
                      <div className="text-gray-600">Avg. Response</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of professionals who have advanced their careers
              with our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Setup</h3>
              <p className="text-gray-600 text-sm">
                Create your profile in minutes with our guided setup process
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-4">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Global Opportunities
              </h3>
              <p className="text-gray-600 text-sm">
                Access job opportunities from companies worldwide
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-4">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Career Growth
              </h3>
              <p className="text-gray-600 text-sm">
                Get insights and recommendations to advance your career
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-4">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Premium Support
              </h3>
              <p className="text-gray-600 text-sm">
                Get help from our career experts whenever you need it
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Your Career to the Next Level?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who have found their dream jobs
            through our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg"
            >
              Get Started for Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link
              href="/public"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold text-lg"
            >
              Browse Jobs First
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-4">
            No credit card required • Set up in minutes • Join 50,000+
            professionals
          </p>
        </div>
      </div>
    </div>
  );
}
