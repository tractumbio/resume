#!/usr/bin/env bash
# One command for a full application: score the resume against the ad, build
# the cover letter, and report where the score is weakest.
#
#   pipeline/apply.sh applications/bain-associate-consultant \
#     --draft drafts/consulting/bain-associate-consultant.html
#
# Wraps score_for_ad.sh (resume) + build_cover.sh (cover letter) and finishes
# with weak_rules.py against the fresh scorecard — the refinement loop is:
# read that output, edit the draft or cover.html, run this again, repeat
# until the score plateaus or the weak rules left are ones you've decided not
# to chase (see "Building a resume from a job ad" in BUILDER_INSTRUCTIONS.md).
# This script does not loop by itself — deciding what to change in response
# to a weak rule is a judgement call, same as drafting the content was.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

app="${1:-}"
[[ -n "$app" ]] || { echo "usage: $0 <applications/slug> --draft <drafts/<sector>/<file>.html> [--name <export-basename>] [--skip-cover]" >&2; exit 2; }
shift

draft=""
name=""
skip_cover=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft) draft="$2"; shift 2 ;;
    --name) name="$2"; shift 2 ;;
    --skip-cover) skip_cover=1; shift ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

score_args=("$app")
[[ -n "$draft" ]] && score_args+=(--draft "$draft")
[[ -n "$name" ]] && score_args+=(--name "$name")

echo "=========================================="
echo " resume"
echo "=========================================="
pipeline/score_for_ad.sh "${score_args[@]}"

if [[ "$skip_cover" -eq 0 ]]; then
  echo
  echo "=========================================="
  echo " cover letter"
  echo "=========================================="
  if [[ -f "$app/cover.html" ]]; then
    pipeline/build_cover.sh "$app" || echo "  cover letter has failing checks — see above." >&2
  else
    echo "  $app/cover.html not found — skipping. Run pipeline/from_ad.py first, or draft one by hand." >&2
  fi
fi

if [[ -f "$app/resume.scorecard.json" ]]; then
  echo
  echo "=========================================="
  echo " where to focus the next revision"
  echo "=========================================="
  python3 pipeline/weak_rules.py "$app/resume.scorecard.json"
fi
