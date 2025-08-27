"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Heart,
  BookMarked,
  Headphones,
  BarChart3,
  Settings,
  Share2,
  Home,
  ChevronRight,
} from "lucide-react";

// Navigation items for story dashboard
const navigationItems = [
  {
    id: "story",
    title: "Story Reader",
    href: "/view-story/[id]",
    icon: BookOpen,
  },
  {
    id: "moral",
    title: "Story Moral",
    href: "/view-story/[id]/moral",
    icon: Heart,
  },
  {
    id: "vocabulary",
    title: "Vocabulary",
    href: "/view-story/[id]/vocabulary",
    icon: BookMarked,
  },
  {
    id: "audio",
    title: "Audio Controls",
    href: "/view-story/[id]/audio",
    icon: Headphones,
  },
  {
    id: "progress",
    title: "Progress",
    href: "/view-story/[id]/progress",
    icon: BarChart3,
  },
];

export default function SidebarNav() {
  const params = useParams();
  const pathname = usePathname();
  const storyId = params?.id as string;

  // Generate href with actual story ID
  const getHref = (template: string) => {
    return template.replace("[id]", storyId);
  };

  // Check if current path matches navigation item
  const isActive = (href: string) => {
    const actualHref = getHref(href);
    if (
      actualHref === `/view-story/${storyId}` &&
      pathname === `/view-story/${storyId}`
    ) {
      return true;
    }
    return pathname === actualHref;
  };

  return (
    <Sidebar className="border-r bg-sidebar">
      {/* Sidebar Header */}
      <SidebarHeader className="border-b bg-muted/10">
        <div className="flex items-center gap-2 px-4 py-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Story Dashboard</span>
            <span className="text-xs text-muted-foreground">
              Interactive Reading
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Content */}
      {/* Sidebar Content */}
      <SidebarContent className="py-4 px-4">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <SidebarMenuItem key={item.id} className="flex-1">
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className={`w-full my-1 p-1 transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-medium py-4"
                      : "hover:bg-muted/50 hover:py-4"
                  }`}
                >
                  <Link
                    href={getHref(item.href)}
                    className="flex items-center gap-3"
                  >
                    <item.icon
                      className={`h-4 w-4 ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <ChevronRight
                      className={`h-3 w-3 ml-auto ${
                        active ? "text-primary" : "opacity-50"
                      }`}
                    />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t bg-muted/10">
        <div className="p-2 space-y-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Link href="/create-story">
              <BookOpen className="h-4 w-4 mr-2" />
              Create Story
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
