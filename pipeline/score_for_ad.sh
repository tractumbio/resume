#!/usr/bin/env bash
# Render, verify and score a resume draft against a specific job ad, then
# drop the scored PDF into that application's own folder.
#
#   pipeline/score_for_ad.sh applications/bain-associate-consultant \
#     --draft drafts/consulting/mckinsey-associate.html
#
# Reads applications/<slug>/ad.md, turns its metadata (firm, role, office,
# practice) into FITSIGNAL_ROLE / FITSIGNAL_REGION / FITSIGNAL_ROUTE /
# FITSIGNAL_PRACTICE via pipeline/ad_meta.py, then runs pipeline/release.sh
# with those set — so the FitSignal score reflects the actual ad, not the
# hardcoded McKinsey/AU defaults. On success, copies the resulting PDF and
# scorecard into the application folder as resume.pdf / resume.scorecard.json
# / resume.checks.json / resume.provenance.txt.
#
# This still assumes a tailored draft already exists — it does not write
# resume content. See "Building a resume from a job ad" in
# BUILDER_INSTRUCTIONS.md.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

app="${1:-}"
[[ -n "$app" ]] || { echo "usage: $0 <applications/slug> --draft <drafts/<sector>/<file>.html> [--name <export-basename>]" >&2; exit 2; }
[[ -f "$app/ad.md" ]] || { echo "No ad.md in $app — run pipeline/from_ad.py first." >&2; exit 2; }
shift

draft=""
name=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft) draft="$2"; shift 2 ;;
    --name) name="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

slug="$(basename "$app")"

if [[ -z "$draft" ]]; then
  # Try the obvious spot before giving up: drafts/<sector>/<slug>.html for
  # each sector directory that exists.
  for candidate in drafts/*/"$slug.html"; do
    [[ -f "$candidate" ]] && draft="$candidate" && break
  done
fi
[[ -n "$draft" && -f "$draft" ]] || {
  echo "No draft found. Pass --draft <drafts/<sector>/<file>.html> — a draft is not auto-generated," >&2
  echo "see 'Building a resume from a job ad' in BUILDER_INSTRUCTIONS.md." >&2
  exit 2
}

name="${name:-Adrian_Cioanca_Resume_$(echo "$slug" | sed -E 's/(^|-)([a-z])/\U\2/g')}"

echo "==> reading ad metadata from $app/ad.md"
eval "$(python3 pipeline/ad_meta.py "$app/ad.md" --emit-shell)"
for var in FITSIGNAL_ROLE FITSIGNAL_REGION FITSIGNAL_ROUTE FITSIGNAL_PRACTICE; do
  [[ -n "${!var:-}" ]] && echo "  $var=${!var}"
done
export FITSIGNAL_ROLE FITSIGNAL_REGION FITSIGNAL_ROUTE FITSIGNAL_PRACTICE
echo

pipeline/release.sh "$draft" --name "$name"

sector="$(basename "$(dirname "$draft")")"
src="exports/$sector"
echo
echo "==> copying into $app/"
cp "$src/$name.pdf" "$app/resume.pdf"
[[ -f "$src/$name.checks.json" ]] && cp "$src/$name.checks.json" "$app/resume.checks.json"
[[ -f "$src/$name.scorecard.json" ]] && cp "$src/$name.scorecard.json" "$app/resume.scorecard.json"
[[ -f "$src/$name.provenance.txt" ]] && cp "$src/$name.provenance.txt" "$app/resume.provenance.txt"

echo "  $app/resume.pdf is ready — scored against this ad's role/region/route/practice."
