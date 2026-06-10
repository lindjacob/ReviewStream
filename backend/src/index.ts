import { fetchItunesReviews } from "./itunesReviews.js";
import { parseAppId, parsePollIntervalMs, startReviewPolling } from "./polling.js";
import { createSqliteReviewStore } from "./reviewStore.js";
import { createServer } from "./server.js";

const port = 3000;
const appId = parseAppId();

const store = createSqliteReviewStore();
const polling = startReviewPolling({
  appId,
  pollIntervalMs: parsePollIntervalMs(),
  store,
  fetchReviews: fetchItunesReviews,
});
const app = createServer({ appIds: [appId], store });

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
