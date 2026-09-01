export type Token =
  | { kind: "num"; value: number }
  | { kind: "ident"; name: string }
  | { kind: "op"; op: "+" | "-" | "*" | "/" | "^" | "u-" }
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "comma" };

type FnSig = (args: number[]) => number;

const FUNCS: Record<string, FnSig> = {
  sin: (a) => Math.sin(a[0]),
  cos: (a) => Math.cos(a[0]),
  tan: (a) => Math.tan(a[0]),
  asin: (a) => Math.asin(a[0]),
  acos: (a) => Math.acos(a[0]),
  atan: (a) => Math.atan(a[0]),
  sinh: (a) => Math.sinh(a[0]),
  cosh: (a) => Math.cosh(a[0]),
  tanh: (a) => Math.tanh(a[0]),
  exp: (a) => Math.exp(a[0]),
  ln: (a) => Math.log(a[0]),
  log: (a) => Math.log(a[0]) / Math.log(10),
  log2: (a) => Math.log2(a[0]),
  log10: (a) => Math.log10(a[0]),
  abs: (a) => Math.abs(a[0]),
  sqrt: (a) => Math.sqrt(a[0]),
  floor: (a) => Math.floor(a[0]),
  ceil: (a) => Math.ceil(a[0]),
  round: (a) => Math.round(a[0]),
  min: (a) => Math.min(...a),
  max: (a) => Math.max(...a),
  sign: (a) => Math.sign(a[0]),
};

const CONSTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E,
};

const ALLOWED_IDENTS = new Set<string>([
  "x",
  "y",
  "t",
  ...Object.keys(FUNCS),
  ...Object.keys(CONSTS),
]);

const MAX_INPUT_LEN = 500;

export type Op =
  | { kind: "push_const"; value: number }
  | { kind: "push_var"; slot: number }
  | { kind: "call"; name: string; argc: number }
  | { kind: "neg" }
  | { kind: "add" }
  | { kind: "sub" }
  | { kind: "mul" }
  | { kind: "div" }
  | { kind: "pow" };

export type Compiled = {
  raw: string;
  expr: string;
  bytecode: Op[];
  identArgs: Map<number, string>;
  hasVariable: boolean;
};

export type ParseResult =
  | { ok: true; compiled: Compiled }
  | { ok: false; error: string };

function normalize(input: string): string {
  return input
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\s+/g, "")
    .replace(/^y\s*=/i, "")
    .replace(/^f\(x\)\s*=/i, "")
    .trim();
}

function tokenize(input: string): { tokens: Token[]; error?: string } {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (c >= "0" && c <= "9") {
      let j = i + 1;
      let dotSeen = false;
      while (j < input.length) {
        const d = input[j];
        if (d >= "0" && d <= "9") j++;
        else if (d === "." && !dotSeen) {
          dotSeen = true;
          j++;
        } else break;
      }
      const n = Number(input.slice(i, j));
      if (!Number.isFinite(n)) return { tokens, error: "Number is too large." };
      tokens.push({ kind: "num", value: n });
      i = j;
      continue;
    }
    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_") {
      let j = i + 1;
      while (j < input.length) {
        const d = input[j];
        if ((d >= "a" && d <= "z") || (d >= "A" && d <= "Z") || (d >= "0" && d <= "9") || d === "_") j++;
        else break;
      }
      const name = input.slice(i, j);
      if (!ALLOWED_IDENTS.has(name)) {
        return { tokens, error: `Unknown identifier "${name}".` };
      }
      tokens.push({ kind: "ident", name });
      i = j;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/" || c === "^") {
      tokens.push({ kind: "op", op: c });
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ kind: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ kind: "rparen" });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ kind: "comma" });
      i++;
      continue;
    }
    return { tokens, error: `Unexpected character "${c}" at position ${i + 1}.` };
  }
  return { tokens };
}

function precedence(op: string): number {
  if (op === "u-") return 4;
  if (op === "^") return 3;
  if (op === "*" || op === "/") return 2;
  if (op === "+" || op === "-") return 1;
  return 0;
}

function isRightAssoc(op: string): boolean {
  return op === "^" || op === "u-";
}

function toRPN(tokens: Token[]): { rpn: Token[]; error?: string } {
  const out: Token[] = [];
  const stack: Token[] = [];
  let prev: Token | null = null;
  for (const t of tokens) {
    if (t.kind === "num" || t.kind === "ident") {
      out.push(t);
    } else if (t.kind === "comma") {
      while (stack.length && stack[stack.length - 1].kind !== "lparen") {
        out.push(stack.pop()!);
      }
      if (!stack.length) return { rpn: out, error: "Misplaced comma." };
    } else if (t.kind === "op") {
      let op: "+" | "-" | "*" | "/" | "^" | "u-" = t.op;
      if (op === "-" && (prev === null || prev.kind === "op" || prev.kind === "lparen" || prev.kind === "comma")) {
        op = "u-";
      } else if (op === "+" && (prev === null || prev.kind === "op" || prev.kind === "lparen" || prev.kind === "comma")) {
        continue;
      }
      const tok: Token = { kind: "op", op };
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.kind !== "op") break;
        const pTop = precedence(top.op);
        const pCur = precedence(op);
        if (pTop > pCur || (pTop === pCur && !isRightAssoc(op))) {
          out.push(stack.pop()!);
        } else break;
      }
      stack.push(tok);
    } else if (t.kind === "lparen") {
      stack.push(t);
    } else if (t.kind === "rparen") {
      while (stack.length && stack[stack.length - 1].kind !== "lparen") {
        out.push(stack.pop()!);
      }
      if (!stack.length) return { rpn: out, error: "Unmatched ')'." };
      stack.pop();
      if (stack.length && stack[stack.length - 1].kind === "ident") {
        out.push(stack.pop()!);
      }
    }
    prev = t;
  }
  while (stack.length) {
    const t = stack.pop()!;
    if (t.kind === "lparen") return { rpn: out, error: "Unmatched '('." };
    out.push(t);
  }
  return { rpn: out };
}

function compileRPN(
  rpn: Token[]
): { code: Op[]; error?: string; identArgs: Map<number, string>; hasVariable: boolean } {
  const code: Op[] = [];
  const stackDepth: number[] = [];
  const pendingCalls: { name: string }[] = [];
  const identArgs = new Map<number, string>();
  let slotCounter = 0;
  let hasVariable = false;

  function flushCalls() {
    while (pendingCalls.length) {
      const c = pendingCalls.pop()!;
      if (stackDepth.length < 1) {
        return { code, error: "Function is missing an argument.", identArgs, hasVariable };
      }
      code.push({ kind: "call", name: c.name, argc: 1 });
    }
  }

  for (const t of rpn) {
    if (t.kind === "num") {
      code.push({ kind: "push_const", value: t.value });
      stackDepth.push(1);
    } else if (t.kind === "ident") {
      if (FUNCS[t.name]) {
        pendingCalls.push({ name: t.name });
      } else if (CONSTS[t.name] !== undefined) {
        code.push({ kind: "push_const", value: CONSTS[t.name] });
        stackDepth.push(1);
      } else {
        if (!identArgs.has(slotCounter)) {
          identArgs.set(slotCounter, t.name);
        }
        hasVariable = true;
        code.push({ kind: "push_var", slot: slotCounter });
        slotCounter++;
        stackDepth.push(1);
      }
    } else if (t.kind === "op") {
      flushCalls();
      if (t.op === "u-") {
        if (stackDepth.length < 1) return { code, error: "Operator is missing an operand.", identArgs, hasVariable };
        code.push({ kind: "neg" });
      } else {
        if (stackDepth.length < 2) return { code, error: "Operator is missing an operand.", identArgs, hasVariable };
        const k: Op["kind"] =
          t.op === "+" ? "add" :
          t.op === "-" ? "sub" :
          t.op === "*" ? "mul" :
          t.op === "/" ? "div" :
          "pow";
        code.push({ kind: k });
        stackDepth.pop();
      }
    }
  }

  flushCalls();

  if (stackDepth.length !== 1) {
    return { code, error: "Expression is incomplete.", identArgs, hasVariable };
  }
  return { code, identArgs, hasVariable };
}

export function compile(input: string): ParseResult {
  if (!input || !input.trim()) {
    return { ok: false, error: "Type a formula to get started." };
  }
  if (input.length > MAX_INPUT_LEN) {
    return { ok: false, error: `Formula is too long (max ${MAX_INPUT_LEN} characters).` };
  }
  const expr = normalize(input);
  if (!expr) return { ok: false, error: "Type a formula to get started." };

  const { tokens, error: tErr } = tokenize(expr);
  if (tErr) return { ok: false, error: tErr };
  const { rpn, error: rErr } = toRPN(tokens);
  if (rErr) return { ok: false, error: rErr };
  const { code, error: cErr, identArgs, hasVariable } = compileRPN(rpn);
  if (cErr) return { ok: false, error: cErr };

  return {
    ok: true,
    compiled: { raw: input, expr, bytecode: code, identArgs, hasVariable },
  };
}

export function evaluate(compiled: Compiled, vars: Record<string, number>): number {
  const stack: number[] = [];
  for (const op of compiled.bytecode) {
    switch (op.kind) {
      case "push_const":
        stack.push(op.value);
        break;
      case "push_var": {
        const name = compiled.identArgs.get(op.slot);
        const v = name ? vars[name] : NaN;
        stack.push(v);
        break;
      }
      case "call": {
        const fn = FUNCS[op.name];
        const args = stack.splice(stack.length - op.argc, op.argc);
        let r = NaN;
        try {
          r = fn(args);
        } catch {
          r = NaN;
        }
        stack.push(r);
        break;
      }
      case "neg": {
        const a = stack.pop();
        stack.push(a === undefined ? NaN : -a);
        break;
      }
      case "add": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push((a ?? NaN) + (b ?? NaN));
        break;
      }
      case "sub": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push((a ?? NaN) - (b ?? NaN));
        break;
      }
      case "mul": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push((a ?? NaN) * (b ?? NaN));
        break;
      }
      case "div": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push((a ?? NaN) / (b ?? NaN));
        break;
      }
      case "pow": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(Math.pow(a ?? NaN, b ?? NaN));
        break;
      }
    }
  }
  return stack.length ? stack[stack.length - 1] : NaN;
}

export function parseFormula(input: string): ParseResult {
  return compile(input);
}
