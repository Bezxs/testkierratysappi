import { describe, expect, it } from "vitest";
import { localizedText, messages, translate } from "../index";

describe("localization", () => {
  it("keeps Finnish and English key sets in parity", () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.fi).sort());
  });

  it("contains no empty interface messages", () => {
    for (const language of ["fi", "en"] as const) {
      for (const value of Object.values(messages[language])) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("uses KeepItGreen consistently in both languages and privacy/deletion copy", () => {
    for (const language of ["fi", "en"] as const) {
      expect(translate(language, "appName")).toBe("KeepItGreen");
      for (const key of ["privacyDraft", "deleteLocalDataBody", "localDataDeleted"] as const) {
        expect(translate(language, key)).toContain("KeepItGreen");
      }
      expect(Object.values(messages[language]).join(" ")).not.toContain("KierrätysAppi");
    }
  });

  it("selects typed interface and domain text", () => {
    expect(translate("fi", "cameraAction")).toBe("Avaa kamera");
    expect(localizedText("en", { fi: "Lasi", en: "Glass" })).toBe("Glass");
  });

  it("uses explicit local-history and unsent-feedback action copy in both languages", () => {
    expect(translate("fi", "disableHistory")).toBe("Lopeta tallennus ja tyhjennä historia");
    expect(translate("en", "disableHistory")).toBe("Stop saving and clear history");
    expect(translate("fi", "draftNotSent")).toBe("Palautetta ei ole lähetetty.");
    expect(translate("en", "draftNotSent")).toBe("Feedback has not been sent.");
  });

  it("removes blanket reassurance while retaining contextual disclosures and uncertainty", () => {
    for (const language of ["fi", "en"] as const) {
      expect(messages[language]).not.toHaveProperty("privacySummary");
      expect(messages[language]).not.toHaveProperty("loadingDetail");
      expect(translate(language, "cameraPurpose")).toContain("Open Facts");
      expect(translate(language, "nearbyPrivacy")).toContain("OpenStreetMap");
      expect(translate(language, "privacyDraft")).toContain("Open Food Facts");
      expect(translate(language, "legalReview")).toMatch(/JURIDISTA|LEGAL/);
    }
    expect(translate("fi", "materialCodeRecognizedBody")).toContain("pelkkä koodi ei kerro");
    expect(translate("en", "materialCodeRecognizedBody")).toContain("code alone does not tell");
  });
});
