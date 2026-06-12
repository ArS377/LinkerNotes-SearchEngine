import test from "node:test";
import assert from "node:assert/strict";
import {
  lookupWikimediaArtist,
  setWikimediaFetchForTests
} from "../src/providers/wikimedia.js";

test("resolves a Wikidata relation into a Wikipedia artist summary", async () => {
  setWikimediaFetchForTests(async (url) => {
    if (String(url).includes("Special:EntityData")) {
      return {
        ok: true,
        json: async () => ({
          entities: {
            Q1: {
              descriptions: { en: { value: "American rapper" } },
              sitelinks: { enwiki: { title: "Example Artist" } }
            }
          }
        })
      };
    }
    return {
      ok: true,
      json: async () => ({
        query: {
          pages: [{
            title: "Example Artist",
            extract: "Example Artist is an American rapper and songwriter.",
            thumbnail: { source: "https://upload.wikimedia.org/example.jpg" }
          }]
        }
      })
    };
  });

  const artist = await lookupWikimediaArtist(
    "https://www.wikidata.org/wiki/Q1"
  );
  assert.match(artist.summary, /American rapper/);
  assert.match(artist.wikipediaUrl, /Example_Artist/);
  assert.equal(artist.imageUrl, "https://upload.wikimedia.org/example.jpg");
});

test("returns null when no Wikidata identifier is provided", async () => {
  assert.equal(await lookupWikimediaArtist(null), null);
});

test("coalesces concurrent lookups for the same Wikidata entity", async () => {
  let requestCount = 0;
  setWikimediaFetchForTests(async (url) => {
    requestCount += 1;
    if (String(url).includes("Special:EntityData")) {
      return {
        ok: true,
        json: async () => ({
          entities: {
            Q2: {
              descriptions: { en: { value: "Artist" } },
              sitelinks: { enwiki: { title: "Artist" } }
            }
          }
        })
      };
    }
    return {
      ok: true,
      json: async () => ({
        query: { pages: [{ title: "Artist", extract: "Artist summary." }] }
      })
    };
  });

  await Promise.all([
    lookupWikimediaArtist("https://www.wikidata.org/wiki/Q2"),
    lookupWikimediaArtist("https://www.wikidata.org/wiki/Q2")
  ]);
  assert.equal(requestCount, 2);
});
