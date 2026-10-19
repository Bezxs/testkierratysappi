import {
  CollectionDirectorySchema,
  collectionPointUrl,
  collectionPointMapUrl,
  directoryAgeDays,
  nearestCollectionPoint,
} from "@kierratysappi/contracts/collection-points";
import { CoordinatesSchema, type Coordinates } from "@kierratysappi/domain";
import type { MessageKey } from "@kierratysappi/localization";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import { AppState, Keyboard, Linking, Platform, StyleSheet, TextInput, View } from "react-native";
import snapshot from "@/assets/data/finland-recycling.json";
import {
  AppText,
  Button,
  InlineLink,
  PageHeader,
  PageIntro,
  Paper,
  Rule,
  Screen,
} from "@/components/ui";
import { announceAccessibility } from "@/features/accessibility/announcements";
import { readDeviceLocation } from "@/features/nearby/device-location";
import { displayDistance, LocationIssue } from "@/features/nearby/location-session";
import { resolvePointAddress } from "@/features/nearby/point-address";
import { useLanguage } from "@/i18n/language-context";
import { controls, radius, spacing, useAppTheme } from "@/theme/tokens";

const directory = CollectionDirectorySchema.safeParse(snapshot);
type Result = NonNullable<ReturnType<typeof nearestCollectionPoint>> & { accuracy: number };
type State =
  | { status: "idle" | "loading" }
  | { status: "error"; message: MessageKey }
  | { status: "ready"; result: Result };

const errors = {
  permission: "nearbyPermission",
  services: "nearbyServices",
  timeout: "nearbyTimeout",
  unavailable: "nearbyUnavailable",
  cancelled: "nearbyUnavailable",
} as const;

type GeocodingResult = { lat: string; lon: string };

function isGeocodingResult(value: unknown): value is GeocodingResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return typeof result.lat === "string" && typeof result.lon === "string";
}

async function geoLocation(input: string): Promise<Coordinates> {
  const query = input.trim();
  if (!query || query.length > 160) throw new Error("invalid");
  const isPostalCode = /^\d{5}$/.test(query);
  const url = isPostalCode
    ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
        query,
      )}&country=Finland&format=json&limit=1`
    : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query,
      )}&countrycodes=fi&format=json&limit=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "KierratysAppi-Mobile/1.0 (https://github.com/roopeaal/KierratysAppi)",
      "Accept-Language": "fi",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length === 0 || !isGeocodingResult(data[0])) {
    throw new Error("not-found");
  }

  const coordinates = {
    latitude: Number(data[0].lat),
    longitude: Number(data[0].lon),
  };
  const parsed = CoordinatesSchema.safeParse(coordinates);
  if (!parsed.success) throw new Error("not-found");
  return parsed.data;
}

export default function NearbyScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { t, language } = useLanguage();
  const [state, setState] = useState<State>({ status: "idle" });
  const [linkError, setLinkError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const active = useRef<AbortController | null>(null);
  const addressRequest = useRef<AbortController | null>(null);
  const [address, setAddress] = useState<{
    status: "idle" | "loading" | "done";
    text: string | null;
  }>({ status: "idle", text: null });
  const [locationInput, setLocationInput] = useState("");
  const [locationError, setLocationError] = useState<MessageKey | null>(null);
  const [locationFocused, setLocationFocused] = useState(false);

  const clear = useCallback(() => {
    addressRequest.current?.abort();
    addressRequest.current = null;
    setAddress({ status: "idle", text: null });
    setDetailsOpen(false);
    setPrivacyOpen(false);
    active.current?.abort();
    active.current = null;
    setState({ status: "idle" });
    setLinkError(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      const listener = AppState.addEventListener("change", (next) => {
        // A permission sheet may be inactive. Only actual backgrounding clears the query.
        if (next === "background") clear();
      });
      return () => {
        listener.remove();
        clear();
      };
    }, [clear]),
  );

  const find = async (method: "device" | "manual" = "device") => {
    if (active.current) return;
    clear();

    if (!directory.success) {
      setState({ status: "error", message: "nearbyDataError" });
      return;
    }

    const controller = new AbortController();
    active.current = controller;
    setState({ status: "loading" });
    announceAccessibility(t("nearbyLoading"));

    try {
      const coords =
        method === "manual"
          ? await geoLocation(locationInput)
          : (await readDeviceLocation(controller.signal)).coords;

      if (controller.signal.aborted) return;
      const result = nearestCollectionPoint(directory.data.points, coords);
      if (!result || result.distanceMeters > 100_000) {
        setState({ status: "error", message: "nearbyNoResult" });
        announceAccessibility(t("nearbyNoResult"), "high");
      } else {
        setState({ status: "ready", result: { ...result, accuracy: 0 } });
        announceAccessibility(
          `${t("nearbyResult")}. ${result.point.name ?? t("nearbyGeneric")}. ${t("nearbyEstimate")}: ${displayDistance(result.distanceMeters, language)}.`,
          "high",
        );
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        method === "manual"
          ? error instanceof Error && error.message === "invalid"
            ? "nearbyLocationInvalid"
            : error instanceof Error && error.message === "not-found"
              ? "nearbyLocationNotFound"
              : "nearbyLocationError"
          : error instanceof LocationIssue
            ? errors[error.reason]
            : "nearbyUnavailable";
      setState({ status: "error", message });
      announceAccessibility(t(message), "high");
    } finally {
      if (active.current === controller) active.current = null;
    }
  };

  const findByLocation = () => {
    Keyboard.dismiss();
    setLocationError(null);
    if (!locationInput.trim() || locationInput.trim().length > 160) {
      setLocationError("nearbyLocationInvalid");
      return;
    }
    void find("manual");
  };

  const openUrl = (url: string) => {
    setLinkError(false);
    void Linking.openURL(url).catch(() => {
      setLinkError(true);
      announceAccessibility(t("nearbyLinkError"), "high");
    });
  };
  const completeAddress = async () => {
    if (state.status !== "ready" || address.status !== "idle" || addressRequest.current) return;
    const controller = new AbortController();
    addressRequest.current = controller;
    setAddress({ status: "loading", text: null });
    announceAccessibility(t("nearbyAddressLoading"));
    const text = await resolvePointAddress(
      state.result.point,
      Location.reverseGeocodeAsync,
      controller.signal,
    );
    if (!controller.signal.aborted) {
      setAddress({ status: "done", text });
      announceAccessibility(
        text ? `${t("nearbyAddressEstimate")}: ${text}` : t("nearbyAddressFailed"),
      );
    }
    if (addressRequest.current === controller) addressRequest.current = null;
  };

  return (
    <Screen testID="nearby-screen">
      <PageHeader
        onBack={() => {
          clear();
          router.back();
        }}
        label={t("close")}
        testID="nearby-close-action"
      />
      <PageIntro
        title={t("nearbyTitle")}
        body={state.status !== "ready" ? t("nearbyIntro") : undefined}
      />
      <View style={styles.body}>
        {state.status !== "ready" && (
          <Button
            label={t("nearbyFind")}
            onPress={() => void find()}
            busy={state.status === "loading"}
            testID="nearby-find"
          />
        )}

        {state.status !== "ready" && (
          <Paper>
            <View style={styles.stack}>
              <AppText variant="label" nativeID="nearby-location-label">
                {t("nearbyLocationLabel")}
              </AppText>
              <TextInput
                accessibilityLabel={t("nearbyLocationLabel")}
                accessibilityLabelledBy="nearby-location-label"
                accessibilityHint={t("nearbyLocationHint")}
                autoCorrect={false}
                autoCapitalize="words"
                maxLength={160}
                onChangeText={(text) => {
                  setLocationInput(text);
                  setLocationError(null);
                }}
                onSubmitEditing={findByLocation}
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setLocationFocused(false)}
                placeholder={t("nearbyLocationPlaceholder")}
                placeholderTextColor={palette.faint}
                returnKeyType="search"
                style={[
                  styles.locationInput,
                  {
                    backgroundColor: palette.surfaceRaised,
                    borderColor: locationError
                      ? palette.brick
                      : locationFocused
                        ? palette.actionPrimary
                        : palette.borderStrong,
                    color: palette.ink,
                  },
                ]}
                value={locationInput}
                testID="nearby-location-input"
              />
              <AppText variant="small" muted>
                {t("nearbyLocationHint")}
              </AppText>
              {locationError && (
                <AppText
                  style={{ color: palette.brick }}
                  accessibilityRole="alert"
                  testID="nearby-location-error"
                >
                  {t(locationError)}
                </AppText>
              )}
            </View>
            <Button
              label={t("nearbyLocationAction")}
              variant="secondary"
              onPress={findByLocation}
              busy={state.status === "loading"}
              disabled={locationInput.trim().length === 0}
              testID="nearby-location-submit"
            />
          </Paper>
        )}

        {state.status === "loading" && (
          <View style={styles.stack}>
            <AppText accessibilityLiveRegion="polite">{t("nearbyLoading")}</AppText>
            <Button label={t("cancel")} variant="secondary" onPress={clear} />
          </View>
        )}
        {state.status === "error" && (
          <View
            style={[
              styles.error,
              { backgroundColor: palette.brickSoft, borderColor: palette.brick },
            ]}
          >
            <AppText accessibilityRole="alert">{t(state.message)}</AppText>
            {(state.message === "nearbyPermission" || state.message === "nearbyServices") &&
              (Platform.OS === "web" ? (
                <AppText muted>{t("nearbySettingsHint")}</AppText>
              ) : (
                <Button
                  label={t("openSettings")}
                  variant="secondary"
                  onPress={() => {
                    void Linking.openSettings().catch(() => setLinkError(true));
                  }}
                />
              ))}
          </View>
        )}
        {state.status === "ready" && (
          <Paper testID="nearby-result">
            <View style={styles.stack}>
              <AppText variant="small" muted>
                {t("nearbyResultShort")}
              </AppText>
              <AppText variant="heading" accessibilityRole="header">
                {state.result.point.name ?? t("nearbyGeneric")}
              </AppText>
              {state.result.point.name && state.result.point.kind !== "unknown" && (
                <AppText variant="small" muted>
                  {t(state.result.point.kind === "centre" ? "nearbyCentre" : "nearbyContainer")}
                </AppText>
              )}
              <View style={styles.distance}>
                <AppText variant="heading">
                  {displayDistance(state.result.distanceMeters, language)}
                </AppText>
                <AppText variant="small" muted>
                  {t("nearbyDistanceShort")}
                </AppText>
              </View>
              {state.result.point.address ? (
                <AppText>{state.result.point.address}</AppText>
              ) : address.text ? (
                <View style={styles.stack}>
                  <AppText variant="small" muted>
                    {t("nearbyAddressLabel")}
                  </AppText>
                  <AppText>{address.text}</AppText>
                  <AppText variant="small" muted>
                    {t("nearbyAddressSource")}
                  </AppText>
                </View>
              ) : (
                <AppText variant="small" muted>
                  {t(address.status === "done" ? "nearbyAddressFailed" : "nearbyAddressUnknown")}
                </AppText>
              )}
            </View>
            <Button
              label={t("nearbyShowMap")}
              onPress={() => openUrl(collectionPointMapUrl(state.result.point))}
              accessibilityHint={t("nearbyMapHint")}
              testID="nearby-map"
            />
            <AppText variant="small" muted>
              {t("nearbyShortMapHint")}
            </AppText>
            {!state.result.point.address && Platform.OS !== "web" && address.status !== "done" && (
              <View style={styles.stack}>
                <AppText variant="small" muted>
                  {t("nearbyAddressConsent")}
                </AppText>
                <Button
                  label={t("nearbyCompleteAddress")}
                  variant="quiet"
                  busy={address.status === "loading"}
                  onPress={() => void completeAddress()}
                  testID="nearby-address"
                />
                {address.status === "loading" && (
                  <AppText variant="small" accessibilityLiveRegion="polite">
                    {t("nearbyAddressLoading")}
                  </AppText>
                )}
              </View>
            )}
            <Rule />
            {state.result.accuracy > 100 && <AppText>{t("nearbyApproximate")}</AppText>}
            <AppText variant="small" muted>
              {t("nearbyUnverified")}
            </AppText>
            <AppText variant="small">{t("nearbyQuickCaution")}</AppText>
            <InlineLink
              label={t(detailsOpen ? "nearbyLess" : "nearbyMore")}
              role="button"
              expanded={detailsOpen}
              onPress={() => setDetailsOpen((open) => !open)}
              testID="nearby-details-toggle"
            />
            {detailsOpen && (
              <View style={styles.stack} testID="nearby-details">
                <AppText variant="small" muted>
                  {t("nearbyPointType")}:{" "}
                  {t(
                    state.result.point.kind === "centre"
                      ? "nearbyCentre"
                      : state.result.point.kind === "container"
                        ? "nearbyContainer"
                        : "nearbyTypeUnknown",
                  )}
                </AppText>
                {!state.result.point.name && (
                  <AppText variant="small" muted>
                    {t("nearbyNameUnknown")}
                  </AppText>
                )}
                <AppText variant="small" muted>
                  {t("nearbyPointId")}: {state.result.point.id}
                </AppText>
                <AppText variant="small" muted>
                  {t("nearbyAccuracy")}: ±{Math.max(1, Math.ceil(state.result.accuracy / 10) * 10)}{" "}
                  m
                </AppText>
                <AppText variant="small" muted>
                  {t("nearbyCaution")}
                </AppText>
                <AppText variant="small" muted>
                  {t("nearbyAddressDisclosure")}
                </AppText>
                <InlineLink
                  label={t("nearbyDetails")}
                  accessibilityHint={t("nearbyExternalHint")}
                  onPress={() => openUrl(collectionPointUrl(state.result.point))}
                />
              </View>
            )}
          </Paper>
        )}
        {state.status === "ready" && (
          <Button
            label={t("nearbyRefresh")}
            variant="quiet"
            onPress={() => void find()}
            testID="nearby-find"
          />
        )}
        {linkError && <AppText accessibilityRole="alert">{t("nearbyLinkError")}</AppText>}
        <View style={[styles.provenance, { borderColor: palette.borderSubtle }]}>
          <AppText variant="small" muted>
            {t("nearbyScope")}
          </AppText>
          {directory.success && (
            <>
              <AppText variant="small" muted>
                {t("nearbyRetrieved")}:{" "}
                {new Date(directory.data.retrievedAt).toLocaleDateString(
                  language === "fi" ? "fi-FI" : "en-GB",
                )}
              </AppText>
              {directoryAgeDays(directory.data) > 30 && <AppText>{t("nearbyStale")}</AppText>}
              <InlineLink
                label={t("nearbySource")}
                onPress={() => openUrl(directory.data.attributionUrl)}
              />
            </>
          )}
          <InlineLink
            label={t(privacyOpen ? "nearbyPrivacyLess" : "nearbyPrivacyMore")}
            role="button"
            expanded={privacyOpen}
            onPress={() => setPrivacyOpen((open) => !open)}
            testID="nearby-privacy-toggle"
          />
          {privacyOpen && (
            <View style={styles.stack}>
              <AppText variant="small" muted>
                {t("nearbyPurpose")}
              </AppText>
              <AppText variant="small" muted>
                {t("nearbyCaution")}
              </AppText>
              <AppText variant="small" muted>
                {t("nearbyAddressDisclosure")}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  distance: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: spacing.sm },
  stack: { gap: spacing.xs },
  provenance: { gap: spacing.sm, paddingTop: spacing.lg, borderTopWidth: 1 },
  error: {
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  locationInput: {
    minHeight: controls.inputMinHeight,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: "Atkinson_400Regular",
    fontSize: 18,
    lineHeight: 26,
  },
});
