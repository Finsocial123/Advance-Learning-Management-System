"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/utils";
import Button from "@/components/ui/Button";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonConfig = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  type?: "standard" | "icon";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: string | number;
  logo_alignment?: "left" | "center";
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
        };
      };
    };
  }
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function GoogleLoginButton() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const handleGoogleLogin = useCallback(async (credential?: string) => {
    if (!credential) {
      toast.error("Google login failed. Please try again.");
      return;
    }

    const loadingToast = toast.loading("Signing in with Google...");
    try {
      const tokenData = await authService.google(credential);
      localStorage.setItem("token", tokenData.access_token);
      const userProfile = await userService.getMe();
      setAuth(userProfile, tokenData.access_token);
      toast.success(`Welcome, ${userProfile.name}!`, { id: loadingToast });
      router.push(userProfile.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error), { id: loadingToast });
    }
  }, [router, setAuth]);

  useEffect(() => {
    if (!googleClientId) return;

    const existingScript = document.getElementById("google-identity-script");
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => toast.error("Google script could not load");
    document.head.appendChild(script);
  }, [googleClientId]);

  useEffect(() => {
    if (!googleClientId || !scriptReady || !buttonRef.current || !window.google?.accounts?.id) return;

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => handleGoogleLogin(response.credential),
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "continue_with",
      width: 360,
      logo_alignment: "left",
    });
  }, [googleClientId, scriptReady, handleGoogleLogin]);

  if (!googleClientId) {
    return (
      <Button
        type="button"
        variant="outline"
        fullWidth
        size="lg"
        onClick={() => toast.error("Add NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local")}
      >
        <GoogleIcon /> Continue with Google
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="google-login-shell rounded-xl border border-slate-700/80 bg-slate-950/40 p-2">
        <div ref={buttonRef} className="min-h-10 w-full" />
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck size={14} className="text-emerald-300" /> Secured with Google OAuth
      </div>
    </div>
  );
}
