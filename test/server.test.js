import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { server } from "../src/server.js";

let baseUrl;

before(async () => {
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
