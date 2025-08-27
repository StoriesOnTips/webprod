"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts"

interface LanguageStreaksChartProps {
  data: Array<{
    language: string
    weeklyStreak: number
    totalStories: number
    currentWeekStories: number
  }>
}

interface CustomTooltipProps extends TooltipProps<any, any> {
  active?: boolean;
  payload?: Array<{
    payload: {
      language: string;
      weeklyStreak: number;
      totalStories: number;
      currentWeekStories: number;
    };
  }>;
  label?: string;
}

export default function LanguageStreaksChart({ data }: LanguageStreaksChartProps) {
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-sm">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Weekly Streak: <span className="font-medium text-orange-500">{d.weeklyStreak} weeks</span>
            </p>
            <p>
              Total Stories: <span className="font-semibold text-foreground">{d.totalStories}</span>
            </p>
            <p>
              This Week: <span className="font-semibold text-foreground">{d.currentWeekStories}/2</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="language"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={{ stroke: "hsl(var(--border))" }}
          label={{
            value: "Weeks",
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle", fill: "hsl(var(--muted-foreground))" },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="weeklyStreak" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Weekly Streak" />
      </BarChart>
    </ResponsiveContainer>
  )
}
