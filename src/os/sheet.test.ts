import { describe, expect, it } from "vitest";
import { evaluate } from "./sheet";

describe("Sheets formulas", () => {
  const cells = { A1: "10", A2: "20", A3: "=SUM(A1:A2)", B1: "=A1*2+A2", B2: "=AVERAGE(A1:A2)", C1: "=C1" };
  it("sums a range", () => expect(evaluate(cells, "A3")).toBe("30"));
  it("does arithmetic with refs", () => expect(evaluate(cells, "B1")).toBe("40"));
  it("averages", () => expect(evaluate(cells, "B2")).toBe("15"));
  it("detects cycles", () => expect(evaluate(cells, "C1")).toBe("#CYCLE"));
});
