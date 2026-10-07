import { CoordinatesSchema, type Coordinates } from "@kierratysappi/domain";

export type LocationFailure = "permission" | "services" | "timeout" | "unavailable" | "cancelled";
export class LocationIssue extends Error {
  constructor(readonly reason: LocationFailure) {
    super(reason);
  }
}
export type LocationFix = { coords: Coordinates & { accuracy: number | null }; timestamp: number };
export type LocationPort = {
  requestPermission: () => Promise<{ granted: boolean }>;
  servicesEnabled: () => Promise<boolean>;
  watch: (
    onFix: (fix: LocationFix) => void,
    onError: () => void,
  ) => Promise<{ remove: () => void }>;
};

/** A short foreground subscription, removed on first usable fix, cancel, error or timeout. */
export async function locateOnce(
  port: LocationPort,
  signal: AbortSignal,
  timeoutMs = 20_000,
  now = Date.now,
): Promise<LocationFix> {
  if (signal.aborted) throw new LocationIssue("cancelled");
  const permission = await port.requestPermission();
  if (signal.aborted) throw new LocationIssue("cancelled");
  if (!permission.granted) throw new LocationIssue("permission");
  if (!(await port.servicesEnabled())) throw new LocationIssue("services");
  if (signal.aborted) throw new LocationIssue("cancelled");
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: { remove: () => void } | undefined;
    const finish = (fix?: LocationFix, reason: LocationFailure = "unavailable") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      subscription?.remove();
      if (fix) resolve(fix);
      else reject(new LocationIssue(reason));
    };
    const abort = () => finish(undefined, "cancelled");
    const timer = setTimeout(() => finish(undefined, "timeout"), timeoutMs);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    void Promise.resolve()
      .then(() => {
        if (settled) return undefined;
        return port.watch(
          (fix) => {
            const accuracy = fix.coords.accuracy;
            if (
              !CoordinatesSchema.safeParse(fix.coords).success ||
              accuracy === null ||
              !Number.isFinite(accuracy) ||
              accuracy < 0 ||
              accuracy > 10_000 ||
              !Number.isFinite(fix.timestamp) ||
              now() - fix.timestamp > 60_000 ||
              fix.timestamp > now() + 5_000
            )
              return;
            finish(fix);
          },
          () => finish(),
        );
      })
      .then((watch) => {
        if (!watch) return;
        subscription = watch;
        // Native setup can complete after cancellation or a synchronous first callback.
        if (settled) watch.remove();
      })
      .catch(() => finish());
  });
}

export function displayDistance(meters: number, language: "fi" | "en"): string {
  if (!Number.isFinite(meters) || meters < 0) throw new Error("Invalid distance");
  if (meters < 50) return language === "fi" ? "alle 50 m" : "under 50 m";
  if (meters < 995) return `${Math.round(meters / 10) * 10} m`;
  const km = (meters / 1000).toFixed(1);
  return `${language === "fi" ? km.replace(".", ",") : km} km`;
}
