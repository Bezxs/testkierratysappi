import { expect, it } from "vitest";
import { createNearbySearchIntent } from "../search-intent";

it("does not start location just because a screen or deep link opens", () => {
  expect(createNearbySearchIntent().consumeSearchRequest()).toBe(false);
});
it("consumes one Home action once, without restarting on return or remount", () => {
  const intent = createNearbySearchIntent();
  intent.requestSearch();
  expect(intent.consumeSearchRequest()).toBe(true);
  expect(intent.consumeSearchRequest()).toBe(false);
  intent.requestSearch();
  expect(intent.consumeSearchRequest()).toBe(true);
});
it("expires a delayed navigation and does not retain an expired action", () => {
  let time = 0;
  const intent = createNearbySearchIntent(() => time);
  intent.requestSearch();
  time = 30_001;
  expect(intent.consumeSearchRequest()).toBe(false);
  time = 0;
  expect(intent.consumeSearchRequest()).toBe(false);
});
it("does not turn a backward clock into an action", () => {
  let time = 10;
  const intent = createNearbySearchIntent(() => time);
  intent.requestSearch();
  time = 9;
  expect(intent.consumeSearchRequest()).toBe(false);
});
