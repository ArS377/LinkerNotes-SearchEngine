# Liner Notes

An independent music search engine for finding recordings by title, artist, or
remembered lyrics, then exploring playback links, credits, versions, and sources.

## Run locally

Requires Node.js 22 or newer.

```bash
npm test
npm start
```

Open <http://localhost:3000>.

## Search coverage

Search combines three layers:

1. The locally enriched catalog for detailed pages and remembered-lyric matching.
2. MusicBrainz for broad open recording metadata.
3. Apple Music's official Search API for commercial-catalog coverage, artwork,
   legal previews, and exact Apple Music track links.

No single provider contains every recording ever made. When one remote provider is
unavailable, the others continue to return results.

## Optional integrations

Copy `.env.example` to `.env` and add credentials as needed.

- Spotify client credentials resolve exact Spotify track URLs. Without them, the
  interface provides a correctly encoded Spotify search link.
- ACRCloud credentials enable audio-file and humming identification.
- `MUSICBRAINZ_CONTACT` identifies this application in MusicBrainz API requests.

Credentials are used only on the server and are never exposed to browser code.

## Tests

```bash
npm test
```

The suite covers local relevance, provider normalization, federated deduplication,
provider outages, exact/fallback playback links, audio identification signing,
HTTP routes, and static asset behavior.
