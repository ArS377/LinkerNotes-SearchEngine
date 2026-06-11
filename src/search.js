import { getArtist, recordings } from "./catalog.js";

export function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function trigrams(value) {
  const padded = `  ${value} `;
  const values = new Set();
  for (let index = 0; index < padded.length - 2; index += 1) {
    values.add(padded.slice(index, index + 3));
  }
  return values;
}

function similarity(left, right) {
  if (!left || !right) return 0;
  const leftSet = trigrams(left);
  const rightSet = trigrams(right);
  let overlap = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) overlap += 1;
  }
  return (2 * overlap) / (leftSet.size + rightSet.size);
}

function fieldScore(query, value, weight) {
  if (!value) return 0;
  if (value === query) return weight;
  if (value.startsWith(query)) return weight * 0.86;
  if (value.includes(query)) return weight * 0.72;
  return similarity(query, value) * weight * 0.55;
}

export function searchRecordings(rawQuery, limit = 8) {
  const query = normalize(rawQuery);
  if (!query) return [];

  return recordings
    .map((recording) => {
      const artist = getArtist(recording.artistId);
      const title = normalize(recording.title);
      const artistName = normalize(artist.name);
      const album = normalize(recording.album);
      const lyrics = recording.lyricSearchFragments.map(normalize);

      const scores = [
        { reason: "title match", score: fieldScore(query, title, 100) },
        { reason: "artist match", score: fieldScore(query, artistName, 82) },
        { reason: "album match", score: fieldScore(query, album, 55) },
        {
          reason: "lyric match",
          score: Math.max(...lyrics.map((value) => fieldScore(query, value, 92)))
        }
      ];

      const combined = normalize(`${recording.title} ${artist.name}`);
      scores.push({
        reason: "title and artist match",
        score: fieldScore(query, combined, 96)
      });

      const best = scores.reduce((winner, current) =>
        current.score > winner.score ? current : winner
      );

      return {
        slug: recording.slug,
        title: recording.title,
        artist: artist.name,
        artistSlug: artist.slug,
        album: recording.album,
        releaseDate: recording.releaseDate,
        version: recording.version,
        genres: recording.genres,
        color: recording.color,
        matchReason: best.reason,
        score: best.score + recording.prominence * 0.04
      };
    })
    .filter((result) => result.score >= 18)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score, ...result }) => ({
      ...result,
      relevanceScore: score
    }));
}
