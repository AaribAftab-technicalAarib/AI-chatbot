import { compile, evaluate } from "@/lib/parser";

function approx(a: number, b: number, eps = 1e-6) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
  return Math.abs(a - b) <= eps;
}

function evalAt(eq: string, x: number): number {
  const r = compile(eq);
  if (!r.ok) throw new Error(r.error);
  return evaluate(r.compiled, { x });
}

describe("parser", () => {
  it("compiles basic arithmetic", () => {
    expect(evalAt("y = 1 + 2 * 3", 0)).toBe(7);
    expect(evalAt("y = (1 + 2) * 3", 0)).toBe(9);
    expect(evalAt("y = 2 ^ 10", 0)).toBe(1024);
  });

  it("respects operator precedence", () => {
    expect(evalAt("y = 2 + 3 * 4", 0)).toBe(14);
    expect(evalAt("y = (2 + 3) * 4", 0)).toBe(20);
  });

  it("is right-associative for ^", () => {
    expect(evalAt("y = 2 ^ 3 ^ 2", 0)).toBe(512);
  });

  it("evaluates trig and math functions", () => {
    expect(approx(evalAt("y = sin(0)", 0), 0)).toBe(true);
    expect(approx(evalAt("y = cos(0)", 0), 1)).toBe(true);
    expect(approx(evalAt("y = sqrt(2)", 0), Math.SQRT2)).toBe(true);
    expect(approx(evalAt("y = ln(e)", 0), 1)).toBe(true);
  });

  it("handles unary minus", () => {
    expect(evalAt("y = -3 + 5", 0)).toBe(2);
    expect(evalAt("y = -(2 + 3)", 0)).toBe(-5);
  });

  it("uses x as the variable", () => {
    expect(evalAt("y = x^2", 3)).toBe(9);
    expect(evalAt("y = sin(x)", Math.PI / 2)).toBeCloseTo(1, 6);
  });

  it("supports pi and e constants", () => {
    expect(evalAt("y = pi", 0)).toBeCloseTo(Math.PI, 10);
    expect(evalAt("y = e", 0)).toBeCloseTo(Math.E, 10);
  });

  it("rejects unknown identifiers", () => {
    const r = compile("y = foo(1)");
    expect(r.ok).toBe(false);
  });

  it("rejects unmatched parens", () => {
    expect(compile("y = ((").ok).toBe(false);
    expect(compile("y = ))").ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(compile("").ok).toBe(false);
    expect(compile("   ").ok).toBe(false);
  });

  it("rejects oversized input", () => {
    const big = "x+" + "x+".repeat(1000);
    expect(compile(big).ok).toBe(false);
  });
});
