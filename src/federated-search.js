import { searchRecordings, normalize } from "./search.js";
import { searchMusicBrainz } from "./providers/musicbrainz.js";

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

export async function federatedSearch(
  query,
  { remoteSearch = searchMusicBrainz, limit = 12 } = {}
) {
  const local = searchRecordings(query, limit).map((result) => ({
    ...result,
    source: "Liner Notes",
    external: false
  }));

  let remote = [];
  let remoteStatus = "ok";
  try {
    remote = await remoteSearch(query, limit);
  } catch {
    remoteStatus = "unavailable";
  }

  const seen = new Set(local.map(dedupeKey));
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
    results: [...local, ...uniqueRemote].slice(0, limit),
    localCount: local.length,
    globalCount: uniqueRemote.length,
    remoteStatus
  };
}
