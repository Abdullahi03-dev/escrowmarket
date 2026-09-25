/** kobo (minor units) → ₦25,000 */
export function formatNGN(kobo: string | number): string {
  const naira = Number(kobo) / 100;
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: naira % 1 === 0 ? 0 : 2 })}`;
}

/** ₦ input → kobo integer */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}
