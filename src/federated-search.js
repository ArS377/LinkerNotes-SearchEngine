import { searchRecordings, normalize } from "./search.js";
import { searchMusicBrainz } from "./providers/musicbrainz.js";

function dedupeKey(result) {
  return normalize(`${result.title} ${result.artist}`);
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
  const uniqueRemote = remote.filter((result) => {
    const key = dedupeKey(result);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    results: [...local, ...uniqueRemote].slice(0, limit),
    localCount: local.length,
    globalCount: uniqueRemote.length,
    remoteStatus
  };
}
