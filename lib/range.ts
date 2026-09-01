import type { SampledCurve } from "./sampler";

export type Range = { xMin: number; xMax: number; yMin: number; yMax: number };

const PAD = 0.08;

export function autoYRange(
  curves: SampledCurve[],
  xMin: number,
  xMax: number
): { yMin: number; yMax: number } {
  let yMin = Infinity;
  let yMax = -Infinity;
  let any = false;
  for (const c of curves) {
    for (const p of c.points) {
      if (!Number.isFinite(p.y)) continue;
      if (p.x < xMin - 1e-9 || p.x > xMax + 1e-9) continue;
      any = true;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
  }
  if (!any) {
    return { yMin: -1, yMax: 1 };
  }
  if (yMin === yMax) {
    const pad = Math.max(1, Math.abs(yMin) * 0.1 + 1);
    return { yMin: yMin - pad, yMax: yMax + pad };
  }
  const span = yMax - yMin;
  return {
    yMin: yMin - span * PAD,
    yMax: yMax + span * PAD,
  };
}

export function niceTicks(min: number, max: number, count = 6): number[] {
  if (max <= min) return [min];
  const span = max - min;
  const rawStep = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let step: number;
  if (norm < 1.5) step = 1 * mag;
  else if (norm < 3) step = 2 * mag;
  else if (norm < 7) step = 5 * mag;
  else step = 10 * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}
