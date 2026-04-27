import { cn } from "@/lib/utils";
import Spinner from "./Spinner";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
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
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden relative";

  const variants = {
    primary:
      "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.15)] rounded-full",
    secondary:
      "bg-white/5 hover:bg-white/10 text-zinc-100 border border-white/10 rounded-full backdrop-blur-sm",
    danger:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-full",
    ghost: "hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg",
    outline:
      "border border-white/10 bg-transparent hover:border-white/20 text-zinc-300 hover:text-white rounded-full",
  };

  const sizes = {
    sm: "text-[11px] px-4 py-1.5 uppercase tracking-wider",
    md: "text-sm px-6 py-2.5",
    lg: "text-base px-8 py-3.5",
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
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
          <Spinner size="sm" />
        </div>
      ) : null}
      <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {children}
      </span>
    </button>
  );
}