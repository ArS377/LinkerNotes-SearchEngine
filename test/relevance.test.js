import test from "node:test";
import assert from "node:assert/strict";
import { searchRecordings } from "../src/search.js";

const titleArtistCases = [
  ["Love Story Taylor Swift", "love-story-taylor-swift"],
  ["Bohemian Rhapsody Queen", "bohemian-rhapsody-queen"],
  ["Jolene Dolly Parton", "jolene-dolly-parton"],
  ["Alright Kendrick Lamar", "alright-kendrick-lamar"],
  ["Get Lucky Daft Punk", "get-lucky-daft-punk"],
  ["Smells Like Teen Spirit Nirvana", "smells-like-teen-spirit-nirvana"]
];

const lyricCases = [
  ["we were both young when i first saw you", "love-story-taylor-swift"],
  ["is this the real life", "bohemian-rhapsody-queen"],
  ["please dont take him just because you can", "jolene-dolly-parton"],
  ["we gon be alright", "alright-kendrick-lamar"],
  ["were up all night to get lucky", "get-lucky-daft-punk"],
  ["with the lights out", "smells-like-teen-spirit-nirvana"]
];

function topThreeContains(query, slug) {
  return searchRecordings(query, 3).some((result) => result.slug === slug);
}

test("title and artist evaluation meets the 95% top-three target", () => {
  const passing = titleArtistCases.filter(([query, slug]) =>
    topThreeContains(query, slug)
  ).length;
  assert.ok(passing / titleArtistCases.length >= 0.95);
});

test("lyric evaluation meets the 85% top-three target", () => {
  const passing = lyricCases.filter(([query, slug]) =>
    topThreeContains(query, slug)
  ).length;
  assert.ok(passing / lyricCases.length >= 0.85);
});

test("local search stays comfortably below the one-second page target", () => {
  const durations = [];
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const startedAt = performance.now();
    searchRecordings(titleArtistCases[iteration % titleArtistCases.length][0], 8);
    durations.push(performance.now() - startedAt);
  }
  durations.sort((left, right) => left - right);
  const p95 = durations[Math.floor(durations.length * 0.95)];
  assert.ok(p95 < 100, `Expected local search p95 below 100ms, received ${p95}ms`);
});
