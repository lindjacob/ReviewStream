export const DEFAULT_APP_ID = "447188370";
export const DEFAULT_POLL_INTERVAL_MS = 300_000;

export function parseAppId(env: Record<string, string | undefined> = process.env): string {
  const raw = env.APP_ID;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_APP_ID;
  }
  return raw.trim();
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
