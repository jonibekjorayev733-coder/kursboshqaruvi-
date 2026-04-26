export function formatUzs(amount: number | null | undefined): string {
  const numericAmount = Number(amount ?? 0);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return `${safeAmount.toLocaleString('uz-UZ')} so'm`;
}
