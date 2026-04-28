import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="px-0.5 text-[12px] font-semibold text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 w-full rounded-xl border border-slate-700/75 bg-slate-950/40 px-3.5 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600",
            "focus:border-indigo-400/70 focus:bg-slate-950/70 focus:ring-4 focus:ring-indigo-500/10",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-400/60 focus:border-rose-400/80 focus:ring-rose-500/10",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="px-0.5 text-xs text-slate-500">{hint}</p>}
        {error && <p className="px-0.5 text-xs font-medium text-rose-300">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
