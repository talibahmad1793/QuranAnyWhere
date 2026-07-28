#!/usr/bin/env python3
"""
Regenerates manifest.json files used by the site instead of live calls to
api.github.com (which has a 60 requests/hour/IP limit for unauthenticated
requests - a real risk once you have real traffic, especially many users
sharing one IP via mobile carrier CGNAT or office/school/mosque WiFi).

Run this from the repo root any time you add, remove, or rename a book
folder or a PDF file inside one, then commit + push the updated
manifest.json files along with your new PDFs.

Usage:
    python3 generate-manifests.py
"""
import json
import os

# Folders that hold JSON data (hadith, duas, quran-data, search-index) or
# tooling, not PDF "books" - these should never appear in the homepage grid.
RESERVED = {"duas", "search-index", "quran-data", "hadith-data", ".git", ".github"}


def main():
    root_entries = []
    for name in sorted(os.listdir(".")):
        if name.startswith(".") or name in RESERVED:
            continue
        if os.path.isdir(name):
            root_entries.append({"name": name, "type": "dir"})

    with open("manifest.json", "w", encoding="utf-8") as f:
        json.dump(root_entries, f, ensure_ascii=False, indent=2)
    print(f"manifest.json: {len(root_entries)} book folder(s)")

    for entry in root_entries:
        folder = entry["name"]
        files = sorted(
            (n for n in os.listdir(folder) if n.lower().endswith(".pdf")),
            key=str.lower,
        )
        file_entries = [{"name": n, "type": "file"} for n in files]
        manifest_path = os.path.join(folder, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(file_entries, f, ensure_ascii=False, indent=2)
        print(f"{manifest_path}: {len(file_entries)} PDF(s)")

    print("\nDone. Commit and push manifest.json + your PDF changes together.")


if __name__ == "__main__":
    main()
