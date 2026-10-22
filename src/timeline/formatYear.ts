type T = (key: string) => string;

/** Looks up a separator via i18n; falls back to the English default if the key is missing. */
function sep(t: T, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/** Inserts the language's thousands separator (deterministic, no `toLocaleString`). */
export function formatThousands(n: number, t: T): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, sep(t, 'number.thousands', ','));
}

/** One decimal place with the language's decimal separator; a trailing zero decimal is dropped. */
export function formatOneDecimal(n: number, t: T): string {
  return n
    .toFixed(1)
    .replace(/\.0$/, '')
    .replace('.', sep(t, 'number.decimal', '.'));
}

/**
 * Formats a year number for display in the UI.
 * Negative numbers = BCE. Uses i18n translation keys.
 * Notation: millions/billions with one decimal, everything below whole numbers
 * (≥ 100,000 counts as millions to avoid false precision).
 */
export function formatEventYear(y: number, t: T): string {
  const suffix = y < 0 ? ` ${t('event.bce')}` : ` ${t('event.ce')}`;
  const a = Math.abs(y);
  if (a >= 1_000_000_000) return `${formatOneDecimal(a / 1e9, t)} ${t('event.billion')}${suffix}`;
  if (a >= 100_000) return `${formatOneDecimal(a / 1_000_000, t)} ${t('event.million')}${suffix}`;
  return `${formatThousands(a, t)}${suffix}`;
}
