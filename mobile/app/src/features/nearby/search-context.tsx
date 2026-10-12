import { createContext, useContext, useState, type PropsWithChildren } from "react";
import { createNearbySearchIntent } from "./search-intent";

const NearbySearchContext = createContext<ReturnType<typeof createNearbySearchIntent> | null>(null);
export function NearbySearchProvider({ children }: PropsWithChildren) {
  const [intent] = useState(() => createNearbySearchIntent());
  return <NearbySearchContext.Provider value={intent}>{children}</NearbySearchContext.Provider>;
}
export function useNearbySearch() {
  const intent = useContext(NearbySearchContext);
  if (!intent) throw new Error("Nearby search provider missing");
  return intent;
}
