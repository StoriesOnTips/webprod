"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { LayoutDashboardIcon, Menu, X, LogOut } from "lucide-react";
import { SignOutButtonComponent } from "@/app/(auth)/_components/sign-out-button";
import CustomAvatarDropdown from "./custom-avatar";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "Create Story", href: "/create-story" },
  { name: "Library", href: "/explore" },
  { name: "Buy Coins", href: "/buy-coins" },
];

export default function Header() {
  const [isClient, setIsClient] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <header
      className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent backdrop-blur-sm"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-white font-bold text-xl flex items-center space-x-2"
          >
            <span>StoriesOnTips</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white/70 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <SignedIn>
              <CustomAvatarDropdown />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/40 rounded-full px-4 py-2 text-sm font-medium"
                >
                  Login
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-2 text-sm font-medium transition-all duration-200">
                  Get Started
                </Button>
              </Link>
            </SignedOut>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-3">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white p-2"
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-black/95 backdrop-blur-xl border-l border-white/10 px-6 py-8"
              >
                <DialogTitle className="sr-only">
                  Mobile Navigation Menu
                </DialogTitle>
                <nav className="flex flex-col space-y-6 mt-8">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-white text-lg font-medium hover:text-blue-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <SignedIn>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full w-full font-medium">
                          <LayoutDashboardIcon className="w-4 h-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <SignOutButtonComponent />
                    </SignedIn>
                    <SignedOut>
                      <Link
                        href="/sign-in"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 rounded-full w-full font-medium"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button className="bg-white mt-4 text-black hover:bg-white/90 rounded-full w-full font-medium">
                          Get Started
                        </Button>
                      </Link>
                    </SignedOut>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
