export const artists = [
  {
    id: "artist-taylor-swift",
    slug: "taylor-swift",
    name: "Taylor Swift",
    country: "United States",
    summary:
      "American singer-songwriter known for narrative songwriting and stylistic reinvention.",
    sources: ["MusicBrainz", "Wikidata"]
  },
  {
    id: "artist-queen",
    slug: "queen",
    name: "Queen",
    country: "United Kingdom",
    summary:
      "British rock band whose layered arrangements joined hard rock, pop, and theatrical performance.",
    sources: ["MusicBrainz", "Wikidata"]
  },
  {
    id: "artist-dolly-parton",
    slug: "dolly-parton",
    name: "Dolly Parton",
    country: "United States",
    summary:
      "American singer-songwriter whose catalog is foundational to modern country music.",
    sources: ["MusicBrainz", "Wikidata"]
  },
  {
    id: "artist-kendrick-lamar",
    slug: "kendrick-lamar",
    name: "Kendrick Lamar",
    country: "United States",
    summary:
      "American rapper and songwriter recognized for concept-driven albums and intricate lyricism.",
    sources: ["MusicBrainz", "Wikidata"]
  },
  {
    id: "artist-daft-punk",
    slug: "daft-punk",
    name: "Daft Punk",
    country: "France",
    summary:
      "French electronic duo known for combining house music with pop, disco, and a distinctive visual identity.",
    sources: ["MusicBrainz", "Wikidata"]
  },
  {
    id: "artist-nirvana",
    slug: "nirvana",
    name: "Nirvana",
    country: "United States",
    summary:
      "American rock band central to the worldwide breakthrough of alternative rock in the early 1990s.",
    sources: ["MusicBrainz", "Wikidata"]
  }
];

export const recordings = [
  {
    id: "recording-love-story-2008",
    slug: "love-story-taylor-swift",
    workId: "work-love-story",
    title: "Love Story",
    artistId: "artist-taylor-swift",
    album: "Fearless",
    releaseDate: "2008-09-15",
    duration: "3:55",
    genres: ["country pop", "pop"],
    version: "Original studio recording",
    prominence: 98,
    lyricSearchFragments: ["we were both young when i first saw you"],
    lyrics: {
      status: "unavailable",
      message:
        "Full lyrics will appear here when a licensed lyrics provider is connected."
    },
    story:
      "A narrative song that transforms a forbidden young romance into a hopeful ending. Its framing borrows familiar names from Romeo and Juliet while deliberately changing the outcome.",
    credits: [
      ["Written by", "Taylor Swift"],
      ["Produced by", "Nathan Chapman, Taylor Swift"],
      ["Label", "Big Machine Records"]
    ],
    chartFacts: [
      {
        label: "US Billboard Hot 100",
        value: "Peak #4",
        asOf: "2009",
        source: "Billboard"
      }
    ],
    spotifyUrl: "https://open.spotify.com/search/Love%20Story%20Taylor%20Swift",
    color: "#a88a68",
    sources: ["MusicBrainz", "Wikidata", "Billboard"]
  },
  {
    id: "recording-love-story-2021",
    slug: "love-story-taylors-version",
    workId: "work-love-story",
    title: "Love Story (Taylor's Version)",
    artistId: "artist-taylor-swift",
    album: "Fearless (Taylor's Version)",
    releaseDate: "2021-02-12",
    duration: "3:55",
    genres: ["country pop", "pop"],
    version: "2021 rerecording",
    prominence: 88,
    lyricSearchFragments: ["we were both young when i first saw you"],
    lyrics: {
      status: "unavailable",
      message:
        "Full lyrics will appear here when a licensed lyrics provider is connected."
    },
    story:
      "A rerecording of the 2008 composition, created as part of Swift's project to revisit her early catalog. It retains the original arrangement while presenting a newly recorded performance.",
    credits: [
      ["Written by", "Taylor Swift"],
      ["Produced by", "Taylor Swift, Christopher Rowe"],
      ["Label", "Republic Records"]
    ],
    chartFacts: [],
    spotifyUrl:
      "https://open.spotify.com/search/Love%20Story%20Taylor's%20Version",
    color: "#c7a975",
    sources: ["MusicBrainz", "Wikidata"]
  },
  {
    id: "recording-bohemian-rhapsody",
    slug: "bohemian-rhapsody-queen",
    workId: "work-bohemian-rhapsody",
    title: "Bohemian Rhapsody",
    artistId: "artist-queen",
    album: "A Night at the Opera",
    releaseDate: "1975-10-31",
    duration: "5:55",
    genres: ["progressive rock", "hard rock"],
    version: "Original studio recording",
    prominence: 100,
    lyricSearchFragments: ["is this the real life"],
    lyrics: {
      status: "unavailable",
      message:
        "Full lyrics will appear here when a licensed lyrics provider is connected."
    },
    story:
      "A through-composed rock recording that moves through ballad, operatic, and hard-rock sections without a conventional chorus. Its elaborate multitracking became part of its legend.",
    credits: [
      ["Written by", "Freddie Mercury"],
      ["Produced by", "Roy Thomas Baker, Queen"],
      ["Label", "EMI"]
    ],
    chartFacts: [
      {
        label: "UK Singles Chart",
        value: "Peak #1",
        asOf: "1975",
        source: "Official Charts"
      }
    ],
    spotifyUrl: "https://open.spotify.com/search/Bohemian%20Rhapsody%20Queen",
    color: "#253755",
    sources: ["MusicBrainz", "Wikidata", "Official Charts"]
  },
  {
    id: "recording-jolene",
    slug: "jolene-dolly-parton",
    workId: "work-jolene",
    title: "Jolene",
    artistId: "artist-dolly-parton",
    album: "Jolene",
    releaseDate: "1973-10-15",
    duration: "2:42",
    genres: ["country"],
    version: "Original studio recording",
    prominence: 93,
    lyricSearchFragments: ["please dont take him just because you can"],
    lyrics: {
      status: "unavailable",
      message:
        "Full lyrics will appear here when a licensed lyrics provider is connected."
    },
    story:
      "A direct plea addressed to a captivating romantic rival. The spare narrative, repeating guitar figure, and vulnerable point of view helped make it one of Parton's defining songs.",
    credits: [
      ["Written by", "Dolly Parton"],
      ["Produced by", "Bob Ferguson"],
      ["Label", "RCA Victor"]
    ],
    chartFacts: [
      {
        label: "Billboard Hot Country Songs",
        value: "Peak #1",
        asOf: "1974",
        source: "Billboard"
      }
    ],
    spotifyUrl: "https://open.spotify.com/search/Jolene%20Dolly%20Parton",
    color: "#b34e34",
    sources: ["MusicBrainz", "Wikidata", "Billboard"]
  },
  {
    id: "recording-alright",
    slug: "alright-kendrick-lamar",
    workId: "work-alright",
    title: "Alright",
    artistId: "artist-kendrick-lamar",
    album: "To Pimp a Butterfly",
    releaseDate: "2015-06-30",
    duration: "3:39",
    genres: ["hip hop", "jazz rap"],
    version: "Original studio recording",
    prominence: 96,
    lyricSearchFragments: ["we gon be alright"],
    lyrics: {
      status: "unavailable",
      message:
        "Full lyrics will appear here when a licensed lyrics provider is connected."
    },
    story:
      "A song that sets personal struggle and structural injustice against a resilient refrain. Its chorus became widely associated with public protest and collective resolve.",
    credits: [
      ["Written by", "Kendrick Lamar, Pharrell Williams, Mark Spears"],
      ["Produced by", "Pharrell Williams, Sounwave"],
      ["Label", "Top Dawg Entertainment, Aftermath, Interscope"]
    ],
    chartFacts: [
      {
        label: "Grammy Awards",
        value: "Best Rap Song",
        asOf: "2016",
        source: "Recording Academy"
      }
    ],
    spotifyUrl: "https://open.spotify.com/search/Alright%20Kendrick%20Lamar",
    color: "#3a3a38",
    sources: ["MusicBrainz", "Wikidata", "Recording Academy"]
  },
  {
    id: "recording-get-lucky",
    slug: "get-lucky-daft-punk",
    workId: "work-get-lucky",
    title: "Get Lucky",
    artistId: "artist-daft-punk",
    album: "Random Access Memories",
    releaseDate: "2013-04-19",
    duration: "6:09",
    genres: ["disco", "funk", "pop"],
    version: "Album version",
    prominence: 94,
    lyricSearchFragments: ["were up all night to get lucky"],
    lyrics: {
      status: "unavailable",
      message:
        "Full lyrics will appear here when a licensed lyrics provider is connected."
    },
    story:
      "A live-instrument disco recording built around Nile Rodgers' guitar, a relaxed Pharrell Williams vocal, and Daft Punk's production. It signaled the duo's turn toward studio musicianship.",
    credits: [
      ["Written by", "Thomas Bangalter, Guy-Manuel de Homem-Christo, Nile Rodgers, Pharrell Williams"],
      ["Produced by", "Daft Punk"],
      ["Label", "Columbia"]
    ],
    chartFacts: [
      {
        label: "US Billboard Hot 100",
        value: "Peak #2",
        asOf: "2013",
        source: "Billboard"
      }
    ],
    spotifyUrl: "https://open.spotify.com/search/Get%20Lucky%20Daft%20Punk",
    color: "#9c7c32",
    sources: ["MusicBrainz", "Wikidata", "Billboard"]
  },
  {
    id: "recording-smells-like-teen-spirit",
    slug: "smells-like-teen-spirit-nirvana",
    workId: "work-smells-like-teen-spirit",
    title: "Smells Like Teen Spirit",
    artistId: "artist-nirvana",
    album: "Nevermind",
    releaseDate: "1991-09-10",
    duration: "5:01",
    genres: ["grunge", "alternative rock"],
    version: "Original studio recording",
    prominence: 97,
    lyricSearchFragments: ["with the lights out"],
    lyrics: {
      status: "unavailable",
      message:
        "Full lyrics will appear here when a licensed lyrics provider is connected."
    },
    story:
      "A quiet-loud alternative rock single whose distorted riff and explosive dynamics helped bring grunge into the pop mainstream.",
    credits: [
      ["Written by", "Kurt Cobain, Krist Novoselic, Dave Grohl"],
      ["Produced by", "Butch Vig"],
      ["Label", "DGC"]
    ],
    chartFacts: [
      {
        label: "US Billboard Hot 100",
        value: "Peak #6",
        asOf: "1992",
        source: "Billboard"
      }
    ],
    spotifyUrl:
      "https://open.spotify.com/search/Smells%20Like%20Teen%20Spirit%20Nirvana",
    color: "#5c7449",
    sources: ["MusicBrainz", "Wikidata", "Billboard"]
  }
];

const artistById = new Map(artists.map((artist) => [artist.id, artist]));
const artistBySlug = new Map(artists.map((artist) => [artist.slug, artist]));

export function getArtist(id) {
  return artistById.get(id);
}

function recordingSummary(recording) {
  const artist = getArtist(recording.artistId);
  return {
    slug: recording.slug,
    title: recording.title,
    artist: artist.name,
    artistSlug: artist.slug,
    album: recording.album,
    releaseDate: recording.releaseDate,
    version: recording.version,
    genres: recording.genres,
    color: recording.color
  };
}

export function getArtistProfile(slug) {
  const artist = artistBySlug.get(slug);
  if (!artist) return null;

  const artistRecordings = recordings
    .filter((recording) => recording.artistId === artist.id)
    .sort((left, right) => right.prominence - left.prominence)
    .map(recordingSummary);

  return {
    ...artist,
    genres: [...new Set(artistRecordings.flatMap((recording) => recording.genres))],
    recordings: artistRecordings
  };
}

export function getGenres() {
  const genreMap = new Map();

  for (const recording of recordings) {
    for (const genre of recording.genres) {
      if (!genreMap.has(genre)) genreMap.set(genre, []);
      genreMap.get(genre).push(recording);
    }
  }

  return [...genreMap.entries()]
    .map(([name, genreRecordings]) => ({
      slug: name.replaceAll(" ", "-"),
      name,
      count: genreRecordings.length,
      color: genreRecordings[0].color
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getGenre(slug) {
  const genre = getGenres().find((candidate) => candidate.slug === slug);
  if (!genre) return null;

  return {
    ...genre,
    recordings: recordings
      .filter((recording) => recording.genres.includes(genre.name))
      .sort((left, right) => right.prominence - left.prominence)
      .map(recordingSummary)
  };
}

export function getFeaturedRecordings(limit = 6) {
  return [...recordings]
    .sort((left, right) => right.prominence - left.prominence)
    .slice(0, limit)
    .map(recordingSummary);
}

export function getRecording(slug) {
  const recording = recordings.find((candidate) => candidate.slug === slug);
  if (!recording) return null;

  const artist = getArtist(recording.artistId);
  const related = recordings
    .filter(
      (candidate) =>
        candidate.workId === recording.workId && candidate.id !== recording.id
    )
    .map((candidate) => ({
      slug: candidate.slug,
      title: candidate.title,
      version: candidate.version,
      releaseDate: candidate.releaseDate
    }));

  return {
    ...recording,
    artist,
    related,
    sourceFacts: recording.sources.map((source) => ({
      source,
      fields:
        source === "MusicBrainz"
          ? ["recording identity", "release metadata", "credits"]
          : source === "Wikidata"
            ? ["artist context", "historical context"]
            : ["chart or award fact"],
      retrievedAt: "2026-06-11T00:00:00.000Z",
      confidence:
        source === "MusicBrainz" ? "canonical metadata" : "editorially verified"
    }))
  };
}
