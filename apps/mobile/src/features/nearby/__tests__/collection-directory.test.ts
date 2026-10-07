import { CollectionDirectorySchema } from "@kierratysappi/application/collection-points";
import { expect, it } from "vitest";
import snapshot from "../../../../assets/data/finland-recycling.json";

it("validates the entire bundled point database against the runtime contract", () => {
  const parsed = CollectionDirectorySchema.parse(snapshot);
  expect(new Set(parsed.points.map((p) => p.id)).size).toBe(parsed.points.length);
});
