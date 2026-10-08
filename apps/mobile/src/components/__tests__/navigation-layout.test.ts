import { describe, expect, it } from "vitest";
import { navigationTileMinimumWidth, screenLayout } from "../navigation-layout";

describe("navigation tile layout", () => {
  it.each([
    [390, 1, 160],
    [320, 1, 160],
    [390, 1.3, 208],
    [320, 2, 280],
    [1280, 1, 160],
    [390, 4, 350],
    [240, 1.3, 200],
    [390, 0.8, 160],
  ])("bounds tile width for viewport %s at font scale %s", (width, scale, expected) => {
    expect(navigationTileMinimumWidth(width, scale)).toBe(expected);
  });

  it("stacks at phone width with large system text, without exceeding the content width", () => {
    const available = 390 - screenLayout.horizontalPadding * 2;
    const normal = navigationTileMinimumWidth(390, 1);
    const large = navigationTileMinimumWidth(390, 1.3);
    expect(normal * 2 + 12).toBeLessThanOrEqual(available);
    expect(large * 2 + 12).toBeGreaterThan(available);
    expect(large).toBeLessThanOrEqual(available);
  });
});
