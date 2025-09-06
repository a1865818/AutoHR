"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Search, 
  Target, 
  BarChart3, 
  Zap, 
  Shield, 
  MessageSquare,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "AI-Powered Job Matching",
    description: "Advanced AI analyzes your skills and preferences to find perfect job matches.",
    icon: Target,
    stats: "95% match accuracy"
  },
  {
    title: "Smart Application Tracking",
    description: "Track applications with intelligent status updates and reminders.",
    icon: BarChart3,
    stats: "Track 50+ applications"
  },
  {
    title: "Instant Job Alerts",
    description: "Get notified immediately when new jobs match your criteria.",
    icon: Zap,
    stats: "< 1 min notifications"
  },
  {
    title: "Company Insights",
    description: "Access detailed company information, culture insights, and reviews.",
    icon: Users,
    stats: "1000+ companies"
  },
  {
    title: "Secure & Private",
    description: "Your data is encrypted and secure. Control who sees your profile.",
    icon: Shield,
    stats: "Bank-level security"
  },
  {
    title: "Real-time Chat",
    description: "Connect directly with hiring managers and recruiters instantly.",
    icon: MessageSquare,
    stats: "24/7 communication"
  },
  {
    title: "Career Growth Tracking",
    description: "Monitor career progress and get personalized skill recommendations.",
    icon: TrendingUp,
    stats: "Track milestones"
  },
  {
    title: "Quick Apply",
    description: "Apply to jobs with one click using your saved profile and preferences.",
    icon: Clock,
    stats: "< 30 sec applications"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.6
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

export function FeatureGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // All cards will be uniform size
  const getGridClasses = () => {
    return ""; // No special sizing - all cards uniform
  };

  return (
    <div className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4">
              ✨ Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Everything you need to
              <br />
              <span className="text-primary">land your dream job</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful tools and intelligent features designed to accelerate your job search 
              and connect you with the right opportunities.
            </p>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="h-full"
              >
                <Card className="h-full group hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
                  
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex-1">
                      {/* Icon - Consistent size */}
                      <div className="inline-flex items-center justify-center rounded-xl mb-4 w-12 h-12 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      {/* Title - Consistent styling */}
                      <h3 className="font-bold text-foreground mb-3 text-lg leading-tight">
                        {feature.title}
                      </h3>
                      
                      {/* Description - Consistent height with line clamping */}
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Stats Badge - Always at bottom */}
                    <div className="mt-auto pt-4">
                      <Badge 
                        variant="secondary" 
                        className="text-xs font-medium text-primary w-full justify-center"
                      >
                        {feature.stats}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-6">
            Ready to experience the future of job searching?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:bg-primary/90 transition-all duration-300"
          >
            Start Your Job Search
            <Search className="ml-2 h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}