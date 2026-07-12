const cfg = window.SITE_CONFIG;
const API_ROOT = `https://api.github.com/repos/${cfg.githubOwner}/${cfg.githubRepo}/contents`;
const RAW_ROOT = `https://raw.githubusercontent.com/${cfg.githubOwner}/${cfg.githubRepo}/${cfg.githubBranch}`;
const PROGRESS_PREFIX = "qaw:progress:";

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
    const folders = items.filter((i) => i.type === "dir").sort(naturalSort);
    main.innerHTML = "";

    if (folders.length === 0) {
      main.appendChild(
        el("p", { class: "state-msg" }, "No books yet \u2014 push a folder of PDFs to your repo and refresh.")
      );
      return;
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

    const isNarrow = window.innerWidth < 640;
    const sidePadding = isNarrow ? 16 : 48;
    const containerWidth = Math.min(canvasWrap.clientWidth - sidePadding, 900);
    const baseViewport = page.getViewport({ scale: 1 });
    const fitScale = containerWidth / baseViewport.width;
    const scale = zoomed ? fitScale * 1.9 : fitScale;
    const viewport = page.getViewport({ scale });

    // Render at device pixel ratio so text stays crisp on phone screens.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

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

function route() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);

  if (parts[0] === "book" && parts[1] && parts[2] === "part" && parts[3]) {
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
