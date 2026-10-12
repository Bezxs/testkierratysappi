import { afterEach, describe, expect, it, vi } from "vitest";
import {
  displayDistance,
  locateOnce,
  type LocationFix,
  type LocationPort,
} from "../location-session";

const fix: LocationFix = {
  coords: { latitude: 60, longitude: 25, accuracy: 100 },
  timestamp: 10_000,
};
function setup(granted = true, enabled = true) {
  let emit: (value: LocationFix) => void = () => undefined;
  let fail: () => void = () => undefined;
  const remove = vi.fn();
  const port: LocationPort = {
    requestPermission: vi.fn(async () => ({ granted })),
    servicesEnabled: vi.fn(async () => enabled),
    watch: vi.fn(async (callback, error) => {
      emit = callback;
      fail = error;
      return { remove };
    }),
  };
  return { port, remove, emit: (value = fix) => emit(value), fail: () => fail() };
}
async function tick() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}
afterEach(() => vi.useRealTimers());

describe("foreground one-shot location", () => {
  it("does not start location acquisition when permission is denied", async () => {
    const { port } = setup(false);
    await expect(locateOnce(port, new AbortController().signal)).rejects.toMatchObject({
      reason: "permission",
    });
    expect(port.watch).not.toHaveBeenCalled();
  });
  it("identifies disabled services", async () => {
    const { port } = setup(true, false);
    await expect(locateOnce(port, new AbortController().signal)).rejects.toMatchObject({
      reason: "services",
    });
    expect(port.watch).not.toHaveBeenCalled();
  });
  it("stops after the first valid fix and ignores later values", async () => {
    const s = setup();
    const result = locateOnce(s.port, new AbortController().signal, 20_000, () => 10_000);
    await tick();
    s.emit();
    expect(await result).toEqual(fix);
    s.emit({ ...fix, coords: { ...fix.coords, latitude: 61 } });
    expect(s.remove).toHaveBeenCalledTimes(1);
  });
  it("accepts approximate permission without requiring a precise upgrade", async () => {
    const s = setup();
    const result = locateOnce(s.port, new AbortController().signal, 20_000, () => 10_000);
    await tick();
    s.emit({ ...fix, coords: { ...fix.coords, accuracy: 3000 } });
    expect((await result).coords.accuracy).toBe(3000);
  });
  it("times out and releases a watch after stale, invalid and inaccurate fixes", async () => {
    vi.useFakeTimers();
    const s = setup();
    const result = locateOnce(s.port, new AbortController().signal, 20_000, () => 100_000);
    const check = expect(result).rejects.toMatchObject({ reason: "timeout" });
    await tick();
    s.emit();
    s.emit({ ...fix, timestamp: 100_000, coords: { ...fix.coords, latitude: NaN } });
    s.emit({ ...fix, timestamp: 100_000, coords: { ...fix.coords, accuracy: 20_000 } });
    await vi.advanceTimersByTimeAsync(20_000);
    await check;
    expect(s.remove).toHaveBeenCalledTimes(1);
  });
  it("cancels on background/navigation and releases a late-starting watch", async () => {
    const s = setup();
    let ready: ((value: { remove: () => void }) => void) | undefined;
    s.port.watch = vi.fn(
      () =>
        new Promise<{ remove: () => void }>((resolve) => {
          ready = resolve;
        }),
    );
    const controller = new AbortController();
    const result = locateOnce(s.port, controller.signal);
    const check = expect(result).rejects.toMatchObject({ reason: "cancelled" });
    await tick();
    controller.abort();
    await check;
    ready?.({ remove: s.remove });
    await tick();
    expect(s.remove).toHaveBeenCalledTimes(1);
  });
  it("does not start a watch if cancelled while the OS permission sheet is open", async () => {
    const s = setup();
    const controller = new AbortController();
    s.port.requestPermission = async () => {
      controller.abort();
      return { granted: true };
    };
    await expect(locateOnce(s.port, controller.signal)).rejects.toMatchObject({
      reason: "cancelled",
    });
    expect(s.port.watch).not.toHaveBeenCalled();
  });
  it("recovers from native acquisition failure without exposing raw errors", async () => {
    const s = setup();
    const result = locateOnce(s.port, new AbortController().signal);
    const check = expect(result).rejects.toMatchObject({ reason: "unavailable" });
    await tick();
    s.fail();
    await check;
    expect(s.remove).toHaveBeenCalledTimes(1);
  });
  it("formats estimates without zero-distance or kilometre-boundary artifacts", () => {
    expect(displayDistance(0, "fi")).toBe("alle 50 m");
    expect(displayDistance(994, "fi")).toBe("990 m");
    expect(displayDistance(999, "fi")).toBe("1,0 km");
    expect(displayDistance(1200, "en")).toBe("1.2 km");
    expect(() => displayDistance(NaN, "fi")).toThrow();
  });
});
