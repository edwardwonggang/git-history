export function monthsAgoIso(months: number, now = new Date()): string {
  const since = new Date(now.getTime());
  const originalDate = since.getUTCDate();

  since.setUTCMonth(since.getUTCMonth() - months);
  if (since.getUTCDate() !== originalDate) {
    since.setUTCDate(0);
  }

  return since.toISOString();
}
