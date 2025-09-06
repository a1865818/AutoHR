"use client";

import { HeroSection } from "@/components/landing/hero/HeroSection";
import { FeatureGrid } from "@/components/landing/features/FeatureGrid";
import { TestimonialCarousel } from "@/components/landing/testimonials/TestimonialCarousel";
import { CompanyShowcase } from "@/components/landing/companies/CompanyShowcase";
import { CTASection } from "@/components/landing/cta/CTASection";

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeatureGrid />
      <CompanyShowcase />
      <TestimonialCarousel />
      <CTASection />
    </div>
  );
}