"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, BookOpen, Eye, EyeOff, KeyRound, LockKeyhole, Mail, PencilLine, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

type LoginMode = "password" | "otp";
type OtpStep = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [mode, setMode] = useState<LoginMode>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string }>({});

  const normalizedEmail = email.trim().toLowerCase();

  const completeLogin = async (accessToken: string) => {
    localStorage.setItem("token", accessToken);
    const userProfile = await userService.getMe();
    setAuth(userProfile, accessToken);
    toast.success(`Welcome back, ${userProfile.name}!`);
    router.push(userProfile.role === "admin" ? "/admin" : "/dashboard");
  };

  const validatePasswordLogin = () => {
    const nextErrors: typeof errors = {};
    if (!normalizedEmail) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateEmail = () => {
    const nextErrors: typeof errors = {};
    if (!normalizedEmail) nextErrors.email = "Email is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateOtp = () => {
    const nextErrors: typeof errors = {};
    if (!otp.trim()) nextErrors.otp = "OTP is required";
    else if (otp.trim().length !== 6) nextErrors.otp = "Enter 6 digit OTP";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const showDevOtp = (devOtp?: string | null) => {
    if (devOtp) toast(`Development OTP: ${devOtp}`, { duration: 8000 });
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!validatePasswordLogin()) return;

    setLoading(true);
    try {
      const tokenData = await authService.login(normalizedEmail, password);
      await completeLogin(tokenData.access_token);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const response = await authService.sendLoginOtp(normalizedEmail);
      toast.success(response.message || "OTP sent to your email");
      showDevOtp(response.dev_otp);
      setOtpStep("otp");
      setOtp("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setLoading(true);
    try {
      const tokenData = await authService.verifyLoginOtp(normalizedEmail, otp.trim());
      await completeLogin(tokenData.access_token);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setErrors({});
    setOtp("");
    setOtpStep("email");
  };

  return (
    <div className="auth-grid-bg -mx-4 -my-5 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:-mx-6 lg:-mx-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/55 shadow-[0_30px_110px_-70px_rgba(99,102,241,0.85)] backdrop-blur-xl lg:grid-cols-[1fr_0.92fr]">
        <section className="hidden min-h-[34rem] flex-col justify-between border-r border-slate-800 bg-linear-to-br from-indigo-500/14 via-slate-950/50 to-sky-500/8 p-8 lg:flex">
          <div>
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-[0_18px_44px_-24px_rgba(99,102,241,0.95)]">
              <BookOpen size={24} />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Sparkles size={13} /> Production style authentication
            </span>
            <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
              Sign in with password, OTP, or Google.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
              Password login stays as the main flow. OTP login is available as a backup when users forget their password or need quick access.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ["Password", "Main"],
              ["OTP", "Backup"],
              ["Google", "Enabled"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 sm:p-8">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-400">Use password login, Google login, or OTP login.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <GoogleLoginButton />
            </div>
            

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-600">or continue with email</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 p-1">
              <button
                type="button"
                onClick={() => switchMode("password")}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  mode === "password" ? "bg-indigo-500 text-white" : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("otp")}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  mode === "otp" ? "bg-indigo-500 text-white" : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                OTP Login
              </button>
            </div>

            {mode === "password" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-[2.45rem] z-10 text-slate-500" />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>

                <div className="relative">
                  <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-[2.45rem] z-10 text-slate-500" />
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-[2.35rem] text-slate-500 transition-colors hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                <div className="flex items-center justify-end">
                  <Link href="/forgot-password" className="text-sm font-semibold text-indigo-300 underline decoration-indigo-500/30 underline-offset-4 hover:text-indigo-200">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                  Login with password <ArrowRight size={18} />
                </Button>
              </form>
            ) : otpStep === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-[2.45rem] z-10 text-slate-500" />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                  Send login OTP <ArrowRight size={18} />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">OTP sent to</p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-200">{normalizedEmail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep("email");
                        setOtp("");
                        setErrors({});
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/10 hover:text-indigo-200"
                    >
                      <PencilLine size={13} /> Edit
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-[2.45rem] z-10 text-slate-500" />
                  <Input
                    label="Enter OTP"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    error={errors.otp}
                    className="pl-10 tracking-[0.24em]"
                    autoComplete="one-time-code"
                  />
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                  Verify & login <ShieldCheck size={18} />
                </Button>

                <Button type="button" variant="ghost" fullWidth onClick={() => handleSendOtp()} disabled={loading}>
                  <RotateCcw size={16} /> Resend OTP
                </Button>
              </form>
            )}

            <p className="mt-7 text-center text-sm text-slate-500">
              Do not have an account?{" "}
              <Link href="/register" className="font-semibold text-indigo-300 underline decoration-indigo-500/30 underline-offset-4 hover:text-indigo-200">
                Create one
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
