"use client";

import type React from "react";
import { Separator } from "@/components/ui/separator"
import {
  ChevronDown,
  LayoutDashboard,
  Library,
  Coins,
  Wand,
  Plus,
  User,
  CreditCard,
  BookAIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButtonComponent } from "@/app/(auth)/_components/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  isActive?: boolean;
  items?: { title: string; url: string }[];
};

const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Library",
      url: "/explore",
      icon: Library,
    },
    {
      title: "My Stories",
      url: "/my-stories",
      icon: BookAIcon,
    },
  ],
};

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  const isActivePath = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="offcanvas" className="bg-sidebar-background text-sidebar-foreground">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/"
                aria-label="Go to StoriesOnTips homepage"
                className="flex items-center gap-2"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {/* You can replace with your own logo/icon */}
                  <span className="font-bold text-lg">S</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm md:text-base tracking-wide">
                    StoriesOnTips
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Your Dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator className="" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Create</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/create-story">
                  <Plus />
                  <span>New Story</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActivePath(item.url)}
                  asChild
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.items && <ChevronDown className="ml-auto" />}
                  </Link>
                </SidebarMenuButton>
                {item.items && (
                  <SidebarMenuSub>
                    {item.items.map((sub) => (
                      <SidebarMenuSubItem key={sub.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActivePath(sub.url)}
                        >
                          <Link href={sub.url}>
                            <span>{sub.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/buy-coins">
                  <Coins />
                  <span>Buy Coins</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SignedIn>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center size-8 rounded-full overflow-hidden ring-2 ring-sidebar-border/50">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={user?.imageUrl}
                          alt={user?.fullName || "User avatar"}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-semibold">
                          {user?.firstName?.charAt(0) ||
                            user?.username?.charAt(0) ||
                            "U"}
                          {user?.lastName?.charAt(0) || ""}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="truncate font-semibold text-sidebar-foreground">
                        {user?.fullName || user?.firstName || "User"}
                      </span>
                      <span className="truncate text-xs text-sidebar-foreground/60">
                        {user?.primaryEmailAddress?.emailAddress ||
                          "user@example.com"}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto size-4 text-sidebar-foreground/60 transition-transform duration-200" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg shadow-lg border bg-popover/95 backdrop-blur-sm"
                  side="top"
                  align="end"
                  sideOffset={8}
                >
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 p-3 border-b border-border/50">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName || "User avatar"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-semibold">
                        {user?.firstName?.charAt(0) ||
                          user?.username?.charAt(0) ||
                          "U"}
                        {user?.lastName?.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.fullName || user?.firstName || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.primaryEmailAddress?.emailAddress ||
                          "user@example.com"}
                      </p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/user-profile"
                        className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-sm transition-colors"
                      >
                        <User className="size-4 text-muted-foreground" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/buy-coins"
                        className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-sm transition-colors"
                      >
                        <CreditCard className="size-4 text-muted-foreground" />
                        <span>Buy Coins</span>
                      </Link>
                    </DropdownMenuItem>


                    <DropdownMenuSeparator className="bg-border/50 my-1" />

                    <DropdownMenuItem asChild className="p-0">
                      <SignOutButtonComponent />
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </SignedIn>

            <SignedOut>
              <div className="flex flex-col gap-2 p-3">
                <Link href="/sign-in">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent hover:bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground transition-colors"
                    size="sm"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                    size="sm"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </SignedOut>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
