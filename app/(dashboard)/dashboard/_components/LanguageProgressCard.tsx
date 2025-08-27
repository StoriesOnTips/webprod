import { Flame } from "lucide-react"

interface LanguageProgressCardProps {
  language: string
  data: {
    totalStories: number
    currentWeekStories: number
    weeklyStreak: number
    lastStoryDate: string
  }
}

export default function LanguageProgressCard({ language, data }: LanguageProgressCardProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 8) return "text-red-500"
    if (streak >= 4) return "text-orange-500"
    if (streak >= 1) return "text-amber-500"
    return "text-muted-foreground"
  }

  const getProgressColor = (currentWeek: number) => {
    if (currentWeek >= 2) return "text-emerald-600"
    if (currentWeek === 1) return "text-amber-600"
    return "text-muted-foreground"
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors bg-card">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground">{language}</h4>
        <div className={`flex items-center ${getStreakColor(data.weeklyStreak)}`}>
          <Flame className="w-4 h-4 mr-1" />
          <span className="font-bold">{data.weeklyStreak}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Total Stories:</span>
          <span className="font-medium text-foreground">{data.totalStories}</span>
        </div>
        <div className="flex justify-between">
          <span>This Week:</span>
          <span className={`font-medium ${getProgressColor(data.currentWeekStories)}`}>
            {data.currentWeekStories}/2
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last Story:</span>
          <span className="font-medium text-foreground">
            {(() => {
              const date = new Date(data.lastStoryDate);
              return !isNaN(date.getTime()) ? date.toLocaleDateString() : '—';
            })()}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex space-x-1 mb-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded ${i < data.currentWeekStories ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {data.currentWeekStories >= 2 ? (
          <div className="text-emerald-600 text-xs font-medium">✓ Weekly goal achieved!</div>
        ) : data.currentWeekStories === 1 ? (
          <div className="text-amber-600 text-xs font-medium">📖 1 more story to maintain streak</div>
        ) : (
          <div className="text-muted-foreground text-xs font-medium">📚 Create 2 stories this week</div>
        )}
      </div>
    </div>
  )
}
