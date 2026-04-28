import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import Spinner from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "google";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080d]";

  const variants = {
    primary:
      "bg-linear-to-r from-indigo-500 via-violet-500 to-sky-500 text-white shadow-[0_14px_34px_-20px_rgba(99,102,241,0.95)] hover:brightness-110",
    secondary:
      "border border-slate-700/70 bg-slate-900/70 text-slate-100 hover:border-indigo-400/45 hover:bg-slate-800/80",
    danger:
      "border border-rose-400/25 bg-rose-500/12 text-rose-200 hover:border-rose-300/45 hover:bg-rose-500/18",
    ghost:
      "text-slate-400 hover:bg-slate-800/70 hover:text-white",
    outline:
      "border border-slate-700/80 bg-slate-950/30 text-slate-200 hover:border-indigo-400/45 hover:bg-indigo-500/10 hover:text-white",
    google:
      "border border-slate-700/80 bg-white text-slate-950 shadow-[0_14px_34px_-24px_rgba(255,255,255,0.7)] hover:bg-slate-100",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm sm:text-base",
  };

  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit">
          <Spinner size="sm" />
        </span>
      ) : null}
      <span className={cn("inline-flex items-center justify-center gap-2", loading && "opacity-0")}>
        {children}
      </span>
    </button>
  );
}
