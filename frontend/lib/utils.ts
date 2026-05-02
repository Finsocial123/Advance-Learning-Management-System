export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "admin":
      return "border border-rose-400/25 bg-rose-500/10 text-rose-300";
    case "teacher":
      return "border border-sky-400/25 bg-sky-500/10 text-sky-300";
    case "student":
      return "border border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
    default:
      return "border border-zinc-400/20 bg-zinc-500/10 text-zinc-300";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { data?: { detail?: string | { msg?: string }[] } };
    };

    const detail = axiosError.response?.data?.detail;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).filter(Boolean).join(", ") || "Validation failed";
    }
  }

  return "Something went wrong";
}