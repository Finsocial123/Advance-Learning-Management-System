import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 px-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn(
            "w-full bg-[#0c0c0e] border border-white/5 rounded-2xl px-4 py-3",
            "text-zinc-100 placeholder-zinc-600 text-sm resize-none",
            "focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5",
            "transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/5",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-[11px] text-zinc-500 px-1 font-medium">{hint}</p>
        )}
        {error && (
          <p className="text-[11px] text-rose-400 px-1 font-bold italic">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;