import { describe, expect, it } from "vitest";
import {
  CollectionDirectorySchema,
  collectionPointUrl,
  collectionPointMapUrl,
  directoryAgeDays,
  nearestCollectionPoint,
  type CollectionPoint,
} from "../collection-points";

const point: CollectionPoint = {
  id: "node/1",
  coordinates: { latitude: 60, longitude: 25 },
  name: null,
  address: null,
  access: "unknown",
  kind: "unknown",
};
const directory = {
  version: 1,
  source: "OpenStreetMap contributors",
  attributionUrl: "https://www.openstreetmap.org/copyright",
  license: "ODbL-1.0",
  licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
  retrievedAt: "2026-10-06T00:00:00Z",
  dataTimestamp: "2026-10-05T23:00:00Z",
  coverage: "FI",
  points: [point],
};

describe("local collection directory contract", () => {
  it("opens a marked map at the public point, including when its address is missing", () => {
    expect(collectionPointMapUrl(point)).toBe(
      "https://www.openstreetmap.org/?mlat=60&mlon=25#map=18/60/25",
    );
    expect(() =>
      collectionPointMapUrl({
        ...point,
        coordinates: { latitude: 999, longitude: 25 },
      }),
    ).toThrow();
  });
  it("does not make old upstream data fresh by downloading it again", () => {
    const parsed = CollectionDirectorySchema.parse({
      ...directory,
      dataTimestamp: "2026-01-01T00:00:00Z",
    });
    expect(directoryAgeDays(parsed, Date.parse("2026-10-06T00:00:00Z"))).toBeGreaterThan(30);
  });
  it("preserves unknown access and unnamed points without fabricating metadata", () => {
    expect(CollectionDirectorySchema.parse(directory).points[0]).toEqual(point);
  });
  it("rejects missing licence, foreign source URLs and malformed positions", () => {
    expect(CollectionDirectorySchema.safeParse({ ...directory, license: undefined }).success).toBe(
      false,
    );
    expect(
      CollectionDirectorySchema.safeParse({ ...directory, attributionUrl: "https://evil.invalid" })
        .success,
    ).toBe(false);
    expect(
      CollectionDirectorySchema.safeParse({
        ...directory,
        points: [{ ...point, coordinates: { latitude: 999, longitude: 25 } }],
      }).success,
    ).toBe(false);
  });
  it("chooses nearest by actual distance without mutating data and resolves ties stably", () => {
    const far = { ...point, id: "node/2", coordinates: { latitude: 61, longitude: 25 } };
    const list = Object.freeze([far, point]);
    expect(nearestCollectionPoint(list, point.coordinates)?.point.id).toBe("node/1");
    expect(
      nearestCollectionPoint([{ ...point, id: "node/3" }, point], point.coordinates)?.point.id,
    ).toBe("node/1");
    expect(list[0]).toBe(far);
  });
  it("does not invent a point for an empty directory", () => {
    expect(nearestCollectionPoint([], point.coordinates)).toBeNull();
  });
  it("only constructs allowlisted source links without user location", () => {
    expect(collectionPointUrl(point)).toBe("https://www.openstreetmap.org/node/1");
    expect(() => collectionPointUrl({ ...point, id: "../evil" })).toThrow();
  });
  it("distinguishes data age from a physical verification date", () => {
    expect(
      directoryAgeDays(
        CollectionDirectorySchema.parse(directory),
        Date.parse("2026-11-06T00:00:00Z"),
      ),
    ).toBe(31);
  });
});
