import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function ProgressBar({
  value,
  showLabel = true,
  size = "md",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const color =
    clamped === 100
      ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
      : clamped >= 50
      ? "bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
      : "bg-indigo-600";

  const heights = {
    sm: "h-1",
    md: "h-2",
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full bg-white/5 rounded-full overflow-hidden border border-white/5",
          heights[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            color
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Progress</span>
          <p className="text-[11px] font-bold text-violet-400">
            {clamped}%
          </p>
        </div>
      )}
    </div>
  );
}