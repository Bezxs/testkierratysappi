import * as Location from "expo-location";
import { locateOnce } from "./location-session";

export function readDeviceLocation(signal: AbortSignal) {
  return locateOnce(
    {
      requestPermission: Location.requestForegroundPermissionsAsync,
      servicesEnabled: Location.hasServicesEnabledAsync,
      watch: (onFix, onError) =>
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 1000,
            distanceInterval: 0,
          },
          onFix,
          onError,
        ),
    },
    signal,
  );
}
