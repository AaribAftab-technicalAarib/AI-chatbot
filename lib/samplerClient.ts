import type { SampledCurve } from "./sampler";

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

let worker: Worker | null = null;
let counter = 0;
const pending = new Map<number, (res: Res) => void>();

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./sampler.worker.ts", import.meta.url), { type: "module" });
  worker.addEventListener("message", (e: MessageEvent<Res>) => {
    const cb = pending.get(e.data.id);
    if (cb) {
      pending.delete(e.data.id);
      cb(e.data);
    }
  });
  return worker;
}

export function sampleInWorker(
  equations: string[],
  xMin: number,
  xMax: number,
  samples: number
): Promise<Res> {
  const w = ensureWorker();
  const id = ++counter;
  return new Promise<Res>((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ id, equations, xMin, xMax, samples });
  });
}
