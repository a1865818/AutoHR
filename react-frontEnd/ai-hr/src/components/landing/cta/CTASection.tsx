"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/app/public/components/ui/button";
import { Card, CardContent } from "@/app/public/components/ui/card";
import Link from "next/link";

const benefits = [
  "No credit card required",
  "Setup in under 5 minutes",
  "Cancel anytime",
  "24/7 customer support"
];

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

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Main CTA */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 glass rounded-full text-white/90 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Join 50,000+ professionals
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to accelerate
              <br />
              <span className="text-white/90">
                your career?
              </span>
            </h2>
            
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed">
              Join thousands of professionals who have transformed their careers with our AI-powered platform. 
              Start your journey to your dream job today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                size="lg"
                asChild
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
              >
                <Link href="/signup/applicant">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg"
              >
                Schedule Demo
              </Button>
            </div>

            {/* Benefits List */}
            <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  {benefit}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <Card className="glass border-white/20 hover-lift">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">2 weeks</div>
                <div className="text-white/80 text-sm">Average time to job offer</div>
              </CardContent>
            </Card>
            
            <Card className="glass border-white/20 hover-lift">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">40%</div>
                <div className="text-white/80 text-sm">Average salary increase</div>
              </CardContent>
            </Card>
            
            <Card className="glass border-white/20 hover-lift">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">95%</div>
                <div className="text-white/80 text-sm">User satisfaction rate</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            variants={itemVariants}
            className="text-center mt-12"
          >
            <p className="text-white/70 text-sm mb-4">
              Trusted by professionals at
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
              {["Google", "Microsoft", "Apple", "Netflix", "Amazon"].map((company) => (
                <div key={company} className="text-white font-medium">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}