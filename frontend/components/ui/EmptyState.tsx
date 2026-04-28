import { ReactNode } from "react";
import { LucideIcon, Inbox } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  return (
    <div className="surface-card flex min-h-[18rem] flex-col items-center justify-center rounded-2xl p-8 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-900/70 text-slate-400">
        <Icon size={28} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mb-6 max-w-md text-sm leading-6 text-slate-400">{description}</p>}
      {action || (actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null)}
    </div>
  );
}
