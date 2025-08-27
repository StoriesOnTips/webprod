"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface StoriesByLanguageChartProps {
  data: {
    month: string;
    language: string;
    count: number;
  }[];
}

export default function StoriesByLanguageChart({
  data,
}: StoriesByLanguageChartProps) {
  // Extract unique months and languages
  const months = Array.from(new Set(data.map((item) => item.month)));
  const languages = Array.from(new Set(data.map((item) => item.language)));

  // Transform to format: { month: "Jan 2025", English: 10, Hindi: 5, ... }
  const chartData = months.map((month) => {
    const entry: Record<string, string | number> = { month };
    languages.forEach((lang) => {
      const found = data.find(
        (item) => item.month === month && item.language === lang
      );
      entry[lang] = found ? found.count : 0;
    });
    return entry;
  });

  // Custom Tooltip with theme styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-muted-foreground">
              {p.name}:{" "}
              <span className="font-semibold text-foreground">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 10, fontSize: 14 }} />
        {languages.map((lang, index) => (
          <Bar
            key={lang}
            dataKey={lang}
            fill={COLORS[index % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
