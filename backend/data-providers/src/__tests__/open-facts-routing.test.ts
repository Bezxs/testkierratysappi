import { GtinSchema } from "@kierratysappi/domain";
import { describe, expect, it, vi } from "vitest";
import { OpenFoodFactsProvider } from "../open-food-facts";

const gtin = GtinSchema.parse("3017620422003"); // Synthetic routing fixtures, not real product claims.
const context = { country: "FI" as const, language: "fi" as const };
const redirect = (location: string, status = 302) =>
  new Response(null, { status, headers: { location } });
const record = (product_type: string, code = gtin) =>
  new Response(
    JSON.stringify({
      product: {
        code,
        product_type,
        product_name: "Synthetic contract fixture",
        image_front_url: "https://example.test/unreviewed.jpg",
        packagings: [{ material: "en:plastic", shape: "en:bottle" }],
      },
    }),
  );

describe("Open Facts universal read routing", () => {
  it.each([
    ["beauty", "openbeautyfacts", "Open Beauty Facts", "open-beauty-facts"],
    ["petfood", "openpetfoodfacts", "Open Pet Food Facts", "open-pet-food-facts"],
    ["product", "openproductsfacts", "Open Products Facts", "open-products-facts"],
  ])("routes %s once and keeps the real database attribution", async (type, host, name, id) => {
    const calls: { url: URL; init: RequestInit | undefined }[] = [];
    const provider = new OpenFoodFactsProvider({
      productScope: "all",
      fetch: vi.fn(async (input, init) => {
        calls.push({ url: new URL(input.toString()), init });
        return calls.length === 1
          ? redirect(`https://fi.${host}.org/api/v3/product/${gtin}.json?fields=secret&evil=true`)
          : record(type);
      }),
    });
    const result = await provider.findByGtin(gtin, context);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.url.searchParams.get("product_type")).toBe("all");
    expect(calls[1]?.url.origin).toBe(`https://world.${host}.org`);
    expect(calls[1]?.url.searchParams.get("product_type")).toBe(type);
    expect(calls[1]?.url.searchParams.get("fields")).not.toContain("secret");
    expect(calls[1]?.url.searchParams.has("evil")).toBe(false);
    expect(calls.every(({ init }) => init?.redirect === "manual")).toBe(true);
    expect(result.status).toBe("found");
    if (result.status !== "found") return;
    expect(result.product.name?.provenance).toMatchObject({
      sourceId: id,
      sourceName: name,
      verificationStatus: "community",
      sourceUrl: `https://world.${host}.org/product/${gtin}`,
      license: { shareAlike: true, attributionText: `${name} contributors` },
    });
    expect(result.product.imageUrl).toBeUndefined();
    expect(result.product.packagingCompleteness.value).toBe("partial");
    expect(result.product.packagingComponents[0]?.depositReturnStatus?.value).toBe("unknown");
    expect(result.product.packagingComponents[0]?.conditions.hazardousResidue).toBe("unknown");
  });

  it.each([
    "http://world.openproductsfacts.org",
    "https://world.openproductsfacts.org.evil.test",
    "https://127.0.0.1",
    "https://user:pass@world.openproductsfacts.org",
    "https://world.openproductsfacts.org:8443",
    "https://world.openfoodfacts.org",
    "https://anything.openproductsfacts.org",
  ])("rejects unsafe/self redirect %s without following it", async (origin) => {
    const fetchMock = vi.fn(async () => redirect(`${origin}/api/v3/product/${gtin}`));
    const provider = new OpenFoodFactsProvider({ productScope: "all", fetch: fetchMock });
    await expect(provider.findByGtin(gtin, context)).resolves.toMatchObject({
      status: "error",
      code: "invalid_response",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["/api/v3/product/6410405196811", "/other", `/api/v3/product/${gtin}#fragment`])(
    "rejects a mismatched redirect path %s",
    async (path) => {
      const fetchMock = vi.fn(async () => redirect(`https://world.openproductsfacts.org${path}`));
      const provider = new OpenFoodFactsProvider({ productScope: "all", fetch: fetchMock });
      await expect(provider.findByGtin(gtin, context)).resolves.toMatchObject({
        status: "error",
        code: "invalid_response",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects a redirect chain and spends at most two requests", async () => {
    const fetchMock = vi.fn(async () =>
      redirect(`https://world.openproductsfacts.org/api/v3/product/${gtin}`),
    );
    const provider = new OpenFoodFactsProvider({ productScope: "all", fetch: fetchMock });
    await expect(provider.findByGtin(gtin, context)).resolves.toMatchObject({
      status: "error",
      code: "invalid_response",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("charges routed requests to the same quota", async () => {
    const fetchMock = vi.fn(async () =>
      redirect(`https://world.openproductsfacts.org/api/v3/product/${gtin}`),
    );
    const provider = new OpenFoodFactsProvider({
      productScope: "all",
      fetch: fetchMock,
      maxRequestsPerMinute: 1,
    });
    await expect(provider.findByGtin(gtin, context)).resolves.toMatchObject({
      status: "error",
      code: "rate_limited",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not request or fan out when cancelled or universally missing", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
    const provider = new OpenFoodFactsProvider({ productScope: "all", fetch: fetchMock });
    await expect(
      provider.findByGtin(gtin, { ...context, signal: AbortSignal.abort() }),
    ).resolves.toMatchObject({ status: "error", code: "unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(provider.findByGtin(gtin, context)).resolves.toEqual({ status: "not_found" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["food", "beauty", "invalid"])(
    "rejects %s data on the other-products host",
    async (type) => {
      let calls = 0;
      const provider = new OpenFoodFactsProvider({
        productScope: "all",
        fetch: async () =>
          ++calls === 1
            ? redirect(`https://world.openproductsfacts.org/api/v3/product/${gtin}`)
            : record(type),
      });
      await expect(provider.findByGtin(gtin, context)).resolves.toMatchObject({
        status: "error",
        code: "invalid_response",
      });
    },
  );

  it("retains the original deadline across a slow routed request", async () => {
    let calls = 0;
    const provider = new OpenFoodFactsProvider({
      productScope: "all",
      timeoutMs: 10,
      fetch: async (_input, init) => {
        if (++calls === 1)
          return redirect(`https://world.openproductsfacts.org/api/v3/product/${gtin}`);
        return new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          ),
        );
      },
    });
    await expect(provider.findByGtin(gtin, context)).resolves.toMatchObject({
      status: "error",
      code: "unavailable",
      retryable: true,
    });
  });

  it("still validates the barcode returned by a sister database", async () => {
    let calls = 0;
    const provider = new OpenFoodFactsProvider({
      productScope: "all",
      fetch: async () =>
        ++calls === 1
          ? redirect(`https://world.openproductsfacts.org/api/v3/product/${gtin}`)
          : record("product", GtinSchema.parse("6410405196811")),
    });
    await expect(provider.findByGtin(gtin, context)).resolves.toMatchObject({
      status: "error",
      code: "invalid_response",
    });
  });
});
