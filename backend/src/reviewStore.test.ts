import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test, { type TestContext } from "node:test";

import type { Review } from "./models/review.js";
import { createSqliteReviewStore } from "./reviewStore.js";

const appId = "595068606";
const otherAppId = "123456789";

async function createTempDbPath(t: TestContext): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "reviewstore-"));
  t.after(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  return join(tempDir, "reviews.sqlite");
}

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

function readIndexedColumns(db: DatabaseSync, tableName: string): string[][] {
  const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all() as Array<{ name: string }>;

  return indexes.map((index) =>
    (
      db.prepare(`PRAGMA index_info(${index.name})`).all() as Array<{
        name: string;
      }>
    ).map((column) => column.name),
  );
}

test("createSqliteReviewStore initializes the reviews table and composite index", async (t) => {
  const dbPath = await createTempDbPath(t);
  const store = createSqliteReviewStore({ dbPath });
  store.close();

  const db = new DatabaseSync(dbPath, { readOnly: true });
  t.after(() => db.close());

  const columns = db.prepare("PRAGMA table_info(reviews)").all() as Array<{
    name: string;
    pk: number;
  }>;

  assert.deepEqual(
    columns.map((column) => column.name),
    ["id", "app_id", "author", "title", "content", "rating", "submitted_at"],
  );
  assert.equal(
    columns.find((column) => column.name === "id")?.pk,
    1,
  );
  assert.ok(
    readIndexedColumns(db, "reviews").some(
      (columnsForIndex) =>
        columnsForIndex.includes("app_id") && columnsForIndex.includes("submitted_at"),
    ),
  );
});

test("getRecent returns matching app reviews at or after the cutoff newest first", async (t) => {
  const dbPath = await createTempDbPath(t);
  const store = createSqliteReviewStore({ dbPath });
  t.after(() => store.close());

  await store.insertMany([
    buildReview({ id: "old", submittedAt: new Date(1_000) }),
    buildReview({ id: "recent-older", submittedAt: new Date(2_000) }),
    buildReview({ id: "recent-newer", submittedAt: new Date(3_000) }),
    buildReview({ id: "other-app", appId: otherAppId, submittedAt: new Date(4_000) }),
  ]);

  const reviews = await store.getRecent(appId, 2_000);

  assert.deepEqual(
    reviews.map((review) => review.id),
    ["recent-newer", "recent-older"],
  );
  assert.deepEqual(
    reviews.map((review) => review.submittedAt),
    [new Date(3_000), new Date(2_000)],
  );
});

test("insertMany ignores duplicate review ids without overwriting the first row", async (t) => {
  const dbPath = await createTempDbPath(t);
  const store = createSqliteReviewStore({ dbPath });
  t.after(() => store.close());

  await store.insertMany([buildReview({ id: "duplicate", title: "Original title" })]);
  await store.insertMany([buildReview({ id: "duplicate", title: "Changed title" })]);

  const reviews = await store.getRecent(appId, 0);

  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]?.title, "Original title");
});

test("file-backed stores persist reviews across close and reopen", async (t) => {
  const dbPath = await createTempDbPath(t);
  const firstStore = createSqliteReviewStore({ dbPath });

  await firstStore.insertMany([buildReview({ id: "persisted", submittedAt: new Date(5_000) })]);
  firstStore.close();

  const secondStore = createSqliteReviewStore({ dbPath });
  t.after(() => secondStore.close());

  const reviews = await secondStore.getRecent(appId, 0);

  assert.deepEqual(
    reviews.map((review) => review.id),
    ["persisted"],
  );
});

test("empty inserts and queries without matches return empty arrays", async (t) => {
  const dbPath = await createTempDbPath(t);
  const store = createSqliteReviewStore({ dbPath });
  t.after(() => store.close());

  await store.insertMany([]);

  assert.deepEqual(await store.getRecent(appId, 0), []);
  assert.deepEqual(
    await store.getRecent(otherAppId, 0),
    [],
  );
});
