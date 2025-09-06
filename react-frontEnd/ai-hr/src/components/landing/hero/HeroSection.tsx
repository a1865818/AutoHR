"use client";

import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientText } from "@/components/landing/shared/GradientText";
import { AnimatedCounter } from "@/components/landing/shared/AnimatedCounter";
import Link from "next/link";
import { useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      duration: 0.6
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  return (
    <div className="relative overflow-hidden bg-gradient-primary min-h-[90vh] flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center px-4 py-2 glass rounded-full text-white/90 text-sm font-medium">
              ✨ Over 50,000 successful job matches
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              Find Your Dream Job
              <br />
              <span className="text-white/90">
                Powered by AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Connect with top companies, get personalized recommendations, and land your next opportunity with our intelligent job matching platform.
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div variants={itemVariants} className="mb-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 p-4 glass rounded-2xl border-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                  <Input
                    type="text"
                    placeholder="Job title, company, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-white/10 border-0 text-white placeholder:text-white/60 focus:bg-white/20 h-14 text-lg focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                  <Input
                    type="text"
                    placeholder="City, state, or remote"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="pl-12 bg-white/10 border-0 text-white placeholder:text-white/60 focus:bg-white/20 h-14 text-lg focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-primary hover:bg-white/90 font-semibold px-8 h-14"
                >
                  <Link href={`/public/browse-jobs${searchQuery || locationQuery ? `?${searchQuery ? `search=${encodeURIComponent(searchQuery)}` : ''}${searchQuery && locationQuery ? '&' : ''}${locationQuery ? `location=${encodeURIComponent(locationQuery)}` : ''}` : ''}`}>
                    Search Jobs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="mb-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                asChild
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
              >
                <Link href="/signup/applicant">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <p className="text-white/70 text-sm mt-4">
              No credit card required • Join 50,000+ professionals
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <AnimatedCounter end={50000} suffix="+" />
                </div>
                <div className="text-white/80 text-sm">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <AnimatedCounter end={1200} suffix="+" />
                </div>
                <div className="text-white/80 text-sm">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <AnimatedCounter end={95} suffix="%" />
                </div>
                <div className="text-white/80 text-sm">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <AnimatedCounter end={24} />
                </div>
                <div className="text-white/80 text-sm">Avg. Hours to Match</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}