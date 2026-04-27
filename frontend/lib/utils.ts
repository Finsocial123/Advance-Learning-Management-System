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
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "teacher":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "student":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { data?: { detail?: string } };
    };
    return axiosError.response?.data?.detail || "Something went wrong";
  }
  return "Something went wrong";
}