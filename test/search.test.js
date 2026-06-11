import test from "node:test";
import assert from "node:assert/strict";
import { normalize, searchRecordings } from "../src/search.js";

test("normalizes punctuation, casing, and apostrophes", () => {
  assert.equal(normalize("Taylor’s  Version!"), "taylors version");
});

test("ranks an exact title ahead of alternate versions", () => {
  const results = searchRecordings("Love Story");
  assert.equal(results[0].slug, "love-story-taylor-swift");
  assert.equal(results[0].matchReason, "title match");
  assert.equal(results[1].slug, "love-story-taylors-version");
});

test("finds songs by artist", () => {
  const results = searchRecordings("Daft Punk");
  assert.equal(results[0].slug, "get-lucky-daft-punk");
  assert.equal(results[0].matchReason, "artist match");
});

test("finds songs by remembered lyric fragment", () => {
  const results = searchRecordings("we gon be alright");
  assert.equal(results[0].slug, "alright-kendrick-lamar");
  assert.equal(results[0].matchReason, "lyric match");
});

test("tolerates a small typo", () => {
  const results = searchRecordings("bohemain rhapsody");
  assert.equal(results[0].slug, "bohemian-rhapsody-queen");
});

test("returns no results for an unrelated query", () => {
  assert.deepEqual(searchRecordings("quantum gardening manual"), []);
});
