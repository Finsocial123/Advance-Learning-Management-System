import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={cn(
        "rounded-full border-white/10 border-t-violet-500 animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col gap-4 items-center justify-center bg-[#050507]">
      <Spinner size="lg" />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600 animate-pulse">
        Loading LearnHub
      </p>
    </div>
  );
}