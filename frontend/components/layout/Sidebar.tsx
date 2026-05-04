"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  ListVideo,
  Plus,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  exact?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["student", "teacher", "admin"],
    exact: true,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
    roles: ["student", "teacher", "admin"],
  },
  {
    label: "Browse Courses",
    href: "/courses",
    icon: BookOpen,
    roles: ["student", "teacher", "admin"],
  },
  {
    label: "My Courses",
    href: "/teacher/courses",
    icon: ListVideo,
    roles: ["teacher", "admin"],
  },
  {
    label: "Create Course",
    href: "/teacher/courses/create",
    icon: Plus,
    roles: ["teacher", "admin"],
  },
  {
    label: "Admin Panel",
    href: "/admin",
    icon: Shield,
    roles: ["admin"],
    exact: true,
  },
  {
    label: "Manage Users",
    href: "/admin/users",
    icon: Users,
    roles: ["admin"],
  },
];
export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  const visible = navItems.filter((item) => item.roles.includes(user.role));
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const renderGroup = (label: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
          {label}
        </h4>
        <div className="space-y-1">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "border-indigo-400/25 bg-indigo-500/12 text-white"
                    : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-100",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-indigo-500/18 text-indigo-200"
                      : "bg-slate-950/45 text-slate-500 group-hover:text-slate-300",
                  )}
                >
                  <item.icon size={16} />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "surface-card flex w-64 shrink-0 flex-col rounded-2xl p-3",
        className,
      )}
    >
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4">
        <p className="text-xs text-slate-500">Signed in as</p>
        <p className="mt-1 truncate text-sm font-semibold text-white">
          {user.name}
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">
          {user.role}
        </p>
      </div>
      <div className="space-y-6 overflow-y-auto pr-1">
        {renderGroup(
          "Main",
          visible.filter((item) =>
            ["/dashboard", "/profile", "/courses"].includes(item.href),
          ),
        )}
        {renderGroup(
          "Instructor",
          visible.filter((item) => item.href.startsWith("/teacher")),
        )}
        {renderGroup(
          "System",
          visible.filter((item) => item.href.startsWith("/admin")),
        )}
      </div>
    </aside>
  );
}
