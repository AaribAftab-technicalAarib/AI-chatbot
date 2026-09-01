"use client";

import { cn } from "@/lib/cn";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "mt-3 flex items-start gap-2 rounded-lg border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700",
        "dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
      )}
    >
      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
