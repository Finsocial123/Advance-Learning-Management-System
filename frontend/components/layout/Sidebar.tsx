"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, Shield, Plus, ListVideo, User } from "lucide-react";
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["student", "teacher", "admin"], exact: true },
  { label: "Profile", href: "/profile", icon: User, roles: ["student", "teacher", "admin"] },
  { label: "Browse Courses", href: "/courses", icon: BookOpen, roles: ["student", "teacher", "admin"] },
  { label: "My Courses", href: "/teacher/courses", icon: ListVideo, roles: ["teacher", "admin"] },
  { label: "Create Course", href: "/teacher/courses/create", icon: Plus, roles: ["teacher", "admin"] },
  { label: "Admin Panel", href: "/admin", icon: Shield, roles: ["admin"], exact: true },
  { label: "Manage Users", href: "/admin/users", icon: Users, roles: ["admin"] },
];

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  const visible = navItems.filter((item) => item.roles.includes(user.role));

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const renderGroup = (label: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <h4 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-4">{label}</h4>
        <div className="space-y-1">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  active 
                    ? "bg-violet-600/10 text-violet-400 border border-violet-500/20" 
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                )}
              >
                <item.icon size={18} className={active ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className={cn("flex flex-col gap-3 p-4 w-64 border-r border-white/5 py-10 px-4 bg-transparent", className)}>
      {renderGroup("Main Menu", visible.filter(i => ["/dashboard", "/profile", "/courses"].includes(i.href)))}
      {renderGroup("Instructor", visible.filter(i => i.href.startsWith("/teacher")))}
      {renderGroup("System", visible.filter(i => i.href.startsWith("/admin")))}
    </aside>
  );
}