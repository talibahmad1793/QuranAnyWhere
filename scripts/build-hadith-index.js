#!/usr/bin/env node
/**
 * build-hadith-index.js
 *
 * Rebuilds search-index/hadith_index.json from EVERY hadith book file it
 * finds at the repo root, so search can match BOTH the English ("en") and
 * Hinglish ("hi") translation text.
 *
 * Run manually with:  node scripts/build-hadith-index.js
 * (The GitHub Actions workflow runs this automatically on every push that
 * touches a root-level *.json file — see
 * .github/workflows/build-search-index.yml)
 *
 * ADDING A NEW HADITH BOOK LATER — ZERO CODE CHANGES NEEDED:
 *   Just drop the new book's JSON file in the repo root (same shape as
 *   bukhari.json / muslim.json / tirmidhi.json — a top-level
 *   { sections, hadithsByBook } object) and push. This script scans every
 *   *.json file at the root automatically and picks up anything that has
 *   a "hadithsByBook" key. The "bk" value used in search results is just
 *   the filename without ".json" (e.g. "abudawud.json" -> bk: "abudawud"),
 *   so make sure the filename is the short key your app.js routes expect
 *   (matches how HADITH_BOOK_NAMES / URL routing already works for
 *   bukhari/muslim/tirmidhi).
 *
 *   If you ever need a book indexed under a different "bk" key than its
 *   filename, add an override in FILENAME_TO_BK_OVERRIDES below — that's
 *   the only case that needs a manual edit.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "search-index", "hadith_index.json");

// Files at repo root that are JSON but are NOT hadith book files, so we
// don't waste time trying to parse them as one. Add to this list if you
// ever add other root-level JSON (e.g. package.json, manifest.json).
const IGNORE_FILES = new Set([
  "package.json",
  "package-lock.json",
  "manifest.json",
  "site.webmanifest",
]);

// Only needed if a book's filename shouldn't be used directly as its "bk"
// key (rare). Example: { "sunanabudawud.json": "abudawud" }
const FILENAME_TO_BK_OVERRIDES = {};

function discoverBookFiles() {
  const rootFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".json") && !IGNORE_FILES.has(f));

  const books = [];
  for (const file of rootFiles) {
    const filePath = path.join(ROOT, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      console.warn(`  ! Skipping ${file} — not valid JSON (${err.message})`);
      continue;
    }
    // A hadith book file is recognised purely by having "hadithsByBook".
    // This is what lets a brand-new book get picked up automatically.
    if (!data || typeof data !== "object" || !data.hadithsByBook) {
      continue; // silently skip non-hadith JSON files (e.g. quran data, duas)
    }
    const bk = FILENAME_TO_BK_OVERRIDES[file] || file.replace(/\.json$/i, "");
    books.push({ file, bk, data });
  }
  return books;
}

function buildIndex() {
  const index = [];
  let totalHadith = 0;
  let totalWithHi = 0;

  const books = discoverBookFiles();

  if (books.length === 0) {
    console.warn("No hadith book files found at repo root — nothing to index.");
    return { index, totalHadith, totalWithHi };
  }

  for (const { file, bk, data } of books) {
    console.log(`Reading ${file} (bk="${bk}")...`);
    const hadithsByBook = data.hadithsByBook;
    let bookCount = 0;

    for (const sectionKey of Object.keys(hadithsByBook)) {
      const sc = Number(sectionKey);
      const entries = hadithsByBook[sectionKey];
      if (!Array.isArray(entries)) continue;

      for (const entry of entries) {
        // Skip empty placeholder entries (no English/Hinglish text at all)
        const en = (entry.en || "").trim();
        const hi = (entry.hi || "").trim();
        if (!en && !hi) continue;

        const record = { bk, n: entry.n, sc, ib: entry.ib, e: en };
        // Only include "hi" when it actually has content, to keep the
        // index file smaller for hadith not yet translated.
        if (hi) {
          record.hi = hi;
          totalWithHi++;
        }

        index.push(record);
        bookCount++;
        totalHadith++;
      }
    }

    console.log(`  -> ${bookCount} hadith indexed from ${file}`);
  }

  return { index, totalHadith, totalWithHi };
}

function main() {
  console.log("Building hadith search index (auto-discovering book files)...\n");

  const { index, totalHadith, totalWithHi } = buildIndex();

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index), "utf8");

  console.log(`\nDone.`);
  console.log(`Total hadith indexed: ${totalHadith}`);
  console.log(`Hadith with Hinglish ("hi") text: ${totalWithHi}`);
  console.log(`Written to: ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main();
