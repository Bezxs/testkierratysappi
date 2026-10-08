import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BarcodeMark } from "@/components/packaging-mark";
import { ActionRow, AppText, BrandLockup, InlineLink, Screen, sharedStyles } from "@/components/ui";
import { isHistoryEnabled } from "@/features/history/storage";
import { useScanSession } from "@/features/scan/session-context";
import { useLanguage } from "@/i18n/language-context";
import { controls, interaction, radius, spacing, useAppTheme } from "@/theme/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const { reset } = useScanSession();
  const [historyEnabled, setHistoryState] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reset();
      void isHistoryEnabled().then(setHistoryState);
    }, [reset]),
  );

  return (
    <Screen testID="home-screen">
      <View style={styles.topbar}>
        <BrandLockup compact />
        <View
          style={[styles.languageSwitch, { borderColor: palette.borderSubtle }]}
          accessibilityRole="radiogroup"
          accessibilityLabel={t("languageLabel")}
        >
          {(["fi", "en"] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ checked: language === item }}
              aria-checked={language === item}
              accessibilityLabel={item === "fi" ? t("finnish") : t("english")}
              onPress={() => setLanguage(item)}
              testID={`language-${item}`}
              style={({ pressed }) => [
                styles.languageChoice,
                language === item && { backgroundColor: palette.pineSoft },
                pressed && { opacity: interaction.pressedOpacity },
              ]}
            >
              <AppText
                variant="small"
                style={{
                  fontFamily: language === item ? "Atkinson_700Bold" : "Atkinson_400Regular",
                }}
              >
                {item.toUpperCase()}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.intro}>
        <AppText variant="display" accessibilityRole="header">
          {t("introTitle")}
        </AppText>
        <AppText muted>{t("introBody")}</AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("scanAction")}
        testID="home-scan-action"
        onPress={() => router.push("/scan")}
        style={({ pressed }) => [
          styles.scanAction,
          {
            backgroundColor: palette.actionPrimary,
            opacity: pressed ? interaction.pressedOpacity : 1,
          },
        ]}
      >
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          <BarcodeMark color={palette.onStrong} />
        </View>
        <View style={sharedStyles.grow}>
          <AppText variant="heading" style={{ color: palette.onStrong }}>
            {t("scanAction")}
          </AppText>
        </View>
      </Pressable>
      <ActionRow
        label={t("manualEntry")}
        detail={t("gtinHint")}
        onPress={() => router.push("/manual")}
        testID="home-manual-action"
      />
      <AppText variant="small" muted style={styles.scope}>
        {t("scanScope")}
      </AppText>

      <View style={styles.utilities}>
        <ActionRow
          label={t("nearbyTitle")}
          detail={t("nearbyHomeBody")}
          onPress={() => router.push("/nearby")}
          testID="home-nearby-action"
        />
        <ActionRow
          label={t("homeGuideTitle")}
          detail={t("homeGuideBody")}
          onPress={() => router.push("/guide")}
          testID="home-guide-action"
        />
        <ActionRow
          label={t("historyTitle")}
          detail={historyEnabled ? t("homeHistoryOn") : t("homeHistoryOff")}
          onPress={() => router.push("/history")}
          testID="home-history-action"
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <InlineLink
            label={t("legalAction")}
            onPress={() => router.push("/legal")}
            role="button"
            testID="home-legal-action"
          />
          <AppText variant="small" muted>
            {t("homeJurisdiction")}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  languageSwitch: { flexDirection: "row", borderRadius: radius.md, borderWidth: 1, padding: 2 },
  languageChoice: {
    minWidth: controls.minimumTouchTarget,
    minHeight: controls.minimumTouchTarget,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: { paddingTop: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm },
  scanAction: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  scope: { paddingTop: spacing.sm },
  utilities: { paddingTop: spacing.lg },
  footer: { marginTop: spacing.xl, gap: spacing.xs },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
});
