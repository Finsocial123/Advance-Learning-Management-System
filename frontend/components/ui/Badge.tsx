import { cn, getRoleBadgeColor } from "@/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "role" | "success" | "warning" | "danger" | "default";
  className?: string;
}

export default function Badge({
  label,
  variant = "default",
  className,
}: BadgeProps) {
  const variants = {
    role: getRoleBadgeColor(label),
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    default: "bg-white/5 text-zinc-400 border border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  );
}