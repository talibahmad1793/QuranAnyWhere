#!/usr/bin/env python3
"""
build_hadith_search_index.py

Regenerates search-index/hadith_index.json for QuranAnyWhere from the
per-collection files in hadith-data/*.json.

WHY THIS EXISTS
----------------
The site's client-side search (app.js -> loadSearchIndex / renderSearch)
fetches search-index/hadith_index.json and searches it entirely in the
browser. The version currently deployed only contains 3 of the 11 hadith
collections (Bukhari, Muslim, Tirmidhi) because it was generated once and
never rebuilt as more collections were finished. This script rebuilds it
from whatever is currently in hadith-data/, so it's always in sync.

It also trims each hadith's `en`/`hi` text to a max length (default 350
chars) before writing. This is a deliberate size/recall trade-off:
  - The median hadith in this project is ~290-340 characters, so the vast
    majority of hadith are captured in full and search/snippets are
    unaffected.
  - A small number of very long narrations (a few outliers run 5,000-24,000
    characters) get truncated, meaning a search word that only appears deep
    in one of those specific hadith won't match. Given how rare and long
    those outliers are, this is a reasonable trade for keeping the index
    fetchable on mobile/slow connections.
  - Set --max-chars 0 to disable truncation entirely and keep full text
    (this is closer to today's behavior, just across all collections -
    expect a much larger file, likely 35-40MB+ once every collection is
    included).

OUTPUT FORMAT (unchanged from the current file, so app.js needs NO changes)
-----------------------------------------------------------------------
A flat JSON array of objects:
  { "bk": "<collection slug>", "n": <int>, "sc": <int book/section num>,
    "ib": <int in-book position>, "e": "<english, possibly truncated>",
    "hi": "<hinglish, possibly truncated>" }   # "hi" omitted if empty

USAGE
-----
    python3 build_hadith_search_index.py \
        --hadith-data-dir /path/to/hadith-data \
        --out /path/to/search-index/hadith_index.json \
        --max-chars 350

Run this any time you finish translating another book/collection, then
commit the regenerated search-index/hadith_index.json.
"""

import argparse
import glob
import json
import os
import sys


def truncate(text, max_chars):
    """Trim text to max_chars. 0/None disables truncation."""
    if not text:
        return text
    if not max_chars:
        return text
    return text if len(text) <= max_chars else text[:max_chars]


def build_index(hadith_data_dir, max_chars):
    records = []
    per_collection_counts = {}
    per_collection_hi_counts = {}

    # Only look at *.json files directly inside hadith-data/ - this
    # deliberately does NOT recurse into hadith-data/about/, which holds
    # collection metadata, not hadith entries.
    pattern = os.path.join(hadith_data_dir, "*.json")
    files = sorted(glob.glob(pattern))

    if not files:
        print(f"No .json files found in {hadith_data_dir}", file=sys.stderr)
        sys.exit(1)

    for filepath in files:
        slug = os.path.splitext(os.path.basename(filepath))[0]
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                print(f"  ! Skipping {slug}.json - invalid JSON: {e}", file=sys.stderr)
                continue

        hadith_by_book = data.get("hadithsByBook", {})
        if not hadith_by_book:
            print(f"  ! Skipping {slug}.json - no hadithsByBook found", file=sys.stderr)
            continue

        count = 0
        hi_count = 0
        for book_key, entries in hadith_by_book.items():
            try:
                sc = int(book_key)
            except (TypeError, ValueError):
                sc = book_key  # fall back to whatever it is, rather than crash

            for entry in entries:
                en = (entry.get("en") or "").strip()
                hi = (entry.get("hi") or "").strip()
                if not en:
                    # No English text at all - nothing meaningful to search
                    # or show a snippet for, so skip it from the index.
                    continue

                record = {
                    "bk": slug,
                    "n": entry.get("n"),
                    "sc": sc,
                    "ib": entry.get("ib"),
                    "e": truncate(en, max_chars),
                }
                if hi:
                    record["hi"] = truncate(hi, max_chars)
                    hi_count += 1

                records.append(record)
                count += 1

        per_collection_counts[slug] = count
        per_collection_hi_counts[slug] = hi_count
        print(f"  {slug}: {count} hadith indexed ({hi_count} with Hinglish)")

    return records, per_collection_counts, per_collection_hi_counts


def main():
    parser = argparse.ArgumentParser(description="Rebuild the hadith search index for QuranAnyWhere.")
    parser.add_argument(
        "--hadith-data-dir",
        default="hadith-data",
        help="Path to the hadith-data folder (default: ./hadith-data)",
    )
    parser.add_argument(
        "--out",
        default="search-index/hadith_index.json",
        help="Output path for the regenerated index (default: ./search-index/hadith_index.json)",
    )
    parser.add_argument(
        "--max-chars",
        type=int,
        default=350,
        help="Max characters kept per en/hi field, 0 = no truncation (default: 350)",
    )
    args = parser.parse_args()

    print(f"Scanning {args.hadith_data_dir} ...")
    records, counts, hi_counts = build_index(args.hadith_data_dir, args.max_chars)

    if not records:
        print("No hadith records were built - aborting without writing output.", file=sys.stderr)
        sys.exit(1)

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    # Compact separators (no spaces) - keeps the file as small as possible
    # for what it contains, matching the format already used in this repo.
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(",", ":"))

    size_bytes = os.path.getsize(args.out)
    size_mb = size_bytes / 1_000_000

    print()
    print("=" * 60)
    print(f"Collections indexed : {len(counts)}")
    print(f"Total hadith indexed: {sum(counts.values())}")
    print(f"  (with Hinglish)   : {sum(hi_counts.values())}")
    print(f"Output file         : {args.out}")
    print(f"Output size         : {size_mb:.1f} MB")
    print(f"Truncation cap      : {args.max_chars if args.max_chars else 'disabled (full text kept)'} chars/field")
    print("=" * 60)


if __name__ == "__main__":
    main()
