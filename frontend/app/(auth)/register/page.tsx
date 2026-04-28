"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, Eye, EyeOff, GraduationCap, KeyRound, LockKeyhole, Mail, PencilLine, RotateCcw, ShieldCheck, UserCircle } from "lucide-react";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import type { Role } from "@/types";

type SignupStep = "details" | "otp";
type SignupRole = Extract<Role, "student" | "teacher">;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<SignupRole>("student");
  const [step, setStep] = useState<SignupStep>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; otp?: string }>({});

  const normalizedEmail = email.trim().toLowerCase();

  const validateDetails = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    else if (name.trim().length < 2) nextErrors.name = "Name must be at least 2 characters";
    if (!normalizedEmail) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your password";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
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

  const handleSendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!validateDetails()) return;

    setLoading(true);
    try {
      const response = await authService.sendSignupOtp(normalizedEmail);
      toast.success(response.message || "OTP sent to your email");
      showDevOtp(response.dev_otp);
      setStep("otp");
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
      const tokenData = await authService.verifySignupOtp({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        otp: otp.trim(),
      });

      localStorage.setItem("token", tokenData.access_token);
      const userProfile = await userService.getMe();
      setAuth(userProfile, tokenData.access_token);

      toast.success(`Account created, ${userProfile.name}!`);
      router.push(userProfile.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEditDetails = () => {
    setStep("details");
    setOtp("");
    setErrors({});
  };

  return (
    <div className="auth-grid-bg -mx-4 -my-5 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:-mx-6 lg:-mx-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/55 shadow-[0_30px_110px_-70px_rgba(99,102,241,0.85)] backdrop-blur-xl lg:grid-cols-[0.92fr_1fr]">
        <section className="p-5 sm:p-8">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-[0_18px_44px_-24px_rgba(99,102,241,0.95)] lg:mx-0">
                <GraduationCap size={24} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Create account</h2>
              <p className="mt-2 text-sm text-slate-400">Create your LMS account, verify email with OTP, or continue with Google.</p>
            </div>

            <GoogleLoginButton />

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-600">or signup with email</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 p-1">
              <button
                type="button"
                onClick={() => setRole("student")}
                disabled={step === "otp"}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  role === "student" ? "bg-indigo-500 text-white" : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("teacher")}
                disabled={step === "otp"}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  role === "teacher" ? "bg-indigo-500 text-white" : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                Instructor
              </button>
            </div>

            {step === "details" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="relative">
                  <UserCircle size={16} className="pointer-events-none absolute left-3.5 top-[2.45rem] z-10 text-slate-500" />
                  <Input
                    label="Full Name"
                    placeholder="Aashish Maurya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    className="pl-10"
                    autoComplete="name"
                  />
                </div>

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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
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

                <div className="relative">
                  <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-[2.45rem] z-10 text-slate-500" />
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-[2.35rem] text-slate-500 transition-colors hover:text-slate-200"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                  Send signup OTP <ArrowRight size={18} />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Verify account for</p>
                      <p className="mt-1 text-sm font-semibold text-slate-200">{name.trim()}</p>
                      <p className="mt-0.5 break-all text-xs text-slate-500">{normalizedEmail}</p>
                      <p className="mt-2 inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold capitalize text-indigo-200">
                        {role}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEditDetails}
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
                  Verify & create account <ShieldCheck size={18} />
                </Button>

                <Button type="button" variant="ghost" fullWidth onClick={() => handleSendOtp()} disabled={loading}>
                  <RotateCcw size={16} /> Resend OTP
                </Button>
              </form>
            )}

            <p className="mt-7 text-center text-sm text-slate-500">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-indigo-300 underline decoration-indigo-500/30 underline-offset-4 hover:text-indigo-200">
                Sign in
              </Link>
            </p>
          </div>
        </section>

        <section className="hidden min-h-[34rem] flex-col justify-between border-l border-slate-800 bg-linear-to-br from-sky-500/10 via-slate-950/50 to-indigo-500/14 p-8 lg:flex">
          <div>
            <span className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
              Verified signup flow
            </span>
            <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
              Create accounts only after email OTP verification.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
              Users create a normal password, verify their email with OTP, and can later login using password, OTP, or Google.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <p className="text-sm font-semibold text-white">Auth workflow</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              <div className="rounded-2xl bg-slate-900/60 p-3">Password signup with OTP email verification</div>
              <div className="rounded-2xl bg-slate-900/60 p-3">Password login as the default login method</div>
              <div className="rounded-2xl bg-slate-900/60 p-3">Google login available on auth screens</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
