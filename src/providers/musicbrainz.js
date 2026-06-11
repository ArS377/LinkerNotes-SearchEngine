const apiRoot = "https://musicbrainz.org/ws/2";
const cache = new Map();
const cacheTtlMs = 10 * 60 * 1000;
const maxCacheEntries = 200;
let nextRequestAt = 0;
let fetchImplementation = globalThis.fetch;

function userAgent() {
  const contact = process.env.MUSICBRAINZ_CONTACT || "https://github.com/ArS377/SearchEngine";
  return `LinerNotesSearch/0.1.0 (${contact})`;
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > cacheTtlMs) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key, value) {
  if (cache.size >= maxCacheEntries) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { createdAt: Date.now(), value });
}

async function respectRateLimit() {
  const waitMs = Math.max(0, nextRequestAt - Date.now());
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  nextRequestAt = Date.now() + 1100;
}

async function requestMusicBrainz(path, params) {
  const url = new URL(`${apiRoot}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }
  url.searchParams.set("fmt", "json");

  const cacheKey = url.toString();
  const cached = readCache(cacheKey);
  if (cached) return cached;

  await respectRateLimit();
  const response = await fetchImplementation(url, {
    headers: {
      accept: "application/json",
      "user-agent": userAgent()
    },
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz returned ${response.status}`);
  }

  const body = await response.json();
  writeCache(cacheKey, body);
  return body;
}

function artistCreditText(credits = []) {
  return credits
    .map((credit) => {
      if (typeof credit === "string") return credit;
      return `${credit.name || credit.artist?.name || ""}${credit.joinphrase || ""}`;
    })
    .join("")
    .trim();
}

function primaryArtist(credits = []) {
  const credit = credits.find((candidate) => typeof candidate !== "string");
  return credit?.artist || null;
}

function firstRelease(recording) {
  return recording.releases?.find((release) => release.status === "Official")
    || recording.releases?.[0]
    || null;
}

function formatDuration(length) {
  if (!Number.isFinite(length)) return null;
  const seconds = Math.round(length / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function externalSlug(id) {
  return `mbid-${id}`;
}

export function normalizeMusicBrainzResult(recording) {
  const artist = primaryArtist(recording["artist-credit"]);
  const release = firstRelease(recording);
  const genres = (recording.genres || [])
    .sort((left, right) => (right.count || 0) - (left.count || 0))
    .slice(0, 3)
    .map((genre) => genre.name);

  return {
    source: "MusicBrainz",
    external: true,
    musicBrainzId: recording.id,
    slug: externalSlug(recording.id),
    title: recording.title || "Untitled recording",
    artist: artistCreditText(recording["artist-credit"]) || "Unknown artist",
    artistMusicBrainzId: artist?.id || null,
    album: release?.title || "Release unknown",
    releaseDate: release?.date || recording["first-release-date"] || null,
    version: recording.disambiguation || "MusicBrainz recording",
    genres,
    duration: formatDuration(recording.length),
    color: "#496b66",
    matchReason: "global catalog match",
    score: Number(recording.score || 0)
  };
}

export async function searchMusicBrainz(query, limit = 12) {
  const body = await requestMusicBrainz("recording", {
    query,
    limit: String(limit)
  });
  return (body.recordings || []).map(normalizeMusicBrainzResult);
}

export async function lookupMusicBrainzRecording(id) {
  const recording = await requestMusicBrainz(`recording/${encodeURIComponent(id)}`, {
    inc: "artist-credits+releases+genres"
  });
  const result = normalizeMusicBrainzResult(recording);
  const artist = primaryArtist(recording["artist-credit"]);
  const release = firstRelease(recording);

  return {
    id: `musicbrainz-${recording.id}`,
    slug: result.slug,
    external: true,
    musicBrainzId: recording.id,
    title: result.title,
    album: result.album,
    releaseDate: result.releaseDate,
    duration: result.duration,
    genres: result.genres,
    version: result.version,
    color: result.color,
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(
      `${result.title} ${result.artist}`
    )}`,
    musicBrainzUrl: `https://musicbrainz.org/recording/${recording.id}`,
    lyrics: {
      status: "unavailable",
      message:
        "Lyrics are not included in MusicBrainz. A licensed lyrics provider is required."
    },
    story:
      "This recording was found in the global MusicBrainz catalog. Rich editorial context has not been added to the local index yet.",
    credits: [
      ["Artist credit", result.artist],
      ["Release", release?.title || "Unknown"],
      ["MusicBrainz ID", recording.id]
    ],
    chartFacts: [],
    sources: ["MusicBrainz"],
    related: [],
    artist: {
      id: artist?.id || null,
      slug: null,
      name: result.artist,
      country: artist?.country || "Country unavailable",
      summary:
        "This artist is available through the global MusicBrainz catalog but does not yet have a locally enriched profile.",
      sources: ["MusicBrainz"]
    }
  };
}

export function setMusicBrainzFetchForTests(fetchFn) {
  fetchImplementation = fetchFn;
  cache.clear();
  nextRequestAt = 0;
}
