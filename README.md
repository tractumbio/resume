# resume

Adrian Cioanca's resume source-of-truth, drafts, and a build pipeline that will not let a
resume reach `exports/` unless it passes every standard in [`CLAUDE.md`](CLAUDE.md).

Target: top-tier management consulting (MBB-calibre). See **Career Intentions** in the
knowledge base.

```
knowledge-base/     every fact, with variants and open questions — the only source of truth
drafts/<sector>/    HTML sources, one per variant. Edit these.
pipeline/           render -> verify -> score -> promote
exports/<sector>/   ready to submit. Everything here passed all checks.
archive/            superseded renders, kept for diffing. Do not send these.
assets/             vendored typefaces, embedded into every export
CLAUDE.md           the standards
BUILDER_INSTRUCTIONS.md   how to build one, step by step
```

## Quick start

```bash
pip install -r pipeline/requirements.txt
apt-get install poppler-utils

make verify                                                   # render + check the default draft
pipeline/release.sh drafts/consulting/mckinsey-associate.html  # ... and promote it to exports/
```

`make verify` renders the draft and runs nine checks against the PDF — page count, page
size, embedded fonts, ATS reading order, margins and dead space, header language,
quantification, the Profile section, orphan words. `pipeline/release.sh` runs the same
checks and refuses to promote anything that fails, which is what makes "it is in
`exports/`" mean "it is ready to submit".

## Scoring

[FitSignal](https://github.com/tractumbio/fitsignal) scores an export against a versioned
consulting rubric. It is a sibling repo, not a dependency:

```bash
git clone https://github.com/tractumbio/fitsignal ../fitsignal
pipeline/score.sh exports/consulting/Adrian_Cioanca_Resume_McKinsey_Associate.pdf
```

Set `FITSIGNAL_HOME` if your checkout is elsewhere. Without an `ANTHROPIC_API_KEY` the run
falls back to mock mode — the pipeline completes, the numbers are placeholders, and every
artefact it writes says so. Read the result as a screen-out instrument: the rubric is
unvalidated and `likelihood` is an uncalibrated band, not a prediction.

## Where to start reading

- Building or tailoring a resume → [`BUILDER_INSTRUCTIONS.md`](BUILDER_INSTRUCTIONS.md)
- What "good" means here → [`CLAUDE.md`](CLAUDE.md)
- The facts → [`knowledge-base/`](knowledge-base/)
