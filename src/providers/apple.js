const apiRoot = "https://itunes.apple.com";
const cache = new Map();
const cacheTtlMs = 10 * 60 * 1000;
let fetchImplementation = globalThis.fetch;

function formatDuration(length) {
  if (!Number.isFinite(length)) return null;
  const seconds = Math.round(length / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function artworkUrl(url, size = 600) {
  return url?.replace(/\/100x100bb\.(jpg|png)$/i, `/${size}x${size}bb.$1`) || null;
}

function normalizeAppleResult(track) {
  return {
    source: "Apple Music",
    providers: ["Apple Music"],
    external: true,
    appleTrackId: String(track.trackId),
    slug: `apple-${track.trackId}`,
    title: track.trackName,
    artist: track.artistName,
    artistAppleId: String(track.artistId),
    album: track.collectionName || "Release unknown",
    releaseDate: track.releaseDate?.slice(0, 10) || null,
    version: track.trackCensoredName !== track.trackName
      ? track.trackCensoredName
      : "Apple Music recording",
    genres: track.primaryGenreName ? [track.primaryGenreName.toLowerCase()] : [],
    duration: formatDuration(track.trackTimeMillis),
    color: "#b24c63",
    artworkUrl: artworkUrl(track.artworkUrl100),
    thumbnailUrl: artworkUrl(track.artworkUrl100, 240),
    previewUrl: track.previewUrl || null,
    appleMusicUrl: track.trackViewUrl || null,
    isStreamable: Boolean(track.isStreamable),
    matchReason: "commercial catalog match",
    score: 0
  };
}

async function request(path, params) {
  const url = new URL(`${apiRoot}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const key = url.toString();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.createdAt < cacheTtlMs) return cached.value;

  const response = await fetchImplementation(url, {
    headers: {
      accept: "application/json",
      "user-agent": "LinerNotesSearch/0.1.0"
    },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`Apple Search API returned ${response.status}`);
  const value = await response.json();
  cache.set(key, { createdAt: Date.now(), value });
  return value;
}

export async function searchAppleMusic(query, limit = 20, offset = 0) {
  const requestedLimit = Math.min(200, offset + limit);
  const body = await request("search", {
    term: query,
    media: "music",
    entity: "song",
    limit: String(requestedLimit),
    country: "US",
    explicit: "Yes"
  });
  return {
    results: (body.results || [])
      .slice(offset, offset + limit)
      .map(normalizeAppleResult),
    total: Number(body.resultCount || 0),
    offset
  };
}

export async function lookupAppleTrack(id) {
  const body = await request("lookup", {
    id,
    entity: "song",
    country: "US"
  });
  const track = body.results?.find((result) => String(result.trackId) === String(id));
  if (!track) throw new Error("Apple track not found");
  const result = normalizeAppleResult(track);

  return {
    id: `apple-${id}`,
    slug: result.slug,
    external: true,
    providers: result.providers,
    appleTrackId: result.appleTrackId,
    title: result.title,
    album: result.album,
    releaseDate: result.releaseDate,
    duration: result.duration,
    genres: result.genres,
    version: result.version,
    color: result.color,
    artworkUrl: result.artworkUrl,
    previewUrl: result.previewUrl,
    appleMusicUrl: result.appleMusicUrl,
    isStreamable: result.isStreamable,
    spotifySearchUrl: spotifySearchUrl(result.title, result.artist),
    lyrics: {
      status: "unavailable",
      message: "A licensed lyrics provider is required for full lyrics."
    },
    story:
      "This track was found in Apple’s commercial music catalog. Editorial context has not been added to the local index yet.",
    credits: [
      ["Artist", result.artist],
      ["Album", result.album],
      ["Apple track ID", result.appleTrackId]
    ],
    chartFacts: [],
    sources: ["Apple Music"],
    related: [],
    artist: {
      id: result.artistAppleId,
      slug: result.artistAppleId ? `apple-${result.artistAppleId}` : null,
      name: result.artist,
      country: "Country unavailable",
      summary:
        "This artist is available through Apple’s global catalog but does not yet have a locally enriched profile.",
      sources: ["Apple Music"]
    }
  };
}

export async function lookupAppleArtist(id, limit = 50) {
  const body = await request("lookup", {
    id,
    entity: "song",
    limit: String(limit),
    sort: "recent",
    country: "US"
  });
  const artist = body.results?.find(
    (result) => result.wrapperType === "artist"
  );
  const tracks = (body.results || [])
    .filter((result) => result.wrapperType === "track" && result.kind === "song")
    .map(normalizeAppleResult);
  if (!artist && tracks.length === 0) throw new Error("Apple artist not found");
  const first = tracks[0];

  return {
    id: String(artist?.artistId || id),
    slug: `apple-${artist?.artistId || id}`,
    external: true,
    source: "Apple Music",
    name: artist?.artistName || first?.artist || "Unknown artist",
    type: artist?.artistType || "Artist",
    country: first?.country || "Country unavailable",
    summary: "Artist profile and recordings from Apple Music’s commercial catalog.",
    genres: [
      ...new Set(
        [artist?.primaryGenreName, ...tracks.flatMap((track) => track.genres)]
          .filter(Boolean)
          .map((genre) => genre.toLowerCase())
      )
    ],
    appleMusicUrl: artist?.artistLinkUrl || artist?.artistViewUrl || null,
    recordings: tracks
  };
}

export function spotifySearchUrl(title, artist) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
}

export function setAppleFetchForTests(fetchFn) {
  fetchImplementation = fetchFn;
  cache.clear();
}
