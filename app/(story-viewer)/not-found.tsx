// app/view-story/[id]/not-found.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StoryNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-10 w-10 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Story Not Found</h1>
            <p className="text-slate-400">
              The story you're looking for doesn't exist or may have been removed.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/create-story">
                <BookOpen className="mr-2 h-4 w-4" />
                Create New Story
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full">
              <Link href="/stories">
                <Search className="mr-2 h-4 w-4" />
                Browse All Stories
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-500">
              Need help? <Link href="/support" className="text-purple-400 hover:text-purple-300">Contact support</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}