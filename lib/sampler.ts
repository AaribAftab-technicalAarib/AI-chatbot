import { evaluate, type Compiled } from "./parser";

export type SamplePoint = { x: number; y: number };
export type SampledCurve = {
  raw: string;
  points: SamplePoint[];
  finiteCount: number;
  hasUndefined: boolean;
};

const DEFAULT_SAMPLES = 600;
const MAX_SAMPLES = 4000;
const Y_CLIP = 1e9;

export function sampleCurve(
  compiled: Compiled,
  xMin: number,
  xMax: number,
  samples: number = DEFAULT_SAMPLES
): SampledCurve {
  if (xMax <= xMin) xMax = xMin + 1;
  const n = Math.max(2, Math.min(MAX_SAMPLES, Math.floor(samples)));
  const step = (xMax - xMin) / (n - 1);
  const points: SamplePoint[] = new Array(n);
  let finiteCount = 0;
  let hasUndefined = false;
  for (let i = 0; i < n; i++) {
    const x = xMin + i * step;
    let y: number;
    try {
      y = evaluate(compiled, { x });
    } catch {
      y = NaN;
    }
    if (!Number.isFinite(y) || Math.abs(y) > Y_CLIP) {
      hasUndefined = true;
      points[i] = { x, y: NaN };
    } else {
      finiteCount++;
      points[i] = { x, y };
    }
  }
  return { raw: compiled.raw, points, finiteCount, hasUndefined };
}

export function sampleCurves(
  compiledList: Compiled[],
  xMin: number,
  xMax: number,
  samples: number = DEFAULT_SAMPLES
): SampledCurve[] {
  return compiledList.map((c) => sampleCurve(c, xMin, xMax, samples));
}
