type AppearancePort = {
  read: () => string | null | undefined;
  subscribe: (onChange: () => void) => { remove: () => void };
};

/** React rechecks the snapshot after subscribing, including a change during hydration. */
export function createColorSchemeStore(port: AppearancePort) {
  return {
    getSnapshot: () => (port.read() === "dark" ? ("dark" as const) : ("light" as const)),
    getServerSnapshot: () => "light" as const,
    subscribe: (onChange: () => void) => {
      const subscription = port.subscribe(onChange);
      return () => subscription.remove();
    },
  };
}
