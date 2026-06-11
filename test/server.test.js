import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { server } from "../src/server.js";
import { setMusicBrainzFetchForTests } from "../src/providers/musicbrainz.js";

let baseUrl;

before(async () => {
  setMusicBrainzFetchForTests(async (url) => {
    if (String(url).includes("/recording/remote-id")) {
      return {
        ok: true,
        json: async () => ({
          id: "remote-id",
          title: "Remote Song",
          "artist-credit": [
            { name: "Remote Artist", artist: { id: "remote-artist", name: "Remote Artist" } }
          ],
          releases: [{ title: "Remote Album", status: "Official", date: "2024" }]
        })
      };
    }
    return { ok: true, json: async () => ({ recordings: [] }) };
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

test("health endpoint reports readiness", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("search endpoint returns explained matches", async () => {
  const response = await fetch(`${baseUrl}/api/search?q=with%20the%20lights%20out`);
  const body = await response.json();
  assert.equal(body.results[0].slug, "smells-like-teen-spirit-nirvana");
  assert.equal(body.results[0].matchReason, "lyric match");
  assert.equal(body.remoteStatus, "ok");
});

test("external song endpoint builds a global catalog page", async () => {
  const response = await fetch(`${baseUrl}/api/external-songs/remote-id`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.title, "Remote Song");
  assert.equal(body.external, true);
});

test("song endpoint returns canonical artist and related versions", async () => {
  const response = await fetch(`${baseUrl}/api/songs/love-story-taylor-swift`);
  const body = await response.json();
  assert.equal(body.artist.name, "Taylor Swift");
  assert.equal(body.related[0].slug, "love-story-taylors-version");
});

test("song endpoint returns 404 for unknown slugs", async () => {
  const response = await fetch(`${baseUrl}/api/songs/not-a-song`);
  assert.equal(response.status, 404);
});

test("discover endpoint returns featured recordings and generated genres", async () => {
  const response = await fetch(`${baseUrl}/api/discover`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.featured[0].slug, "bohemian-rhapsody-queen");
  assert.ok(body.genres.some((genre) => genre.slug === "hip-hop"));
});

test("artist endpoint returns an artist discography", async () => {
  const response = await fetch(`${baseUrl}/api/artists/taylor-swift`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.name, "Taylor Swift");
  assert.equal(body.recordings.length, 2);
});

test("genre endpoint returns matching recordings", async () => {
  const response = await fetch(`${baseUrl}/api/genres/country`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.ok(body.recordings.every((recording) => recording.genres.includes("country")));
});

test("discovery endpoints return 404 for unknown entities", async () => {
  const artistResponse = await fetch(`${baseUrl}/api/artists/unknown`);
  const genreResponse = await fetch(`${baseUrl}/api/genres/unknown`);
  assert.equal(artistResponse.status, 404);
  assert.equal(genreResponse.status, 404);
});

test("serves the production application shell", async () => {
  const response = await fetch(baseUrl);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /Find the song/);
  assert.match(body, /data-search-form/);
});

test("serves client routes through the application shell", async () => {
  const response = await fetch(`${baseUrl}/songs/jolene-dolly-parton`);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /Liner Notes/);
});

test("supports deployment probes for static assets", async () => {
  const response = await fetch(`${baseUrl}/styles.css`, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/css/);
});

test("returns 404 for missing static assets", async () => {
  const response = await fetch(`${baseUrl}/missing.css`);
  assert.equal(response.status, 404);
});
