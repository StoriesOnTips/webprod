import { ModeToggle } from '@/components/theme-toggle';
import React from 'react';
import Link from 'next/link'
import {Button} from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle positioned in top right */}
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <div className="absolute top-4 left-4 z-10">
        <Button asChild variant="outline" className="flex justify-center items-center">
          <Link href="/">
            <ArrowLeft className="size-4"/>
            Home
          </Link>
        </Button>
      </div>
      
      {/* Main Content */}
      <main className="flex min-h-screen items-center justify-center p-6 md:p-10 mx-auto">
        <div className="w-full max-w-sm md:max-w-3xl">
          {children}
        </div>
      </main>
    </div>
  );
}