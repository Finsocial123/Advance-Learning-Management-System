import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  showLabel,
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const shouldShowText = showLabel === false ? false : showPercentage;
  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || shouldShowText) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          {label && <span className="font-medium text-slate-400">{label}</span>}
          {shouldShowText && (
            <span className="font-semibold text-indigo-200">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn("overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-slate-700/50", heights[size])}>
        <div
          className="h-full rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-sky-400 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
