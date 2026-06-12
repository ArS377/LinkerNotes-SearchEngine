const apiRoot = "https://coverartarchive.org";
const cache = new Map();
const cacheTtlMs = 24 * 60 * 60 * 1000;
const maxCacheEntries = 200;
let fetchImplementation = globalThis.fetch;

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > cacheTtlMs) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function writeCache(key, value) {
  if (cache.size >= maxCacheEntries) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { createdAt: Date.now(), value });
}

export async function lookupCoverArt(releaseId) {
  if (!releaseId) return null;
  const cached = readCache(releaseId);
  if (cached !== undefined) return cached;

  const response = await fetchImplementation(
    `${apiRoot}/release/${encodeURIComponent(releaseId)}`,
    {
      headers: {
        accept: "application/json",
        "user-agent": "LinerNotesSearch/0.1.0"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000)
    }
  );
  if (response.status === 404) {
    writeCache(releaseId, null);
    return null;
  }
  if (!response.ok) {
    throw new Error(`Cover Art Archive returned ${response.status}`);
  }

  const body = await response.json();
  const image = body.images?.find((candidate) => candidate.front)
    || body.images?.[0];
  const artwork = image
    ? {
        source: "Cover Art Archive",
        releaseId,
        artworkUrl: image.image || null,
        thumbnailUrl:
          image.thumbnails?.["500"]
          || image.thumbnails?.["250"]
          || image.thumbnails?.small
          || image.image
          || null
      }
    : null;
  writeCache(releaseId, artwork);
  return artwork;
}

export function setCoverArtFetchForTests(fetchFn) {
  fetchImplementation = fetchFn;
  cache.clear();
}
