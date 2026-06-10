import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ItunesReviewsFetchError,
  MalformedItunesReviewsPayloadError,
  fetchItunesReviews,
  parseItunesReviews,
} from "./itunesReviews.js";

const appId = "595068606";

async function readFixture(): Promise<unknown> {
  const fixtureUrl = new URL("./__fixtures__/itunes-customer-reviews.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8"));
}

test("parseItunesReviews maps review entries into Review models", async () => {
  const reviews = parseItunesReviews(await readFixture(), appId);

  assert.deepEqual(reviews, [
    {
      id: "1234567890",
      appId,
      author: "Alice Reviewer",
      title: "Exactly what I needed",
      content: "The workflow is clear and fast.",
      rating: 5,
      submittedAt: new Date("2026-06-10T08:30:00-07:00"),
    },
    {
      id: "1234567891",
      appId,
      author: "Bob Reviewer",
      title: "Useful, but noisy",
      content: "Good reviews view, but alerts need tuning.",
      rating: 3,
      submittedAt: new Date("2026-06-09T19:15:20-07:00"),
    },
  ]);
});

test("parseItunesReviews ignores the app metadata entry Apple includes before reviews", async () => {
  const reviews = parseItunesReviews(await readFixture(), appId);

  assert.equal(reviews.length, 2);
  assert.deepEqual(
    reviews.map((review) => review.id),
    ["1234567890", "1234567891"],
  );
});

test("parseItunesReviews returns an empty array for a valid feed with no review entries", () => {
  assert.deepEqual(parseItunesReviews({ feed: { entry: [] } }, appId), []);
});

test("parseItunesReviews rejects malformed feed shapes with a typed error", () => {
  assert.throws(
    () => parseItunesReviews({ feed: { entry: "not-an-array" } }, appId),
    MalformedItunesReviewsPayloadError,
  );
});

test("parseItunesReviews rejects review entries with invalid ratings", async () => {
  const payload = await readFixture();

  assert.ok(isRecord(payload));
  const feed = payload.feed;
  assert.ok(isRecord(feed));
  const entries = feed.entry;
  assert.ok(Array.isArray(entries));
  const reviewEntry = entries[1];
  assert.ok(isRecord(reviewEntry));
  const rating = reviewEntry["im:rating"];
  assert.ok(isRecord(rating));
  rating.label = "six";

  assert.throws(() => parseItunesReviews(payload, appId), MalformedItunesReviewsPayloadError);
});

test("parseItunesReviews rejects review entries with invalid submitted dates", async () => {
  const payload = await readFixture();

  assert.ok(isRecord(payload));
  const feed = payload.feed;
  assert.ok(isRecord(feed));
  const entries = feed.entry;
  assert.ok(Array.isArray(entries));
  const reviewEntry = entries[1];
  assert.ok(isRecord(reviewEntry));
  const updated = reviewEntry.updated;
  assert.ok(isRecord(updated));
  updated.label = "not-a-date";

  assert.throws(() => parseItunesReviews(payload, appId), MalformedItunesReviewsPayloadError);
});

test("fetchItunesReviews fetches the customer reviews feed and parses the response", async () => {
  const fixture = await readFixture();
  const calls: string[] = [];

  const reviews = await fetchItunesReviews(appId, {
    fetch: async (url) => {
      calls.push(url.toString());
      return Response.json(fixture);
    },
  });

  assert.equal(
    calls[0],
    "https://itunes.apple.com/us/rss/customerreviews/id=595068606/sortBy=mostRecent/page=1/json",
  );
  assert.equal(reviews.length, 2);
});

test("fetchItunesReviews rejects non-OK responses with status details", async () => {
  await assert.rejects(
    fetchItunesReviews(appId, {
      fetch: async () => new Response("rate limited", { status: 429, statusText: "Too Many Requests" }),
    }),
    (error: unknown) =>
      error instanceof ItunesReviewsFetchError &&
      error.status === 429 &&
      error.statusText === "Too Many Requests",
  );
});

test("fetchItunesReviews wraps malformed response JSON as a typed payload error", async () => {
  await assert.rejects(
    fetchItunesReviews(appId, {
      fetch: async () => new Response("{", { headers: { "content-type": "application/json" } }),
    }),
    MalformedItunesReviewsPayloadError,
  );
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
