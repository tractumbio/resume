# Pipeline

Render a draft, check it against `CLAUDE.md`, score it, and promote it to `exports/` only
if it passed.

```
render.py      HTML -> PDF (WeasyPrint), with the vendored fonts embedded
verify.py      nine checks against the rendered PDF; any FAIL exits non-zero
score.sh       FitSignal scoring, via the sibling fitsignal repo
summarise.py   one-paragraph summary of a FitSignal scorecard
release.sh     all of the above, then promote — the only way into exports/
```

## Requirements

```bash
pip install -r requirements.txt    # WeasyPrint
apt-get install poppler-utils      # pdffonts, pdftotext, pdfinfo
```

## Notes on the implementation

**Fonts.** `render.py` passes a single `FontConfiguration` to both the stylesheet and the
writer. Without it WeasyPrint silently ignores `@font-face` and falls back to whatever
fontconfig offers — which is precisely the failure `CLAUDE.md` calls out, and it is silent:
the render succeeds and the PDF is wrong.

**Reading order.** The check runs `pdftotext` *without* `-layout`, deliberately. `-layout`
reconstructs columns geometrically and papers over a `float:right` date; the raw content
stream is what an ATS sees. A right-aligned date always extracts onto its own line — the
defect is the date landing *before* its role, so the check looks at what follows a
date-only line, not at whether one exists.

**Margins.** Measured from the text bounding box via `pdftotext -bbox`, not from the CSS.
What matters is where the ink actually ends.

**Orphan words.** The check reads the single-column flow. A word stranded inside one
column of a two-column block sits on the same extracted line as the other column's text
and is invisible to it — the Capabilities block needs an eye, not a check.

**Scoring.** `score.sh` extracts with `-layout` and passes `--input-mode pdf_layout`, so
the layout rules can resolve. Defaults target Adrian's brief (`McKinsey Associate`, region
`AU`, route `experienced-hire`); override with `FITSIGNAL_ROLE`, `FITSIGNAL_REGION`,
`FITSIGNAL_ROUTE`.

## Adding a check

`CLAUDE.md` is the specification; `verify.py` is its executable half. A new standard that
can be tested against the rendered PDF belongs in both. Follow the existing shape: a
`check_*` function taking `(pdf_or_text, report)` and calling `report.passed/warn/fail`.
`fail` blocks a release; `warn` does not.
