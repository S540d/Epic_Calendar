/**
 * Formats a year number for display in the UI.
 * Negative numbers = BCE. Uses i18n translation keys.
 */
export function formatEventYear(y: number, t: (key: string) => string): string {
  const suffix = y < 0 ? ` ${t('event.bce')}` : ` ${t('event.ce')}`;
  const a = Math.abs(y);
  if (a >= 1_000_000) return `${(a / 1_000_000).toFixed(1)} ${t('event.million')}${suffix}`;
  if (a >= 10_000) return `${(a / 1_000).toFixed(1)} ${t('event.thousand')}${suffix}`;
  return `${a}${suffix}`;
}
