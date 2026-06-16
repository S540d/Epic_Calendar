/** Inserts thousands separators without relying on locale (deterministic). */
function withThousandsSep(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats a year number for display in the UI.
 * Negative numbers = BCE. Uses i18n translation keys.
 */
export function formatEventYear(y: number, t: (key: string) => string): string {
  const suffix = y < 0 ? ` ${t('event.bce')}` : ` ${t('event.ce')}`;
  const a = Math.abs(y);
  if (a >= 1_000_000_000) {
    const n = (a / 1e9).toFixed(1).replace(/\.0$/, '');
    return `${n} ${t('event.billion')}${suffix}`;
  }
  if (a >= 1_000_000) return `${Math.round(a / 1_000_000)} ${t('event.million')}${suffix}`;
  return `${withThousandsSep(a)}${suffix}`;
}
