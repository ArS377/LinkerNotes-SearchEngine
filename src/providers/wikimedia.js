const cache = new Map();
const inFlight = new Map();
const cacheTtlMs = 24 * 60 * 60 * 1000;
const maxCacheEntries = 200;
let fetchImplementation = globalThis.fetch;

function wikidataId(value) {
  return String(value || "").match(/\bQ\d+\b/i)?.[0]?.toUpperCase() || null;
}

function writeCache(key, value) {
  if (cache.size >= maxCacheEntries) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { createdAt: Date.now(), value });
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > cacheTtlMs) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function conciseExtract(value, maxLength = 700) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    shortened.lastIndexOf(". "),
    shortened.lastIndexOf("! "),
    shortened.lastIndexOf("? ")
  );
  return `${shortened.slice(0, sentenceEnd > 300 ? sentenceEnd + 1 : maxLength).trim()}…`;
}

async function requestJson(url) {
  const response = await fetchImplementation(url, {
    headers: {
      accept: "application/json",
      "user-agent": "LinerNotesSearch/0.1.0"
    },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`Wikimedia returned ${response.status}`);
  return response.json();
}

async function fetchWikimediaArtist(id) {
  const entityBody = await requestJson(
    `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`
  );
  const entity = entityBody.entities?.[id];
  if (!entity || entity.missing !== undefined) return null;

  const title = entity.sitelinks?.enwiki?.title;
  const description = entity.descriptions?.en?.value || null;
  if (!title) {
    return {
      source: "Wikidata",
      summary: description,
      wikipediaUrl: null,
      wikidataUrl: `https://www.wikidata.org/wiki/${id}`,
      imageUrl: null
    };
  }

  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "extracts|pageimages");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "640");
  url.searchParams.set("titles", title);
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const pageBody = await requestJson(url);
  const page = pageBody.query?.pages?.find((candidate) => !candidate.missing);
  return {
    source: "Wikipedia",
    summary: conciseExtract(page?.extract || description),
    wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(
      page?.title || title
    ).replaceAll("%20", "_")}`,
    wikidataUrl: `https://www.wikidata.org/wiki/${id}`,
    imageUrl: page?.thumbnail?.source || null
  };
}

export async function lookupWikimediaArtist(wikidataUrl) {
  const id = wikidataId(wikidataUrl);
  if (!id) return null;
  const cached = readCache(id);
  if (cached !== undefined) return cached;
  if (inFlight.has(id)) return inFlight.get(id);

  const pending = fetchWikimediaArtist(id)
    .then((result) => {
      writeCache(id, result);
      return result;
    })
    .finally(() => {
      inFlight.delete(id);
    });
  inFlight.set(id, pending);
  return pending;
}

export function setWikimediaFetchForTests(fetchFn) {
  fetchImplementation = fetchFn;
  cache.clear();
  inFlight.clear();
}
