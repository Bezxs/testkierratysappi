import {
  CollectionDirectorySchema,
  collectionPointUrl,
  directoryAgeDays,
  nearestCollectionPoint,
} from "@kierratysappi/application/collection-points";
import type { MessageKey } from "@kierratysappi/localization";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppState, Linking, Platform, StyleSheet, View } from "react-native";
import snapshot from "@/assets/data/finland-recycling.json";
import { AppText, BrandLockup, Button, InlineLink, Paper, Screen } from "@/components/ui";
import { announceAccessibility } from "@/features/accessibility/announcements";
import { readDeviceLocation } from "@/features/nearby/device-location";
import { displayDistance, LocationIssue } from "@/features/nearby/location-session";
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
  const active = useRef<AbortController | null>(null);

  const clear = useCallback(() => {
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
        <AppText muted>{t("nearbyPurpose")}</AppText>
      </View>
      <Button
        label={t(state.status === "ready" ? "nearbyRefresh" : "nearbyFind")}
        onPress={() => void find()}
        busy={state.status === "loading"}
        testID="nearby-find"
      />
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
            {t("nearbyResult")}
          </AppText>
          <AppText variant="heading" accessibilityRole="header">
            {state.result.point.name ?? t("nearbyNameUnknown")}
          </AppText>
          <AppText>
            {t("nearbyPointType")}:{" "}
            {t(
              state.result.point.kind === "centre"
                ? "nearbyCentre"
                : state.result.point.kind === "container"
                  ? "nearbyContainer"
                  : "nearbyTypeUnknown",
            )}
          </AppText>
          {state.result.point.address && <AppText>{state.result.point.address}</AppText>}
          <AppText variant="small" muted>
            {t("nearbyPointId")}: {state.result.point.id}
          </AppText>
          <View style={styles.stack}>
            <AppText variant="display">
              {displayDistance(state.result.distanceMeters, language)}
            </AppText>
            <AppText>{t("nearbyEstimate")}</AppText>
            <AppText variant="small" muted>
              {t("nearbyAccuracy")}: ±{Math.max(1, Math.ceil(state.result.accuracy / 10) * 10)} m
            </AppText>
          </View>
          {state.result.accuracy > 100 && <AppText>{t("nearbyApproximate")}</AppText>}
          <AppText variant="small" muted>
            {t("nearbyUnverified")}
          </AppText>
          <InlineLink
            label={t("nearbyDetails")}
            accessibilityHint={t("nearbyExternalHint")}
            onPress={() => openUrl(collectionPointUrl(state.result.point))}
          />
        </Paper>
      )}
      {linkError && <AppText accessibilityRole="alert">{t("nearbyLinkError")}</AppText>}
      <View style={styles.provenance}>
        <AppText variant="small" muted>
          {t("nearbyScope")}
        </AppText>
        <AppText variant="small" muted>
          {t("nearbyCaution")}
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
  intro: { gap: spacing.md, paddingTop: spacing.lg },
  stack: { gap: spacing.xs },
  provenance: { gap: spacing.sm, paddingTop: spacing.sm },
});
