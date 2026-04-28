import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "violet" | "blue" | "green" | "orange";
  subtitle?: string;
}

export default function StatCard({ title, value, icon: Icon, color = "violet", subtitle }: StatCardProps) {
  const colors = {
    violet: "from-violet-500/18 to-indigo-500/8 text-violet-200 border-violet-400/20",
    blue: "from-sky-500/18 to-indigo-500/8 text-sky-200 border-sky-400/20",
    green: "from-emerald-500/18 to-teal-500/8 text-emerald-200 border-emerald-400/20",
    orange: "from-amber-500/18 to-orange-500/8 text-amber-200 border-amber-400/20",
  };

  return (
    <div className="surface-card card-hover rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-linear-to-br", colors[color])}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
