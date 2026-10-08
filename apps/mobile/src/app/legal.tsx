import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  AppText,
  Button,
  DocumentSection,
  PageHeader,
  PageIntro,
  Screen,
  StatusPill,
} from "@/components/ui";
import { announceAccessibility } from "@/features/accessibility/announcements";
import { clearAllLocalData } from "@/features/history/storage";
import { useLanguage } from "@/i18n/language-context";
import { spacing, useAppTheme } from "@/theme/tokens";

export default function LegalScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { t } = useLanguage();
  const [deleted, setDeleted] = useState(false);

  const confirmDeletion = () => {
    Alert.alert(t("deleteLocalDataConfirmTitle"), t("deleteLocalDataConfirmBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("deleteLocalDataConfirmAction"),
        style: "destructive",
        onPress: () => {
          void clearAllLocalData().then(() => {
            setDeleted(true);
            announceAccessibility(t("localDataDeleted"), "high");
          });
        },
      },
    ]);
  };
  return (
    <Screen>
      <PageHeader onBack={() => router.back()} />
      <PageIntro title={t("legalAction")} />
      <View style={styles.review}>
        <StatusPill label={t("legalReview")} tone="amber" />
      </View>
      <DocumentSection>
        <AppText variant="heading" accessibilityRole="header">
          {t("privacyTitle")}
        </AppText>
        <AppText>{t("privacyDraft")}</AppText>
        <AppText>{t("nearbyPrivacy")}</AppText>
        <AppText>{t("nearbyAddressDisclosure")}</AppText>
      </DocumentSection>
      <DocumentSection>
        <AppText variant="heading">{t("deleteLocalData")}</AppText>
        <AppText>{t("deleteLocalDataBody")}</AppText>
        <Button label={t("deleteLocalData")} variant="danger" onPress={confirmDeletion} />
        {deleted && (
          <AppText accessibilityRole="alert" style={{ color: palette.pine }}>
            {t("localDataDeleted")}
          </AppText>
        )}
      </DocumentSection>
      <DocumentSection>
        <AppText variant="heading">{t("termsTitle")}</AppText>
        <AppText>{t("termsDraft")}</AppText>
      </DocumentSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  review: { paddingBottom: spacing.lg },
});
