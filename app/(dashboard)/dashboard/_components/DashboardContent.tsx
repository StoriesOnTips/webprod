import { getDashboardData, type DashboardData, type StoryByLanguage } from "@/lib/actions/dashboard-actions"
import { BookOpen, Globe, Calendar, Flame } from "lucide-react"
import EmptyDashboard from "./EmptyDashboard"
import LanguageStreaksChart from "./LanguageStreaksChart"
import StatsCard from "./StatsCard"
import StoriesByLanguageChart from "./StoriesByLanguageCharts"

interface DashboardContentProps {
  userId: string
}

// Utility function for safe date formatting
function formatDate(value: unknown): string {
  if (!value) return '—';
  
  try {
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      return '—';
    }
    
    return !isNaN(date.getTime()) ? date.toLocaleDateString() : '—';
  } catch {
    return '—';
  }
}

export default async function DashboardContent({ userId }: DashboardContentProps) {
  let dashboardData: DashboardData | null = null;
  
  try {
    dashboardData = await getDashboardData(userId);
  } catch (error) {
    // Log the error for debugging and monitoring
    console.error('Error fetching dashboard data:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Return null to trigger the EmptyDashboard fallback
    dashboardData = null;
  }

  if (!dashboardData) {
    return <EmptyDashboard />
  }

  const {
    motherTongue,
    firstName,
    lastName,
    totalStoriesCreated,
    monthlyStoriesCreated,
    storiesByLanguage,
    languageStreaks,
  } = dashboardData

  const hasNoData = totalStoriesCreated === 0

  if (hasNoData) {
    return <EmptyDashboard userName={`${firstName} ${lastName}`} />
  }

  const streaksData = Object.entries(languageStreaks || {}).map(([language, data]) => ({
    language,
    ...data,
  }))

  const totalActiveStreaks = streaksData.filter((item) => item.weeklyStreak > 0).length

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome back, {firstName}! 👋</h2>
        <p className="text-muted-foreground">
          Your native language: <span className="font-medium text-foreground">{motherTongue}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Stories"
          value={totalStoriesCreated}
          icon={BookOpen}
          subtitle="Stories created"
          color="violet"
        />
        <StatsCard
          title="This Month"
          value={monthlyStoriesCreated}
          icon={Calendar}
          subtitle="Stories this month"
          color="indigo"
        />
        <StatsCard
          title="Active Streaks"
          value={totalActiveStreaks}
          icon={Flame}
          subtitle="Languages with streaks"
          color="purple"
        />
        <StatsCard
          title="Languages"
          value={storiesByLanguage?.length || 0}
          icon={Globe}
          subtitle="Languages learning"
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Stories by Language Chart */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">Stories by Language</h3>
          {storiesByLanguage && storiesByLanguage.length > 0 ? (
            <StoriesByLanguageChart
              data={storiesByLanguage.map((item: StoryByLanguage) => ({
                month: item.month ?? "",
                language: item.language?.trim() || "Unknown",
                count: item.count,
              }))}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <p>No language data available</p>
            </div>
          )}
        </div>

        {/* Language Streaks Chart */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">Weekly Streaks</h3>
          {streaksData.length > 0 ? (
            <LanguageStreaksChart data={streaksData} />
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <p>No streak data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Streaks */}
      {streaksData.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">Language Learning Progress</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {streaksData.map((item) => (
              <div
                key={item.language}
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors bg-card"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{item.language}</h4>
                  <div className="flex items-center text-orange-500">
                    <Flame className="mr-1 h-4 w-4" />
                    <span className="font-bold">{item.weeklyStreak}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total Stories:</span>
                    <span className="font-medium text-foreground">{item.totalStories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week:</span>
                    <span className="font-medium text-foreground">{item.currentWeekStories}/2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Story:</span>
                    <span className="font-medium text-foreground">
                      {formatDate(item.lastStoryDate)}
                    </span>
                  </div>
                </div>
                {item.currentWeekStories >= 2 && (
                  <div className="mt-3 text-emerald-600 text-xs font-medium">✓ Weekly goal achieved!</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}