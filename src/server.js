import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize as normalizePath } from "node:path";
import { fileURLToPath } from "node:url";
import { getRecording } from "./catalog.js";
import { searchRecordings } from "./search.js";

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
    "cache-control": "no-store"
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
      "cache-control": "public, max-age=300"
    });
    response.end(content);
  } catch {
    if (extname(requested)) {
      sendJson(response, 404, { error: "Asset not found" });
      return;
    }
    const index = await readFile(join(root, "index.html"));
    response.writeHead(200, { "content-type": contentTypes[".html"] });
    response.end(index);
  }
}

export const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

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
    sendJson(response, 200, {
      query,
      results: searchRecordings(query)
    });
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

  await sendStatic(response, url.pathname);
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, () => {
    console.log(`Liner Notes is listening on http://localhost:${port}`);
  });
}
