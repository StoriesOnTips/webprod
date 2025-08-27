// app/(story-viewer)/layout.tsx
import { Suspense } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import SidebarNav from "./_components/sidebar-nav";
import StoryHeader from "./_components/story-header";

interface StoryViewerLayoutProps {
  children: React.ReactNode;
}

export default function StoryViewerLayout({
  children,
}: StoryViewerLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar Navigation */}
        <SidebarNav />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <Suspense fallback={<div className="h-16 border-b bg-background" />}>
            <StoryHeader />
          </Suspense>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
