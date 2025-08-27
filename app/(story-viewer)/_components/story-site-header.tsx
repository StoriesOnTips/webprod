// app/(story-viewer)/_components/story-site-header.tsx
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ModeToggle } from "@/components/theme-toggle";
import { Share2, Settings, User } from "lucide-react";
import StoryHeaderInfo from "./story-header-info";

export default function StorySiteHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background">
      <div className="flex items-center gap-2 px-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Story Reader</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Center - Story Info */}
      <div className="flex flex-1 items-center justify-center">
        <StoryHeaderInfo />
      </div>

      {/* Right Actions */}
      <div className="ml-auto flex items-center gap-2 px-3">
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="size-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="size-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>

        <Separator orientation="vertical" className="h-4" />

        <ModeToggle />

        <Button variant="ghost" size="sm" className="gap-2">
          <User className="size-4" />
          <span className="hidden sm:inline">Profile</span>
        </Button>
      </div>
    </header>
  );
}
