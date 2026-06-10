import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import test, { type TestContext } from "node:test";

import type { Review } from "./itunesReviews.js";
import type { ReviewStore } from "./reviewStore.js";
import { createServer } from "./server.js";

const appId = "595068606";
const otherAppId = "123456789";
const nowMs = new Date("2026-06-10T12:00:00.000Z").getTime();

type RecentCall = {
  appId: string;
  sinceMs: number;
};

type MockStore = ReviewStore & {
  recentCalls: RecentCall[];
};

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

function serializeReview(review: Review): Record<string, unknown> {
  return {
    ...review,
    submittedAt: review.submittedAt.toISOString(),
  };
}

function createMockStore(reviews: Review[] = []): MockStore {
  const recentCalls: RecentCall[] = [];

  return {
    recentCalls,
    insertMany(): void {},
    getRecent(requestedAppId: string, sinceMs: number): Review[] {
      recentCalls.push({ appId: requestedAppId, sinceMs });
      return reviews;
    },
  };
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function startTestServer(
  t: TestContext,
  options: {
    appIds?: readonly string[];
    store: ReviewStore;
    nowMs?: () => number;
    log?: (...args: unknown[]) => void;
  },
): Promise<string> {
  const app = createServer({
    appIds: options.appIds ?? [appId],
    store: options.store,
    nowMs: options.nowMs,
    log: options.log,
  });
  const server = app.listen(0);
  await once(server, "listening");

  t.after(() => closeServer(server));

  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function fetchJson(baseUrl: string, path: string): Promise<{ response: Response; body: unknown }> {
  const response = await fetch(new URL(path, baseUrl));
  const body = await response.json();

  return { response, body };
}

test("GET /health returns ok", async (t) => {
  const store = createMockStore();
  const baseUrl = await startTestServer(t, { store });

  const { response, body } = await fetchJson(baseUrl, "/health");

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: "ok" });
});

test("GET /api/apps lists configured app IDs", async (t) => {
  const store = createMockStore();
  const baseUrl = await startTestServer(t, { appIds: [appId], store });

  const { response, body } = await fetchJson(baseUrl, "/api/apps");

  assert.equal(response.status, 200);
  assert.deepEqual(body, { apps: [appId] });
});

test("GET /api/apps/:appId/reviews returns reviews within the default 48 hour window", async (t) => {
  const newerReview = buildReview({
    id: "newer",
    submittedAt: new Date("2026-06-10T11:00:00.000Z"),
  });
  const olderReview = buildReview({
    id: "older",
    submittedAt: new Date("2026-06-09T11:00:00.000Z"),
  });
  const store = createMockStore([newerReview, olderReview]);
  const baseUrl = await startTestServer(t, { store, nowMs: () => nowMs });

  const { response, body } = await fetchJson(baseUrl, `/api/apps/${appId}/reviews`);

  assert.equal(response.status, 200);
  assert.deepEqual(store.recentCalls, [
    {
      appId,
      sinceMs: nowMs - 48 * 60 * 60 * 1000,
    },
  ]);
  assert.deepEqual(body, {
    reviews: [serializeReview(newerReview), serializeReview(olderReview)],
  });
});

test("GET /api/apps/:appId/reviews accepts a custom positive hours value", async (t) => {
  const store = createMockStore();
  const baseUrl = await startTestServer(t, { store, nowMs: () => nowMs });

  const { response, body } = await fetchJson(baseUrl, `/api/apps/${appId}/reviews?hours=1.5`);

  assert.equal(response.status, 200);
  assert.deepEqual(body, { reviews: [] });
  assert.deepEqual(store.recentCalls, [
    {
      appId,
      sinceMs: nowMs - 1.5 * 60 * 60 * 1000,
    },
  ]);
});

test("GET /api/apps/:appId/reviews rejects invalid hours values", async (t) => {
  const store = createMockStore();
  const baseUrl = await startTestServer(t, { store });

  for (const hours of ["", "0", "-1", "not-a-number", "Infinity"]) {
    const { response, body } = await fetchJson(
      baseUrl,
      `/api/apps/${appId}/reviews?hours=${encodeURIComponent(hours)}`,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      error: {
        code: "invalid_hours",
        message: "hours must be a finite positive number",
      },
    });
  }

  assert.deepEqual(store.recentCalls, []);
});

test("GET /api/apps/:appId/reviews rejects unknown app IDs", async (t) => {
  const store = createMockStore();
  const baseUrl = await startTestServer(t, { store });

  const { response, body } = await fetchJson(baseUrl, `/api/apps/${otherAppId}/reviews`);

  assert.equal(response.status, 404);
  assert.deepEqual(body, {
    error: {
      code: "unknown_app",
      message: `Unknown appId: ${otherAppId}`,
    },
  });
  assert.deepEqual(store.recentCalls, []);
});

test("GET /api/apps/:appId/reviews returns a clean JSON error when the store fails", async (t) => {
  const logMessages: unknown[][] = [];
  const store: ReviewStore = {
    insertMany(): void {},
    getRecent(): Review[] {
      throw new Error("database locked");
    },
  };
  const baseUrl = await startTestServer(t, {
    store,
    log: (...args) => {
      logMessages.push(args);
    },
  });

  const { response, body } = await fetchJson(baseUrl, `/api/apps/${appId}/reviews`);

  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    error: {
      code: "reviews_unavailable",
      message: "Unable to load reviews",
    },
  });
  assert.equal(logMessages.length, 1);
});
