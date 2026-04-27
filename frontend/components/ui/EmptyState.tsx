import { LucideIcon } from "lucide-react";
import { BookOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon = BookOpen,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center glass-card rounded-[2.5rem]">
      <div className="w-20 h-20 rounded-3xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-6 shadow-2xl">
        <Icon size={32} className="text-violet-400/60" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed font-medium">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}