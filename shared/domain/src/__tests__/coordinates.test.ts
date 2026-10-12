import { describe, expect, it } from "vitest";
import { straightLineMeters } from "../coordinates";

describe("straight-line distance", () => {
  it("is zero at the same point and symmetric", () => {
    const a = { latitude: 60, longitude: 25 };
    const b = { latitude: 61, longitude: 26 };
    expect(straightLineMeters(a, a)).toBe(0);
    expect(straightLineMeters(a, b)).toBeCloseTo(straightLineMeters(b, a), 8);
  });
  it("calculates an equatorial degree and crosses the date line correctly", () => {
    expect(
      straightLineMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }),
    ).toBeCloseTo(111_195.08, 1);
    expect(
      straightLineMeters({ latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 }),
    ).toBeCloseTo(111_195.08, 1);
  });
  it("remains finite at antipodal points", () => {
    expect(
      straightLineMeters({ latitude: 90, longitude: 0 }, { latitude: -90, longitude: 0 }),
    ).toBeCloseTo(Math.PI * 6_371_008.8, 3);
  });
  it("rejects invalid coordinates rather than displaying a fabricated distance", () => {
    for (const latitude of [NaN, Infinity, 91, -91]) {
      expect(() =>
        straightLineMeters({ latitude, longitude: 0 }, { latitude: 0, longitude: 0 }),
      ).toThrow();
    }
  });
});
