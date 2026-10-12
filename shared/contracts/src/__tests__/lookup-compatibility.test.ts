import { describe, expect, it } from "vitest";
import {
  ProductLookupBodySchema,
  ProductLookupInputSchema,
  ProductLookupResultSchema,
  productLookupMethod,
  productLookupPath,
} from "../lookup-schema";

// Frozen v1 consumer contract examples, never runtime product/provider data.
describe("v1 consumer compatibility", () => {
  it("keeps the installed client's endpoint, method and input defaults", () => {
    expect(productLookupPath).toBe("/v1/recycling/lookup");
    expect(productLookupMethod).toBe("POST");
    expect(ProductLookupBodySchema.parse({ gtin: "3017 6204-22003" })).toEqual({
      gtin: "3017 6204-22003",
      language: "fi",
    });
    expect(ProductLookupInputSchema.parse({ gtin: "3017620422003" })).toEqual({
      gtin: "3017620422003",
      language: "fi",
      country: "FI",
    });
  });
  it("retains strict HTTP-body rejection without conflating transport and GTIN validation", () => {
    for (const body of [
      { gtin: "3017620422003", country: "FI" },
      { gtin: "1".repeat(33) },
      { gtin: "" },
      { gtin: "3017620422003", language: "sv" },
    ])
      expect(ProductLookupBodySchema.safeParse(body).success).toBe(false);
    expect(ProductLookupInputSchema.safeParse({ gtin: "123" }).success).toBe(false);
  });
  it("keeps failure discriminants and requires real typed provenance for a successful result", () => {
    expect(ProductLookupResultSchema.parse({ status: "not_found", gtin: "3017620422003" })).toEqual(
      { status: "not_found", gtin: "3017620422003" },
    );
    expect(
      ProductLookupResultSchema.parse({
        status: "provider_unavailable",
        gtin: "3017620422003",
        retryable: true,
      }),
    ).toEqual({ status: "provider_unavailable", gtin: "3017620422003", retryable: true });
    for (const status of ["resolved", "packaging_missing"])
      expect(ProductLookupResultSchema.safeParse({ status, gtin: "3017620422003" }).success).toBe(
        false,
      );
    expect(
      ProductLookupResultSchema.safeParse({ status: "success", gtin: "3017620422003" }).success,
    ).toBe(false);
  });
});
