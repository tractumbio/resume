# Builder instructions

How to produce a resume in this repo, from the knowledge base to a file you can attach
to an application. Written to be followed step by step, by Adrian or by an agent.

The standards themselves live in [`CLAUDE.md`](CLAUDE.md). This file is the procedure;
CLAUDE.md is the specification. Where they disagree, CLAUDE.md wins.

---

## The shape of the repo

```
knowledge-base/     every fact, with its variants and open questions — the only source of truth
drafts/<sector>/    HTML sources, one file per variant. This is where you write.
pipeline/           render -> verify -> score -> promote
exports/<sector>/   ready to submit. Nothing lands here that has not passed every check.
archive/            superseded renders, kept for diffing. Never send these.
assets/             vendored typefaces, embedded into every export
```

Three rules hold the whole thing together:

1. **Facts come from `knowledge-base/`.** If a claim is not in there and Adrian has not
   confirmed it, it does not go on a resume. Adding a fact means editing the knowledge
   base first, then the draft.
2. **You edit `drafts/`, never `exports/`.** Exports are build output. Editing one by hand
   breaks the guarantee that everything in `exports/` passed the checks.
3. **`pipeline/release.sh` is the only way into `exports/`.** It refuses to promote a PDF
   with a failing check, so "it is in exports/" and "it is ready to submit" mean the same thing.

---

## One-time setup

```bash
pip install -r pipeline/requirements.txt   # WeasyPrint
apt-get install poppler-utils              # pdffonts, pdftotext, pdfinfo
git clone https://github.com/tractumbio/fitsignal ../fitsignal   # scoring, optional
```

FitSignal is a sibling repo, not a dependency. `pipeline/score.sh` looks for `../fitsignal`
unless `FITSIGNAL_HOME` says otherwise, and installs its npm dependencies on first use.
Without an `ANTHROPIC_API_KEY` it runs in mock mode: the pipeline completes, but the
numbers are placeholders and every artefact says so.

---

## Building a variant

### 1. Decide the target, then re-read the brief

Open `knowledge-base/Adrian_Cioanca_Master_Knowledge_Base.md` and read **Career Intentions**
before anything else. It states what the move is for. A resume that does not serve that
angle is off-brief even if every bullet is true.

### 2. Start from the nearest existing draft

```bash
cp drafts/consulting/mckinsey-associate.html drafts/consulting/<new-variant>.html
```

Sector directories group variants by where they are going (`consulting/`, and more as
needed). Name the file for the target, in lowercase and hyphens.

### 3. Select the content

Working from the knowledge base, for each role pick the bullets that:

- make **one** distinct claim each — no two bullets in a role covering the same ground,
  no compound bullet welding two achievements together with "and";
- **carry a number** — dollars, percent, headcount, time saved, rank. Where no number
  exists, state a concrete verifiable outcome instead. An adjective is not a substitute;
- **lead with the verb and the result**, not the activity;
- foreground stakeholder management, cross-functional leadership, and turning technical or
  scientific complexity into commercial decisions.

Keep the **Profile** section. It states the role being applied for and the specific angle
offered. If the page is tight, cut bullet density, not the Profile.

**Reconcile every conflicting figure before you publish.** The knowledge base flags open
variants — postdoc funding, the ErythroSight raise, the publication count, the Crawford
cohort size. Pick the best-supported number and be able to cite it against the in-repo
grants table or Google Scholar, or ask Adrian. Never ship an unreconciled figure.

### 4. Keep the markup honest

Two patterns in the template exist for reasons the checks enforce:

- Dates sit in `<span class="date">` **after** `<span class="who">` inside a flex row.
  Never `float:right` — a float puts the date ahead of the role in the PDF content
  stream, which is the order an ATS reads.
- Type comes from `assets/fonts.css` (Source Sans 3 / Source Serif 4), vendored in the repo
  and embedded at render time. Do not name a font that is not vendored: the renderer will
  quietly substitute one, and a substituted font is an accident, not a choice.

### 5. Render, check, iterate

```bash
make verify DRAFT=drafts/consulting/<new-variant>.html
```

Nine checks run. Fix every FAIL; read every WARN and decide.

| Check | What a failure means |
|---|---|
| one page | Cut bullet density — never the Profile |
| A4 page size | `@page size` was changed |
| fonts embedded | A non-vendored family was named, or the font config was bypassed |
| reading order | A date is being extracted ahead of its role — a `float` crept back in |
| margins | Dead space at the foot (thin content) or asymmetric sides |
| header tagline | Self-laudatory language in the header |
| quantification | Vague filler where a number belongs |
| profile section | The Profile was cut |
| orphan words | A short word stranded alone at the end of a block |

Typography is the usual lever for the page-fill checks. The draft's body `font-size`,
`line-height`, `li` margin and `.section` margin-top tune together; move them in small
steps and re-render. Going from a 37mm gap at the foot to symmetric 12.4mm margins took
three passes.

### 6. Score it

```bash
pipeline/score.sh build/consulting/<new-variant>.pdf
```

FitSignal scores the PDF against its rubric. Read it as a screen-out instrument, not a
verdict: it catches disqualifiers and missing biodata, it does not tell you the resume is
good. Two things to know before you act on a number:

- The rubric is **unvalidated** — no labelled set has been run through it.
- `likelihood` is an **uncalibrated** heuristic, reported as a band. It is not a prediction.

`R24` (resume/LinkedIn consistency) always resolves `unknown` from a PDF; it needs profile
metadata. That is correct behaviour, not a gap to fix.

### 7. Release

```bash
pipeline/release.sh drafts/consulting/<new-variant>.html --name Adrian_Cioanca_Resume_<Target>
```

Render, verify, score, promote — and nothing is promoted unless every check passes. Four
files land in `exports/<sector>/`:

| File | What it is |
|---|---|
| `<name>.pdf` | the document to attach |
| `<name>.checks.json` | every check and its result |
| `<name>.scorecard.json` | the FitSignal scorecard |
| `<name>.provenance.txt` | source draft, render time, commit, provider |

Use the export name that will appear in a recruiter's download folder —
`Adrian_Cioanca_Resume_McKinsey_Associate`, not `draft-v3-final`.

### 8. Commit both sides

Commit the draft and its export together. A PDF in the tree whose HTML source is not
beside it cannot be re-rendered, diffed or trusted.

---

## When you change the standards

`CLAUDE.md` is the specification and `pipeline/verify.py` is its executable half. Adding a
rule to one without the other leaves the repo asserting something it does not check. If a
new standard can be tested against the rendered PDF, add the check.

## What the pipeline does not check

It reads the artefact, not the argument. Nothing here can tell you whether a bullet is
MECE, whether a number is the right number, or whether the Profile answers the question
the firm is actually asking. That judgement stays with the person building the resume.
