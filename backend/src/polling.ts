import type { Review } from "./itunesReviews.js";
import type { ReviewStore } from "./reviewStore.js";

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

export type FetchReviewsFn = (appId: string) => Promise<Review[]>;

export type PollingTimerId = unknown;

export type SetIntervalFn = (
  callback: () => void,
  intervalMs: number,
) => PollingTimerId;

export type StartReviewPollingOptions = {
  appId: string;
  pollIntervalMs: number;
  store: ReviewStore;
  fetchReviews: FetchReviewsFn;
  setIntervalFn?: SetIntervalFn;
  log?: (...args: unknown[]) => void;
};

export type ReviewPollingHandle = {
  stop(): void;
};

async function pollOnce(
  appId: string,
  store: ReviewStore,
  fetchReviews: FetchReviewsFn,
  log: (...args: unknown[]) => void,
): Promise<void> {
  try {
    const reviews = await fetchReviews(appId);
    await Promise.resolve(store.insertMany(reviews));
  } catch (error) {
    log("Review poll failed:", error);
  }
}

export function startReviewPolling(options: StartReviewPollingOptions): ReviewPollingHandle {
  const {
    appId,
    pollIntervalMs,
    store,
    fetchReviews,
    setIntervalFn = setInterval,
    log = console.error,
  } = options;

  const runPoll = () => {
    void pollOnce(appId, store, fetchReviews, log);
  };

  runPoll();

  const timerId = setIntervalFn(runPoll, pollIntervalMs);

  return {
    stop() {
      clearInterval(timerId as ReturnType<typeof setInterval>);
    },
  };
}
