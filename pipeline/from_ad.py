#!/usr/bin/env python3
"""Turn a job ad into a scaffolded application folder.

    python3 pipeline/from_ad.py path/to/ad.txt
    python3 pipeline/from_ad.py path/to/ad.txt --name bain-associate-consultant
    pbpaste | python3 pipeline/from_ad.py -            # paste, then Ctrl-D
    python3 pipeline/from_ad.py https://firm.example/careers/12345

Creates applications/<slug>/ from applications/_template/, with ad.md
prefilled: the metadata block (firm, role, office, practice) guessed from
the ad text via pipeline/ad_meta.py, and the ad itself pasted in below the
rule. Guesses are heuristic — read what got filled in and correct it; this
script's job is to save typing, not to be trusted blindly.

This does NOT draft a resume. Selecting and phrasing bullets against
CLAUDE.md's standards (MECE, quantified, no invented facts) is a judgement
call, not something to template — see "Building a resume from a job ad" in
BUILDER_INSTRUCTIONS.md for what comes after this script.
"""
import argparse
import pathlib
import re
import sys
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ad_meta  # noqa: E402  (needs the sys.path insert above)

REPO = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = REPO / "applications" / "_template"


def slugify(text):
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return re.sub(r"-{2,}", "-", text)


def fetch(source):
    if source == "-":
        return sys.stdin.read()
    if re.match(r"^https?://", source):
        req = urllib.request.Request(source, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode(resp.headers.get_content_charset() or "utf-8", "replace")
        # Best-effort HTML stripping — this is a fallback, not a real
        # scraper. A JS-rendered careers page will come back mostly empty;
        # paste the ad text into a file and pass that instead if so.
        text = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", raw)
        text = re.sub(r"(?s)<[^>]+>", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\s*\n+", "\n\n", text)
        return text.strip()
    path = pathlib.Path(source)
    if not path.is_file():
        print(f"No such file: {path}", file=sys.stderr)
        sys.exit(2)
    return path.read_text(encoding="utf-8", errors="replace")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", help="ad file path, '-' for stdin, or a URL")
    parser.add_argument("--name", help="application slug (default: guessed firm-role, or ad-<n>)")
    parser.add_argument("--force", action="store_true", help="overwrite an existing application folder")
    args = parser.parse_args()

    text = fetch(args.source)
    if not text.strip():
        print("No ad text read — nothing to scaffold.", file=sys.stderr)
        sys.exit(2)

    meta = ad_meta.guess_metadata(text)

    if args.name:
        slug = args.name
    else:
        guess = slugify(" ".join(p for p in (meta["firm"], meta["role"]) if p))
        if guess:
            slug = guess
        else:
            existing = list((REPO / "applications").glob("ad-*"))
            slug = f"ad-{len(existing) + 1}"

    dest = REPO / "applications" / slug
    if dest.exists() and not args.force:
        print(f"applications/{slug} already exists — pass --force to overwrite, or --name for a different slug.", file=sys.stderr)
        sys.exit(1)
    dest.mkdir(parents=True, exist_ok=True)

    ad_md = (TEMPLATE / "ad.md").read_text()
    title = " — ".join(p for p in (meta["firm"], meta["role"]) if p) or "Firm — Role"
    ad_md = ad_md.replace("# <Firm> — <Role title>", f"# {title}")
    for field, value in (
        ("**Firm:**", meta["firm"]),
        ("**Role:**", meta["role"]),
        ("**Office / location:**", meta["office"]),
        ("**Ad URL:**", args.source if re.match(r"^https?://", args.source) else None),
    ):
        if value:
            ad_md = ad_md.replace(f"- {field}\n", f"- {field} {value}\n", 1)
    ad_md = ad_md.replace("<!-- Paste the full job ad text here. -->", text.strip())
    (dest / "ad.md").write_text(ad_md)

    cover_html = (TEMPLATE / "cover.html").read_text()
    if meta["firm"] or meta["role"]:
        cover_html = cover_html.replace("<Firm> <Role>", " ".join(p for p in (meta["firm"], meta["role"]) if p))
    (dest / "cover.html").write_text(cover_html)

    print(f"applications/{slug}/ created.\n")
    print("Guessed metadata (check and correct in ad.md if wrong):")
    for key in ("firm", "role", "office", "region", "route", "practice"):
        print(f"  {key:10s} {meta[key] or '(not detected)'}")
    print(f"\nSuggested FitSignal role string: {meta['fitsignal_role'] or '(set manually)'}")
    print(f"\nNext: draft a resume against this ad (see 'Building a resume from a "
          f"job ad' in BUILDER_INSTRUCTIONS.md), then run\n"
          f"  pipeline/score_for_ad.sh applications/{slug} --draft <drafts/<sector>/<file>.html>")


if __name__ == "__main__":
    main()
