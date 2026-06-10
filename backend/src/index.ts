import express from "express";

import { fetchItunesReviews } from "./itunesReviews.js";
import { parseAppId, parsePollIntervalMs, startReviewPolling } from "./polling.js";
import { createSqliteReviewStore } from "./reviewStore.js";

const app = express();
const port = 3000;

const store = createSqliteReviewStore();
const polling = startReviewPolling({
  appId: parseAppId(),
  pollIntervalMs: parsePollIntervalMs(),
  store,
  fetchReviews: fetchItunesReviews,
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

let shuttingDown = false;

function shutdown(): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  polling.stop();
  server.close(() => {
    store.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
