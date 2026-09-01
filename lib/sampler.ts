import type { ParsedCurve } from "./parser";

export type SamplePoint = { x: number; y: number };
export type SampledCurve = {
  raw: string;
  points: SamplePoint[];
  finiteCount: number;
  hasUndefined: boolean;
};

const DEFAULT_SAMPLES = 800;
const MAX_SAMPLES = 4000;
const Y_CLIP = 1e9;

export function sampleCurves(
  curves: ParsedCurve[],
  xMin: number,
  xMax: number,
  samples: number = DEFAULT_SAMPLES
): SampledCurve[] {
  if (xMax <= xMin) {
    xMax = xMin + 1;
  }
  const n = Math.max(2, Math.min(MAX_SAMPLES, Math.floor(samples)));
  const step = (xMax - xMin) / (n - 1);
  const out: SampledCurve[] = [];

  for (const c of curves) {
    const points: SamplePoint[] = [];
    let finiteCount = 0;
    let hasUndefined = false;
    for (let i = 0; i < n; i++) {
      const x = xMin + i * step;
      let y: number;
      try {
        const v = c.compiled.evaluate({ x });
        y = typeof v === "number" ? v : Number(v);
      } catch {
        y = NaN;
      }
      if (!Number.isFinite(y) || Math.abs(y) > Y_CLIP) {
        hasUndefined = true;
        points.push({ x, y: NaN });
      } else {
        finiteCount++;
        points.push({ x, y });
      }
    }
    out.push({ raw: c.raw, points, finiteCount, hasUndefined });
  }
  return out;
}
