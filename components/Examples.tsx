"use client";

import { cn } from "@/lib/cn";

export type Example = { label: string; eq: string; x0?: number; x1?: number };

export const EXAMPLES: Example[] = [
  { label: "Sine", eq: "y = sin(x)" },
  { label: "Quadratic", eq: "y = x^2 - 4" },
  { label: "Cubic", eq: "y = x^3 - 3x" },
  { label: "Exponential", eq: "y = exp(x/2)" },
  { label: "Log", eq: "y = ln(x)", x0: 0.01, x1: 10 },
  { label: "Sigmoid", eq: "y = 1 / (1 + exp(-x))" },
  { label: "Damped", eq: "y = sin(x) / x", x0: -20, x1: 20 },
  { label: "Compare", eq: "y = sin(x), y = cos(x)" },
];

export function Examples({
  onPick,
  active,
}: {
  onPick: (ex: Example) => void;
  active?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLES.map((ex) => {
        const isActive = active === ex.label;
        return (
          <button
            key={ex.label}
            type="button"
            onClick={() => onPick(ex)}
            className={cn(
              "rounded-full border border-border px-3 py-1 text-sm transition",
              isActive
                ? "bg-accent text-white border-accent"
                : "bg-bg/40 text-fg/80 hover:bg-fg/5"
            )}
          >
            {ex.label}
          </button>
        );
      })}
    </div>
  );
}
