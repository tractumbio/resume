#!/usr/bin/env bash
# Render and check a cover letter in place, inside its application folder.
#
#   pipeline/build_cover.sh applications/bain-associate-consultant
#
# Unlike pipeline/release.sh, this does not promote between directories —
# applications/<slug>/ is already the final location. It renders cover.html
# to cover.pdf in the same folder and refuses to leave a failing PDF there
# uncommitted-looking: on any FAIL it still writes the PDF (so you can look
# at what's wrong) but exits non-zero.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

dir="${1:-}"
[[ -n "$dir" ]] || { echo "usage: $0 <applications/slug>" >&2; exit 2; }
src="$dir/cover.html"
[[ -f "$src" ]] || { echo "No such file: $src" >&2; exit 2; }

echo "==> render"
python3 pipeline/render.py "$src" -o "$dir/cover.pdf"

echo
echo "==> verify (--kind cover)"
status=0
python3 pipeline/verify.py "$dir/cover.pdf" --kind cover --json "$dir/cover.checks.json" || status=$?

echo
if [[ $status -eq 0 ]]; then
  echo "  $dir/cover.pdf is ready to submit."
else
  echo "  $dir/cover.pdf has failing checks — see above. Fix drafts/*.html-side issues in cover.html and re-run." >&2
fi
exit $status
