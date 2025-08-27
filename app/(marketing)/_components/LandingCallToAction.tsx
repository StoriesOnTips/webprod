import React from 'react';
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const LandingCallToAction = () => {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 -right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
          <span className="text-sm text-white/70 font-medium">Skyrocket your journey</span>
        </div>

        {/* Main headline - keeping Magic UI's typography style */}
        <h1 className="text-3xl md:text-4xl lg:text-6xl font-semibold text-white mb-8 leading-[1.1] tracking-tight">
          Ready to build Stories{' '}
          <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            and learn with fun
          </span>
          ?
        </h1>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button className="group relative inline-flex items-center gap-3 px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" asChild>
            <Link href="/dashboard">
            Get started for free
            
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          
        </div>
       
      </div>
    </section>
  );
};

export default LandingCallToAction;