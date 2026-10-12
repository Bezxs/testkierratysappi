import { ProductResolutionService } from "@kierratysappi/application";
import { ProductLookupResultSchema } from "@kierratysappi/contracts/lookup-schema";
import { OpenFoodFactsProvider } from "@kierratysappi/data-providers";
import { expect, it, vi } from "vitest";
import { buildApp } from "../app";

it("serves and caches routed product identity with its real source and no invented packaging", async () => {
  const fetchMock = vi.fn(async () =>
    fetchMock.mock.calls.length === 1
      ? new Response(null, {
          status: 302,
          headers: { location: "https://fi.openproductsfacts.org/api/v3/product/3017620422003" },
        })
      : new Response(
          JSON.stringify({
            product: {
              code: "3017620422003",
              product_type: "product",
              product_name: "Synthetic fixture",
            },
          }),
        ),
  );
  const app = await buildApp({
    lookupService: new ProductResolutionService({
      providers: [new OpenFoodFactsProvider({ productScope: "all", fetch: fetchMock })],
    }),
  });
  try {
    for (const hit of [false, true]) {
      const response = await app.inject({
        method: "POST",
        url: "/v1/recycling/lookup",
        payload: { gtin: "3017620422003", language: "fi" },
      });
      expect(response.statusCode).toBe(200);
      const result = ProductLookupResultSchema.parse(response.json());
      expect(result.status).toBe("packaging_missing");
      if (result.status !== "packaging_missing") throw new Error("Wrong contract");
      expect(result.cache.hit).toBe(hit);
      expect(result.product.name?.provenance.sourceName).toBe("Open Products Facts");
      expect(result.product.packagingComponents).toEqual([]);
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally {
    await app.close();
  }
});
