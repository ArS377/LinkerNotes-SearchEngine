const views = [...document.querySelectorAll("[data-view]")];
const searchForms = [...document.querySelectorAll("[data-search-form]")];
const searchInputs = [...document.querySelectorAll("[data-search-input]")];
const resultsTitle = document.querySelector("[data-results-title]");
const resultsSummary = document.querySelector("[data-results-summary]");
const resultsList = document.querySelector("[data-results-list]");
const songContent = document.querySelector("[data-song-content]");
const audioDialog = document.querySelector("[data-audio-dialog]");

function showView(name) {
  for (const view of views) {
    view.hidden = view.dataset.view !== name;
  }
  document.querySelector("#app").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function syncInputs(value) {
  for (const input of searchInputs) input.value = value;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

function route(path, { replace = false } = {}) {
  if (replace) history.replaceState({}, "", path);
  else history.pushState({}, "", path);
  renderRoute();
}

function renderResult(result) {
  const title = escapeHtml(result.title);
  const artist = escapeHtml(result.artist);
  return `
    <a class="result-card" href="/songs/${encodeURIComponent(result.slug)}">
      <span class="result-art" style="--art-color: ${escapeHtml(result.color)}" aria-hidden="true"></span>
      <span>
        <span class="match-badge">${escapeHtml(result.matchReason)}</span>
        <span class="result-title">${title}</span>
        <span class="result-meta">${artist} · ${escapeHtml(result.album)}</span>
      </span>
      <span class="result-version">${escapeHtml(result.version)}<br>${result.releaseDate.slice(0, 4)}</span>
      <span class="result-arrow" aria-hidden="true">↗</span>
    </a>
  `;
}

async function renderSearch(query) {
  showView("results");
  syncInputs(query);
  resultsTitle.textContent = `“${query}”`;
  resultsSummary.textContent = "";
  resultsList.innerHTML = '<div class="loading-state">Searching the catalog…</div>';
  document.title = `${query} - Liner Notes`;

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Search request failed");
    const body = await response.json();
    resultsSummary.textContent = `${body.results.length} ${
      body.results.length === 1 ? "recording" : "recordings"
    } found`;

    if (body.results.length === 0) {
      resultsList.innerHTML = `
        <div class="empty-state">
          <h2>Nothing surfaced yet.</h2>
          <p>Try a title, artist, or a longer lyric fragment.</p>
        </div>
      `;
      return;
    }

    resultsList.innerHTML = body.results.map(renderResult).join("");
  } catch {
    resultsList.innerHTML = `
      <div class="error-state">
        <h2>Search took a wrong turn.</h2>
        <p>Please try again in a moment.</p>
      </div>
    `;
  }
}

function renderCredits(credits) {
  return credits
    .map(
      ([label, value]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>
      `
    )
    .join("");
}

function renderChartFacts(facts) {
  if (facts.length === 0) {
    return '<p class="provider-note">No verified chart fact is available for this recording yet.</p>';
  }

  return facts
    .map(
      (fact) => `
        <div class="chart-fact">
          <span>${escapeHtml(fact.label)}</span>
          <strong>${escapeHtml(fact.value)}</strong>
          <small>${escapeHtml(fact.source)} · ${escapeHtml(fact.asOf)}</small>
        </div>
      `
    )
    .join("");
}

function renderRelated(related) {
  if (related.length === 0) return "";
  return `
    <section class="related-section">
      <span class="section-number">04 / RELATED RECORDINGS</span>
      <h2>Other versions</h2>
      ${related
        .map(
          (item) => `
            <a class="related-link" href="/songs/${encodeURIComponent(item.slug)}">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.version)}</span>
              <span aria-hidden="true">↗</span>
            </a>
          `
        )
        .join("")}
    </section>
  `;
}

function renderSongMarkup(song) {
  const shadow = `${song.color}99`;
  return `
    <header class="song-hero">
      <div
        class="song-art"
        style="--art-color: ${escapeHtml(song.color)}; --art-shadow: ${escapeHtml(shadow)}"
        role="img"
        aria-label="Abstract artwork for ${escapeHtml(song.title)}"
      ></div>
      <div>
        <p class="song-kicker">${escapeHtml(song.version)}</p>
        <h1>${escapeHtml(song.title)}</h1>
        <p class="song-artist">${escapeHtml(song.artist.name)}</p>
        <div class="song-facts">
          <span>${formatDate(song.releaseDate)}</span>
          <span>${escapeHtml(song.album)}</span>
          <span>${escapeHtml(song.duration)}</span>
          <span>${song.genres.map(escapeHtml).join(" · ")}</span>
        </div>
        <div class="song-actions">
          <a class="primary-action" href="${escapeHtml(song.spotifyUrl)}" target="_blank" rel="noreferrer">
            Find on Spotify ↗
          </a>
          <button class="secondary-action" type="button" data-audio-trigger>Identify from audio</button>
        </div>
      </div>
    </header>

    <div class="song-body">
      <div>
        <section class="song-section">
          <span class="section-number">01 / LYRICS</span>
          <h2>Lyrics</h2>
          <div class="lyrics-unavailable">
            <p>${escapeHtml(song.lyrics.message)}</p>
            <span class="provider-note">
              We do not scrape or reproduce unlicensed lyrics. Search matching currently
              uses a tiny evaluation fragment stored for this portfolio demo.
            </span>
          </div>
        </section>

        <section class="song-section story-section">
          <span class="section-number">02 / THE STORY</span>
          <h2>Behind the song</h2>
          <p>${escapeHtml(song.story)}</p>
        </section>
      </div>

      <aside class="song-sidebar">
        <section>
          <h3>Credits</h3>
          <dl class="credit-list">${renderCredits(song.credits)}</dl>
        </section>
        <section>
          <h3>About the artist</h3>
          <p><strong>${escapeHtml(song.artist.name)}</strong></p>
          <p class="artist-summary">${escapeHtml(song.artist.summary)}</p>
          <p class="provider-note">${escapeHtml(song.artist.country)}</p>
        </section>
        <section>
          <h3>Listening and chart signals</h3>
          ${renderChartFacts(song.chartFacts)}
          <p class="provider-note">
            No estimated Spotify lifetime totals. Every metric is labeled by source and date.
          </p>
        </section>
        <section>
          <h3>Sources</h3>
          <p class="sources-list">${song.sources.map(escapeHtml).join(" · ")}</p>
        </section>
      </aside>
    </div>
    ${renderRelated(song.related)}
  `;
}

async function renderSong(slug) {
  showView("song");
  songContent.innerHTML = '<div class="loading-state compact-search-wrap">Opening the liner notes…</div>';

  try {
    const response = await fetch(`/api/songs/${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error("Song request failed");
    const song = await response.json();
    document.title = `${song.title} by ${song.artist.name} - Liner Notes`;
    songContent.innerHTML = renderSongMarkup(song);
  } catch {
    songContent.innerHTML = `
      <div class="error-state compact-search-wrap">
        <h2>That recording is not in the catalog.</h2>
        <a class="text-link" href="/">Return to search</a>
      </div>
    `;
  }
}

function renderRoute() {
  const url = new URL(window.location.href);
  if (url.pathname === "/about") {
    document.title = "About - Liner Notes";
    showView("about");
    return;
  }

  if (url.pathname.startsWith("/songs/")) {
    renderSong(decodeURIComponent(url.pathname.slice("/songs/".length)));
    return;
  }

  const query = url.searchParams.get("q");
  if (url.pathname === "/search" && query) {
    renderSearch(query);
    return;
  }

  document.title = "Liner Notes - Find the song. Know the story.";
  syncInputs("");
  showView("home");
}

for (const form of searchForms) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = new FormData(form).get("q").trim();
    if (!query) return;
    route(`/search?q=${encodeURIComponent(query)}`);
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (
    link &&
    link.origin === window.location.origin &&
    !link.hasAttribute("download") &&
    link.target !== "_blank"
  ) {
    event.preventDefault();
    route(`${link.pathname}${link.search}`);
    return;
  }

  const example = event.target.closest("[data-example]");
  if (example) {
    route(`/search?q=${encodeURIComponent(example.dataset.example)}`);
    return;
  }

  if (event.target.closest("[data-audio-trigger]")) {
    audioDialog.showModal();
  }

  if (event.target.closest("[data-dialog-close]")) {
    audioDialog.close();
  }
});

audioDialog.addEventListener("click", (event) => {
  if (event.target === audioDialog) audioDialog.close();
});

window.addEventListener("popstate", renderRoute);
renderRoute();
