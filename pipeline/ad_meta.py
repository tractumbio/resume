#!/usr/bin/env python3
"""Parse and infer metadata from a job ad, for pipeline/from_ad.py and
pipeline/score_for_ad.sh.

Two jobs:

1. Guess metadata (firm, role, region, route, practice) from raw ad text, so
   pipeline/from_ad.py can prefill applications/<slug>/ad.md instead of
   handing back an empty template.
2. Read that metadata back out of an already-filled ad.md, so
   pipeline/score_for_ad.sh can turn it into FITSIGNAL_* environment
   variables without a human re-typing the role/region/route by hand.

These are heuristics over known firm names, role titles, city/country
keywords and a handful of route/practice phrases — not a parser for
arbitrary prose. They are meant to get most of the way there and be
corrected by editing ad.md, not to be trusted blindly. Nothing here invents
a fact; it only classifies text that's already in the ad.
"""
import argparse
import json
import re
import sys

# Longest / most specific match wins, so ordering matters within each list.
KNOWN_FIRMS = [
    ("McKinsey & Company", "McKinsey"), ("McKinsey", "McKinsey"),
    ("Boston Consulting Group", "BCG"), ("BCG", "BCG"),
    ("Bain & Company", "Bain"), ("Bain", "Bain"),
    ("Deloitte Consulting", "Deloitte"), ("Deloitte", "Deloitte"),
    ("Accenture Strategy", "Accenture Strategy"), ("Accenture", "Accenture"),
    ("PwC Strategy&", "Strategy&"), ("Strategy&", "Strategy&"), ("PwC", "PwC"),
    ("EY-Parthenon", "EY-Parthenon"), ("EY Parthenon", "EY-Parthenon"),
    ("Oliver Wyman", "Oliver Wyman"),
    ("Kearney", "Kearney"),
    ("L.E.K. Consulting", "L.E.K."), ("L.E.K.", "L.E.K."),
    ("Roland Berger", "Roland Berger"),
]

ROLE_TITLES = [
    "Associate Consultant", "Associate Partner", "Senior Associate",
    "Engagement Manager", "Business Analyst", "Project Leader",
    "Consultant", "Associate", "Analyst", "Manager", "Partner", "Intern",
]

REGION_KEYWORDS = {
    "AU": ["australia", "sydney", "melbourne", "canberra", "brisbane", "perth", "adelaide"],
    "US": ["united states", "usa", "u.s.", "new york", "boston", "chicago", "san francisco",
           "washington, dc", "los angeles", "atlanta", "houston"],
    "UK": ["united kingdom", "london", "manchester", "edinburgh", "birmingham, uk"],
    "DACH": ["germany", "frankfurt", "munich", "berlin", "hamburg", "zurich", "geneva",
             "switzerland", "austria", "vienna"],
    "Gulf": ["dubai", "abu dhabi", "uae", "riyadh", "saudi arabia", "qatar", "doha", "kuwait"],
    "Japan": ["japan", "tokyo", "osaka"],
}

# Checked in this order, most specific first: "undergraduate" alone is common
# boilerplate in any ad that states a bachelor's-degree requirement (including
# APD/experienced-hire ads), so a weak campus keyword must not out-rank a
# strong, rare APD signal like "advanced professional degree" just because
# campus happened to be checked first.
ROUTE_KEYWORDS = {
    "apd": ["advanced professional degree", " apd ", "apd pathway", "apd track",
            "phd track", "doctoral candidate", "postdoctoral", "postdocs"],
    "graduate": ["graduate program", "graduate scheme", "new graduate", "graduate intake",
                 "2027 intake", "2026 intake"],
    "campus": ["campus hire", "undergraduate", "final-year student", "penultimate-year",
               "current student"],
}

PRACTICE_KEYWORDS = {
    "life-sciences": ["life sciences", "biotech", "pharma", "pharmaceutical"],
    "healthcare": ["healthcare", "health care", "payer", "provider systems"],
    "pe-diligence": ["private equity", "commercial due diligence", "cdd", " deal team",
                      "portfolio company"],
}


def _find_first(text_lower, phrases):
    for phrase in phrases:
        idx = text_lower.find(phrase.lower())
        if idx != -1:
            return phrase, idx
    return None, -1


def guess_firm(text):
    lower = text.lower()
    best = None
    for phrase, short in KNOWN_FIRMS:
        idx = lower.find(phrase.lower())
        if idx != -1 and (best is None or idx < best[1]):
            best = (short, idx)
    return best[0] if best else None


def guess_role(text):
    # Prefer a match in the first few lines (usually the ad's title).
    head = "\n".join(text.splitlines()[:5])
    for pool in (head, text):
        lower = pool.lower()
        for title in ROLE_TITLES:
            if title.lower() in lower:
                return title
    return None


def guess_region(text):
    lower = text.lower()
    for region, keywords in REGION_KEYWORDS.items():
        phrase, _ = _find_first(lower, keywords)
        if phrase:
            return region
    return None


def guess_office(text):
    lower = text.lower()
    for keywords in REGION_KEYWORDS.values():
        phrase, idx = _find_first(lower, keywords)
        if phrase:
            return text[idx:idx + len(phrase)]
    return None


def guess_route(text):
    lower = text.lower()
    for route, keywords in ROUTE_KEYWORDS.items():
        if any(k in lower for k in keywords):
            return route
    return "experienced-hire"


def guess_practice(text):
    lower = text.lower()
    for practice, keywords in PRACTICE_KEYWORDS.items():
        if any(k in lower for k in keywords):
            return practice
    return None


def guess_metadata(text):
    firm = guess_firm(text)
    role = guess_role(text)
    return {
        "firm": firm,
        "role": role,
        "office": guess_office(text),
        "region": guess_region(text),
        "route": guess_route(text),
        "practice": guess_practice(text),
        "fitsignal_role": " ".join(p for p in (firm, role) if p) or None,
    }


# --- reading metadata back out of a filled ad.md --------------------------

FIELD_RE = re.compile(r"^\s*-\s*\*\*([^:*]+):\*\*\s*(.*)$")


def parse_ad_md(path):
    text = open(path, encoding="utf-8").read()
    fields = {}
    for line in text.splitlines():
        m = FIELD_RE.match(line)
        if m:
            fields[m.group(1).strip().lower()] = m.group(2).strip()
    body = text.split("\n---\n", 1)
    body_text = body[1].strip() if len(body) > 1 else ""
    return fields, body_text


def metadata_from_ad_md(path):
    fields, body = parse_ad_md(path)
    firm = fields.get("firm") or guess_firm(body)
    role = fields.get("role") or guess_role(body)
    office = fields.get("office / location") or fields.get("office") or guess_office(body)
    practice_field = fields.get("practice / group") or fields.get("practice") or ""
    region = guess_region(office or "") or guess_region(body)
    route = guess_route(practice_field + " " + body)
    practice = guess_practice(practice_field) or guess_practice(body)
    return {
        "firm": firm,
        "role": role,
        "office": office,
        "region": region,
        "route": route,
        "practice": practice,
        "fitsignal_role": " ".join(p for p in (firm, role) if p) or None,
    }


def shell_quote(value):
    return "'" + str(value).replace("'", "'\\''") + "'"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ad_md", help="path to an applications/<slug>/ad.md")
    parser.add_argument("--emit-shell", action="store_true",
                         help="print FITSIGNAL_* export lines instead of JSON")
    args = parser.parse_args()

    meta = metadata_from_ad_md(args.ad_md)

    if args.emit_shell:
        if meta["fitsignal_role"]:
            print(f"export FITSIGNAL_ROLE={shell_quote(meta['fitsignal_role'])}")
        if meta["region"]:
            print(f"export FITSIGNAL_REGION={shell_quote(meta['region'])}")
        if meta["route"]:
            print(f"export FITSIGNAL_ROUTE={shell_quote(meta['route'])}")
        if meta["practice"]:
            print(f"export FITSIGNAL_PRACTICE={shell_quote(meta['practice'])}")
    else:
        json.dump(meta, sys.stdout, indent=2)
        print()


if __name__ == "__main__":
    main()
