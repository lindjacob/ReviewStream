import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import type { Review } from "./models/review.js";

export type ReviewStore = {
  insertMany(reviews: Review[]): void | Promise<void>;
  getRecent(appId: string, sinceMs: number): Review[] | Promise<Review[]>;
};

export type SqliteReviewStore = ReviewStore & {
  close(): void;
};

export type CreateSqliteReviewStoreOptions = {
  dbPath?: string;
};

type ReviewRow = {
  id: string;
  app_id: string;
  author: string;
  title: string;
  content: string;
  rating: number;
  submitted_at: number;
};

const backendDir = dirname(dirname(fileURLToPath(import.meta.url)));
const DEFAULT_DB_PATH = join(backendDir, "..", "data", "reviews.sqlite");

function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      author TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL,
      submitted_at INTEGER NOT NULL
    );
    DROP INDEX IF EXISTS idx_reviews_app_id;
    CREATE INDEX IF NOT EXISTS idx_reviews_app_id_submitted_at ON reviews (app_id, submitted_at);
  `);
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    appId: row.app_id,
    author: row.author,
    title: row.title,
    content: row.content,
    rating: row.rating,
    submittedAt: new Date(row.submitted_at),
  };
}

export function createSqliteReviewStore(
  options: CreateSqliteReviewStoreOptions = {},
): SqliteReviewStore {
  const dbPath = options.dbPath ?? DEFAULT_DB_PATH;

  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  initializeSchema(db);

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO reviews (id, app_id, author, title, content, rating, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const selectStmt = db.prepare(`
    SELECT id, app_id, author, title, content, rating, submitted_at
    FROM reviews
    WHERE app_id = ? AND submitted_at >= ?
    ORDER BY submitted_at DESC
  `);

  return {
    insertMany(reviews: Review[]): void {
      for (const review of reviews) {
        insertStmt.run(
          review.id,
          review.appId,
          review.author,
          review.title,
          review.content,
          review.rating,
          review.submittedAt.getTime(),
        );
      }
    },

    getRecent(appId: string, sinceMs: number): Review[] {
      const rows = selectStmt.all(appId, sinceMs) as ReviewRow[];
      return rows.map(rowToReview);
    },

    close(): void {
      db.close();
    },
  };
}
