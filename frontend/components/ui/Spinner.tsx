import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };

  return <div className={cn("animate-spin rounded-full border-slate-700 border-t-indigo-300", sizes[size], className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#07080d]/95 backdrop-blur-xl">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-[0_20px_80px_-40px_rgba(99,102,241,0.9)]">
        <Spinner size="lg" />
      </div>
      <p className="animate-pulse text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
        Loading LearnHub
      </p>
    </div>
  );
}
