import { cn, getRoleBadgeColor } from "@/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "role" | "success" | "warning" | "danger" | "default";
  className?: string;
}

export default function Badge({ label, variant = "default", className }: BadgeProps) {
  const variants = {
    role: getRoleBadgeColor(label),
    success: "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    warning: "border border-amber-400/25 bg-amber-400/10 text-amber-300",
    danger: "border border-rose-400/25 bg-rose-400/10 text-rose-300",
    default: "border border-slate-700/70 bg-slate-900/65 text-slate-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
