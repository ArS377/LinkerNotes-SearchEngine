import test from "node:test";
import assert from "node:assert/strict";
import { federatedSearch } from "../src/federated-search.js";

test("merges local and global results", async () => {
  const result = await federatedSearch("Love Story", {
    remoteSearch: async () => [
      {
        slug: "mbid-new",
        title: "Love Story",
        artist: "A Different Artist",
        external: true
      }
    ]
  });

  assert.equal(result.results[0].source, "Liner Notes");
  assert.ok(result.results.some((recording) => recording.slug === "mbid-new"));
  assert.equal(result.remoteStatus, "ok");
});

test("deduplicates equivalent local and global recordings", async () => {
  const result = await federatedSearch("Jolene", {
    remoteSearch: async () => [
      {
        slug: "mbid-jolene",
        title: "Jolene",
        artist: "Dolly Parton",
        external: true
      }
    ]
  });

  assert.equal(
    result.results.filter(
      (recording) =>
        recording.title === "Jolene" && recording.artist === "Dolly Parton"
    ).length,
    1
  );
});

test("keeps local search working during provider outages", async () => {
  const result = await federatedSearch("Daft Punk", {
    remoteSearch: async () => {
      throw new Error("offline");
    }
  });

  assert.equal(result.results[0].slug, "get-lucky-daft-punk");
  assert.equal(result.remoteStatus, "unavailable");
});
