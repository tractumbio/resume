# Pipeline

Render a draft, check it against `CLAUDE.md`, score it, and promote it to `exports/` only
if it passed.

```
render.py        HTML -> PDF (WeasyPrint), with the vendored fonts embedded
verify.py        checks against the rendered PDF; --kind resume|cover; any FAIL exits non-zero
score.sh         FitSignal scoring, via the sibling fitsignal repo
summarise.py     one-paragraph summary of a FitSignal scorecard
release.sh       render + verify + score, then promote — the only way into exports/
build_cover.sh   render + verify --kind cover, in place, for applications/<slug>/cover.html
ad_meta.py       heuristics: guess/parse firm, role, region, route, practice from ad text
from_ad.py       scaffold applications/<slug>/ from a job ad (file, stdin, or URL)
score_for_ad.sh  release.sh, with FITSIGNAL_* set from the ad's own metadata
weak_rules.py    rank a scorecard's findings by weighted points left on the table
apply.sh         score_for_ad.sh + build_cover.sh + weak_rules.py, one command per round
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
`FITSIGNAL_ROUTE`, `FITSIGNAL_PRACTICE` (healthcare | life-sciences | pe-diligence — unset
by default, since most roles don't declare one).

**Scoring against a specific ad.** `score_for_ad.sh` is `release.sh` with those four
variables set automatically from `applications/<slug>/ad.md`'s own metadata, via
`ad_meta.py`, instead of the hardcoded defaults — see "Building a resume from a job ad" in
`BUILDER_INSTRUCTIONS.md`. `ad_meta.py`'s guesses are heuristic (known firm names, role
titles, city/country keywords) and meant to be checked, not trusted blindly — they save
typing on the mechanical fields, they don't replace reading the ad.

**Refining toward a higher score.** `weak_rules.py` ranks a scorecard's findings by
`weight × (3 - score)` — actual points of `overall` left on the table, not the rawest-
looking number — and quotes the evidence span each one scored against. `apply.sh` runs it
automatically after every round. There is no automated "maximize the score" mode: deciding
what a low score should change in the draft is a judgement call, same as drafting the
content in the first place. Never invent a fact to satisfy a rule.

## Cover letters vs. resumes

`verify.py --kind resume` (the default) and `--kind cover` share every check except two:
a resume must have a Profile section; a cover letter is checked for word count instead.
Margin and dead-space targets also differ by kind — see the `check_margins` docstring
comment and "Cover-letter standards" in `CLAUDE.md`. `build_cover.sh` always passes
`--kind cover` and writes output next to the source (`applications/<slug>/cover.pdf`)
rather than through `release.sh`'s promotion step, since an application folder is already
its own final location.

## Adding a check

`CLAUDE.md` is the specification; `verify.py` is its executable half. A new standard that
can be tested against the rendered PDF belongs in both. Follow the existing shape: a
`check_*` function taking `(pdf_or_text, report)` and calling `report.passed/warn/fail`.
`fail` blocks a release; `warn` does not.
