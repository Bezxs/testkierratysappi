import { describe, expect, it, vi } from "vitest";
import { createColorSchemeStore } from "../color-scheme-store";

describe("reactive appearance store", () => {
  it("rechecks a change between initial read and subscription instead of retaining stale light", () => {
    let scheme = "light";
    const store = createColorSchemeStore({
      read: () => scheme,
      subscribe: () => ({ remove() {} }),
    });
    expect(store.getSnapshot()).toBe("light");
    scheme = "dark";
    store.subscribe(vi.fn());
    expect(store.getSnapshot()).toBe("dark");
    expect(store.getServerSnapshot()).toBe("light");
  });

  it("forwards live notifications and tears down the appearance listener", () => {
    let listener = () => {};
    const remove = vi.fn();
    const changed = vi.fn();
    const store = createColorSchemeStore({
      read: () => "dark",
      subscribe: (callback) => {
        listener = callback;
        return { remove };
      },
    });
    const unsubscribe = store.subscribe(changed);
    listener();
    expect(changed).toHaveBeenCalledOnce();
    unsubscribe();
    expect(remove).toHaveBeenCalledOnce();
  });

  it("uses stable light snapshots for unspecified appearance", () => {
    for (const scheme of [null, undefined, "unspecified"]) {
      const store = createColorSchemeStore({
        read: () => scheme,
        subscribe: () => ({ remove() {} }),
      });
      expect(store.getSnapshot()).toBe("light");
    }
  });
});
