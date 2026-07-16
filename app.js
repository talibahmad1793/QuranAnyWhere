const cfg = window.SITE_CONFIG;
const API_ROOT = `https://api.github.com/repos/${cfg.githubOwner}/${cfg.githubRepo}/contents`;
const RAW_ROOT = `https://raw.githubusercontent.com/${cfg.githubOwner}/${cfg.githubRepo}/${cfg.githubBranch}`;
const PROGRESS_PREFIX = "qaw:progress:";

// Verified, structured Quran text data (not OCR) from the open-source
// fawazahmed0/quran-api project, served via GitHub raw (same trusted host
// used for our own PDFs). Three editions combined per verse:
//  - Arabic Uthmani text (source: tanzil.net, the standard reference text)
//  - Roman transliteration of the Arabic recitation (source: tanzil.net)
//  - Roman Urdu translation by Abul Ala Maududi (source: quranromanurdu.com)
const QTEXT_ROOT = "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions";
const QTEXT_EDITIONS = {
  arabic: "ara-quranuthmanihaf",
  transliteration: "ara-quran-la",
  urdu: "urd-abulaalamaududi-la",
};
const QURAN_TEXT_BOOK_SLUG = "quran-roman-urdu-hindi";
const DUAS_JSON_PATH = "duas/duas.json";

// Verified hadith data (Arabic + English), same trusted source/host
// pattern as the Qur'an text above. Numbering matches sunnah.com: each
// hadith's overall number is its standard citation (e.g. "Sahih al-Bukhari
// 1"), and reference.book/reference.hadith give the traditional in-book
// chapter and position sunnah.com also shows.
const HADITH_ROOT = "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions";
const HADITH_BOOKS = [
  { slug: "bukhari", name: "Sahih al-Bukhari", ar: "ara-bukhari", en: "eng-bukhari" },
  { slug: "muslim", name: "Sahih Muslim", ar: "ara-muslim", en: "eng-muslim" },
  { slug: "abudawud", name: "Sunan Abi Dawud", ar: "ara-abudawud", en: "eng-abudawud" },
  { slug: "tirmidhi", name: "Jami' at-Tirmidhi", ar: "ara-tirmidhi", en: "eng-tirmidhi" },
  { slug: "nasai", name: "Sunan an-Nasa'i", ar: "ara-nasai", en: "eng-nasai" },
  { slug: "ibnmajah", name: "Sunan Ibn Majah", ar: "ara-ibnmajah", en: "eng-ibnmajah" },
];
const hadithBookCache = {}; // slug -> { sections, hadithsByBook: {bookNum: [{ar,en}]} }

const SURAH_NAMES = [
  null, "Al-Fatihah", "Al-Baqarah", "Aal-e-Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf",
  "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl",
  "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha", "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan",
  "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab",
  "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shuraa",
  "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila",
  "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
  "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil",
  "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la",
  "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
  "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur",
  "Al-Asr", "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas",
];

const app = document.getElementById("app");

document.title = cfg.siteTitle;
document.querySelectorAll("[data-site-title]").forEach((el) => (el.textContent = cfg.siteTitle));

function titleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\.pdf$/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function githubList(path) {
  const url = path ? `${API_ROOT}/${path}?ref=${cfg.githubBranch}` : `${API_ROOT}?ref=${cfg.githubBranch}`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) {
    if (res.status === 403) throw new Error("GitHub API rate limit reached. Try again in a bit.");
    if (res.status === 404) throw new Error("Repo or folder not found. Check config.js.");
    throw new Error(`GitHub API error (${res.status})`);
  }
  return res.json();
}

function naturalSort(a, b) {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function renderLoading(target) {
  target.appendChild(el("div", { class: "spinner" }));
}

function renderError(target, message) {
  target.appendChild(el("p", { class: "state-msg error" }, message));
}

// --- Reading progress (kept in the visitor's own browser only) ---
function getProgress(bookSlug) {
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + bookSlug);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setProgress(bookSlug, file, page) {
  try {
    localStorage.setItem(PROGRESS_PREFIX + bookSlug, JSON.stringify({ file, page, updatedAt: Date.now() }));
  } catch (e) {
    // Storage may be unavailable (private browsing etc) - fine to skip.
  }
}

function partHref(bookSlug, fileName, page) {
  const base = `#/book/${encodeURIComponent(bookSlug)}/part/${encodeURIComponent(fileName)}`;
  return page && page > 1 ? `${base}/page/${page}` : base;
}

async function renderHome() {
  app.innerHTML = "";
  const hero = el("section", { class: "hero" }, [
    el("div", { class: "container" }, [
      el("p", { class: "eyebrow" }, "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0647\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"),
      el("h1", {}, cfg.siteTitle),
      el("p", {}, cfg.tagline),
    ]),
  ]);
  app.appendChild(hero);

  const main = el("main", { class: "container" });
  app.appendChild(main);
  renderLoading(main);

  try {
    const items = await githubList("");
    const RESERVED_FOLDERS = ["duas"]; // reserved for JSON-backed typed collections, not PDF folders
    const folders = items.filter((i) => i.type === "dir" && !RESERVED_FOLDERS.includes(i.name)).sort(naturalSort);
    main.innerHTML = "";

    if (folders.length === 0) {
      main.appendChild(
        el("p", { class: "state-msg" }, "No PDF books yet \u2014 push a folder of PDFs to your repo and refresh.")
      );
    }

    const grid = el("div", { class: "grid" });
    folders.forEach((folder) => {
      const progress = getProgress(folder.name);
      const body = [
        el("span", { class: "card-kicker" }, "Book"),
        el("h2", { class: "card-title" }, titleFromSlug(folder.name)),
      ];
      if (progress) {
        body.push(el("p", { class: "card-desc card-continue" }, `Continue \u2014 ${titleFromSlug(progress.file)}, page ${progress.page}`));
      } else {
        body.push(el("p", { class: "card-desc" }, "Tap to view parts"));
      }
      const card = el(
        "a",
        { class: "card", href: progress ? partHref(folder.name, progress.file, progress.page) : `#/book/${encodeURIComponent(folder.name)}` },
        [el("div", { class: "card-spine" }), el("div", { class: "card-body" }, body)]
      );
      grid.appendChild(card);
    });

    // Typed (non-PDF) collections, sourced from JSON in this repo rather
    // than a folder of files.
    grid.appendChild(
      el("a", { class: "card", href: "#/duas" }, [
        el("div", { class: "card-spine" }),
        el("div", { class: "card-body" }, [
          el("span", { class: "card-kicker" }, "Typed text"),
          el("h2", { class: "card-title" }, "Daily Dua & Dhikr"),
          el("p", { class: "card-desc" }, "Essential duas for every moment of your day"),
        ]),
      ])
    );

    grid.appendChild(
      el("a", { class: "card", href: "#/hadith" }, [
        el("div", { class: "card-spine" }),
        el("div", { class: "card-body" }, [
          el("span", { class: "card-kicker" }, "Typed text"),
          el("h2", { class: "card-title" }, "Hadith Collections"),
          el("p", { class: "card-desc" }, "Sahih al-Bukhari, Sahih Muslim & 4 more \u2014 Arabic & English"),
        ]),
      ])
    );

    main.appendChild(grid);
  } catch (e) {
    main.innerHTML = "";
    renderError(main, e.message);
  }
}

async function renderBook(bookSlug) {
  app.innerHTML = "";
  const main = el("main", { class: "container" });
  app.appendChild(main);
  main.appendChild(el("p", { class: "crumb" }, [el("a", { href: "#/" }, "Library"), ` / ${titleFromSlug(bookSlug)}`]));
  main.appendChild(el("h1", { class: "page-title" }, titleFromSlug(bookSlug)));

  const progress = getProgress(bookSlug);
  if (progress) {
    main.appendChild(
      el("a", { class: "continue-banner", href: partHref(bookSlug, progress.file, progress.page) }, [
        el("span", {}, "\u25b6 Continue reading"),
        el("span", { class: "continue-banner-detail" }, `${titleFromSlug(progress.file)} \u2014 page ${progress.page}`),
      ])
    );
  }

  if (bookSlug === QURAN_TEXT_BOOK_SLUG) {
    main.appendChild(
      el("a", { class: "text-mode-banner", href: "#/quran-text/1" }, [
        el("span", {}, "\u0627 Read as typed text"),
        el("span", { class: "continue-banner-detail" }, "Arabic \u00b7 transliteration \u00b7 Urdu translation \u2014 no scanned pages"),
      ])
    );
  }

  const listWrap = el("div");
  main.appendChild(listWrap);
  renderLoading(listWrap);

  try {
    const items = await githubList(bookSlug);
    const files = items.filter((i) => i.type === "file" && /\.pdf$/i.test(i.name)).sort(naturalSort);
    listWrap.innerHTML = "";

    if (files.length === 0) {
      listWrap.appendChild(el("p", { class: "state-msg" }, "No PDF parts uploaded to this folder yet."));
      return;
    }

    const grid = el("div", { class: "part-grid" });
    files.forEach((file, i) => {
      const tile = el("a", { class: "tile", href: partHref(bookSlug, file.name) }, [
        el("span", { class: "tile-num" }, String(i + 1)),
        el("span", { class: "tile-label" }, titleFromSlug(file.name)),
      ]);
      grid.appendChild(tile);
    });
    listWrap.appendChild(grid);
  } catch (e) {
    listWrap.innerHTML = "";
    renderError(listWrap, e.message);
  }
}

// GitHub's raw file server sends PDFs as application/octet-stream with
// X-Frame-Options: deny, so they can never be shown in an <iframe> - the
// browser just downloads them. Instead we fetch the raw bytes ourselves
// (allowed - GitHub raw sends Access-Control-Allow-Origin: *) and render
// pages with PDF.js onto a canvas.
async function renderPart(bookSlug, fileName, startPage) {
  app.innerHTML = "";
  const rawUrl = `${RAW_ROOT}/${bookSlug}/${encodeURIComponent(fileName)}`;

  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: "#/" }, "Library"),
    " / ",
    el("a", { href: `#/book/${encodeURIComponent(bookSlug)}` }, titleFromSlug(bookSlug)),
    ` / ${titleFromSlug(fileName)}`,
  ]);

  const topBar = el("div", { class: "viewer-top" }, [
    el("a", { href: `#/book/${encodeURIComponent(bookSlug)}` }, "\u2190 Back to parts"),
    el("span", { class: "viewer-part-label" }, titleFromSlug(fileName)),
    el("span", { class: "viewer-page-counter", id: "pageCounter" }, ""),
  ]);

  const canvas = el("canvas", { class: "pdf-canvas", id: "pdfCanvas" });
  const canvasScroll = el("div", { class: "pdf-canvas-scroll", id: "canvasScroll" }, [canvas]);
  const canvasWrap = el("div", { class: "pdf-canvas-wrap" }, [
    el("button", { class: "page-nav-btn page-nav-btn--prev", id: "prevBtn", "aria-label": "Previous page" }, "\u2039"),
    canvasScroll,
    el("button", { class: "page-nav-btn page-nav-btn--next", id: "nextBtn", "aria-label": "Next page" }, "\u203a"),
  ]);
  const hint = el("p", { class: "viewer-hint" }, "Swipe to turn pages \u00b7 double-tap to zoom");

  const viewerWrap = el("div", { class: "viewer-wrap" }, [topBar, canvasWrap, hint]);
  const wrap = el("div", { class: "container" }, [crumb, viewerWrap]);
  app.appendChild(el("main", {}, wrap));

  const pageCounter = document.getElementById("pageCounter");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // Figure out this file's neighbors within the book, so paging past the
  // first/last page of this PDF can hop into the previous/next part.
  let siblingFiles = [fileName];
  let fileIndex = 0;
  try {
    const items = await githubList(bookSlug);
    siblingFiles = items.filter((i) => i.type === "file" && /\.pdf$/i.test(i.name)).sort(naturalSort).map((f) => f.name);
    fileIndex = siblingFiles.indexOf(fileName);
  } catch (e) {
    // Non-fatal - we just won't be able to auto-advance between parts.
  }

  let pdfDoc = null;
  let currentPage = 1;
  let rendering = false;
  let zoomed = false;

  async function renderPage(num) {
    if (!pdfDoc || rendering) return;
    rendering = true;
    const page = await pdfDoc.getPage(num);

    // Fixed small padding only - the nav buttons intentionally float over
    // the page rather than reserving their own column, on both mobile and
    // desktop, so this doesn't need to change per device.
    const availableWidth = canvasWrap.clientWidth - 24;
    const desktopCap = 820; // comfortable single-page reading width

    const baseViewport = page.getViewport({ scale: 1 });

    // Fit to WIDTH, not height. Fitting the whole page height into the
    // screen shrinks text unnecessarily on normal (non-scanned) documents -
    // mobile readers expect to scroll down a tall page, same as any PDF or
    // e-book app, rather than have everything squeezed to fit one screen.
    const fitScale = Math.min(availableWidth, desktopCap) / baseViewport.width;
    const scale = zoomed ? fitScale * 1.9 : fitScale;
    const viewport = page.getViewport({ scale });

    // Render at device pixel ratio so text stays crisp on phone screens.
    // The canvas's backing store (width/height attributes) is scaled by
    // dpr; its displayed CSS size (style.width/height) is not - these are
    // set as the only source of truth for display size, with no competing
    // CSS max-width/auto rules, to avoid the browser recomputing a
    // different size than we intended.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    await page.render({ canvasContext: ctx, viewport }).promise;

    currentPage = num;
    pageCounter.textContent = `Page ${num} of ${pdfDoc.numPages}`;
    setProgress(bookSlug, fileName, num);
    rendering = false;
  }

  function setZoom(nextZoomed) {
    zoomed = nextZoomed;
    canvasScroll.classList.toggle("zoomed", zoomed);
    canvasScroll.scrollLeft = 0;
    canvasScroll.scrollTop = 0;
    renderPage(currentPage);
  }

  function goNext() {
    if (!pdfDoc) return;
    if (currentPage < pdfDoc.numPages) {
      renderPage(currentPage + 1);
    } else if (fileIndex >= 0 && fileIndex < siblingFiles.length - 1) {
      window.location.hash = partHref(bookSlug, siblingFiles[fileIndex + 1]);
    }
  }

  function goPrev() {
    if (!pdfDoc) return;
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    } else if (fileIndex > 0) {
      window.location.hash = partHref(bookSlug, siblingFiles[fileIndex - 1]);
    }
  }

  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);

  function onKey(e) {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  }
  window.addEventListener("keydown", onKey);

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderPage(currentPage), 200);
  }
  window.addEventListener("resize", onResize);

  // Swipe to turn pages (only while not zoomed in - while zoomed, a swipe
  // pans around the enlarged page instead).
  let touchStartX = 0;
  let touchStartY = 0;
  canvasScroll.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );
  canvasScroll.addEventListener(
    "touchend",
    (e) => {
      if (zoomed) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) goNext();
        else goPrev();
      }
    },
    { passive: true }
  );

  // Double-tap / double-click to toggle zoom.
  let lastTap = 0;
  canvasScroll.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastTap < 350) setZoom(!zoomed);
    lastTap = now;
  });

  pageCounter.textContent = "Loading\u2026";
  try {
    const loadingTask = pdfjsLib.getDocument(rawUrl);
    pdfDoc = await loadingTask.promise;
    const first = Math.max(1, Math.min(startPage || 1, pdfDoc.numPages));
    await renderPage(first);
  } catch (e) {
    pageCounter.textContent = "";
    canvasWrap.appendChild(el("p", { class: "state-msg error" }, `Couldn't load this PDF: ${e.message}`));
  }
}

async function fetchJuz(editionSlug, juzNumber) {
  const url = `${QTEXT_ROOT}/${editionSlug}/juzs/${juzNumber}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load text data (${res.status})`);
  const data = await res.json();
  return data.juzs;
}

async function renderQuranText(juzNumber) {
  app.innerHTML = "";
  juzNumber = Math.max(1, Math.min(juzNumber, 30));

  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: "#/" }, "Library"),
    " / ",
    el("a", { href: `#/book/${encodeURIComponent(QURAN_TEXT_BOOK_SLUG)}` }, "Quran Roman Urdu Hindi"),
    ` / Juz ${juzNumber} (typed text)`,
  ]);

  const topBar = el("div", { class: "text-top-bar" }, [
    el(
      "a",
      { class: "text-nav-link", href: juzNumber > 1 ? `#/quran-text/${juzNumber - 1}` : "#", "aria-disabled": juzNumber <= 1 },
      "\u2039 Juz " + (juzNumber - 1)
    ),
    el("span", { class: "text-juz-label" }, `Juz ${juzNumber}`),
    el(
      "a",
      { class: "text-nav-link", href: juzNumber < 30 ? `#/quran-text/${juzNumber + 1}` : "#", "aria-disabled": juzNumber >= 30 },
      "Juz " + (juzNumber + 1) + " \u203a"
    ),
  ]);

  const versesWrap = el("div", { class: "verses-wrap" });
  renderLoading(versesWrap);

  const wrap = el("div", { class: "container text-container" }, [crumb, topBar, versesWrap]);
  app.appendChild(el("main", {}, wrap));

  try {
    const [arabic, translit, urdu] = await Promise.all([
      fetchJuz(QTEXT_EDITIONS.arabic, juzNumber),
      fetchJuz(QTEXT_EDITIONS.transliteration, juzNumber),
      fetchJuz(QTEXT_EDITIONS.urdu, juzNumber),
    ]);

    versesWrap.innerHTML = "";
    let currentChapter = null;

    for (let i = 0; i < arabic.length; i++) {
      const v = arabic[i];
      if (v.chapter !== currentChapter) {
        currentChapter = v.chapter;
        versesWrap.appendChild(
          el("div", { class: "surah-header" }, [
            el("span", { class: "surah-header-num" }, String(currentChapter)),
            el("span", { class: "surah-header-name" }, SURAH_NAMES[currentChapter] || `Surah ${currentChapter}`),
          ])
        );
      }
      const card = el("div", { class: "verse-card" }, [
        el("div", { class: "verse-arabic" }, [
          el("span", {}, v.text),
          el("span", { class: "verse-num-badge" }, String(v.verse)),
        ]),
        el("p", { class: "verse-translit" }, translit[i] ? translit[i].text : ""),
        el("p", { class: "verse-urdu" }, urdu[i] ? urdu[i].text : ""),
      ]);
      versesWrap.appendChild(card);
    }

    const note = el("p", { class: "text-source-note" },
      "Arabic text \u00b7 transliteration: tanzil.net. Urdu translation: Abul Ala Maududi, via quranromanurdu.com."
    );
    versesWrap.appendChild(note);
  } catch (e) {
    versesWrap.innerHTML = "";
    renderError(versesWrap, e.message);
  }
}

async function renderDuas() {
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: "#/" }, "Library"), " / Daily Dua & Dhikr"]);
  const heading = el("div", {}, [
    el("h1", { class: "page-title" }, "Daily Dua & Dhikr"),
    el("p", { class: "duas-subtitle" }, "Essential duas and dhikr for every moment of your day"),
  ]);

  const versesWrap = el("div", { class: "verses-wrap" });
  renderLoading(versesWrap);

  const wrap = el("div", { class: "container text-container" }, [crumb, heading, versesWrap]);
  app.appendChild(el("main", {}, wrap));

  try {
    const res = await fetch(`${RAW_ROOT}/${DUAS_JSON_PATH}`);
    if (!res.ok) throw new Error(`Couldn't load duas.json (${res.status})`);
    const duas = await res.json();

    versesWrap.innerHTML = "";
    duas.forEach((d) => {
      const card = el("div", { class: "dua-card" }, [
        el("h3", { class: "dua-title" }, d.title),
        el("div", { class: "verse-arabic dua-arabic" }, d.arabic),
        el("p", { class: "verse-translit" }, d.transliteration),
        el("p", { class: "verse-urdu dua-translation" }, `\u201c${d.translation}\u201d`),
        el("p", { class: "dua-reference" }, d.reference),
      ]);
      if (d.note) {
        card.appendChild(el("p", { class: "dua-note" }, `\u2139 ${d.note}`));
      }
      versesWrap.appendChild(card);
    });
  } catch (e) {
    versesWrap.innerHTML = "";
    renderError(versesWrap, e.message);
  }
}

async function loadHadithBook(bookSlug) {
  if (hadithBookCache[bookSlug]) return hadithBookCache[bookSlug];
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  if (!book) throw new Error("Unknown hadith book");

  const [arRes, enRes] = await Promise.all([
    fetch(`${HADITH_ROOT}/${book.ar}.json`),
    fetch(`${HADITH_ROOT}/${book.en}.json`),
  ]);
  if (!arRes.ok || !enRes.ok) throw new Error("Couldn't load hadith data");
  const [arData, enData] = await Promise.all([arRes.json(), enRes.json()]);

  const hadithsByBook = {};
  for (let i = 0; i < arData.hadiths.length; i++) {
    const a = arData.hadiths[i];
    const e = enData.hadiths[i];
    const bookNum = a.reference.book;
    if (!hadithsByBook[bookNum]) hadithsByBook[bookNum] = [];
    hadithsByBook[bookNum].push({
      hadithnumber: a.hadithnumber,
      inBookNumber: a.reference.hadith,
      arabic: a.text,
      english: e.text,
    });
  }

  const result = { sections: arData.metadata.sections, hadithsByBook };
  hadithBookCache[bookSlug] = result;
  return result;
}

async function renderHadithBooks() {
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: "#/" }, "Library"), " / Hadith Collections"]);
  const heading = el("div", {}, [
    el("h1", { class: "page-title" }, "Hadith Collections"),
    el("p", { class: "duas-subtitle" }, "Arabic text with English translation, numbered as on sunnah.com"),
  ]);
  const grid = el("div", { class: "grid" });
  HADITH_BOOKS.forEach((b) => {
    grid.appendChild(
      el("a", { class: "card", href: `#/hadith/${b.slug}` }, [
        el("div", { class: "card-spine" }),
        el("div", { class: "card-body" }, [
          el("span", { class: "card-kicker" }, "Collection"),
          el("h2", { class: "card-title" }, b.name),
          el("p", { class: "card-desc" }, "Tap to browse chapters"),
        ]),
      ])
    );
  });
  const wrap = el("div", { class: "container" }, [crumb, heading, grid]);
  app.appendChild(el("main", {}, wrap));
}

async function renderHadithChapters(bookSlug) {
  app.innerHTML = "";
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: "#/" }, "Library"),
    " / ",
    el("a", { href: "#/hadith" }, "Hadith Collections"),
    ` / ${book ? book.name : bookSlug}`,
  ]);
  const heading = el("h1", { class: "page-title" }, book ? book.name : bookSlug);
  const listWrap = el("div");
  renderLoading(listWrap);
  const wrap = el("div", { class: "container" }, [crumb, heading, listWrap]);
  app.appendChild(el("main", {}, wrap));

  try {
    const { sections } = await loadHadithBook(bookSlug);
    listWrap.innerHTML = "";
    const grid = el("div", { class: "grid" });
    Object.keys(sections)
      .map(Number)
      .filter((n) => n > 0 && sections[n])
      .sort((a, b) => a - b)
      .forEach((n) => {
        grid.appendChild(
          el("a", { class: "card", href: `#/hadith/${bookSlug}/${n}` }, [
            el("div", { class: "card-spine" }),
            el("div", { class: "card-body" }, [
              el("span", { class: "card-kicker" }, `Book ${n}`),
              el("h2", { class: "card-title hadith-chapter-title" }, sections[n]),
            ]),
          ])
        );
      });
    listWrap.appendChild(grid);
  } catch (e) {
    listWrap.innerHTML = "";
    renderError(listWrap, e.message);
  }
}

async function renderHadithList(bookSlug, sectionNum) {
  app.innerHTML = "";
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: "#/" }, "Library"),
    " / ",
    el("a", { href: "#/hadith" }, "Hadith Collections"),
    " / ",
    el("a", { href: `#/hadith/${bookSlug}` }, book ? book.name : bookSlug),
    ` / Book ${sectionNum}`,
  ]);
  const headingWrap = el("div", {}, [el("h1", { class: "page-title" }, `Loading\u2026`)]);
  const listWrap = el("div");
  renderLoading(listWrap);
  const wrap = el("div", { class: "container text-container" }, [crumb, headingWrap, listWrap]);
  app.appendChild(el("main", {}, wrap));

  try {
    const { sections, hadithsByBook } = await loadHadithBook(bookSlug);
    headingWrap.innerHTML = "";
    headingWrap.appendChild(el("h1", { class: "page-title" }, sections[sectionNum] || `Book ${sectionNum}`));

    const hadiths = hadithsByBook[sectionNum] || [];
    listWrap.innerHTML = "";

    if (hadiths.length === 0) {
      listWrap.appendChild(el("p", { class: "state-msg" }, "No hadith found in this chapter."));
      return;
    }

    hadiths.forEach((h) => {
      const card = el("div", { class: "dua-card" }, [
        el("div", { class: "verse-arabic dua-arabic" }, h.arabic),
        el("p", { class: "verse-urdu dua-translation" }, h.english),
        el(
          "p",
          { class: "dua-reference" },
          `${book ? book.name : bookSlug} ${h.hadithnumber} \u00b7 Book ${sectionNum}, Hadith ${h.inBookNumber}`
        ),
      ]);
      listWrap.appendChild(card);
    });
  } catch (e) {
    listWrap.innerHTML = "";
    renderError(listWrap, e.message);
  }
}

function route() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);

  if (parts[0] === "hadith" && parts[1] && parts[2]) {
    renderHadithList(decodeURIComponent(parts[1]), parseInt(parts[2], 10));
  } else if (parts[0] === "hadith" && parts[1]) {
    renderHadithChapters(decodeURIComponent(parts[1]));
  } else if (parts[0] === "hadith") {
    renderHadithBooks();
  } else if (parts[0] === "duas") {
    renderDuas();
  } else if (parts[0] === "quran-text" && parts[1]) {
    renderQuranText(parseInt(parts[1], 10) || 1);
  } else if (parts[0] === "book" && parts[1] && parts[2] === "part" && parts[3]) {
    const startPage = parts[4] === "page" && parts[5] ? parseInt(parts[5], 10) : 1;
    renderPart(decodeURIComponent(parts[1]), decodeURIComponent(parts[3]), startPage);
  } else if (parts[0] === "book" && parts[1]) {
    renderBook(decodeURIComponent(parts[1]));
  } else {
    renderHome();
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
