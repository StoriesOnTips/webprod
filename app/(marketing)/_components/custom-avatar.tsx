"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboardIcon,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react"; // Adjust import path as needed
import { SignOutButtonComponent } from "@/app/(auth)/_components/sign-out-button";

/**
 * Custom Avatar Dropdown Component - Use inside <SignedIn> tag
 */
const CustomAvatarDropdown = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  // Get user initials for fallback
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(
        0
      )}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="flex items-center gap-3">
      {/* Custom Avatar Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-auto rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-3 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={user?.imageUrl}
                  alt={user?.fullName || "User avatar"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <ChevronDown
                className={`h-3 w-3 text-white/70 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 bg-card/95 backdrop-blur-sm border-border/50"
          align="end"
          sideOffset={8}
        >
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-3 border-b border-border/50">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.imageUrl}
                alt={user?.fullName || "User avatar"}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {user?.fullName || user?.username || "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
              >
                <LayoutDashboardIcon className="h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/user-profile"
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
              >
                <User className="h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            {/* Sign Out */}
            <DropdownMenuItem asChild>
              <SignOutButtonComponent />
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CustomAvatarDropdown;
