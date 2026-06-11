export const DEFAULT_APP_ID = "447188370";
export const DEFAULT_POLL_INTERVAL_MS = 300_000;

export function parseAppIds(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const raw = env.APP_IDS;
  if (raw === undefined || raw.trim() === "") {
    return [DEFAULT_APP_ID];
  }

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const segment of raw.split(",")) {
    const trimmed = segment.trim();
    if (trimmed === "" || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    ids.push(trimmed);
  }

  if (ids.length === 0) {
    throw new Error("APP_IDS must contain at least one valid app ID");
  }

  return ids;
}

export function parsePollIntervalMs(
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = env.POLL_INTERVAL;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_POLL_INTERVAL_MS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_POLL_INTERVAL_MS;
  }

  return parsed;
}
