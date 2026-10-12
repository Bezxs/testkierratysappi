import {
  CollectionDirectorySchema,
  directoryAgeDays,
  nearestCollectionPoints,
  type NearbyCollectionPoint,
} from "@kierratysappi/contracts/collection-points";
import type { MessageKey } from "@kierratysappi/localization";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, AppState, Linking, Platform, StyleSheet, View } from "react-native";
import snapshot from "@/assets/data/finland-recycling.json";
import { NearbyPointCard } from "@/components/nearby-point-card";
import {
  AppText,
  Button,
  InlineLink,
  PageHeader,
  PageIntro,
  Screen,
  sharedStyles,
} from "@/components/ui";
import { announceAccessibility } from "@/features/accessibility/announcements";
import { readDeviceLocation } from "@/features/nearby/device-location";
import { LocationIssue } from "@/features/nearby/location-session";
import { useNearbySearch } from "@/features/nearby/search-context";
import { useLanguage } from "@/i18n/language-context";
import { spacing, useAppTheme } from "@/theme/tokens";

const directory = CollectionDirectorySchema.safeParse(snapshot);
type State =
  | { status: "idle" | "loading" }
  | { status: "error"; message: MessageKey }
  | { status: "ready"; points: readonly NearbyCollectionPoint[]; accuracy: number };
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
  const { palette } = useAppTheme();
  const { consumeSearchRequest } = useNearbySearch();
  const [state, setState] = useState<State>({ status: "idle" });
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const active = useRef<AbortController | null>(null);
  const clear = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setState({ status: "idle" });
    setPrivacyOpen(false);
    setLinkError(false);
  }, []);
  const find = useCallback(async () => {
    if (active.current) return;
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
      const points = nearestCollectionPoints(directory.data.points, fix.coords);
      if (!points.length) {
        setState({ status: "error", message: "nearbyNoResult" });
        announceAccessibility(t("nearbyNoResult"), "high");
      } else {
        setState({ status: "ready", points, accuracy: fix.coords.accuracy ?? 0 });
        announceAccessibility(t("nearbyResult"), "high");
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof LocationIssue ? errors[error.reason] : "nearbyUnavailable";
      setState({ status: "error", message });
      announceAccessibility(t(message), "high");
    } finally {
      if (active.current === controller) active.current = null;
    }
  }, [t]);
  useFocusEffect(
    useCallback(() => {
      // Only a recent in-memory Home press auto-starts; URL/deep-link opening alone never does.
      if (consumeSearchRequest()) void find();
      const listener = AppState.addEventListener("change", (next) => {
        if (next === "background") clear();
      });
      return () => {
        listener.remove();
        clear();
      };
    }, [clear, consumeSearchRequest, find]),
  );
  const openSource = () => {
    if (!directory.success) return;
    setLinkError(false);
    void Linking.openURL(directory.data.attributionUrl).catch(() => {
      setLinkError(true);
      announceAccessibility(t("nearbyLinkError"), "high");
    });
  };
  return (
    <Screen testID="nearby-screen" style={styles.screen}>
      <PageHeader
        onBack={() => {
          clear();
          router.back();
        }}
      />
      <PageIntro
        title={t("nearbyTitle")}
        body={state.status === "ready" ? undefined : t("nearbyIntro")}
      />
      {state.status === "loading" ? (
        <View style={sharedStyles.tightStack}>
          <ActivityIndicator
            color={palette.actionPrimary}
            accessibilityLabel={t("nearbyLoading")}
          />
          <AppText accessibilityLiveRegion="polite">{t("nearbyLoading")}</AppText>
          <Button label={t("cancel")} variant="secondary" onPress={clear} testID="nearby-cancel" />
        </View>
      ) : (
        state.status !== "ready" && (
          <Button label={t("nearbyFind")} onPress={() => void find()} testID="nearby-find" />
        )
      )}
      {state.status === "error" && (
        <View style={sharedStyles.tightStack}>
          <AppText accessibilityRole="alert">{t(state.message)}</AppText>
          {(state.message === "nearbyPermission" || state.message === "nearbyServices") &&
            (Platform.OS === "web" ? (
              <AppText muted>{t("nearbySettingsHint")}</AppText>
            ) : (
              <Button
                label={t("openSettings")}
                variant="secondary"
                onPress={() => {
                  void Linking.openSettings().catch(() => {
                    setLinkError(true);
                    announceAccessibility(t("nearbyLinkError"), "high");
                  });
                }}
              />
            ))}
        </View>
      )}
      {state.status === "ready" && (
        <>
          <View style={sharedStyles.tightStack}>
            <AppText variant="small" muted>
              {t("nearbyUnverified")}
            </AppText>
            {directory.success && (
              <AppText variant="small" muted>
                {t("nearbyRetrieved")}:{" "}
                {new Date(directory.data.retrievedAt).toLocaleDateString(
                  language === "fi" ? "fi-FI" : "en-GB",
                )}
              </AppText>
            )}
            <InlineLink label={t("nearbySource")} onPress={openSource} />
            {directory.success && directoryAgeDays(directory.data) > 30 && (
              <AppText>{t("nearbyStale")}</AppText>
            )}
            <AppText variant="small">{t("nearbyQuickCaution")}</AppText>
            {state.accuracy > 100 && <AppText>{t("nearbyApproximate")}</AppText>}
          </View>
          <View style={sharedStyles.stack} testID="nearby-result">
            {state.points.map((result, index) => (
              <NearbyPointCard
                key={result.point.id}
                result={result}
                index={index}
                accuracy={state.accuracy}
              />
            ))}
          </View>
          <Button
            label={t("nearbyRefresh")}
            variant="quiet"
            onPress={() => void find()}
            testID="nearby-find"
          />
        </>
      )}
      {linkError && <AppText accessibilityRole="alert">{t("nearbyLinkError")}</AppText>}
      <View style={styles.provenance}>
        <AppText variant="small" muted>
          {t("nearbyScope")}
        </AppText>
        {directory.success && (
          <>
            {state.status !== "ready" && (
              <AppText variant="small" muted>
                {t("nearbyRetrieved")}:{" "}
                {new Date(directory.data.retrievedAt).toLocaleDateString(
                  language === "fi" ? "fi-FI" : "en-GB",
                )}
              </AppText>
            )}
            {state.status !== "ready" && directoryAgeDays(directory.data) > 30 && (
              <AppText>{t("nearbyStale")}</AppText>
            )}
            {state.status !== "ready" && (
              <InlineLink label={t("nearbySource")} onPress={openSource} />
            )}
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
          <View style={sharedStyles.tightStack}>
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
  provenance: { gap: spacing.sm, paddingTop: spacing.sm },
});
