import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize as normalizePath } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getArtistProfile,
  getFeaturedRecordings,
  getGenre,
  getGenres,
  getRecording
} from "./catalog.js";
import { federatedSearch } from "./federated-search.js";
import { searchRecordings } from "./search.js";
import {
  lookupMusicBrainzArtist,
  lookupMusicBrainzRecording
} from "./providers/musicbrainz.js";
import {
  lookupAppleArtist,
  lookupAppleTrack,
  searchAppleMusic
} from "./providers/apple.js";
import { resolveSpotifyTrack } from "./providers/spotify.js";
import {
  audioIdentificationConfigured,
  identifyAudio
} from "./providers/acrcloud.js";

const root = fileURLToPath(new URL("../public", import.meta.url));
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin"
  });
  response.end(JSON.stringify(body));
}

async function sendStatic(response, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalizePath(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);

  if (!filePath.startsWith(root)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "content-security-policy":
        "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data:; media-src https:; connect-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    });
    response.end(content);
  } catch {
    if (extname(requested)) {
      sendJson(response, 404, { error: "Asset not found" });
      return;
    }
    const index = await readFile(join(root, "index.html"));
    response.writeHead(200, {
      "content-type": contentTypes[".html"],
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "content-security-policy":
        "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data:; media-src https:; connect-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    });
    response.end(index);
  }
}

export const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/api/capabilities") {
    sendJson(response, 200, {
      globalSearch: true,
      applePlayback: true,
      exactSpotifyLinks: Boolean(
        process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET
      ),
      audioIdentification: audioIdentificationConfigured()
    });
    return;
  }

  if (url.pathname === "/api/identify" && request.method === "POST") {
    const chunks = [];
    let total = 0;
    for await (const chunk of request) {
      total += chunk.length;
      if (total > 10 * 1024 * 1024) {
        sendJson(response, 413, { error: "Audio clip must be 10 MB or smaller" });
        return;
      }
      chunks.push(chunk);
    }

    try {
      const match = await identifyAudio(
        Buffer.concat(chunks),
        request.headers["content-type"] || "audio/mpeg"
      );
      if (!match.matched) {
        sendJson(response, 200, { matched: false, results: [] });
        return;
      }
      const query = `${match.title} ${match.artist}`;
      const search = await federatedSearch(query);
      sendJson(response, 200, { ...match, query, ...search });
    } catch (error) {
      if (error.code === "NOT_CONFIGURED") {
        sendJson(response, 503, {
          error: "Audio identification is not configured",
          required: [
            "ACRCLOUD_HOST",
            "ACRCLOUD_ACCESS_KEY",
            "ACRCLOUD_ACCESS_SECRET"
          ]
        });
        return;
      }
      if (error.code === "EMPTY_AUDIO") {
        sendJson(response, 400, { error: error.message });
        return;
      }
      sendJson(response, 502, { error: "Audio identification provider unavailable" });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  if (url.pathname === "/api/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (url.pathname === "/api/search") {
    const query = url.searchParams.get("q") || "";
    const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);
    const search = query
      ? await federatedSearch(query, { offset })
      : {
          results: [],
          localCount: 0,
          globalCount: 0,
          remoteStatus: "ok",
          offset: 0,
          nextOffset: 20,
          hasMore: false
        };
    sendJson(response, 200, {
      query,
      ...search
    });
    return;
  }

  if (url.pathname === "/api/suggest") {
    const query = (url.searchParams.get("q") || "").trim();
    if (query.length < 2) {
      sendJson(response, 200, { query, suggestions: [] });
      return;
    }
    const local = searchRecordings(query, 5).map((result) => ({
      ...result,
      source: "Liner Notes",
      external: false
    }));
    const applePayload = await searchAppleMusic(query, 8).catch(() => ({
      results: []
    }));
    const seen = new Set(
      local.map((result) => `${result.title}::${result.artist}`.toLowerCase())
    );
    const apple = (applePayload.results || applePayload)
      .filter((result) => {
        const key = `${result.title}::${result.artist}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, Math.max(0, 8 - local.length));
    sendJson(response, 200, {
      query,
      suggestions: [...local, ...apple].slice(0, 8)
    });
    return;
  }

  if (url.pathname === "/api/discover") {
    sendJson(response, 200, {
      featured: getFeaturedRecordings(),
      genres: getGenres()
    });
    return;
  }

  if (url.pathname.startsWith("/api/artists/")) {
    const slug = decodeURIComponent(url.pathname.slice("/api/artists/".length));
    const artist = getArtistProfile(slug);
    if (!artist) {
      sendJson(response, 404, { error: "Artist not found" });
      return;
    }
    sendJson(response, 200, artist);
    return;
  }

  if (url.pathname.startsWith("/api/external-artists/")) {
    const id = decodeURIComponent(
      url.pathname.slice("/api/external-artists/".length)
    );
    try {
      sendJson(response, 200, await lookupMusicBrainzArtist(id));
    } catch {
      sendJson(response, 502, { error: "Global artist lookup unavailable" });
    }
    return;
  }

  if (url.pathname.startsWith("/api/apple-artists/")) {
    const id = decodeURIComponent(url.pathname.slice("/api/apple-artists/".length));
    try {
      sendJson(response, 200, await lookupAppleArtist(id));
    } catch {
      sendJson(response, 502, { error: "Commercial artist lookup unavailable" });
    }
    return;
  }

  if (url.pathname.startsWith("/api/genres/")) {
    const slug = decodeURIComponent(url.pathname.slice("/api/genres/".length));
    const genre = getGenre(slug);
    if (!genre) {
      sendJson(response, 404, { error: "Genre not found" });
      return;
    }
    sendJson(response, 200, genre);
    return;
  }

  if (url.pathname.startsWith("/api/songs/")) {
    const slug = decodeURIComponent(url.pathname.slice("/api/songs/".length));
    const recording = getRecording(slug);
    if (!recording) {
      sendJson(response, 404, { error: "Song not found" });
      return;
    }
    sendJson(response, 200, recording);
    return;
  }

  if (url.pathname.startsWith("/api/external-songs/")) {
    const id = decodeURIComponent(
      url.pathname.slice("/api/external-songs/".length)
    );
    try {
      const recording = await lookupMusicBrainzRecording(id);
      const applePayload = await searchAppleMusic(
        `${recording.title} ${recording.artist.name}`,
        5
      ).catch(() => ({ results: [] }));
      const appleResults = applePayload.results || applePayload;
      const exactApple = appleResults.find(
        (candidate) =>
          candidate.title.toLowerCase() === recording.title.toLowerCase()
          && candidate.artist.toLowerCase() === recording.artist.name.toLowerCase()
      ) || appleResults[0];
      if (exactApple) {
        Object.assign(recording, {
          appleTrackId: exactApple.appleTrackId,
          appleMusicUrl: exactApple.appleMusicUrl,
          previewUrl: exactApple.previewUrl,
          artworkUrl: exactApple.artworkUrl,
          isStreamable: exactApple.isStreamable,
          providers: ["MusicBrainz", "Apple Music"]
        });
      }
      if (!recording.spotifyUrl) {
        Object.assign(
          recording,
          await resolveSpotifyTrack(recording.title, recording.artist.name)
        );
      }
      sendJson(response, 200, recording);
    } catch {
      sendJson(response, 502, { error: "Global recording lookup unavailable" });
    }
    return;
  }

  if (url.pathname.startsWith("/api/apple-songs/")) {
    const id = decodeURIComponent(url.pathname.slice("/api/apple-songs/".length));
    try {
      const recording = await lookupAppleTrack(id);
      Object.assign(
        recording,
        await resolveSpotifyTrack(recording.title, recording.artist.name)
      );
      sendJson(response, 200, recording);
    } catch {
      sendJson(response, 502, { error: "Commercial recording lookup unavailable" });
    }
    return;
  }

  if (url.pathname.startsWith("/api/playback/")) {
    const slug = decodeURIComponent(url.pathname.slice("/api/playback/".length));
    const recording = getRecording(slug);
    if (!recording) {
      sendJson(response, 404, { error: "Song not found" });
      return;
    }
    const applePayload = await searchAppleMusic(
      `${recording.title} ${recording.artist.name}`,
      5
    ).catch(() => ({ results: [] }));
    const appleResults = applePayload.results || applePayload;
    const exactApple = appleResults.find(
      (candidate) =>
        candidate.title.toLowerCase() === recording.title.toLowerCase()
        && candidate.artist.toLowerCase() === recording.artist.name.toLowerCase()
    ) || appleResults[0];
    const spotify = await resolveSpotifyTrack(
      recording.title,
      recording.artist.name
    );
    sendJson(response, 200, {
      ...spotify,
      appleMusicUrl: exactApple?.appleMusicUrl || null,
      previewUrl: exactApple?.previewUrl || null,
      artworkUrl: exactApple?.artworkUrl || null
    });
    return;
  }

  await sendStatic(response, url.pathname);
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, () => {
    console.log(`Liner Notes is listening on http://localhost:${port}`);
  });
}
