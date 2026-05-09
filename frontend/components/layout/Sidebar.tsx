"use client";

import type { ElementType } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  ListVideo,
  Plus,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
  roles: string[];
  exact?: boolean;
}

interface SidebarProps {
  menu: boolean;
  onClose?: () => void;
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
    href: "/my-courses",
    icon: BookOpen,
    roles: ["student"],
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
    label: "Manage Users",
    href: "/admin/users",
    icon: Users,
    roles: ["admin"],
  },
];

export default function Sidebar({ menu, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  const visible = navItems.filter((item) => item.roles.includes(user.role));

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const navigate = (href: string) => {
    router.push(href);
    onClose?.();
  };

  const renderGroup = (label: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </h4>

        <div className="space-y-1">
          {items.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigate(item.href)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "border-indigo-400/25 bg-indigo-500/12 text-white"
                    : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-100"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-indigo-500/18 text-indigo-200"
                      : "bg-slate-950/45 text-slate-500 group-hover:text-slate-300"
                  )}
                >
                  <Icon size={16} />
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
    <>
      {menu && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-x-0 top-16 z-50 h-[calc(100vh-4rem)] bg-black/40 backdrop-blur-[2px]"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-16 z-[60] h-[calc(100vh-4rem)] w-72 border-r border-slate-800/80 bg-slate-900/98 p-3 shadow-2xl transition-transform duration-300",
          menu ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full space-y-6 overflow-y-auto pr-1 pt-2">
          {renderGroup(
            "Main",
            visible.filter((item) =>
              ["/dashboard", "/profile", "/courses", "/my-courses"].includes(
                item.href
              )
            )
          )}

          {renderGroup(
            "Instructor",
            visible.filter((item) => item.href.startsWith("/teacher"))
          )}

          {renderGroup(
            "System",
            visible.filter((item) => item.href.startsWith("/admin"))
          )}
        </div>
      </aside>
    </>
  );
}