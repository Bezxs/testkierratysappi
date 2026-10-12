import { z } from "zod";

export const CoordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

/** Great-circle distance, not a walking/driving route or entrance distance. */
export function straightLineMeters(from: Coordinates, to: Coordinates): number {
  CoordinatesSchema.parse(from);
  CoordinatesSchema.parse(to);
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = radians(to.latitude - from.latitude);
  const deltaLongitude = radians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 6_371_008.8 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}
