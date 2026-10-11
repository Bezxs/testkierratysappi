/** A short-lived in-memory action, never a URL flag or stored location permission. */
export function createNearbySearchIntent(now: () => number = Date.now) {
  let requestedAt: number | null = null;
  return {
    requestSearch() {
      requestedAt = now();
    },
    consumeSearchRequest() {
      const requested = requestedAt;
      requestedAt = null;
      const elapsed = requested === null ? Infinity : now() - requested;
      return elapsed >= 0 && elapsed <= 30_000;
    },
  };
}
