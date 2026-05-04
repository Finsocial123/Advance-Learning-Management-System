"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, RotateCcw, ShieldCheck } from "lucide-react";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/utils";
import { PASSWORD_RULE_TEXT, validateEmailAddress, validateStrongPassword } from "@/lib/validators";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type ResetStep = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; otp?: string; password?: string; confirmPassword?: string }>({});

  const normalizedEmail = email.trim().toLowerCase();

  const showDevOtp = (devOtp?: string | null) => {
    if (devOtp) toast(`Development OTP: ${devOtp}`, { duration: 8000 });
  };

  const validateEmail = () => {
    const nextErrors: typeof errors = {};
    const emailError = validateEmailAddress(normalizedEmail);
    if (emailError) nextErrors.email = emailError;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateReset = () => {
    const nextErrors: typeof errors = {};
    if (!otp.trim()) nextErrors.otp = "OTP is required";
    else if (otp.trim().length !== 6) nextErrors.otp = "Enter 6 digit OTP";
    const passwordError = validateStrongPassword(password);
    if (passwordError) nextErrors.password = passwordError;
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your password";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const response = await authService.sendForgotPasswordOtp(normalizedEmail);
      toast.success(response.message || "Password reset OTP sent");
      showDevOtp(response.dev_otp);
      setStep("reset");
      setOtp("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateReset()) return;

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        email: normalizedEmail,
        otp: otp.trim(),
        new_password: password,
      });
      toast.success(response.message || "Password reset successfully");
      setStep("done");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-grid-bg -mx-4 -my-5 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:-mx-6 lg:-mx-8">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950/55 p-5 shadow-[0_30px_110px_-70px_rgba(99,102,241,0.85)] backdrop-blur-xl sm:p-8">
        <Link href="/login" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="mb-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-[0_18px_44px_-24px_rgba(99,102,241,0.95)]">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Reset password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter your email, verify OTP, and create a new password for your LMS account.
          </p>
        </div>

        {step === "email" ? (
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
              Send reset OTP <ArrowRight size={18} />
            </Button>
          </form>
        ) : step === "reset" ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">OTP sent to</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-200">{normalizedEmail}</p>
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

            <div className="relative">
              <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-[2.45rem] z-10 text-slate-500" />
              <Input
                label="New Password"
                type={showPassword ? "text" : "password"}
                placeholder="Create new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                hint={PASSWORD_RULE_TEXT}
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
                placeholder="Repeat new password"
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
              Reset password <ShieldCheck size={18} />
            </Button>

            <Button type="button" variant="ghost" fullWidth onClick={() => handleSendOtp()} disabled={loading}>
              <RotateCcw size={16} /> Resend OTP
            </Button>
          </form>
        ) : (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-center">
            <p className="text-lg font-bold text-white">Password changed successfully</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">You can now login with your new password.</p>
            <Link href="/login" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-indigo-500 via-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110">
              Go to login <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
