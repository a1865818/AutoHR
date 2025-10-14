"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/app/public/components/ui/badge";
import { Card, CardContent } from "@/app/public/components/ui/card";
import { Building2, MapPin, Users, TrendingUp } from "lucide-react";

const companies = [
  {
    name: "Google",
    industry: "Technology",
    location: "Mountain View, CA",
    employees: "150,000+",
    openJobs: 245
  },
  {
    name: "Microsoft",
    industry: "Technology",
    location: "Redmond, WA",
    employees: "220,000+",
    openJobs: 189
  },
  {
    name: "Apple",
    industry: "Technology",
    location: "Cupertino, CA",
    employees: "165,000+",
    openJobs: 156
  },
  {
    name: "Netflix",
    industry: "Entertainment",
    location: "Los Gatos, CA",
    employees: "15,000+",
    openJobs: 78
  },
  {
    name: "Spotify",
    industry: "Music Streaming",
    location: "Stockholm, Sweden",
    employees: "8,000+",
    openJobs: 92
  },
  {
    name: "Amazon",
    industry: "E-commerce",
    location: "Seattle, WA",
    employees: "1,500,000+",
    openJobs: 567
  },
  {
    name: "Meta",
    industry: "Social Media",
    location: "Menlo Park, CA",
    employees: "77,000+",
    openJobs: 134
  },
  {
    name: "Tesla",
    industry: "Automotive",
    location: "Austin, TX",
    employees: "140,000+",
    openJobs: 289
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
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 }
  }
};

export function CompanyShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
              🏢 Trusted Partners
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Join professionals at
              <br />
              <span className="text-primary">world-class companies</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform connects you with opportunities at the most innovative 
              and forward-thinking companies across industries.
            </p>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-8 mb-16 p-8 bg-primary text-primary-foreground rounded-2xl"
        >
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">1,200+</div>
            <div className="text-primary-foreground/80 text-sm">Partner Companies</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">50,000+</div>
            <div className="text-primary-foreground/80 text-sm">Active Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">95%</div>
            <div className="text-primary-foreground/80 text-sm">Hiring Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">$120k</div>
            <div className="text-primary-foreground/80 text-sm">Average Salary</div>
          </div>
        </motion.div>

        {/* Company Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full group hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
                
                <CardContent className="p-6">
                  {/* Company Logo */}
                  <div className="flex items-center justify-center h-16 mb-4 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-foreground">
                      {company.name}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{company.industry}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{company.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>{company.employees} employees</span>
                    </div>
                  </div>

                  {/* Open Jobs Badge */}
                  <div className="mt-4 pt-4">
                    <Badge 
                      variant="secondary" 
                      className="w-full justify-center font-medium text-primary"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {company.openJobs} open positions
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-muted/30 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to join these amazing companies?
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your journey today and get matched with opportunities 
              at the world's most innovative companies.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:bg-primary/90 transition-all duration-300"
            >
              Browse Company Jobs
              <Building2 className="ml-2 h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}