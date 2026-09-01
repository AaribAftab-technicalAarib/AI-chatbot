"use client";

import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

export function FormulaInput({ value, onChange, onSubmit, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-3 text-muted">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20l16-16M4 20h6M4 20v-6" />
        </svg>
      </div>
      <textarea
        ref={ref}
        value={value}
        rows={1}
        spellCheck={false}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder ?? "y = sin(x)"}
        className={cn(
          "block w-full resize-none rounded-xl border border-border bg-bg/60 px-11 py-3",
          "font-mono text-base text-fg placeholder:text-muted/70 shadow-sm",
          "focus:border-accent"
        )}
        aria-label="Formula input"
      />
    </div>
  );
}
