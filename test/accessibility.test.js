import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

test("search forms and dynamic results expose accessible semantics", () => {
  assert.match(html, /role="search"/);
  assert.match(html, /data-results-list aria-live="polite"/);
  assert.match(html, /<label class="sr-only" for="hero-query">/);
  assert.match(html, /role="status" aria-live="polite"/);
});

test("the interface preserves keyboard focus and reduced-motion preferences", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
