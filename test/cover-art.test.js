import test from "node:test";
import assert from "node:assert/strict";
import {
  lookupCoverArt,
  setCoverArtFetchForTests
} from "../src/providers/cover-art.js";

test("returns front cover artwork and a useful thumbnail", async () => {
  setCoverArtFetchForTests(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      images: [
        {
          front: true,
          image: "https://archive.example/full.jpg",
          thumbnails: {
            "500": "https://archive.example/500.jpg"
          }
        }
      ]
    })
  }));

  const artwork = await lookupCoverArt("release-id");
  assert.equal(artwork.artworkUrl, "https://archive.example/full.jpg");
  assert.equal(artwork.thumbnailUrl, "https://archive.example/500.jpg");
  assert.equal(artwork.source, "Cover Art Archive");
});

test("treats a missing cover as an available empty result", async () => {
  setCoverArtFetchForTests(async () => ({
    ok: false,
    status: 404
  }));

  assert.equal(await lookupCoverArt("missing-release"), null);
});
