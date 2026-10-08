import { translate } from "@kierratysappi/localization";
import { describe, expect, it } from "vitest";
import { formatHistoryDate, historyStatusMessageKey } from "../presentation";

describe("history presentation", () => {
  it.each([
    ["resolved", "historyProductFound"],
    ["packaging_missing", "packagingMissingTitle"],
    ["not_found", "notFoundTitle"],
  ] as const)("localizes %s without claiming verified sorting", (status, key) => {
    expect(historyStatusMessageKey(status)).toBe(key);
    for (const language of ["fi", "en"] as const) {
      const label = translate(language, historyStatusMessageKey(status));
      expect(label).not.toBe(status);
      expect(label).not.toMatch(/verified|varmennettu/i);
    }
  });
  it.each([undefined, null, "unexpected", 1])("uses a safe label for %s", (status) => {
    expect(historyStatusMessageKey(status)).toBe("historyResultUnknown");
  });
  it("formats dates for the selected language", () => {
    expect(formatHistoryDate("2026-10-08T12:00:00Z", "fi")).toBe("8.10.2026");
    expect(formatHistoryDate("2026-10-08T12:00:00Z", "en")).toBe("8 Oct 2026");
  });
  it("does not crash or invent a date for malformed storage", () => {
    for (const value of [undefined, null, 42, "not-a-date"]) {
      expect(formatHistoryDate(value, "fi")).toBeUndefined();
    }
  });
});
