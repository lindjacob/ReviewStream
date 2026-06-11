import assert from "node:assert/strict";
import test from "node:test";

import type { Review } from "./models/review.js";
import { startReviewPolling } from "./polling.js";
import type { ReviewStore } from "./reviewStore.js";

const appId = "595068606";

function buildReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "review-1",
    appId,
    author: "Alice Reviewer",
    title: "Exactly what I needed",
    content: "The workflow is clear and fast.",
    rating: 5,
    submittedAt: new Date("2026-06-10T08:30:00.000Z"),
    ...overrides,
  };
}

function createMockStore(): ReviewStore & { inserted: Review[][] } {
  const inserted: Review[][] = [];

  return {
    inserted,
    insertMany(reviews: Review[]): void {
      inserted.push(reviews);
    },
    getRecent(): Review[] {
      return [];
    },
  };
}

test("startReviewPolling fetches and inserts reviews immediately", async () => {
  const store = createMockStore();
  const fetchCalls: string[] = [];
  const reviews = [buildReview()];

  startReviewPolling({
    appId,
    pollIntervalMs: 60_000,
    store,
    fetchReviews: async (requestedAppId) => {
      fetchCalls.push(requestedAppId);
      return reviews;
    },
    setIntervalFn: () => 0,
  });

  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(fetchCalls, [appId]);
  assert.deepEqual(store.inserted, [reviews]);
});

test("startReviewPolling schedules future polls at the configured interval", async (t) => {
  const store = createMockStore();
  let scheduledCallback: (() => void) | undefined;
  let scheduledIntervalMs: number | undefined;

  const handle = startReviewPolling({
    appId,
    pollIntervalMs: 45_000,
    store,
    fetchReviews: async () => [],
    setIntervalFn: (callback: () => void, intervalMs: number) => {
      scheduledCallback = callback;
      scheduledIntervalMs = intervalMs;
      return 1;
    },
  });
  t.after(() => handle.stop());

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(scheduledIntervalMs, 45_000);
  assert.equal(typeof scheduledCallback, "function");

  scheduledCallback?.();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(store.inserted.length, 2);
});

test("startReviewPolling logs fetch failures without stopping future polls", async (t) => {
  const store = createMockStore();
  const logMessages: unknown[][] = [];
  let scheduledCallback: (() => void) | undefined;
  let fetchCount = 0;

  const handle = startReviewPolling({
    appId,
    pollIntervalMs: 30_000,
    store,
    fetchReviews: async () => {
      fetchCount += 1;
      if (fetchCount === 1) {
        throw new Error("network down");
      }
      return [buildReview({ id: "recovered" })];
    },
    setIntervalFn: (callback: () => void) => {
      scheduledCallback = callback;
      return 2;
    },
    log: (...args) => {
      logMessages.push(args);
    },
  });
  t.after(() => handle.stop());

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(fetchCount, 1);
  assert.deepEqual(store.inserted, []);
  assert.equal(logMessages.length, 1);
  assert.match(String(logMessages[0]?.[1]), /network down/);

  scheduledCallback?.();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(fetchCount, 2);
  assert.deepEqual(store.inserted, [[buildReview({ id: "recovered" })]]);
});

test("startReviewPolling logs store failures without stopping future polls", async (t) => {
  const logMessages: unknown[][] = [];
  let scheduledCallback: (() => void) | undefined;
  let insertCount = 0;

  const store: ReviewStore = {
    insertMany(): void {
      insertCount += 1;
      if (insertCount === 1) {
        throw new Error("database locked");
      }
    },
    getRecent(): Review[] {
      return [];
    },
  };

  const handle = startReviewPolling({
    appId,
    pollIntervalMs: 30_000,
    store,
    fetchReviews: async () => [buildReview()],
    setIntervalFn: (callback: () => void) => {
      scheduledCallback = callback;
      return 3;
    },
    log: (...args) => {
      logMessages.push(args);
    },
  });
  t.after(() => handle.stop());

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(insertCount, 1);
  assert.equal(logMessages.length, 1);
  assert.match(String(logMessages[0]?.[1]), /database locked/);

  scheduledCallback?.();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(insertCount, 2);
});

test("startReviewPolling awaits async insertMany", async () => {
  const inserted: Review[][] = [];
  const store: ReviewStore = {
    async insertMany(reviews: Review[]): Promise<void> {
      await new Promise((resolve) => setImmediate(resolve));
      inserted.push(reviews);
    },
    getRecent(): Review[] {
      return [];
    },
  };
  const reviews = [buildReview({ id: "async-insert" })];

  startReviewPolling({
    appId,
    pollIntervalMs: 60_000,
    store,
    fetchReviews: async () => reviews,
    setIntervalFn: () => 0,
  });

  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(inserted, [reviews]);
});

test("stop clears the polling interval", (t) => {
  let clearedTimerId: unknown;

  const handle = startReviewPolling({
    appId,
    pollIntervalMs: 10_000,
    store: createMockStore(),
    fetchReviews: async () => [],
    setIntervalFn: () => 99,
  });

  const originalClearInterval = globalThis.clearInterval;
  globalThis.clearInterval = ((timerId: unknown) => {
    clearedTimerId = timerId;
  }) as typeof clearInterval;
  t.after(() => {
    globalThis.clearInterval = originalClearInterval;
  });

  handle.stop();

  assert.equal(clearedTimerId, 99);
});
