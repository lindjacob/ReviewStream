import express, { type Express, type Response } from "express";
import type {
  AppsResponse,
  JsonErrorCode,
  JsonErrorResponse,
  ReviewDto,
  ReviewsResponse,
} from "@reviewstream/shared/api";

import type { Review } from "./itunesReviews.js";
import type { ReviewStore } from "./reviewStore.js";

const DEFAULT_REVIEW_WINDOW_HOURS = 48;
const MS_PER_HOUR = 60 * 60 * 1000;

export type CreateServerOptions = {
  appIds: readonly string[];
  store: ReviewStore;
  nowMs?: () => number;
  log?: (...args: unknown[]) => void;
};

type HoursParseResult =
  | {
      ok: true;
      hours: number;
    }
  | {
      ok: false;
    };

function sendJsonError(
  res: Response,
  status: number,
  code: JsonErrorCode,
  message: string,
): void {
  const body: JsonErrorResponse = {
    error: {
      code,
      message,
    },
  };

  res.status(status).json(body);
}

function toReviewDto(review: Review): ReviewDto {
  return {
    ...review,
    submittedAt: review.submittedAt.toISOString(),
  };
}

function parseHours(value: unknown): HoursParseResult {
  if (value === undefined) {
    return { ok: true, hours: DEFAULT_REVIEW_WINDOW_HOURS };
  }

  if (Array.isArray(value) || typeof value !== "string" || value.trim() === "") {
    return { ok: false };
  }

  const hours = Number(value);
  const windowMs = hours * MS_PER_HOUR;

  if (!Number.isFinite(hours) || hours <= 0 || !Number.isFinite(windowMs)) {
    return { ok: false };
  }

  return { ok: true, hours };
}

export function createServer(options: CreateServerOptions): Express {
  const { store, nowMs = Date.now, log = console.error } = options;
  const appIds = [...options.appIds];
  const configuredAppIds = new Set(appIds);
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/apps", (_req, res) => {
    const body: AppsResponse = { apps: appIds };
    res.json(body);
  });

  app.get("/api/apps/:appId/reviews", async (req, res) => {
    const { appId } = req.params;

    if (!configuredAppIds.has(appId)) {
      sendJsonError(res, 404, "unknown_app", `Unknown appId: ${appId}`);
      return;
    }

    const parsedHours = parseHours(req.query.hours);
    if (!parsedHours.ok) {
      sendJsonError(res, 400, "invalid_hours", "hours must be a finite positive number");
      return;
    }

    try {
      const sinceMs = nowMs() - parsedHours.hours * MS_PER_HOUR;
      const reviews = await Promise.resolve(store.getRecent(appId, sinceMs));
      const body: ReviewsResponse = { reviews: reviews.map(toReviewDto) };

      res.json(body);
    } catch (error) {
      log("Review lookup failed:", error);
      sendJsonError(res, 500, "reviews_unavailable", "Unable to load reviews");
    }
  });

  return app;
}
