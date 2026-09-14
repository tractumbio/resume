#!/usr/bin/env bash
# Render -> verify -> score -> promote a draft into exports/.
#
#   pipeline/release.sh drafts/consulting/mckinsey-associate.html
#   pipeline/release.sh drafts/consulting/mckinsey-associate.html --name Adrian_Cioanca_Resume_McKinsey_Associate
#
# Nothing reaches exports/ unless every check in pipeline/verify.py passes.
# Anything in exports/ is therefore, by construction, ready to submit.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

src="${1:-}"
[[ -n "$src" ]] || { echo "usage: $0 <draft.html> [--name <export-basename>] [--skip-score]" >&2; exit 2; }
[[ -f "$src" ]] || { echo "No such draft: $src" >&2; exit 2; }
shift

name=""
skip_score=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) name="$2"; shift 2 ;;
    --skip-score) skip_score=1; shift ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

sector="$(basename "$(dirname "$src")")"
stem="$(basename "$src" .html)"
name="${name:-$stem}"
build="$REPO/build/$sector"
dest="$REPO/exports/$sector"
mkdir -p "$build" "$dest"

echo "==> render"
python3 pipeline/render.py "$src" -o "$build/$name.pdf"

echo
echo "==> verify"
if ! python3 pipeline/verify.py "$build/$name.pdf" --json "$build/$name.checks.json"; then
  echo "Verification failed — the draft stays in drafts/ and nothing was promoted." >&2
  exit 1
fi

if [[ "$skip_score" -eq 0 ]]; then
  echo "==> score (FitSignal)"
  if pipeline/score.sh "$build/$name.pdf" --json > "$build/$name.scorecard.raw.json" 2>"$build/$name.score.log"; then
    # Keep the scorecard, drop the model's raw text — it is not a result and
    # would put an unreviewed model transcript into version control.
    python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); d.pop("raw_response", None); json.dump(d, open(sys.argv[2], "w"), indent=2)' \
      "$build/$name.scorecard.raw.json" "$build/$name.scorecard.json"
    rm -f "$build/$name.scorecard.raw.json"
    python3 pipeline/summarise.py "$build/$name.scorecard.json"
  else
    echo "  FitSignal did not run; see $build/$name.score.log" >&2
    rm -f "$build/$name.scorecard.json" "$build/$name.scorecard.raw.json"
  fi
fi

echo
echo "==> promote"
cp "$build/$name.pdf" "$dest/$name.pdf"
cp "$build/$name.checks.json" "$dest/$name.checks.json"
[[ -f "$build/$name.scorecard.json" ]] && cp "$build/$name.scorecard.json" "$dest/$name.scorecard.json"
{
  echo "source:    $src"
  echo "rendered:  $(date -u +%Y-%m-%dT%H:%M:%SZ) by pipeline/release.sh"
  echo "commit:    $(git rev-parse --short HEAD 2>/dev/null || echo 'not a git checkout')"
  echo "checks:    all passed (see $name.checks.json)"
  if [[ -f "$dest/$name.scorecard.json" ]]; then
    python3 pipeline/summarise.py "$dest/$name.scorecard.json" --provenance
  else
    echo "fitsignal: not run"
  fi
} > "$dest/$name.provenance.txt"

echo "  exports/$sector/$name.pdf is ready to submit."
