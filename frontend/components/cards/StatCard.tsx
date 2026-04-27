import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: "violet" | "blue" | "green" | "orange";
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "violet",
  subtitle,
}: StatCardProps) {
  const colors = {
    violet: {
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      icon: "text-violet-400",
      glow: "shadow-violet-500/20",
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: "text-blue-400",
      glow: "shadow-blue-500/20",
    },
    green: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: "text-emerald-400",
      glow: "shadow-emerald-500/20",
    },
    orange: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: "text-amber-400",
      glow: "shadow-amber-500/20",
    },
  };

  const c = colors[color];

  return (
    <div
      className={cn(
        "rounded-[2rem] border p-7 flex items-center gap-6",
        "bg-[#0c0c0e] backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02]",
        c.border
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
          c.bg,
          c.glow
        )}
      >
        <Icon size={28} className={c.icon} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">{title}</p>
        <p className="text-3xl font-black text-white tracking-tight leading-none">{value}</p>
        {subtitle && (
          <p className="text-[11px] text-zinc-600 mt-2 font-medium italic">{subtitle}</p>
        )}
      </div>
    </div>
  );
}