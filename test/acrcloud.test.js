import test from "node:test";
import assert from "node:assert/strict";
import {
  audioIdentificationConfigured,
  identifyAudio,
  setAcrCloudFetchForTests
} from "../src/providers/acrcloud.js";

test("reports when audio identification is not configured", () => {
  delete process.env.ACRCLOUD_HOST;
  delete process.env.ACRCLOUD_ACCESS_KEY;
  delete process.env.ACRCLOUD_ACCESS_SECRET;
  assert.equal(audioIdentificationConfigured(), false);
});

test("normalizes an ACRCloud music match", async () => {
  process.env.ACRCLOUD_HOST = "identify.example.com";
  process.env.ACRCLOUD_ACCESS_KEY = "key";
  process.env.ACRCLOUD_ACCESS_SECRET = "secret";
  setAcrCloudFetchForTests(async (_url, options) => {
    assert.equal(options.method, "POST");
    assert.equal(options.body.get("data_type"), "audio");
    assert.ok(options.body.get("signature"));
    return {
      ok: true,
      json: async () => ({
        status: { code: 0, msg: "Success" },
        metadata: {
          music: [
            {
              title: "Once in a Lifetime",
              artists: [{ name: "Talking Heads" }],
              album: { name: "Remain in Light" },
              release_date: "1980-10-08",
              score: 99,
              external_ids: { isrc: "USWB10000515" }
            }
          ]
        }
      })
    };
  });

  const result = await identifyAudio(Buffer.from("audio"), "audio/mpeg");
  assert.equal(result.matched, true);
  assert.equal(result.artist, "Talking Heads");
  assert.equal(result.externalIds.isrc, "USWB10000515");
  delete process.env.ACRCLOUD_HOST;
  delete process.env.ACRCLOUD_ACCESS_KEY;
  delete process.env.ACRCLOUD_ACCESS_SECRET;
});

test("returns an explicit no-match result", async () => {
  process.env.ACRCLOUD_HOST = "identify.example.com";
  process.env.ACRCLOUD_ACCESS_KEY = "key";
  process.env.ACRCLOUD_ACCESS_SECRET = "secret";
  setAcrCloudFetchForTests(async () => ({
    ok: true,
    json: async () => ({
      status: { code: 1001, msg: "No result" }
    })
  }));

  const result = await identifyAudio(Buffer.from("audio"));
  assert.equal(result.matched, false);
  delete process.env.ACRCLOUD_HOST;
  delete process.env.ACRCLOUD_ACCESS_KEY;
  delete process.env.ACRCLOUD_ACCESS_SECRET;
});
