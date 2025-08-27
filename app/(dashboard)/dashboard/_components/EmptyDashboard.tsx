import { BookOpen, Sparkles } from "lucide-react"
import Link from "next/link"

interface EmptyDashboardProps {
  userName?: string
}

export default function EmptyDashboard({ userName }: EmptyDashboardProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="bg-card rounded-xl shadow-sm border border-border p-12 max-w-md">
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-foreground">{userName ? `Welcome, ${userName}!` : "Welcome!"}</h2>
          <p className="mb-6 text-muted-foreground">
            You haven&apos;t created any stories yet. Start your language learning journey by creating your first story!
          </p>
        </div>

        <Link
          href="/create-story"
          className="inline-flex items-center rounded-lg px-6 py-3 font-medium text-primary-foreground bg-primary hover:opacity-95 transition-opacity"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Create Your First Story
        </Link>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>Start with 2 stories per week to build your learning streak!</p>
        </div>
      </div>
    </div>
  )
}
