import { CollectionMaterialSchema } from "@kierratysappi/contracts/collection-points";
import { translate } from "@kierratysappi/localization";
import { describe, expect, it } from "vitest";
import { collectionMaterialLabels } from "../material-label";

describe("collection material labels", () => {
  it("labels every reported material in both interface languages", () => {
    expect(Object.keys(collectionMaterialLabels).sort()).toEqual(
      [...CollectionMaterialSchema.options].sort(),
    );
    for (const language of ["fi", "en"] as const) {
      for (const key of Object.values(collectionMaterialLabels))
        expect(translate(language, key).trim()).not.toBe("");
    }
  });

  it("does not turn broad plastic, glass or metal into packaging acceptance", () => {
    for (const language of ["fi", "en"] as const) {
      expect(translate(language, collectionMaterialLabels.plastic)).not.toBe(
        translate(language, collectionMaterialLabels.plasticPackaging),
      );
      expect(translate(language, collectionMaterialLabels.plasticPackaging)).not.toBe(
        translate(language, collectionMaterialLabels.plasticBottles),
      );
      expect(translate(language, collectionMaterialLabels.glass)).not.toBe(
        translate(language, collectionMaterialLabels.glassBottles),
      );
      expect(translate(language, collectionMaterialLabels.metal)).not.toBe(
        translate(language, collectionMaterialLabels.metalPackaging),
      );
    }
  });
});
