import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_APP_ID,
  DEFAULT_POLL_INTERVAL_MS,
  parseAppIds,
  parsePollIntervalMs,
} from "./config.js";

test("parseAppIds returns the default when APP_IDS is missing", () => {
  assert.deepEqual(parseAppIds({}), [DEFAULT_APP_ID]);
});

test("parseAppIds returns the default when APP_IDS is blank", () => {
  assert.deepEqual(parseAppIds({ APP_IDS: "   " }), [DEFAULT_APP_ID]);
  assert.deepEqual(parseAppIds({ APP_IDS: "" }), [DEFAULT_APP_ID]);
});

test("parseAppIds parses a single app id", () => {
  assert.deepEqual(parseAppIds({ APP_IDS: "123456789" }), ["123456789"]);
});

test("parseAppIds parses multiple ids with whitespace", () => {
  assert.deepEqual(parseAppIds({ APP_IDS: " 111 , 222 , 333 " }), ["111", "222", "333"]);
});

test("parseAppIds dedupes ids preserving order", () => {
  assert.deepEqual(parseAppIds({ APP_IDS: "111,222,111,333,222" }), ["111", "222", "333"]);
});

test("parseAppIds drops empty segments", () => {
  assert.deepEqual(parseAppIds({ APP_IDS: "111,, ,222" }), ["111", "222"]);
});

test("parseAppIds throws when explicitly set but yields no valid ids", () => {
  assert.throws(() => parseAppIds({ APP_IDS: ",, ," }), /at least one valid app ID/);
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
