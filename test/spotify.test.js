import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSpotifyTrack,
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
              name: "Once in a Lifetime",
              artists: [{ name: "Talking Heads" }],
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
  delete process.env.SPOTIFY_CLIENT_ID;
  delete process.env.SPOTIFY_CLIENT_SECRET;
});
