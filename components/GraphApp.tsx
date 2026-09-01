"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormulaInput } from "@/components/FormulaInput";
import { Examples, EXAMPLES, type Example } from "@/components/Examples";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Graph } from "@/components/Graph";
import { RangeControls } from "@/components/RangeControls";
import { ThemeToggle } from "@/components/ThemeToggle";
import { parseFormula } from "@/lib/parser";
import { sampleCurves, type SampledCurve } from "@/lib/sampler";
import { autoYRange } from "@/lib/range";
import { DEFAULT_RANGE, readStateFromSearch, writeStateToSearch } from "@/lib/share";
import { downloadSvgAsPng } from "@/lib/png";
import { cn } from "@/lib/cn";

type Status = "idle" | "copied" | "error";

export function GraphApp() {
  const initial = useMemo(() => {
    if (typeof window === "undefined") {
      return { eq: "y = sin(x)", x0: DEFAULT_RANGE.xMin, x1: DEFAULT_RANGE.xMax, y0: DEFAULT_RANGE.yMin, y1: DEFAULT_RANGE.yMax, autoY: true };
    }
    return readStateFromSearch(window.location.search);
  }, []);

  const [eq, setEq] = useState<string>(initial.eq);
  const [xMin, setXMin] = useState<number>(initial.x0);
  const [xMax, setXMax] = useState<number>(initial.x1);
  const [yMin, setYMin] = useState<number>(initial.y0);
  const [yMax, setYMax] = useState<number>(initial.y1);
  const [autoY, setAutoY] = useState<boolean>(initial.autoY);
  const [status, setStatus] = useState<Status>("idle");
  const [width, setWidth] = useState<number>(800);
  const [renderTick, setRenderTick] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUrlRef = useRef<string>("");

  const parseResult = useMemo(() => parseFormula(eq), [eq]);

  const computed = useMemo(() => {
    if (!parseResult.ok) {
      return { curves: [] as SampledCurve[], yMin, yMax, error: parseResult.error };
    }
    if (xMax <= xMin) {
      return { curves: [] as SampledCurve[], yMin, yMax, error: "x max must be greater than x min." };
    }
    const curves = sampleCurves(parseResult.curves, xMin, xMax);
    let yLo = yMin;
    let yHi = yMax;
    if (autoY) {
      const r = autoYRange(curves, xMin, xMax);
      yLo = r.yMin;
      yHi = r.yMax;
    }
    return { curves, yMin: yLo, yMax: yHi, error: null as string | null };
  }, [parseResult, xMin, xMax, yMin, yMax, autoY]);

  useEffect(() => {
    setRenderTick((t) => t + 1);
  }, [eq, xMin, xMax, yMin, yMax, autoY]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.pathname}${writeStateToSearch({ eq, x0: xMin, x1: xMax, y0: yMin, y1: yMax, autoY })}`;
    if (url === lastUrlRef.current) return;
    lastUrlRef.current = url;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      window.history.replaceState(null, "", url);
    }, 200);
  }, [eq, xMin, xMax, yMin, yMax, autoY]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(320, Math.floor(e.contentRect.width));
        setWidth(w);
      }
    });
    ro.observe(el);
    setWidth(Math.max(320, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const onPick = useCallback((ex: Example) => {
    setEq(ex.eq);
    if (typeof ex.x0 === "number") setXMin(ex.x0);
    if (typeof ex.x1 === "number") setXMax(ex.x1);
    setAutoY(true);
  }, []);

  const onShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1600);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setStatus("copied");
        setTimeout(() => setStatus("idle"), 1600);
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 1600);
      }
    }
  }, []);

  const onPng = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const filename = (eq.replace(/[^a-z0-9]+/gi, "_").slice(0, 40) || "graph") + ".png";
    try {
      await downloadSvgAsPng(svg, filename);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1600);
    }
  }, [eq]);

  const activeExample = EXAMPLES.find((e) => e.eq === eq)?.label;

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 18 C 8 18, 8 6, 12 6 S 16 18, 21 18" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Formula Graph</h1>
            <p className="text-xs text-muted">Type a formula, get a graph. Share by link.</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <section className="flex flex-col gap-3">
        <FormulaInput value={eq} onChange={setEq} />
        <Examples onPick={onPick} active={activeExample} />
        <ErrorBanner message={computed.error} />
      </section>

      <section
        ref={wrapRef}
        className="rounded-2xl border border-border bg-bg/40 p-3 sm:p-4"
      >
        <div className="relative">
          <Graph
            key={renderTick}
            ref={svgRef}
            curves={computed.curves}
            xMin={xMin}
            xMax={xMax}
            yMin={computed.yMin}
            yMax={computed.yMax}
            width={width - 24}
            height={Math.round((width - 24) * 0.6)}
          />
          {computed.curves.length === 0 && !computed.error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted">
              <span className="text-sm">Type a formula above to plot it.</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <RangeControls
            xMin={xMin}
            xMax={xMax}
            yMin={yMin}
            yMax={yMax}
            autoY={autoY}
            onXMin={setXMin}
            onXMax={setXMax}
            onYMin={setYMin}
            onYMax={setYMax}
            onToggleAutoY={setAutoY}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-bg/60 px-3 text-sm font-medium hover:bg-fg/5"
              )}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              {status === "copied" ? "Link copied" : status === "error" ? "Copy failed" : "Share"}
            </button>
            <button
              type="button"
              onClick={onPng}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-white hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              PNG
            </button>
          </div>
        </div>
      </section>

      <footer className="pb-2 text-center text-xs text-muted">
        Press <kbd className="rounded border border-border bg-bg/60 px-1.5 py-0.5">Enter</kbd> to commit.{" "}
        <span className="opacity-70">No accounts, no tracking beyond anonymous pageviews.</span>
      </footer>
    </main>
  );
}
