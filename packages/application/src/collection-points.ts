import { CoordinatesSchema, straightLineMeters, type Coordinates } from "@kierratysappi/domain";
import { z } from "zod";

export const CollectionPointSchema = z
  .object({
    id: z.string().regex(/^(node|way|relation)\/[1-9]\d*$/u),
    coordinates: CoordinatesSchema,
    name: z.string().min(1).max(160).nullable(),
    address: z.string().min(1).max(240).nullable(),
    access: z.enum(["reported_public", "unknown"]),
    kind: z.enum(["container", "centre", "unknown"]),
  })
  .strict();

export const CollectionDirectorySchema = z
  .object({
    version: z.literal(1),
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
