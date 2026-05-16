"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import Badge from "@/components/ui/Badge";
import { cn, getInitials } from "@/lib/utils";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setSidebarOpen(false);
    router.replace("/login");
  };

  const navLinks = [
    { href: "/courses", label: "Courses", icon: BookOpen, always: true },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      auth: true,
    },
    {
      href: "/teacher/courses",
      label: "My Courses",
      icon: GraduationCap,
      roles: ["teacher", "admin"],
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Shield,
      roles: ["admin"],
    },
  ];

  const visibleLinks = navLinks.filter((link) => {
    if (link.always) return true;
    if (link.auth && !isAuthenticated) return false;
    if (link.roles && (!user || !link.roles.includes(user.role))) return false;
    return true;
  });

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07080d]/82 backdrop-blur-2xl">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => setSidebarOpen((value) => !value)}
                  className="rounded-md bg-slate-900 p-2 text-white transition-colors hover:bg-slate-800"
                  aria-label="Open sidebar"
                >
                  {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                <Sidebar
                  menu={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                />
              </>
            )}

            <Link href="/" className="group flex shrink-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-violet-500 to-sky-500 shadow-[0_14px_34px_-20px_rgba(99,102,241,0.95)] transition-transform group-hover:scale-105">
                <BookOpen size={20} className="text-white" />
              </div>

              <div className="leading-none">
                <span className="block text-lg font-bold tracking-tight text-white">
                  LearnHub
                </span>

                <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:block">
                  Modern LMS
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950/45 p-1 md:flex">
            {visibleLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
  {isAuthenticated && user ? (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 py-1.5 pl-2 pr-2">
      <NotificationBell />

      <Link href="/profile" className="group flex items-center gap-3">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.name}
                      width={34}
                      height={34}
                      className="h-8.5 w-8.5 rounded-xl border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-xs font-bold text-indigo-200">
                      {getInitials(user.name)}
                    </div>
                  )}

                  <div className="hidden min-w-0 text-left xl:block">
                    <p className="max-w-36 truncate text-xs font-semibold leading-none text-white">
                      {user.name}
                    </p>

                    <Badge
                      label={user.role}
                      variant="role"
                      className="mt-1 py-0.5 text-[9px]"
                    />
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label="Logout"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Open navigation"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 top-16 w-full border-b border-slate-800 bg-[#080910]/96 px-4 py-4 shadow-2xl backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {visibleLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <link.icon size={18} /> {link.label}
                </Link>
              );
            })}
          </div>

          {isAuthenticated && user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 py-3 text-sm font-semibold text-rose-200"
            >
              <LogOut size={17} /> Logout
            </button>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-slate-700 py-3 text-center font-semibold text-white"
              >
                Login
              </Link>

              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-white py-3 text-center font-bold text-slate-950"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}