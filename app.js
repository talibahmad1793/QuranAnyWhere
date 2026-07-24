const cfg = window.SITE_CONFIG;
const API_ROOT = `https://api.github.com/repos/${cfg.githubOwner}/${cfg.githubRepo}/contents`;
const RAW_ROOT = `https://raw.githubusercontent.com/${cfg.githubOwner}/${cfg.githubRepo}/${cfg.githubBranch}`;
const PROGRESS_PREFIX = "qaw:progress:";

// Verified, structured Quran text data (not OCR). Sourced originally from
// tanzil.net (Arabic + transliteration) and quranromanurdu.com (Urdu
// translation by Abul Ala Maududi), packaged and stored directly in this
// repo (see /quran-data) - no dependency on any external repo or API.
const QURAN_DATA_PATH = "quran-data";
const QURAN_TEXT_BOOK_SLUG = "quran-roman-urdu-hindi";
const DUAS_JSON_PATH = "duas/duas.json";

// Verified hadith data (Arabic + English), packaged and stored directly in
// this repo (see /hadith-data) - no external dependency. Numbering matches
// sunnah.com: each hadith's overall number is its standard citation (e.g.
// "Sahih al-Bukhari 1"), and reference.book/reference.hadith give the
// traditional in-book chapter and position sunnah.com also shows.
const HADITH_DATA_PATH = "hadith-data";
const HADITH_ABOUT_PATH = "hadith-data/about";
const HADITH_BOOKS = [
  {
    slug: "bukhari",
    name: "Sahih al-Bukhari",
    shortDesc:
      "Sahih al-Bukhari is a collection of hadith compiled by Imam Muhammad al-Bukhari (d. 256 AH/870 CE) (rahimahullah). His collection is recognized by the overwhelming majority of the Muslim world to be the most authentic collection of reports of the Sunnah of the Prophet Muhammad (\uFDFA). It contains over 7500 hadith (with repetitions) in 97 books. The translation provided here is by Dr. M. Muhsin Khan.",
  },
  {
    slug: "muslim",
    name: "Sahih Muslim",
    shortDesc:
      "Sahih Muslim is a collection of hadith compiled by Imam Muslim ibn al-Hajjaj al-Naysaburi (rahimahullah). His collection is considered one of the most authentic collections of the Sunnah of the Prophet Muhammad (\uFDFA), and together with Sahih al-Bukhari forms the \u2018Sahihain\u2019 (the Two Sahihs). It contains roughly 7,500 hadith (with repetitions) in 57 books. The translation provided here is by Abdul Hamid Siddiqui.",
  },
  {
    slug: "abudawud",
    name: "Sunan Abi Dawud",
    shortDesc:
      "Sunan Abi Dawud is a collection of hadith compiled by Imam Abu Dawud Sulaiman ibn al-Ash\u2019ath as-Sijistani (rahimahullah). It is one of the six canonical hadith collections (Kutub as-Sittah) and contains 5,274 hadith in 43 books.",
    extraLinks: [
      {
        aboutSlug: "abudawud-letter",
        label: "Letter from Imam Abu Dawud to the people of Makkah explaining his book, terms he uses, and his methodology.",
      },
    ],
  },
  {
    slug: "tirmidhi",
    name: "Jami' at-Tirmidhi",
    shortDesc:
      "Jami' at-Tirmidhi is a collection of hadith compiled by Imam Abu 'Isa Muhammad at-Tirmidhi (rahimahullah). It is one of the six canonical collections of hadith (Kutub as-Sittah) and contains roughly 4,400 hadith (with repetitions) in 46 books.",
  },
  {
    slug: "nasai",
    name: "Sunan an-Nasa'i",
    shortDesc:
      "Sunan an-Nasa'i is a collection of hadith compiled by Imam Ahmad an-Nasa'i (rahimahullah). It is unanimously regarded as one of the six canonical collections of hadith (Kutub as-Sittah) and contains roughly 5,700 hadith (with repetitions) in 52 books.",
  },
  {
    slug: "ibnmajah",
    name: "Sunan Ibn Majah",
    shortDesc:
      "Sunan Ibn Majah is a collection of hadith compiled by Imam Muhammad bin Yazid Ibn Majah al-Qazvini (rahimahullah). It is widely regarded as the sixth of the six canonical collections of hadith (Kutub as-Sittah) and contains 4,341 hadith arranged in 37 books.",
  },
  {
    slug: "malik",
    name: "Muwatta Malik",
    shortDesc:
      "Al-Muwatta of Imam Malik is one of the earliest and most influential collections of hadith and Islamic jurisprudence, compiled by Imam Malik ibn Anas (rahimahullah). It contains hadith, statements of the Companions, opinions of the Tabi'in, and the legal practice of the people of Madinah.",
  },
  { slug: "nawawi", name: "40 Hadith of an-Nawawi" },
  { slug: "qudsi", name: "40 Hadith Qudsi" },
  { slug: "dehlawi", name: "40 Hadith of Shah Waliullah Dehlawi" },
];
const hadithBookCache = {}; // slug -> { sections, hadithsByBook: {bookNum: [{ar,en}]} }

const SEARCH_INDEX_PATHS = {
  quran: "search-index/quran_index.json",
  hadith: "search-index/hadith_index.json",
};
let searchIndexCache = null; // { quran: [...], hadith: [...] }
const HADITH_BOOK_NAMES = Object.fromEntries(HADITH_BOOKS.map((b) => [b.slug, b.name]));

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

// --- "Report a correction" popup, used on hadith cards ---
function openReportModal(context) {
  const email = (cfg.contactEmail || "").trim();

  const messageArea = el("textarea", {
    class: "modal-textarea",
    rows: "5",
    placeholder: "Describe what looks wrong — a typo, a mistranslation, a missing word…",
  });

  const overlay = el("div", { class: "modal-overlay", role: "presentation" });

  function closeModal() {
    overlay.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
    setTimeout(() => overlay.remove(), 180);
  }
  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
  }

  const closeX = el("button", { class: "modal-close", type: "button", "aria-label": "Close" }, "\u00d7");
  closeX.addEventListener("click", closeModal);

  const copyBtn = el("button", { class: "btn btn-ghost", type: "button" }, "Copy email");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email);
      copyBtn.textContent = "Copied!";
    } catch (e) {
      copyBtn.textContent = "Couldn't copy";
    }
    setTimeout(() => (copyBtn.textContent = "Copy email"), 1600);
  });

  const sendBtn = el("button", { class: "btn btn-primary", type: "button" }, "Open in email app");
  sendBtn.addEventListener("click", () => {
    const subject = `Correction — ${context}`;
    const body = [
      `Regarding: ${context}`,
      `Page: ${window.location.href}`,
      "",
      messageArea.value.trim() || "(describe the issue here)",
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  const panel = el(
    "div",
    { class: "modal-panel", role: "dialog", "aria-modal": "true", "aria-label": "Report a correction" },
    [
      el("div", { class: "modal-head" }, [el("h3", { class: "modal-title" }, "Report a correction"), closeX]),
      el("p", { class: "modal-context" }, context),
      el("label", { class: "modal-label", for: "modal-message" }, "What's wrong?"),
      messageArea,
      el("div", { class: "modal-email-row" }, [
        el("span", { class: "modal-email-label" }, "Or email us directly"),
        el("span", { class: "modal-email" }, email),
        copyBtn,
      ]),
      el("div", { class: "modal-actions" }, [sendBtn]),
    ]
  );

  overlay.appendChild(panel);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.body.appendChild(overlay);
  document.addEventListener("keydown", onKeydown);
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  messageArea.focus();
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

  const ticker = el("div", { class: "hadith-ticker", "aria-label": "Rotating hadith highlights" });
  app.appendChild(ticker);
  startHadithTicker(ticker);

  const main = el("main", { class: "container" });
  app.appendChild(main);
  renderLoading(main);

  try {
    const items = await githubList("");
    const RESERVED_FOLDERS = ["duas", "search-index", "quran-data", "hadith-data"]; // reserved for JSON data, not PDF folders
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
          el("p", { class: "card-desc" }, "Sahih al-Bukhari, Sahih Muslim & 8 more \u2014 Arabic & English"),
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

async function fetchJuz(juzNumber) {
  const url = `${RAW_ROOT}/${QURAN_DATA_PATH}/juz-${String(juzNumber).padStart(2, "0")}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load text data (${res.status})`);
  return res.json();
}

async function renderQuranText(juzNumber, scrollTarget) {
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
    const verses = await fetchJuz(juzNumber);

    versesWrap.innerHTML = "";
    let currentChapter = null;

    verses.forEach((v) => {
      if (v.s !== currentChapter) {
        currentChapter = v.s;
        versesWrap.appendChild(
          el("div", { class: "surah-header" }, [
            el("span", { class: "surah-header-num" }, String(currentChapter)),
            el("span", { class: "surah-header-name" }, SURAH_NAMES[currentChapter] || `Surah ${currentChapter}`),
          ])
        );
      }
      const card = el("div", { class: "verse-card", id: `v-${v.s}-${v.a}` }, [
        el("div", { class: "verse-arabic" }, [
          el("span", {}, v.ar),
          el("span", { class: "verse-num-badge" }, String(v.a)),
        ]),
        el("p", { class: "verse-translit" }, v.t),
        el("p", { class: "verse-urdu" }, v.u),
      ]);
      versesWrap.appendChild(card);
    });

    const note = el("p", { class: "text-source-note" },
      "Arabic text \u00b7 transliteration: tanzil.net. Urdu translation: Abul Ala Maududi, via quranromanurdu.com."
    );
    versesWrap.appendChild(note);

    if (scrollTarget) {
      const target = document.getElementById(`v-${scrollTarget.s}-${scrollTarget.a}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("search-highlight");
        setTimeout(() => target.classList.remove("search-highlight"), 2500);
      }
    }
  } catch (e) {
    versesWrap.innerHTML = "";
    renderError(versesWrap, e.message);
  }
}

async function renderDuas(scrollTarget) {
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

  function duaUrl(i) {
    return `${window.location.origin}${window.location.pathname}#/duas/${i}`;
  }

  function duaShareText(d, i) {
    return [d.title, "", d.arabic, "", d.transliteration, "", `\u201c${d.translation}\u201d`, "", d.reference, duaUrl(i)].join("\n");
  }

  try {
    const res = await fetch(`${RAW_ROOT}/${DUAS_JSON_PATH}`);
    if (!res.ok) throw new Error(`Couldn't load duas.json (${res.status})`);
    const duas = await res.json();

    versesWrap.innerHTML = "";
    duas.forEach((d, i) => {
      const copyBtn = el("button", { class: "share-link", type: "button" }, "Copy");
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(duaShareText(d, i));
          copyBtn.textContent = "Copied!";
        } catch (err) {
          copyBtn.textContent = "Couldn't copy";
        }
        setTimeout(() => (copyBtn.textContent = "Copy"), 1800);
      });

      const socialTargets = [
        { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(duaShareText(d, i))}` },
        { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(duaUrl(i))}&text=${encodeURIComponent(d.title)}` },
        { label: "Twitter/X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(d.title)}&url=${encodeURIComponent(duaUrl(i))}` },
        { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(duaUrl(i))}` },
      ];
      const social = el(
        "div",
        { class: "social-row" },
        socialTargets.map((t) => el("a", { class: "social-link", href: t.href, target: "_blank", rel: "noopener noreferrer" }, t.label))
      );
      social.style.display = "none";

      const shareBtn = el("button", { class: "share-link", type: "button" }, "Share");
      shareBtn.addEventListener("click", async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: d.title, text: duaShareText(d, i), url: duaUrl(i) });
          } catch (err) {
            // Cancelled or failed silently - nothing to do.
          }
        } else {
          social.style.display = social.style.display === "none" ? "flex" : "none";
        }
      });

      const shareRow = el("div", { class: "share-row" }, [shareBtn, el("span", { class: "share-sep" }, "|"), copyBtn]);

      const card = el("div", { class: "dua-card", id: `dua-${i}` }, [
        el("h3", { class: "dua-title" }, d.title),
        el("div", { class: "verse-arabic dua-arabic" }, d.arabic),
        el("p", { class: "verse-translit" }, d.transliteration),
        el("p", { class: "verse-urdu dua-translation" }, `\u201c${d.translation}\u201d`),
        el("p", { class: "dua-reference" }, d.reference),
        shareRow,
        social,
      ]);
      if (d.note) {
        card.appendChild(el("p", { class: "dua-note" }, `\u2139 ${d.note}`));
      }
      versesWrap.appendChild(card);
    });

    if (scrollTarget !== undefined && scrollTarget !== null) {
      const target = document.getElementById(`dua-${scrollTarget}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("search-highlight");
        setTimeout(() => target.classList.remove("search-highlight"), 2500);
      }
    }
  } catch (e) {
    versesWrap.innerHTML = "";
    renderError(versesWrap, e.message);
  }
}

async function loadHadithBook(bookSlug) {
  if (hadithBookCache[bookSlug]) return hadithBookCache[bookSlug];
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  if (!book) throw new Error("Unknown hadith book");

  const res = await fetch(`${RAW_ROOT}/${HADITH_DATA_PATH}/${bookSlug}.json`);
  if (!res.ok) throw new Error("Couldn't load hadith data");
  const data = await res.json();

  const hadithsByBook = {};
  for (const [bookNum, list] of Object.entries(data.hadithsByBook)) {
    hadithsByBook[bookNum] = list.map((h) => ({
      hadithnumber: h.n,
      inBookNumber: h.ib,
      arabic: h.ar,
      english: h.en,
      hinglish: h.hi || null,
    }));
  }

  const result = { sections: data.sections, hadithsByBook };
  hadithBookCache[bookSlug] = result;
  return result;
}

// --- Home page hadith ticker: hadith glide right-to-left, one after another ---
let tickerActive = false;
let tickerPool = [];
let tickerPoolPromise = null;

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function buildTickerPool() {
  if (tickerPoolPromise) return tickerPoolPromise;
  tickerPoolPromise = (async () => {
    const candidates = shuffleInPlace([...HADITH_BOOKS]).slice(0, 3);
    const pool = [];
    for (const b of candidates) {
      try {
        const { sections, hadithsByBook } = await loadHadithBook(b.slug);
        for (const [sectionNum, list] of Object.entries(hadithsByBook)) {
          for (const h of list) {
            if (!h.english) continue;
            pool.push({
              bookSlug: b.slug,
              bookName: b.name,
              sectionNum,
              chapterName: sections[sectionNum] || "",
              hadithnumber: h.hadithnumber,
              inBookNumber: h.inBookNumber,
              snippet: h.english.length > 160 ? h.english.slice(0, 160).trim() + "\u2026" : h.english,
            });
          }
        }
      } catch (e) {
        // That book's data may not be in the repo yet - just skip it.
      }
    }
    return shuffleInPlace(pool);
  })();
  return tickerPoolPromise;
}

function stopHadithTicker() {
  tickerActive = false;
}

async function startHadithTicker(container) {
  const track = el("a", { class: "hadith-ticker-track", href: "#/hadith" });
  container.appendChild(track);

  const pool = await buildTickerPool();
  if (!container.isConnected) return; // user navigated away while this was loading
  if (pool.length === 0) {
    container.style.display = "none";
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PIXELS_PER_SECOND = 130; // reading pace - lower is slower
  const PAUSE_BETWEEN_MS = 900; // brief breather between hadith, not a long dead gap
  let idx = 0;
  tickerActive = true;

  async function cycle() {
    if (!tickerActive || !container.isConnected) return;

    const h = pool[idx % pool.length];
    idx++;
    track.href = `#/hadith/${h.bookSlug}/${h.sectionNum}/h/${h.hadithnumber}`;
    track.innerHTML = "";
    track.appendChild(el("span", { class: "hadith-ticker-ref" }, `${h.bookName} ${h.hadithnumber}`));
    track.appendChild(el("span", { class: "hadith-ticker-text" }, h.snippet));

    if (reduceMotion) {
      await new Promise((r) => setTimeout(r, 7000));
      cycle();
      return;
    }

    const width = container.clientWidth;
    track.style.transform = `translateX(${width}px)`;
    await new Promise((r) => requestAnimationFrame(r));
    if (!tickerActive || !container.isConnected) return;

    const trackWidth = track.scrollWidth;
    const distance = width + trackWidth;
    const duration = Math.min(24000, Math.max(12000, (distance / PIXELS_PER_SECOND) * 1000));

    track.getAnimations().forEach((a) => a.cancel());
    const anim = track.animate(
      [{ transform: `translateX(${width}px)` }, { transform: `translateX(-${trackWidth}px)` }],
      { duration, easing: "linear", fill: "forwards" }
    );

    try {
      await anim.finished;
    } catch (e) {
      return; // cancelled (route change mid-flight) - stop the chain here
    }
    if (!tickerActive || !container.isConnected) return;
    await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_MS));
    cycle();
  }

  cycle();
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
  const aboutBlockWrap = el("div");
  if (book && book.shortDesc) {
    aboutBlockWrap.appendChild(
      el("p", { class: "hadith-collection-desc" }, [
        book.shortDesc + " ",
        el(
          "a",
          { href: `#/hadith-about/${bookSlug}`, target: "_blank", rel: "noopener" },
          "More information \u2026"
        ),
      ])
    );
  }
  if (book && book.extraLinks && book.extraLinks.length) {
    book.extraLinks.forEach((link) => {
      aboutBlockWrap.appendChild(
        el("p", { class: "hadith-collection-extra-link" }, [
          el(
            "a",
            { href: `#/hadith-about/${bookSlug}/${link.aboutSlug}`, target: "_blank", rel: "noopener" },
            link.label
          ),
        ])
      );
    });
  }
  const listWrap = el("div");
  renderLoading(listWrap);
  const wrap = el("div", { class: "container" }, [crumb, heading, aboutBlockWrap, listWrap]);
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

async function renderHadithAbout(bookSlug, aboutSlug) {
  app.innerHTML = "";
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  const fileSlug = aboutSlug || bookSlug;
  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: "#/" }, "Library"),
    " / ",
    el("a", { href: "#/hadith" }, "Hadith Collections"),
    " / ",
    el("a", { href: `#/hadith/${bookSlug}` }, book ? book.name : bookSlug),
    ...(aboutSlug
      ? [" / ", el("a", { href: `#/hadith-about/${bookSlug}` }, "About"), " / Letter"]
      : [" / About"]),
  ]);
  const bodyWrap = el("div");
  renderLoading(bodyWrap);
  const wrap = el("div", { class: "container text-container about-page" }, [crumb, bodyWrap]);
  app.appendChild(el("main", {}, wrap));

  try {
    const res = await fetch(`${RAW_ROOT}/${HADITH_ABOUT_PATH}/${fileSlug}.json`);
    if (!res.ok) throw new Error("About information is not available yet for this collection.");
    const data = await res.json();
    bodyWrap.innerHTML = "";
    bodyWrap.appendChild(el("h1", { class: "page-title about-title" }, data.title || (book ? book.name : bookSlug)));
    const contentWrap = el("div", { class: "about-content" });
    (data.content || []).forEach((block) => {
      if (block.type === "heading") {
        contentWrap.appendChild(el("h2", { class: "about-heading" }, block.text));
      } else if (block.type === "paragraph") {
        contentWrap.appendChild(el("p", { class: "about-paragraph" }, block.text));
      } else if (block.type === "list") {
        const tag = block.style === "number" ? "ol" : "ul";
        const listEl = el(tag, { class: "about-list" });
        (block.items || []).forEach((item) => listEl.appendChild(el("li", {}, item)));
        contentWrap.appendChild(listEl);
      }
    });
    bodyWrap.appendChild(contentWrap);
  } catch (e) {
    bodyWrap.innerHTML = "";
    renderError(bodyWrap, e.message);
  }
}

async function renderHadithList(bookSlug, sectionNum, scrollTarget) {
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

    function hadithUrl(hadithnumber) {
      return `${window.location.origin}${window.location.pathname}#/hadith/${bookSlug}/${sectionNum}/h/${hadithnumber}`;
    }

    function hadithShareText(h) {
      const bookName = book ? book.name : bookSlug;
      const chapterName = sections[sectionNum] || "";
      const lines = [h.arabic, "", h.english];
      if (h.hinglish) lines.push("", h.hinglish);
      lines.push("", `${bookName} ${h.hadithnumber}`, `Book ${sectionNum}: ${chapterName}, Hadith ${h.inBookNumber}`, hadithUrl(h.hadithnumber));
      return lines.join("\n");
    }

    function socialLinksRow(h) {
      const bookName = book ? book.name : bookSlug;
      const url = hadithUrl(h.hadithnumber);
      const shortText = `${bookName} ${h.hadithnumber}`;
      const targets = [
        { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(hadithShareText(h))}` },
        { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shortText)}` },
        { label: "Twitter/X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(url)}` },
        { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
      ];
      return el(
        "div",
        { class: "social-row" },
        targets.map((t) => el("a", { class: "social-link", href: t.href, target: "_blank", rel: "noopener noreferrer" }, t.label))
      );
    }

    hadiths.forEach((h) => {
      const copyBtn = el("button", { class: "share-link", type: "button" }, "Copy");
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(hadithShareText(h));
          copyBtn.textContent = "Copied!";
        } catch (err) {
          copyBtn.textContent = "Couldn't copy";
        }
        setTimeout(() => (copyBtn.textContent = "Copy"), 1800);
      });

      const social = socialLinksRow(h);
      social.style.display = "none";

      const shareBtn = el("button", { class: "share-link", type: "button" }, "Share");
      shareBtn.addEventListener("click", async () => {
        const bookName = book ? book.name : bookSlug;
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${bookName} ${h.hadithnumber}`,
              text: hadithShareText(h),
              url: hadithUrl(h.hadithnumber),
            });
          } catch (err) {
            // User cancelled the native share sheet, or it failed silently - no action needed.
          }
        } else {
          social.style.display = social.style.display === "none" ? "flex" : "none";
        }
      });

      const shareRow = el("div", { class: "share-row" }, [shareBtn, el("span", { class: "share-sep" }, "|"), copyBtn]);

      const reportBtn = el("button", { class: "report-link", type: "button" }, [
        el("svg", { width: "13", height: "13", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", html: '<path d="M8 1.5 14.5 13.5H1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3M8 11.6h.01" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' }),
        el("span", {}, "Report issue"),
      ]);
      reportBtn.addEventListener("click", () => {
        const bookName = book ? book.name : bookSlug;
        openReportModal(`${bookName} ${h.hadithnumber} \u00b7 Book ${sectionNum}, Hadith ${h.inBookNumber}`);
      });

      const card = el("div", { class: "dua-card", id: `h-${h.hadithnumber}` }, [
        el("div", { class: "verse-arabic dua-arabic" }, h.arabic),
        el("p", { class: "verse-urdu dua-translation" }, h.english),
        ...(h.hinglish ? [el("p", { class: "verse-translit hadith-hinglish" }, h.hinglish)] : []),
        el(
          "p",
          { class: "dua-reference" },
          `${book ? book.name : bookSlug} ${h.hadithnumber} \u00b7 Book ${sectionNum}, Hadith ${h.inBookNumber}`
        ),
        shareRow,
        reportBtn,
        social,
      ]);
      listWrap.appendChild(card);
    });

    if (scrollTarget) {
      const target = document.getElementById(`h-${scrollTarget}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("search-highlight");
        setTimeout(() => target.classList.remove("search-highlight"), 2500);
      }
    }
  } catch (e) {
    listWrap.innerHTML = "";
    renderError(listWrap, e.message);
  }
}

async function loadSearchIndex() {
  if (searchIndexCache) return searchIndexCache;
  const [qRes, hRes] = await Promise.all([
    fetch(`${RAW_ROOT}/${SEARCH_INDEX_PATHS.quran}`),
    fetch(`${RAW_ROOT}/${SEARCH_INDEX_PATHS.hadith}`),
  ]);
  if (!qRes.ok || !hRes.ok) throw new Error("Couldn't load the search index");
  const [quran, hadith] = await Promise.all([qRes.json(), hRes.json()]);
  searchIndexCache = { quran, hadith };
  return searchIndexCache;
}

function snippetAround(text, query, radius) {
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\b${escaped}\\b`, "i").exec(text);
  if (!match) return text.slice(0, radius * 2);
  const idx = match.index;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + match[0].length + radius);
  return (start > 0 ? "\u2026" : "") + text.slice(start, end) + (end < text.length ? "\u2026" : "");
}

async function renderSearch(query) {
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: "#/" }, "Library"), " / Search"]);

  const form = el("form", { class: "search-form", id: "searchForm" }, [
    el("input", { class: "search-input", id: "searchInput", type: "search", value: query || "", placeholder: "Search the Qur'an and Hadith, or type a hadith number\u2026", autofocus: "true" }),
    el("button", { class: "btn", type: "submit" }, "Search"),
  ]);

  const resultsWrap = el("div", { class: "search-results" });
  const wrap = el("div", { class: "container text-container" }, [crumb, el("h1", { class: "page-title" }, "Search"), form, resultsWrap]);
  app.appendChild(el("main", {}, wrap));

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("searchInput").value.trim();
    if (q) window.location.hash = `#/search/${encodeURIComponent(q)}`;
  });

  if (!query) {
    resultsWrap.appendChild(el("p", { class: "state-msg" }, "Type something above to search across every Surah, Ayah, and Hadith on this site \u2014 or enter a hadith number to jump straight to it."));
    return;
  }

  renderLoading(resultsWrap);

  try {
    const { quran, hadith } = await loadSearchIndex();
    const trimmedQuery = query.trim();
    const isNumericQuery = /^\d+$/.test(trimmedQuery);

    let quranMatches = [];
    let hadithMatches = [];
    let wordRegex = null;

    if (isNumericQuery) {
      // Numeric query: treat as a hadith number lookup (the overall running
      // number within its collection), not a text search. The same number
      // can exist in several collections, so show every match.
      const wantedNum = Number(trimmedQuery);
      hadithMatches = hadith.filter((h) => h.n === wantedNum).slice(0, 60);
    } else {
      // Whole-word/phrase matching, not raw substring - otherwise "ali" would
      // match inside "maalik" or "Alif", which is what users actually hit.
      const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      wordRegex = new RegExp(`\\b${escaped}\\b`, "i");

      quranMatches = quran.filter((v) => wordRegex.test(v.t) || wordRegex.test(v.u)).slice(0, 40);
      hadithMatches = hadith.filter((h) => wordRegex.test(h.e)).slice(0, 40);
    }

    resultsWrap.innerHTML = "";
    resultsWrap.appendChild(
      el("p", { class: "search-summary" }, `${quranMatches.length + hadithMatches.length} result(s) for \u201c${query}\u201d`)
    );

    if (quranMatches.length > 0) {
      resultsWrap.appendChild(el("h2", { class: "search-section-title" }, "Qur'an"));
      quranMatches.forEach((v) => {
        const matchedUrdu = wordRegex.test(v.u);
        const snippet = snippetAround(matchedUrdu ? v.u : v.t, query, 60);
        resultsWrap.appendChild(
          el("a", { class: "search-result", href: `#/quran-text/${v.j}/v/${v.s}/${v.a}` }, [
            el("span", { class: "search-result-ref" }, `${SURAH_NAMES[v.s] || "Surah " + v.s} ${v.s}:${v.a} \u00b7 Juz ${v.j}`),
            el("p", { class: "search-result-snippet" }, snippet),
          ])
        );
      });
    }

    if (hadithMatches.length > 0) {
      resultsWrap.appendChild(el("h2", { class: "search-section-title" }, "Hadith"));
      hadithMatches.forEach((h) => {
        const snippet = isNumericQuery ? snippetAround(h.e, "", 90) : snippetAround(h.e, query, 70);
        resultsWrap.appendChild(
          el("a", { class: "search-result", href: `#/hadith/${h.bk}/${h.sc}/h/${h.n}` }, [
            el(
              "span",
              { class: "search-result-ref" },
              `${HADITH_BOOK_NAMES[h.bk] || h.bk} ${h.n} \u00b7 Book ${h.sc}, Hadith ${h.ib}`
            ),
            el("p", { class: "search-result-snippet" }, snippet),
          ])
        );
      });
    }

    if (quranMatches.length === 0 && hadithMatches.length === 0) {
      const msg = isNumericQuery
        ? `No hadith numbered ${trimmedQuery} was found in any collection.`
        : "No matches found. Try a different word or phrase.";
      resultsWrap.appendChild(el("p", { class: "state-msg" }, msg));
    }
  } catch (e) {
    resultsWrap.innerHTML = "";
    renderError(resultsWrap, e.message);
  }
}

function route() {
  stopHadithTicker();
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);

  if (parts[0] === "search") {
    renderSearch(parts[1] ? decodeURIComponent(parts[1]) : "");
  } else if (parts[0] === "hadith-about" && parts[1] && parts[2]) {
    renderHadithAbout(decodeURIComponent(parts[1]), decodeURIComponent(parts[2]));
  } else if (parts[0] === "hadith-about" && parts[1]) {
    renderHadithAbout(decodeURIComponent(parts[1]));
  } else if (parts[0] === "hadith" && parts[1] && parts[2] && parts[3] === "h" && parts[4]) {
    renderHadithList(decodeURIComponent(parts[1]), parseInt(parts[2], 10), parseInt(parts[4], 10));
  } else if (parts[0] === "hadith" && parts[1] && parts[2]) {
    renderHadithList(decodeURIComponent(parts[1]), parseInt(parts[2], 10));
  } else if (parts[0] === "hadith" && parts[1]) {
    renderHadithChapters(decodeURIComponent(parts[1]));
  } else if (parts[0] === "hadith") {
    renderHadithBooks();
  } else if (parts[0] === "duas") {
    renderDuas(parts[1] !== undefined ? parseInt(parts[1], 10) : null);
  } else if (parts[0] === "quran-text" && parts[1] && parts[2] === "v" && parts[3] && parts[4]) {
    renderQuranText(parseInt(parts[1], 10) || 1, { s: parseInt(parts[3], 10), a: parseInt(parts[4], 10) });
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
