import { create, all, type EvalFunction } from "mathjs";

const math = create(all);

const ALLOWED_NAMES = new Set<string>([
  "x",
  "y",
  "t",
  "e",
  "pi",
  "PI",
  "E",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "exp",
  "ln",
  "log",
  "log2",
  "log10",
  "abs",
  "sqrt",
  "floor",
  "ceil",
  "round",
  "min",
  "max",
  "sign",
]);

const MAX_INPUT_LEN = 500;

export type ParsedCurve = {
  raw: string;
  expr: string;
  compiled: EvalFunction;
};

export type ParseResult =
  | { ok: true; curves: ParsedCurve[] }
  | { ok: false; error: string };

function normalize(input: string): string {
  return input
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\s+/g, "")
    .replace(/^y\s*=/i, "")
    .replace(/^f\(x\)\s*=/i, "")
    .replace(/=.*$/, "")
    .trim();
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (/[a-zA-Z_]/.test(c)) {
      let j = i + 1;
      while (j < input.length && /[a-zA-Z0-9_]/.test(input[j])) j++;
      tokens.push(input.slice(i, j));
      i = j;
    } else if (/[0-9.]/.test(c)) {
      let j = i + 1;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      tokens.push(input.slice(i, j));
      i = j;
    } else {
      tokens.push(c);
      i++;
    }
  }
  return tokens;
}

function isSafe(input: string): boolean {
  if (input.length === 0 || input.length > MAX_INPUT_LEN) return false;
  const tokens = tokenize(input);
  for (const t of tokens) {
    if (/^[a-zA-Z_]/.test(t)) {
      if (!ALLOWED_NAMES.has(t)) return false;
    } else {
      if (!/^[0-9.+\-*/^(),]+$/.test(t)) return false;
    }
  }
  return true;
}

export function parseFormula(input: string): ParseResult {
  if (!input || !input.trim()) {
    return { ok: false, error: "Type a formula to get started." };
  }
  if (input.length > MAX_INPUT_LEN) {
    return { ok: false, error: `Formula is too long (max ${MAX_INPUT_LEN} characters).` };
  }
  const parts = input
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { ok: false, error: "Type a formula to get started." };
  }

  const curves: ParsedCurve[] = [];
  for (const raw of parts) {
    const expr = normalize(raw);
    if (!expr) continue;
    if (!isSafe(expr)) {
      return {
        ok: false,
        error: `Unsupported token in "${raw}". Use x, numbers, + - * / ^, and standard functions.`,
      };
    }
    try {
      const compiled = math.compile(expr);
      curves.push({ raw, expr, compiled });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: `Couldn't parse "${raw}": ${msg}` };
    }
  }

  if (curves.length === 0) {
    return { ok: false, error: "Type a formula to get started." };
  }

  return { ok: true, curves };
}
