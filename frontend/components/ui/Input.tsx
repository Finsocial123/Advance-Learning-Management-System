import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const inputRef = useRef<HTMLInputElement>(null);

    // Forward click to the actual input
    const handleWrapperClick = () => {
      inputRef.current?.showPicker?.();
    };

    return (
      <div className="flex flex-col gap-2" onClick={handleWrapperClick}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">
            {label}
          </label>
        )}
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={inputId}
          className={cn(
            "w-full bg-[#0c0c0e] border border-white/5 rounded-xl px-4 py-3",
            "text-zinc-100 placeholder-zinc-600 text-sm",
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
          <p className="text-[11px] text-rose-400 px-1 font-bold italic">{error}</p>
        )}
      </div>
    );
  }
);   
Input.displayName = "Input";
export default Input;