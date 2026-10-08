import {
  CollectionDirectorySchema,
  collectionPointUrl,
  collectionPointMapUrl,
  directoryAgeDays,
  nearestCollectionPoint,
} from "@kierratysappi/application/collection-points";
import type { MessageKey } from "@kierratysappi/localization";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import { AppState, Linking, Platform, StyleSheet, View } from "react-native";
import snapshot from "@/assets/data/finland-recycling.json";
import { AppText, BrandLockup, Button, InlineLink, Paper, Rule, Screen } from "@/components/ui";
import { announceAccessibility } from "@/features/accessibility/announcements";
import { readDeviceLocation } from "@/features/nearby/device-location";
import { displayDistance, LocationIssue } from "@/features/nearby/location-session";
import { resolvePointAddress } from "@/features/nearby/point-address";
import { useLanguage } from "@/i18n/language-context";
import { spacing } from "@/theme/tokens";

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

export default function NearbyScreen() {
  const router = useRouter();
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

  const find = async () => {
    if (active.current) return;
    setDetailsOpen(false);
    addressRequest.current?.abort();
    addressRequest.current = null;
    setAddress({ status: "idle", text: null });
    setLinkError(false);
    if (!directory.success) {
      setState({ status: "error", message: "nearbyDataError" });
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setState({ status: "loading" });
    announceAccessibility(t("nearbyLoading"));
    try {
      const fix = await readDeviceLocation(controller.signal);
      if (controller.signal.aborted) return;
      const result = nearestCollectionPoint(directory.data.points, fix.coords);
      if (!result || result.distanceMeters > 100_000) {
        setState({ status: "error", message: "nearbyNoResult" });
        announceAccessibility(t("nearbyNoResult"), "high");
      } else {
        setState({ status: "ready", result: { ...result, accuracy: fix.coords.accuracy ?? 0 } });
        announceAccessibility(
          `${t("nearbyResult")}. ${result.point.name ?? t("nearbyGeneric")}. ${t("nearbyEstimate")}: ${displayDistance(result.distanceMeters, language)}.`,
          "high",
        );
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof LocationIssue ? errors[error.reason] : "nearbyUnavailable";
      setState({ status: "error", message });
      announceAccessibility(t(message), "high");
    } finally {
      if (active.current === controller) active.current = null;
    }
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
    <Screen testID="nearby-screen" style={styles.screen}>
      <View style={styles.header}>
        <BrandLockup compact />
        <InlineLink
          label={t("close")}
          role="button"
          onPress={() => {
            clear();
            router.back();
          }}
        />
      </View>
      <View style={styles.intro}>
        <AppText variant="title" accessibilityRole="header">
          {t("nearbyTitle")}
        </AppText>
        {state.status !== "ready" && <AppText muted>{t("nearbyIntro")}</AppText>}
      </View>
      {state.status !== "ready" && (
        <Button
          label={t("nearbyFind")}
          onPress={() => void find()}
          busy={state.status === "loading"}
          testID="nearby-find"
        />
      )}
      {state.status === "loading" && (
        <>
          <AppText accessibilityLiveRegion="polite">{t("nearbyLoading")}</AppText>
          <Button label={t("cancel")} variant="secondary" onPress={clear} />
        </>
      )}
      {state.status === "error" && (
        <View style={styles.stack}>
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
            <AppText variant="display">
              {displayDistance(state.result.distanceMeters, language)}
            </AppText>
            <AppText variant="small" muted>
              {t("nearbyDistanceShort")}
            </AppText>
          </View>
          {state.result.point.address ? (
            <AppText>{state.result.point.address}</AppText>
          ) : (
            <View style={styles.stack}>
              {address.text ? (
                <>
                  <AppText variant="small" muted>
                    {t("nearbyAddressLabel")}
                  </AppText>
                  <AppText>{address.text}</AppText>
                  <AppText variant="small" muted>
                    {t("nearbyAddressSource")}
                  </AppText>
                </>
              ) : (
                <AppText muted>
                  {t(address.status === "done" ? "nearbyAddressFailed" : "nearbyLocationOnMap")}
                </AppText>
              )}
            </View>
          )}
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
                {t("nearbyAccuracy")}: ±{Math.max(1, Math.ceil(state.result.accuracy / 10) * 10)} m
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
      <View style={styles.provenance}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  intro: { gap: spacing.sm, paddingTop: spacing.sm },
  distance: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: spacing.sm },
  stack: { gap: spacing.xs },
  provenance: { gap: spacing.sm, paddingTop: spacing.sm },
});
