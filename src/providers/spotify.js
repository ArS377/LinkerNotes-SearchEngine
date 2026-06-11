let fetchImplementation = globalThis.fetch;
let tokenCache = null;

export function spotifySearchUrl(title, artist) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
}

async function accessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.value;
  }

  const response = await fetchImplementation(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(5000)
    }
  );
  if (!response.ok) return null;
  const body = await response.json();
  tokenCache = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000
  };
  return tokenCache.value;
}

export async function resolveSpotifyTrack(title, artist) {
  const fallback = {
    spotifyUrl: null,
    spotifySearchUrl: spotifySearchUrl(title, artist)
  };
  const token = await accessToken();
  if (!token) return fallback;

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", `track:${title} artist:${artist}`);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "5");

  const response = await fetchImplementation(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) return fallback;
  const body = await response.json();
  const normalizedTitle = title.toLowerCase();
  const normalizedArtist = artist.toLowerCase();
  const exact = body.tracks?.items?.find(
    (track) =>
      track.name.toLowerCase() === normalizedTitle
      && track.artists.some((candidate) =>
        candidate.name.toLowerCase() === normalizedArtist
      )
  );
  const track = exact || body.tracks?.items?.[0];
  return {
    spotifyUrl: track?.external_urls?.spotify || null,
    spotifySearchUrl: fallback.spotifySearchUrl
  };
}

export function setSpotifyFetchForTests(fetchFn) {
  fetchImplementation = fetchFn;
  tokenCache = null;
}
