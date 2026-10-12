import type { Language } from "@kierratysappi/domain";
import type { MessageKey } from "@kierratysappi/localization";

// A found product is not a verified packaging/sorting answer.
export function historyStatusMessageKey(status: unknown): MessageKey {
  if (status === "resolved") return "historyProductFound";
  if (status === "packaging_missing") return "packagingMissingTitle";
  if (status === "not_found") return "notFoundTitle";
  return "historyResultUnknown";
}

export function formatHistoryDate(value: unknown, language: Language): string | undefined {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(language === "fi" ? "fi-FI" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}
