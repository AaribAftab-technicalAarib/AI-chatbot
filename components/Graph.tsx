"use client";

import { forwardRef, useMemo, type CSSProperties } from "react";
import type { SampledCurve } from "@/lib/sampler";
import { niceTicks } from "@/lib/range";

type Props = {
  curves: SampledCurve[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  width: number;
  height: number;
};

const COLORS = ["#4f46e5", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2"];

export const Graph = forwardRef<SVGSVGElement, Props>(function Graph(
  { curves, xMin, xMax, yMin, yMax, width, height },
  ref
) {
  const padL = 44;
  const padR = 14;
  const padT = 14;
  const padB = 28;
  const plotW = Math.max(10, width - padL - padR);
  const plotH = Math.max(10, height - padT - padB);

  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  const sx = (x: number) => padL + ((x - xMin) / xSpan) * plotW;
  const sy = (y: number) => padT + (1 - (y - yMin) / ySpan) * plotH;

  const xTicks = useMemo(() => niceTicks(xMin, xMax, 7), [xMin, xMax]);
  const yTicks = useMemo(() => niceTicks(yMin, yMax, 6), [yMin, yMax]);

  const x0 = padL;
  const y0 = padT + plotH;
  const x1 = padL + plotW;
  const y1 = padT;

  const xAxisY = clamp(yMin, yMax, 0);
  const yAxisX = clamp(xMin, xMax, 0);

  const viewBox = `0 0 ${width} ${height}`;
  const style: CSSProperties = { width: "100%", height: "auto", display: "block" };

  return (
    <svg
      ref={ref}
      role="img"
      aria-label="Graph"
      viewBox={viewBox}
      style={style}
      className="rounded-xl border border-border bg-bg"
    >
      <rect className="graph-bg" x={0} y={0} width={width} height={height} fill="currentColor" style={{ fill: "rgb(var(--bg))" }} />

      {yTicks.map((t) => {
        const yy = sy(t);
        return (
          <g key={`y-${t}`}>
            <line className="graph-grid" x1={x0} x2={x1} y1={yy} y2={yy} stroke="currentColor" style={{ stroke: "rgb(var(--border))" }} strokeWidth={1} />
            <line className="graph-axis" x1={x0 - 4} x2={x0} y1={yy} y2={yy} stroke="currentColor" style={{ stroke: "rgb(var(--muted))" }} strokeWidth={1} />
            <text className="graph-tick" x={x0 - 7} y={yy + 4} textAnchor="end" fontSize={10} fill="currentColor" style={{ fill: "rgb(var(--muted))" }}>
              {formatTick(t)}
            </text>
          </g>
        );
      })}

      {xTicks.map((t) => {
        const xx = sx(t);
        return (
          <g key={`x-${t}`}>
            <line className="graph-grid" x1={xx} x2={xx} y1={y0} y2={y1} stroke="currentColor" style={{ stroke: "rgb(var(--border))" }} strokeWidth={1} />
            <line className="graph-axis" x1={xx} x2={xx} y1={y0} y2={y0 + 4} stroke="currentColor" style={{ stroke: "rgb(var(--muted))" }} strokeWidth={1} />
            <text className="graph-tick" x={xx} y={y0 + 18} textAnchor="middle" fontSize={10} fill="currentColor" style={{ fill: "rgb(var(--muted))" }}>
              {formatTick(t)}
            </text>
          </g>
        );
      })}

      {xAxisY >= yMin && xAxisY <= yMax && (
        <line
          x1={x0}
          x2={x1}
          y1={sy(xAxisY)}
          y2={sy(xAxisY)}
          stroke="currentColor"
          style={{ stroke: "rgb(var(--fg))" }}
          strokeWidth={1.25}
        />
      )}
      {yAxisX >= xMin && yAxisX <= xMax && (
        <line
          x1={sx(yAxisX)}
          x2={sx(yAxisX)}
          y1={y0}
          y2={y1}
          stroke="currentColor"
          style={{ stroke: "rgb(var(--fg))" }}
          strokeWidth={1.25}
        />
      )}

      {curves.map((c, i) => {
        const color = COLORS[i % COLORS.length];
        const d = buildPath(c, sx, sy, xMin, xMax, yMin, yMax);
        if (!d) return null;
        return (
          <path
            key={`c-${i}-${c.raw}`}
            className="graph-curve"
            d={d}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      })}
    </svg>
  );
});

function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v));
}

function formatTick(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1000 || abs < 0.01) return n.toExponential(0);
  return Number(n.toFixed(4)).toString();
}

function buildPath(
  curve: SampledCurve,
  sx: (x: number) => number,
  sy: (y: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): string {
  const parts: string[] = [];
  let pen: "M" | "L" = "M";
  for (const p of curve.points) {
    if (!Number.isFinite(p.y) || p.y < yMin - 1e6 || p.y > yMax + 1e6) {
      pen = "M";
      continue;
    }
    const x = sx(p.x);
    const y = sy(p.y);
    parts.push(`${pen}${x.toFixed(2)},${y.toFixed(2)}`);
    pen = "L";
  }
  return parts.join(" ");
}
