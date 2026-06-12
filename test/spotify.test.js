import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSpotifyTrack,
  searchSpotifyTracks,
  setSpotifyFetchForTests
} from "../src/providers/spotify.js";

test("returns a working Spotify search fallback without credentials", async () => {
  const oldId = process.env.SPOTIFY_CLIENT_ID;
  const oldSecret = process.env.SPOTIFY_CLIENT_SECRET;
  delete process.env.SPOTIFY_CLIENT_ID;
  delete process.env.SPOTIFY_CLIENT_SECRET;

  const result = await resolveSpotifyTrack("Once in a Lifetime", "Talking Heads");
  assert.equal(result.spotifyUrl, null);
  assert.match(result.spotifySearchUrl, /open\.spotify\.com\/search/);

  if (oldId) process.env.SPOTIFY_CLIENT_ID = oldId;
  if (oldSecret) process.env.SPOTIFY_CLIENT_SECRET = oldSecret;
});

test("resolves an exact Spotify track when credentials are configured", async () => {
  process.env.SPOTIFY_CLIENT_ID = "client";
  process.env.SPOTIFY_CLIENT_SECRET = "secret";
  setSpotifyFetchForTests(async (url) => {
    if (String(url).includes("api/token")) {
      return {
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 })
      };
    }
    return {
      ok: true,
      json: async () => ({
        tracks: {
          items: [
            {
              id: "exact",
              name: "Once in a Lifetime",
              artists: [{ name: "Talking Heads" }],
              popularity: 78,
              external_ids: { isrc: "USWB18100001" },
              external_urls: {
                spotify: "https://open.spotify.com/track/exact"
              }
            }
          ]
        }
      })
    };
  });

  const result = await resolveSpotifyTrack("Once in a Lifetime", "Talking Heads");
  assert.equal(result.spotifyUrl, "https://open.spotify.com/track/exact");
  assert.equal(result.spotifyPopularity, 78);
  assert.equal(result.spotifyId, "exact");
  assert.equal(result.isrc, "USWB18100001");
  delete process.env.SPOTIFY_CLIENT_ID;
  delete process.env.SPOTIFY_CLIENT_SECRET;
  setSpotifyFetchForTests(globalThis.fetch);
});

test("normalizes Spotify search results for ranking", async () => {
  process.env.SPOTIFY_CLIENT_ID = "client";
  process.env.SPOTIFY_CLIENT_SECRET = "secret";
  setSpotifyFetchForTests(async (url) => {
    if (String(url).includes("api/token")) {
      return {
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 })
      };
    }
    return {
      ok: true,
      json: async () => ({
        tracks: {
          items: [
            {
              id: "popular",
              name: "Popular Song",
              artists: [{ name: "Primary Artist" }, { name: "Guest Artist" }],
              popularity: 91,
              external_ids: { isrc: "USABC2600001" },
              external_urls: {
                spotify: "https://open.spotify.com/track/popular"
              }
            }
          ]
        }
      })
    };
  });

  const response = await searchSpotifyTracks("Popular Song", 10);
  assert.equal(response.configured, true);
  assert.deepEqual(response.results[0], {
    source: "Spotify",
    spotifyId: "popular",
    spotifyUrl: "https://open.spotify.com/track/popular",
    title: "Popular Song",
    artist: "Primary Artist",
    spotifyPopularity: 91,
    isrc: "USABC2600001"
  });

  delete process.env.SPOTIFY_CLIENT_ID;
  delete process.env.SPOTIFY_CLIENT_SECRET;
  setSpotifyFetchForTests(globalThis.fetch);
});
