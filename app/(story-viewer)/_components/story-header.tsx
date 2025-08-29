import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/theme-toggle";


export default function StoryHeader() {
  return (
    <header className="border-b bg-background/95 sticky top-0 z-40">
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
