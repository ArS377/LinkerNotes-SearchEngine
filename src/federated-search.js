import { searchRecordings, normalize } from "./search.js";
import { searchMusicBrainz } from "./providers/musicbrainz.js";
import { searchAppleMusic } from "./providers/apple.js";

function dedupeKey(result) {
  return normalize(`${result.title} ${result.artist}`);
}

function globalRelevance(query, result) {
  const normalizedQuery = normalize(query);
  const title = normalize(result.title);
  const artist = normalize(result.artist);
  const combined = `${title} ${artist}`;
  const queryTokens = new Set(normalizedQuery.split(" ").filter(Boolean));
  const candidateTokens = new Set(combined.split(" ").filter(Boolean));
  const matchedTokens = [...queryTokens].filter((token) => candidateTokens.has(token));
  const tokenCoverage = queryTokens.size
    ? matchedTokens.length / queryTokens.size
    : 0;

  let score = tokenCoverage * 500;
  if (combined === normalizedQuery) score += 1000;
  else if (combined.includes(normalizedQuery)) score += 500;
  if (title === normalizedQuery) score += 400;
  else if (normalizedQuery.includes(title)) score += 180;
  if (artist === normalizedQuery) score += 300;
  else if (normalizedQuery.includes(artist)) score += 160;
  score += Number(result.score || 0);
  return score;
}

function mergeProviderResult(primary, secondary) {
  return {
    ...primary,
    providers: [...new Set([
      ...(primary.providers || [primary.source]),
      ...(secondary.providers || [secondary.source])
    ])],
    appleTrackId: primary.appleTrackId || secondary.appleTrackId,
    appleMusicUrl: primary.appleMusicUrl || secondary.appleMusicUrl,
    previewUrl: primary.previewUrl || secondary.previewUrl,
    artworkUrl: primary.artworkUrl || secondary.artworkUrl,
    thumbnailUrl: primary.thumbnailUrl || secondary.thumbnailUrl,
    duration: primary.duration || secondary.duration,
    genres: primary.genres?.length ? primary.genres : secondary.genres
  };
}

export async function federatedSearch(
  query,
  {
    musicBrainzSearch = searchMusicBrainz,
    appleSearch = searchAppleMusic,
    limit = 20
  } = {}
) {
  const local = searchRecordings(query, limit).map((result) => ({
    ...result,
    source: "Liner Notes",
    external: false
  }));

  const [musicBrainzResponse, appleResponse] = await Promise.allSettled([
    musicBrainzSearch(query, limit),
    appleSearch(query, limit)
  ]);
  const musicBrainz = musicBrainzResponse.status === "fulfilled"
    ? musicBrainzResponse.value
    : [];
  const apple = appleResponse.status === "fulfilled" ? appleResponse.value : [];
  const providerStatus = {
    musicBrainz: musicBrainzResponse.status === "fulfilled" ? "ok" : "unavailable",
    apple: appleResponse.status === "fulfilled" ? "ok" : "unavailable"
  };

  const remoteMap = new Map();
  for (const result of [...musicBrainz, ...apple]) {
    const key = dedupeKey(result);
    const existing = remoteMap.get(key);
    remoteMap.set(key, existing ? mergeProviderResult(existing, result) : result);
  }
  const remote = [...remoteMap.values()];

  const localByKey = new Map(local.map((result) => [dedupeKey(result), result]));
  for (const result of remote) {
    const key = dedupeKey(result);
    if (localByKey.has(key)) {
      localByKey.set(key, mergeProviderResult(localByKey.get(key), result));
    }
  }
  const enrichedLocal = [...localByKey.values()];
  const seen = new Set(enrichedLocal.map(dedupeKey));
  const uniqueRemote = remote
    .filter((result) => {
      const key = dedupeKey(result);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (left, right) =>
        globalRelevance(query, right) - globalRelevance(query, left)
    );

  return {
    results: [...enrichedLocal, ...uniqueRemote].slice(0, limit),
    localCount: enrichedLocal.length,
    globalCount: uniqueRemote.length,
    remoteStatus: Object.values(providerStatus).every((status) => status === "unavailable")
      ? "unavailable"
      : "ok",
    providerStatus
  };
}
