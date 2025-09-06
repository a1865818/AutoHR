"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef, useCallback } from "react";
import { Star, Quote, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Senior Software Engineer",
    company: "Google",
    image: "/api/placeholder/64/64",
    content: "AI-HR's intelligent matching system found me my dream job in just 2 weeks. The personalized recommendations were spot-on, and the application process was seamless.",
    rating: 5,
    timeToHire: "2 weeks",
    salaryIncrease: "40%",
    previousRole: "Full Stack Developer"
  },
  {
    id: 2,
    name: "Marcus Johnson",
    role: "Product Manager",
    company: "Microsoft",
    image: "/api/placeholder/64/64",
    content: "The AI-powered insights helped me understand what skills I needed to develop. Within 3 months, I landed a senior role at Microsoft with a significant salary bump.",
    rating: 5,
    timeToHire: "3 months",
    salaryIncrease: "35%",
    previousRole: "Associate PM"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "UX Designer",
    company: "Apple",
    image: "/api/placeholder/64/64",
    content: "The platform's career guidance and company insights gave me the confidence to aim higher. I'm now working on products used by millions at Apple.",
    rating: 5,
    timeToHire: "1 month",
    salaryIncrease: "50%",
    previousRole: "Junior Designer"
  },
  {
    id: 4,
    name: "David Kim",
    role: "Data Scientist",
    company: "Netflix",
    image: "/api/placeholder/64/64",
    content: "The automated application tracking saved me hours of manual work. I could focus on preparing for interviews while the platform managed everything else.",
    rating: 5,
    timeToHire: "6 weeks",
    salaryIncrease: "45%",
    previousRole: "Data Analyst"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "Marketing Director",
    company: "Spotify",
    image: "/api/placeholder/64/64",
    content: "The real-time notifications meant I was always first to apply to new opportunities. The competitive edge this gave me was incredible.",
    rating: 5,
    timeToHire: "3 weeks",
    salaryIncrease: "30%",
    previousRole: "Marketing Manager"
  }
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

export function TestimonialCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: "start",
      containScroll: "trimSnaps"
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-500 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants}>
            <Badge variant="secondary" className="mb-4">
              💼 Success Stories
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Hear from professionals who
              <br />
              <span className="text-gradient-primary">transformed their careers</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of professionals who have successfully advanced their careers 
              using our AI-powered platform.
            </p>
          </motion.div>
        </motion.div>

        {/* Carousel Container */}
        <motion.div
          ref={ref}
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative"
        >
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollPrev}
                className="rounded-full p-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollNext}
                className="rounded-full p-3"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Swipe to see more success stories
            </div>
          </div>

          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="flex-none w-full md:w-96"
                >
                  <Card className="h-full hover-lift border-0 shadow-lg">
                    <CardContent className="p-8">
                      {/* Quote Icon */}
                      <div className="mb-6">
                        <Quote className="h-8 w-8 text-primary/60" />
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-4">
                        {renderStars(testimonial.rating)}
                      </div>

                      {/* Content */}
                      <p className="text-foreground text-lg leading-relaxed mb-6">
                        "{testimonial.content}"
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="font-bold text-primary text-lg">
                            {testimonial.timeToHire}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Time to hire
                          </div>
                        </div>
                        <div className="text-center p-3 bg-success/10 rounded-lg">
                          <div className="font-bold text-success text-lg">
                            +{testimonial.salaryIncrease}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Salary increase
                          </div>
                        </div>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={testimonial.image} alt={testimonial.name} />
                          <AvatarFallback>
                            {testimonial.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">
                            {testimonial.name}
                          </div>
                          <div className="text-sm text-primary font-medium">
                            {testimonial.role}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {testimonial.company} • Previously {testimonial.previousRole}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                4.9/5
              </div>
              <div className="text-muted-foreground text-sm">
                Average rating from users
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                30 days
              </div>
              <div className="text-muted-foreground text-sm">
                Average time to job offer
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                89%
              </div>
              <div className="text-muted-foreground text-sm">
                Get job offers within 60 days
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}