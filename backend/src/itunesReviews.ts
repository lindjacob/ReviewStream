export type Review = {
  id: string;
  appId: string;
  author: string;
  title: string;
  content: string;
  rating: number;
  submittedAt: Date;
};

export class MalformedItunesReviewsPayloadError extends Error {
  override readonly name = "MalformedItunesReviewsPayloadError";

  constructor(message: string) {
    super(message);
  }
}

export class ItunesReviewsFetchError extends Error {
  override readonly name = "ItunesReviewsFetchError";

  readonly status: number;
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`iTunes reviews fetch failed: ${status} ${statusText}`);
    this.status = status;
    this.statusText = statusText;
  }
}

type FetchItunesReviewsOptions = {
  fetch?: typeof globalThis.fetch;
  country?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readLabel(value: unknown, field: string): string {
  if (!isRecord(value) || typeof value.label !== "string") {
    throw new MalformedItunesReviewsPayloadError(`Missing or invalid ${field}`);
  }
  return value.label;
}

function isReviewEntry(entry: unknown): boolean {
  return isRecord(entry) && "im:rating" in entry;
}

function parseReviewEntry(entry: unknown, appId: string): Review {
  if (!isRecord(entry)) {
    throw new MalformedItunesReviewsPayloadError("Review entry must be an object");
  }

  const id = readLabel(entry.id, "review id");
  const author = readLabel(
    isRecord(entry.author) ? entry.author.name : undefined,
    "author name",
  );
  const title = readLabel(entry.title, "title");
  const content = readLabel(entry.content, "content");
  const rating = parseRating(readLabel(entry["im:rating"], "rating"));
  const submittedAt = parseSubmittedAt(readLabel(entry.updated, "updated"));

  return { id, appId, author, title, content, rating, submittedAt };
}

function parseRating(label: string): number {
  const rating = Number(label);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new MalformedItunesReviewsPayloadError(`Invalid rating: ${label}`);
  }
  return rating;
}

function parseSubmittedAt(label: string): Date {
  const submittedAt = new Date(label);
  if (Number.isNaN(submittedAt.getTime())) {
    throw new MalformedItunesReviewsPayloadError(`Invalid submitted date: ${label}`);
  }
  return submittedAt;
}

export function parseItunesReviews(payload: unknown, appId: string): Review[] {
  if (!isRecord(payload) || !isRecord(payload.feed)) {
    throw new MalformedItunesReviewsPayloadError("Missing feed object");
  }

  const { entry } = payload.feed;
  if (!Array.isArray(entry)) {
    throw new MalformedItunesReviewsPayloadError("feed.entry must be an array");
  }

  return entry.filter(isReviewEntry).map((reviewEntry) => parseReviewEntry(reviewEntry, appId));
}

function buildItunesReviewsUrl(appId: string, country: string): URL {
  return new URL(
    `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=mostRecent/page=1/json`,
  );
}

export async function fetchItunesReviews(
  appId: string,
  options: FetchItunesReviewsOptions = {},
): Promise<Review[]> {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const country = options.country ?? "us";
  const response = await fetchFn(buildItunesReviewsUrl(appId, country));

  if (!response.ok) {
    throw new ItunesReviewsFetchError(response.status, response.statusText);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MalformedItunesReviewsPayloadError("Response body is not valid JSON");
  }

  return parseItunesReviews(payload, appId);
}
