import { createHmac } from "node:crypto";

let fetchImplementation = globalThis.fetch;

export function audioIdentificationConfigured() {
  return Boolean(
    process.env.ACRCLOUD_HOST
    && process.env.ACRCLOUD_ACCESS_KEY
    && process.env.ACRCLOUD_ACCESS_SECRET
  );
}

function signature(timestamp) {
  const stringToSign = [
    "POST",
    "/v1/identify",
    process.env.ACRCLOUD_ACCESS_KEY,
    "audio",
    "1",
    timestamp
  ].join("\n");
  return createHmac("sha1", process.env.ACRCLOUD_ACCESS_SECRET)
    .update(stringToSign)
    .digest("base64");
}

export async function identifyAudio(bytes, mimeType = "audio/mpeg") {
  if (!audioIdentificationConfigured()) {
    const error = new Error("Audio identification is not configured");
    error.code = "NOT_CONFIGURED";
    throw error;
  }
  if (!bytes?.length) {
    const error = new Error("Audio clip is empty");
    error.code = "EMPTY_AUDIO";
    throw error;
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const form = new FormData();
  form.set("access_key", process.env.ACRCLOUD_ACCESS_KEY);
  form.set("data_type", "audio");
  form.set("signature_version", "1");
  form.set("signature", signature(timestamp));
  form.set("sample_bytes", String(bytes.length));
  form.set("timestamp", timestamp);
  form.set("sample", new Blob([bytes], { type: mimeType }), "sample");

  const response = await fetchImplementation(
    `https://${process.env.ACRCLOUD_HOST}/v1/identify`,
    {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(12_000)
    }
  );
  if (!response.ok) {
    throw new Error(`ACRCloud returned ${response.status}`);
  }

  const body = await response.json();
  const music = body.metadata?.music?.[0];
  if (!music) {
    return {
      matched: false,
      status: body.status || null
    };
  }

  return {
    matched: true,
    title: music.title,
    artist: music.artists?.map((artist) => artist.name).join(", ") || "Unknown artist",
    album: music.album?.name || null,
    releaseDate: music.release_date || null,
    score: music.score || null,
    externalIds: music.external_ids || {},
    externalMetadata: music.external_metadata || {}
  };
}

export function setAcrCloudFetchForTests(fetchFn) {
  fetchImplementation = fetchFn;
}
