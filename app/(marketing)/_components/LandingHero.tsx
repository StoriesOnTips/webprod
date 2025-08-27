import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroDashboardImage from "@/public/landing/landing-hero-dashboard.webp";

export default function LandingHero() {
  return (
    <section className="w-full min-h-screen flex items-center justify-center relative overflow-hidden py-24 ">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-12 max-w-5xl mx-auto">
          {/* Badge/Announcement */}
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="text-sm text-white/80 font-medium">
              The new way to create stories
            </span>
          </div>

          {/* Main heading */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl lg:text-8xl font-bold text-white tracking-tighter leading-none">
              Make Stories For <span>Fun & Education</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/60  mx-auto leading-relaxed font-light">
              Create personalized stories while learning languages
              <br />
              <span className="text-white/80">
                where AI storytelling meets accelerated language acquisition
              </span>
            </p>
          </div>
          {/* CTA BUTTONS */}
          <div className="flex flex-col sm:mt-4 lg:mt-0 lg:flex-row justify-center items-center gap-4">
            <div className="">
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-white/90 p-6 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                <Link href="/explore" aria-label="Get started for free">
                  Get Started for free
                </Link>
              </Button>
            </div>

            <Link href="/create-story" aria-label="Create a new story">
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 hover:bg-white/10 text-white bg-transparent p-6 text-lg font-semibold rounded-full transition-all duration-300 hover:border-white/40"
              >
                Create Story
                <Sparkles className="ml-2 w-5 h-5" aria-hidden="true" />
              </Button>
            </Link>

          </div>
        </div>
        {/* Dashboard Preview */}
        <div className="w-full max-w-6xl mt-20 relative">
          {/* Glow effect behind the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-purple-500/20 blur-3xl scale-110"></div>

          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
            {/* Top bar with fake window controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-white/60 text-sm font-medium">
                Story Creation Dashboard
              </div>
              <div className="w-16"></div>
            </div>

            {/* Main dashboard content */}
            <div className="relative">
              <Image
                src={heroDashboardImage}
                width={1200}
                height={600}
                alt="Story creation dashboard preview"
                className="w-full h-auto"
                priority={true}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                placeholder="blur"
              />

              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1000ms' }}></div>
      <div className="absolute top-1/2 left-[16.667%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
    </section>
  );
}
