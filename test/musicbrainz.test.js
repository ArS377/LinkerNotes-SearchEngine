import test from "node:test";
import assert from "node:assert/strict";
import {
  lookupMusicBrainzRecording,
  searchMusicBrainz,
  setMusicBrainzFetchForTests
} from "../src/providers/musicbrainz.js";

test("normalizes MusicBrainz search results", async () => {
  setMusicBrainzFetchForTests(async () => ({
    ok: true,
    json: async () => ({
      recordings: [
        {
          id: "1234",
          title: "Dreams",
          score: 99,
          length: 257000,
          "artist-credit": [
            { name: "Fleetwood Mac", artist: { id: "artist-1", name: "Fleetwood Mac" } }
          ],
          releases: [{ title: "Rumours", status: "Official", date: "1977-02-04" }],
          genres: [{ name: "rock", count: 4 }]
        }
      ]
    })
  }));

  const results = await searchMusicBrainz("Dreams");
  assert.equal(results.results[0].slug, "mbid-1234");
  assert.equal(results.results[0].artist, "Fleetwood Mac");
  assert.equal(results.results[0].duration, "4:17");
});

test("builds an on-demand song page from a MusicBrainz lookup", async () => {
  setMusicBrainzFetchForTests(async () => ({
    ok: true,
    json: async () => ({
      id: "5678",
      title: "Once in a Lifetime",
      length: 251000,
      "first-release-date": "1980-10-08",
      "artist-credit": [
        {
          name: "Talking Heads",
          artist: { id: "artist-2", name: "Talking Heads", country: "US" }
        }
      ],
      releases: [{ title: "Remain in Light", status: "Official", date: "1980-10-08" }],
      genres: [{ name: "new wave", count: 5 }]
    })
  }));

  const recording = await lookupMusicBrainzRecording("5678");
  assert.equal(recording.title, "Once in a Lifetime");
  assert.equal(recording.artist.name, "Talking Heads");
  assert.equal(recording.external, true);
  assert.match(recording.musicBrainzUrl, /5678/);
});
