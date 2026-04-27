"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen } from "lucide-react";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const tokenData = await authService.login(email, password);
      localStorage.setItem("token", tokenData.access_token);

      const userProfile = await userService.getMe();
      setAuth(userProfile, tokenData.access_token);

      toast.success(`Welcome back, ${userProfile.name}!`);

      if (userProfile.role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-violet-600/5 blur-[120px] -z-10" />
      
      <div className="w-full max-w-110 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-4xl bg-violet-600 shadow-[0_0_30px_rgba(124,58,237,0.3)] mb-6">
            <BookOpen size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Access LearnHub</h1>
          <p className="text-zinc-500 font-medium mt-2">
            Continue your journey towards mastery.
          </p>
        </div>

        {/* card */}
        <div className="glass-card rounded-[2.5rem] p-10 border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              className="bg-black/20"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              className="bg-black/20"
            />

            <Button type="submit" loading={loading} fullWidth size="lg" className="h-12 text-sm uppercase tracking-widest font-bold">
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-zinc-500 font-medium">
              Do not have an account?{" "}
              <Link
                href="/register"
                className="text-violet-400 hover:text-violet-300 font-bold transition-all ml-1 underline underline-offset-4 decoration-violet-500/30 hover:decoration-violet-500"
              >
                Join for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}