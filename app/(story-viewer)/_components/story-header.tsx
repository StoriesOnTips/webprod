// app/(story-viewer)/_components/story-header.tsx
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/theme-toggle";
import { BookOpen, Share2 } from "lucide-react";

export default function StoryHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Menu trigger and title */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
        </div>

        {/* Right side - Actions and theme toggle */}
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
