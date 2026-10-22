// Tiny spreadsheet formula engine: numbers, cell refs (A1), + - * /, SUM/AVERAGE/MIN/MAX(A1:B3).
export type Cells = Record<string, string>;

const colIndex = (c: string) => c.toUpperCase().charCodeAt(0) - 65;

function expandRange(a: string, b: string): string[] {
  const m1 = /^([A-Z])(\d+)$/i.exec(a);
  const m2 = /^([A-Z])(\d+)$/i.exec(b);
  if (!m1 || !m2) return [];
  const out: string[] = [];
  const [c1, c2] = [colIndex(m1[1]), colIndex(m2[1])].sort((x, y) => x - y);
  const [r1, r2] = [+m1[2], +m2[2]].sort((x, y) => x - y);
  for (let c = c1; c <= c2; c++)
    for (let r = r1; r <= r2; r++) out.push(String.fromCharCode(65 + c) + r);
  return out;
}

export function evaluate(cells: Cells, key: string, seen = new Set<string>()): string {
  const raw = cells[key] ?? "";
  if (!raw.startsWith("=")) return raw;
  if (seen.has(key)) return "#CYCLE";
  seen.add(key);
  const num = (k: string) => {
    const v = parseFloat(evaluate(cells, k.toUpperCase(), new Set(seen)));
    return isNaN(v) ? 0 : v;
  };
  try {
    let expr = raw.slice(1).toUpperCase();
    expr = expr.replace(/(SUM|AVERAGE|MIN|MAX)\(([A-Z]\d+):([A-Z]\d+)\)/g, (_, fn, a, b) => {
      const vals = expandRange(a, b).map(num);
      if (!vals.length) return "0";
      if (fn === "SUM") return String(vals.reduce((s, v) => s + v, 0));
      if (fn === "AVERAGE") return String(vals.reduce((s, v) => s + v, 0) / vals.length);
      if (fn === "MIN") return String(Math.min(...vals));
      return String(Math.max(...vals));
    });
    expr = expr.replace(/[A-Z]\d+/g, (ref) => `(${num(ref)})`);
    if (!/^[\d+\-*/().\s]*$/.test(expr)) return "#ERROR";
    const result = Function(`"use strict";return (${expr || 0})`)() as number;
    if (!isFinite(result)) return "#DIV/0";
    return String(Math.round(result * 1e6) / 1e6);
  } catch {
    return "#ERROR";
  }
}
