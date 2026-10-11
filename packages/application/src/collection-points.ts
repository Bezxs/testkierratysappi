import { CoordinatesSchema, straightLineMeters, type Coordinates } from "@kierratysappi/domain";
import { z } from "zod";

export const CollectionMaterialSchema = z.enum([
  "glass",
  "glassBottles",
  "plastic",
  "plasticPackaging",
  "plasticBottles",
  "paper",
  "paperPackaging",
  "cardboard",
  "cartons",
  "beverageCartons",
  "metal",
  "metalPackaging",
  "smallMetal",
  "scrapMetal",
  "cans",
  "aluminium",
  "batteries",
  "carBatteries",
  "electricalAppliances",
  "smallElectricalAppliances",
  "clothes",
  "textiles",
  "shoes",
  "wood",
  "gardenWaste",
  "foodWaste",
  "hazardousWaste",
  "fluorescentTubes",
  "lightBulbs",
  "tyres",
]);
export type CollectionMaterial = z.infer<typeof CollectionMaterialSchema>;
const reportedMaterials = z
  .array(CollectionMaterialSchema)
  .max(30)
  .refine((values) => new Set(values).size === values.length, "Duplicate material");

export const CollectionPointSchema = z
  .object({
    id: z.string().regex(/^(node|way|relation)\/[1-9]\d*$/u),
    coordinates: CoordinatesSchema,
    name: z.string().min(1).max(160).nullable(),
    operator: z.string().min(1).max(160).nullable(),
    address: z.string().min(1).max(240).nullable(),
    access: z.enum(["reported_public", "unknown"]),
    kind: z.enum(["container", "centre", "unknown"]),
    reportedMaterials,
    reportedExclusions: reportedMaterials,
  })
  .strict()
  .refine(
    (point) => !point.reportedMaterials.some((m) => point.reportedExclusions.includes(m)),
    "Conflicting material report",
  );

export const CollectionDirectorySchema = z
  .object({
    version: z.literal(2),
    source: z.literal("OpenStreetMap contributors"),
    attributionUrl: z.literal("https://www.openstreetmap.org/copyright"),
    license: z.literal("ODbL-1.0"),
    licenseUrl: z.literal("https://opendatacommons.org/licenses/odbl/1-0/"),
    retrievedAt: z.iso.datetime(),
    dataTimestamp: z.iso.datetime(),
    coverage: z.literal("FI"),
    points: z.array(CollectionPointSchema).min(1).max(20_000),
  })
  .strict();

export type CollectionDirectory = z.infer<typeof CollectionDirectorySchema>;
export type CollectionPoint = z.infer<typeof CollectionPointSchema>;
export type NearbyCollectionPoint = {
  readonly point: CollectionPoint;
  readonly distanceMeters: number;
};

/** Rank reported points, not verified material suitability; never mutate the directory. */
export function nearestCollectionPoints(
  points: readonly CollectionPoint[],
  position: Coordinates,
  limit = 5,
): readonly NearbyCollectionPoint[] {
  CoordinatesSchema.parse(position);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20)
    throw new RangeError("Invalid point limit");
  return points
    .map((point) => ({ point, distanceMeters: straightLineMeters(position, point.coordinates) }))
    .filter(({ distanceMeters }) => distanceMeters <= 100_000)
    .sort(
      (a, b) => a.distanceMeters - b.distanceMeters || a.point.id.localeCompare(b.point.id, "en"),
    )
    .slice(0, limit);
}

export function nearestCollectionPoint(
  points: readonly CollectionPoint[],
  position: Coordinates,
): { point: CollectionPoint; distanceMeters: number } | null {
  CoordinatesSchema.parse(position);
  let nearest: { point: CollectionPoint; distanceMeters: number } | null = null;
  for (const point of points) {
    const distanceMeters = straightLineMeters(position, point.coordinates);
    if (
      !nearest ||
      distanceMeters < nearest.distanceMeters ||
      (distanceMeters === nearest.distanceMeters && point.id < nearest.point.id)
    ) {
      nearest = { point, distanceMeters };
    }
  }
  return nearest;
}

export function collectionPointUrl(point: CollectionPoint): string {
  return `https://www.openstreetmap.org/${CollectionPointSchema.parse(point).id}`;
}

export function collectionPointMapUrl(point: CollectionPoint): string {
  const { latitude, longitude } = CollectionPointSchema.parse(point).coordinates;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
}

export function directoryAgeDays(directory: CollectionDirectory, now = Date.now()): number {
  return Math.max(
    0,
    Math.floor(
      (now - Math.min(Date.parse(directory.retrievedAt), Date.parse(directory.dataTimestamp))) /
        86_400_000,
    ),
  );
}
