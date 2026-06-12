import test from "node:test";
import assert from "node:assert/strict";
import {
  lookupAppleArtist,
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
  assert.equal(results.results[0].slug, "apple-300948073");
  assert.equal(results.results[0].duration, "4:19");
  assert.equal(results.results[0].appleMusicUrl, track.trackViewUrl);
  assert.equal(results.results[0].previewUrl, track.previewUrl);
  assert.match(results.results[0].artworkUrl, /600x600bb/);
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

test("builds an Apple artist profile with recordings", async () => {
  setAppleFetchForTests(async () => ({
    ok: true,
    json: async () => ({
      resultCount: 2,
      results: [
        {
          wrapperType: "artist",
          artistType: "Artist",
          artistId: 155546,
          artistName: "Talking Heads",
          primaryGenreName: "Alternative"
        },
        { ...track, wrapperType: "track", kind: "song" }
      ]
    })
  }));

  const artist = await lookupAppleArtist("155546");
  assert.equal(artist.name, "Talking Heads");
  assert.equal(artist.recordings[0].title, "Once In a Lifetime");
});

test("filters duplicate and unreleased artist recordings", async () => {
  setAppleFetchForTests(async () => ({
    ok: true,
    json: async () => ({
      resultCount: 4,
      results: [
        {
          wrapperType: "artist",
          artistType: "Artist",
          artistId: 155546,
          artistName: "Talking Heads"
        },
        { ...track, wrapperType: "track", kind: "song" },
        {
          ...track,
          trackId: 2,
          collectionName: "Compilation",
          wrapperType: "track",
          kind: "song"
        },
        {
          ...track,
          trackId: 3,
          trackName: "Future Song",
          releaseDate: "2999-01-01T00:00:00Z",
          wrapperType: "track",
          kind: "song"
        }
      ]
    })
  }));

  const artist = await lookupAppleArtist("155546");
  assert.equal(artist.recordings.length, 1);
  assert.equal(artist.recordings[0].title, "Once In a Lifetime");
});
