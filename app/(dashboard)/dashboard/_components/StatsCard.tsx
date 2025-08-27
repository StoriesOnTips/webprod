import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  color?: "violet" | "indigo" | "purple" | "blue";
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color = "violet",
}: StatsCardProps) {
  const iconClasses = {
    violet: "text-violet-600",
    indigo: "text-indigo-600",
    purple: "text-purple-600",
    blue: "text-blue-600",
  };

  return (
    <div
      className={`rounded-xl border-2 p-6 bg-background text-foreground`}
    >
      {" "}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-70">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-sm opacity-60 mt-1">{subtitle}</p>}
        </div>
        <Icon className={`w-8 h-8 ${iconClasses[color]}`} />
      </div>
    </div>
  );
}
