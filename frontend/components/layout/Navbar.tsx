"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, LogOut, User, Menu, X, GraduationCap, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import Badge from "@/components/ui/Badge";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navLinks = [
    { href: "/courses", label: "Courses", icon: BookOpen, always: true },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
    { href: "/teacher/courses", label: "My Courses", icon: GraduationCap, roles: ["teacher", "admin"] },
    { href: "/admin/users", label: "Users", icon: Shield, roles: ["admin"] },
  ];

  const visibleLinks = navLinks.filter((link) => {
    if (link.always) return true;
    if (link.auth && !isAuthenticated) return false;
    if (link.roles && (!user || !link.roles.includes(user.role))) return false;
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050507]/80 backdrop-blur-xl">
      <div className="max-w-360 mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-violet-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-white font-bold tracking-tight text-xl">LearnHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <Link href="/profile" className="flex items-center gap-3 group">
                  <div className="text-right hidden xl:block">
                    <p className="text-xs font-semibold text-white leading-none mb-1">{user.name}</p>
                    <p className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">{user.role}</p>
                  </div>
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-full border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-violet-400">
                      {getInitials(user.name)}
                    </div>
                  )}
                </Link>
                <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-5 py-2 text-sm text-zinc-300 hover:text-white">Login</Link>
                <Link href="/register" className="px-5 py-2 text-sm bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">Register</Link>
              </div>
            )}
          </div>

          <button className="md:hidden p-2 text-zinc-400" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full glass-card border-b border-white/10 px-6 py-8 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
          {visibleLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-lg font-semibold text-zinc-300 flex items-center gap-4">
              <link.icon size={20} /> {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
              <Link href="/login" className="text-center py-3 rounded-xl border border-white/10 text-white">Login</Link>
              <Link href="/register" className="text-center py-3 rounded-xl bg-white text-black font-bold">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}