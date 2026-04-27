"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen, UserCircle } from "lucide-react";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name) e.name = "Name is required";
    if (!email) e.email = "Email is required";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.register(name, email, password);
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-full h-full bg-violet-600/5 blur-[120px] -z-10" />
      
      <div className="w-full max-w-120 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-4xl bg-white shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-6">
            <UserCircle size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Account</h1>
          <p className="text-zinc-500 font-medium mt-2">
            Join the global community of learners.
          </p>
        </div>

        <div className="glass-card rounded-[2.5rem] p-10 border-white/5 shadow-2xl">
          {/* Role Selector */}
          <div className="flex p-1 bg-black/40 rounded-2xl mb-8 border border-white/5">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                role === "student" ? "bg-violet-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                role === "teacher" ? "bg-violet-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Instructor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              className="bg-black/20"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
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

            <Button type="submit" loading={loading} fullWidth size="lg" className="h-12 mt-4 text-sm uppercase tracking-widest font-bold">
              Get Started
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-zinc-500 font-medium">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-violet-400 hover:text-violet-300 font-bold transition-all ml-1 underline underline-offset-4 decoration-violet-500/30 hover:decoration-violet-500"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}