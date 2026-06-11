import type { Review } from "./models/review.js";
import type { ReviewStore } from "./reviewStore.js";

export type FetchReviewsFn = (appId: string) => Promise<Review[]>;

export type PollingTimerId = unknown;

export type SetIntervalFn = (
  callback: () => void,
  intervalMs: number,
) => PollingTimerId;

export type StartReviewPollingOptions = {
  appIds: readonly string[];
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
  appIds: readonly string[],
  store: ReviewStore,
  fetchReviews: FetchReviewsFn,
  log: (...args: unknown[]) => void,
): Promise<void> {
  for (const appId of appIds) {
    try {
      const reviews = await fetchReviews(appId);
      await Promise.resolve(store.insertMany(reviews));
    } catch (error) {
      log(`Review poll failed for app ${appId}:`, error);
    }
  }
}

export function startReviewPolling(options: StartReviewPollingOptions): ReviewPollingHandle {
  const {
    appIds,
    pollIntervalMs,
    store,
    fetchReviews,
    setIntervalFn = setInterval,
    log = console.error,
  } = options;

  const runPoll = () => {
    void pollOnce(appIds, store, fetchReviews, log);
  };

  runPoll();

  const timerId = setIntervalFn(runPoll, pollIntervalMs);

  return {
    stop() {
      clearInterval(timerId as ReturnType<typeof setInterval>);
    },
  };
}
