export const screenLayout = { maxWidth: 560, horizontalPadding: 20 } as const;

/** Match the Screen's available width, and use a wider tile for system font scaling. */
export function navigationTileMinimumWidth(width: number, fontScale: number): number {
  const available = Math.max(
    0,
    Math.min(width, screenLayout.maxWidth) - screenLayout.horizontalPadding * 2,
  );
  return Math.min(160 * Math.max(1, fontScale), available);
}
