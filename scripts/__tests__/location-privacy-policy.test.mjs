import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
test("nearest result identifies the source point without inventing missing names or types", () => {
  const screen = read("apps/mobile/src/app/nearby.tsx");
  assert.match(screen, /point\.name \?\? t\("nearbyGeneric"\)/u);
  for (const key of [
    "nearbyPointType",
    "nearbyCentre",
    "nearbyContainer",
    "nearbyTypeUnknown",
    "nearbyPointId",
  ])
    assert.ok(screen.includes(key));
  assert.match(screen, /state\.result\.point\.id/u);
  assert.match(screen, /state\.result\.point\.address/u);
  for (const text of [
    "Pisteen nimeä ei ole aineistossa",
    "Point name is not available in the directory",
  ])
    assert.ok(read("packages/localization/src/nearby.ts").includes(text));
});
test("location native configuration is foreground-only with localised purpose", () => {
  const config = JSON.parse(read("apps/mobile/app.json")).expo;
  const plugin = config.plugins.find((p) => Array.isArray(p) && p[0] === "expo-location")[1];
  for (const field of [
    "isIosBackgroundLocationEnabled",
    "isAndroidBackgroundLocationEnabled",
    "isAndroidForegroundServiceEnabled",
    "locationAlwaysPermission",
    "locationAlwaysAndWhenInUsePermission",
    "motionUsagePermission",
  ]) {
    assert.equal(plugin[field], false);
  }
  for (const language of ["fi", "en"])
    assert.ok(
      JSON.parse(read(`apps/mobile/locales/${language}.json`)).ios
        .NSLocationWhenInUseUsageDescription,
    );
  assert.ok(
    config.android.blockedPermissions.includes("android.permission.ACCESS_BACKGROUND_LOCATION"),
  );
});
test("nearby makes map primary, keeps uncertainty visible and progressively discloses metadata", () => {
  const screen = read("apps/mobile/src/app/nearby.tsx");
  const map = screen.slice(
    screen.indexOf('label={t("nearbyShowMap")}'),
    screen.indexOf('testID="nearby-map"'),
  );
  assert.doesNotMatch(map, /variant="secondary"/u);
  assert.match(map, /accessibilityHint/u);
  assert.match(screen, /expanded=\{detailsOpen\}/u);
  assert.match(screen, /detailsOpen &&/u);
  assert.match(screen, /nearbyQuickCaution/u);
  assert.match(screen, /nearbyUnverified/u);
  assert.ok(screen.indexOf('testID="nearby-map"') < screen.indexOf('t("nearbyPointId")'));
  assert.match(
    read("apps/mobile/src/components/ui.tsx"),
    /accessibilityState=\{expanded === undefined \? undefined : \{ expanded \}\}/u,
  );
  assert.match(read("apps/mobile/src/components/ui.tsx"), /aria-expanded=\{expanded\}/u);
});
test("optional address lookup retains consent and explicit loading without automatic acquisition", () => {
  const screen = read("apps/mobile/src/app/nearby.tsx");
  assert.match(screen, /nearbyAddressConsent/u);
  assert.match(screen, /nearbyAddressLoading/u);
  assert.match(screen, /onPress=\{\(\) => void completeAddress\(\)\}/u);
  assert.match(screen, /nearbyAddressSource/u);
  assert.match(screen, /setDetailsOpen\(false\)/u);
  assert.match(screen, /setPrivacyOpen\(false\)/u);
});
test("all surfaces share one reactive theme so live color-scheme changes stay coherent", () => {
  const tokens = read("apps/mobile/src/theme/tokens.ts");
  const layout = read("apps/mobile/src/app/_layout.tsx");
  assert.match(tokens, /AppThemeProvider/u);
  assert.match(tokens, /useContext\(AppThemeContext\)/u);
  assert.equal((tokens.match(/useColorScheme\(\)/gu) ?? []).length, 1);
  assert.match(layout, /<AppThemeProvider>/u);
  assert.match(read("apps/mobile/src/components/ui.tsx"), /aria-busy=\{busy\}/u);
});
test("nearby screen has explicit acquisition, cleanup and no location network/storage channel", () => {
  const screen = read("apps/mobile/src/app/nearby.tsx");
  const device = read("apps/mobile/src/features/nearby/device-location.ts");
  const session = read("apps/mobile/src/features/nearby/location-session.ts");
  assert.match(screen, /onPress=\{\(\) => void find\(\)\}/u);
  assert.match(screen, /next === "background"/u);
  assert.match(screen, /useFocusEffect/u);
  assert.match(screen, /announceAccessibility/u);
  assert.match(screen, /nearbyCaution/u);
  assert.match(screen, /nearbySource/u);
  assert.doesNotMatch(
    screen + device + session,
    /fetch\(|AsyncStorage|console\.|trackEvent|requestBackgroundPermissions|startLocationUpdates/u,
  );
});
test("nearby uses existing components and bundled real data, without replacing the old Home", () => {
  const home = read("apps/mobile/src/app/index.tsx");
  assert.match(home, /home-nearby-action/u);
  assert.match(home, /home-scan-action/u);
  assert.match(home, /home-manual-action/u);
  assert.match(read("apps/mobile/src/app/nearby.tsx"), /finland-recycling\.json/u);
  assert.match(read("apps/mobile/assets/data/README.md"), /Open Database License 1\.0/u);
});
