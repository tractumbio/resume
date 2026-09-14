#!/usr/bin/env bash
# Score a rendered resume PDF with FitSignal (github.com/tractumbio/fitsignal).
#
#   pipeline/score.sh build/mckinsey-associate.pdf [-- extra fitsignal args]
#
# FitSignal is a sibling repo, not a dependency of this one. Point FITSIGNAL_HOME
# at your checkout, or leave it and the script looks for ../fitsignal.
# Without an ANTHROPIC_API_KEY the run falls back to --mock, which exercises the
# whole pipeline with placeholder findings — useful for wiring, useless as a score.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FITSIGNAL_HOME="${FITSIGNAL_HOME:-$(cd "$REPO/.." && pwd)/fitsignal}"

# Defaults match Adrian's target: see knowledge-base Career Intentions.
ROLE="${FITSIGNAL_ROLE:-McKinsey Associate}"
REGION="${FITSIGNAL_REGION:-AU}"
ROUTE="${FITSIGNAL_ROUTE:-experienced-hire}"
PRACTICE="${FITSIGNAL_PRACTICE:-}"

pdf="${1:-}"
[[ -n "$pdf" ]] || { echo "usage: $0 <resume.pdf> [-- extra fitsignal args]" >&2; exit 2; }
[[ -f "$pdf" ]] || { echo "No such PDF: $pdf" >&2; exit 2; }
shift || true
[[ "${1:-}" == "--" ]] && shift || true

if [[ ! -f "$FITSIGNAL_HOME/src/cli.js" ]]; then
  echo "FitSignal not found at $FITSIGNAL_HOME." >&2
  echo "Clone it beside this repo, or set FITSIGNAL_HOME=/path/to/fitsignal." >&2
  exit 2
fi
if [[ ! -d "$FITSIGNAL_HOME/node_modules" ]]; then
  echo "Installing FitSignal dependencies in $FITSIGNAL_HOME ..." >&2
  (cd "$FITSIGNAL_HOME" && npm install --no-audit --no-fund >/dev/null)
fi

txt="$(mktemp -t fitsignal-resume-XXXXXX.txt)"
trap 'rm -f "$txt"' EXIT
# pdf_layout mode: keep the column geometry so the layout rules can resolve.
pdftotext -layout "$pdf" "$txt"

args=(--file "$txt" --role "$ROLE" --input-mode pdf_layout --region "$REGION" --route "$ROUTE")
[[ -n "$PRACTICE" ]] && args+=(--practice "$PRACTICE")
if [[ -z "${ANTHROPIC_API_KEY:-}${OPENAI_API_KEY:-}" ]] && [[ ! -f "$FITSIGNAL_HOME/.env" ]]; then
  echo "No model API key found — running FitSignal in --mock mode (placeholder scores)." >&2
  args+=(--mock)
fi

node "$FITSIGNAL_HOME/src/cli.js" "${args[@]}" "$@"
