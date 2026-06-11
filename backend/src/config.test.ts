import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_APP_ID,
  DEFAULT_POLL_INTERVAL_MS,
  parseAppId,
  parsePollIntervalMs,
} from "./config.js";

test("parseAppId returns the default when APP_ID is missing", () => {
  assert.equal(parseAppId({}), DEFAULT_APP_ID);
});

test("parseAppId trims whitespace and uses the configured value", () => {
  assert.equal(parseAppId({ APP_ID: "  123456789  " }), "123456789");
});

test("parseAppId falls back to the default for blank values", () => {
  assert.equal(parseAppId({ APP_ID: "   " }), DEFAULT_APP_ID);
  assert.equal(parseAppId({ APP_ID: "" }), DEFAULT_APP_ID);
});

test("parsePollIntervalMs returns the default when POLL_INTERVAL is missing", () => {
  assert.equal(parsePollIntervalMs({}), DEFAULT_POLL_INTERVAL_MS);
});

test("parsePollIntervalMs parses a valid interval", () => {
  assert.equal(parsePollIntervalMs({ POLL_INTERVAL: "60000" }), 60_000);
});

test("parsePollIntervalMs falls back to the default for invalid values", () => {
  assert.equal(parsePollIntervalMs({ POLL_INTERVAL: "not-a-number" }), DEFAULT_POLL_INTERVAL_MS);
  assert.equal(parsePollIntervalMs({ POLL_INTERVAL: "0" }), DEFAULT_POLL_INTERVAL_MS);
  assert.equal(parsePollIntervalMs({ POLL_INTERVAL: "-1000" }), DEFAULT_POLL_INTERVAL_MS);
  assert.equal(parsePollIntervalMs({ POLL_INTERVAL: "   " }), DEFAULT_POLL_INTERVAL_MS);
});
