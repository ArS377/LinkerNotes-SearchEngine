import test from "node:test";
import assert from "node:assert/strict";
import {
  lookupAppleTrack,
  searchAppleMusic,
  setAppleFetchForTests
} from "../src/providers/apple.js";

const track = {
  trackId: 300948073,
  artistId: 155546,
  artistName: "Talking Heads",
  collectionName: "Remain In Light",
  trackName: "Once In a Lifetime",
  trackCensoredName: "Once In a Lifetime",
  trackViewUrl: "https://music.apple.com/us/album/example?i=300948073",
  previewUrl: "https://audio.example/preview.m4a",
  artworkUrl100: "https://image.example/100x100bb.jpg",
  releaseDate: "1980-10-08T07:00:00Z",
  trackTimeMillis: 258600,
  primaryGenreName: "Alternative",
  isStreamable: true
};

test("normalizes Apple search results with exact playback metadata", async () => {
  setAppleFetchForTests(async () => ({
    ok: true,
    json: async () => ({ resultCount: 1, results: [track] })
  }));

  const results = await searchAppleMusic("Once in a Lifetime Talking Heads");
  assert.equal(results[0].slug, "apple-300948073");
  assert.equal(results[0].duration, "4:19");
  assert.equal(results[0].appleMusicUrl, track.trackViewUrl);
  assert.equal(results[0].previewUrl, track.previewUrl);
  assert.match(results[0].artworkUrl, /600x600bb/);
});

test("builds an on-demand page from an Apple track", async () => {
  setAppleFetchForTests(async () => ({
    ok: true,
    json: async () => ({ resultCount: 1, results: [track] })
  }));

  const recording = await lookupAppleTrack("300948073");
  assert.equal(recording.title, "Once In a Lifetime");
  assert.equal(recording.artist.name, "Talking Heads");
  assert.equal(recording.isStreamable, true);
});
