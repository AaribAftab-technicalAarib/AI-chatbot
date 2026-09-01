import type { Range } from "./range";

export const DEFAULT_RANGE: Range = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
};

export type SharedState = {
  eq: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  autoY: boolean;
};

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

export function readStateFromSearch(search: string): SharedState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const eq = params.get("e") ?? params.get("eq") ?? "y = sin(x)";
  const num = (key: string, fallback: number) => {
    const v = params.get(key);
    if (v == null) return fallback;
    const n = Number(v);
    return isFiniteNumber(n) ? n : fallback;
  };
  return {
    eq,
    x0: num("x0", DEFAULT_RANGE.xMin),
    x1: num("x1", DEFAULT_RANGE.xMax),
    y0: num("y0", DEFAULT_RANGE.yMin),
    y1: num("y1", DEFAULT_RANGE.yMax),
    autoY: params.get("ay") !== "0",
  };
}

export function writeStateToSearch(state: SharedState): string {
  const params = new URLSearchParams();
  params.set("e", state.eq);
  params.set("x0", trim(state.x0));
  params.set("x1", trim(state.x1));
  if (!state.autoY) {
    params.set("y0", trim(state.y0));
    params.set("y1", trim(state.y1));
  }
  params.set("ay", state.autoY ? "1" : "0");
  return `?${params.toString()}`;
}

function trim(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toFixed(6)).toString();
}
