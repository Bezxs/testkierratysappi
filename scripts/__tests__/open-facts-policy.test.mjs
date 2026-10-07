import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
test("runtime enables universal lookup while UI attribution follows the actual database", () => {
  assert.match(read("apps/api/src/server.ts"), /productScope: "all"/u);
  const result = read("apps/mobile/src/app/result.tsx");
  assert.match(result, /label=\{provenance.sourceName\}/u);
  assert.doesNotMatch(result, /label=\{result.provider.name\}/u);
});
test("both privacy notices name every potential external barcode recipient", () => {
  const strings = read("packages/localization/src/index.ts");
  for (const name of ["Open Beauty Facts", "Open Pet Food Facts", "Open Products Facts"]) {
    assert.ok(strings.split(name).length >= 3);
  }
  assert.doesNotMatch(strings, /Food-product barcode lookup|Elintarvikkeiden viivakoodihaku/u);
});
