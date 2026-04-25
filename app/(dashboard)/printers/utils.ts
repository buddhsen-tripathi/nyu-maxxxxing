const STALE_HOURS = 48;

export function isStale(isoString: string): boolean {
  return Date.now() - new Date(isoString).getTime() > STALE_HOURS * 3_600_000;
}

export function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}
