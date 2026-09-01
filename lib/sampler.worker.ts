import { compile, type Compiled } from "./parser";
import { sampleCurves, type SampledCurve } from "./sampler";

type Req = {
  id: number;
  equations: string[];
  xMin: number;
  xMax: number;
  samples: number;
};

type Res =
  | { id: number; ok: true; curves: SampledCurve[]; sources: { raw: string; expr: string }[] }
  | { id: number; ok: false; error: string };

self.addEventListener("message", (e: MessageEvent<Req>) => {
  const { id, equations, xMin, xMax, samples } = e.data;
  try {
    const compiled: Compiled[] = [];
    for (const eq of equations) {
      const r = compile(eq);
      if (!r.ok) {
        const res: Res = { id, ok: false, error: r.error };
        (self as unknown as Worker).postMessage(res);
        return;
      }
      compiled.push(r.compiled);
    }
    const curves = sampleCurves(compiled, xMin, xMax, samples);
    const sources = compiled.map((c) => ({ raw: c.raw, expr: c.expr }));
    const res: Res = { id, ok: true, curves, sources };
    (self as unknown as Worker).postMessage(res);
  } catch (err) {
    const res: Res = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
    (self as unknown as Worker).postMessage(res);
  }
});
