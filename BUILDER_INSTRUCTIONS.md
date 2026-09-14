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
applications/       one folder per job applied to: ad, resume copy, cover letter
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

## Building a resume from a job ad

Start here when a specific ad is what's driving the work — it scaffolds the application
folder and does the mechanical parts (metadata, rendering, checking, scoring), so the only
judgement call left is picking and phrasing the resume content.

### 1. Scaffold the application from the ad

```bash
python3 pipeline/from_ad.py path/to/ad.txt --name <firm>-<role-slug>
# or: pbpaste | python3 pipeline/from_ad.py -
# or: python3 pipeline/from_ad.py https://firm.example/careers/12345
```

This creates `applications/<slug>/` from the template, with `ad.md` prefilled: firm, role,
office and practice guessed from the ad text (`pipeline/ad_meta.py`'s heuristics — known
firm names, role titles, region/route/practice keywords), and the ad itself pasted below
the rule. **Read what it guessed before trusting it** — it prints its guesses and where
they landed in `ad.md`; correct any that are wrong (a firm or role it didn't recognise
comes back blank) before scoring.

A URL fetch is best-effort HTML-stripping, not a real scraper — a JS-rendered careers page
often comes back empty. If that happens, paste the ad text into a file and pass that
instead.

### 2. Draft the resume against this specific ad

This step is not automated, deliberately — see "What the pipeline does not check" at the
end of this file. Selecting which bullets to lead with, matching the ad's language, and
deciding what to cut is a judgement call CLAUDE.md's standards govern (MECE, quantified,
no invented facts), not something a script should do unsupervised.

```bash
cp drafts/consulting/<nearest-existing-variant>.html drafts/consulting/<slug>.html
```

Then follow "Building a variant" above: tailor the Profile line to name the specific role
and practice from the ad, reorder or reweight bullets toward what the ad asks for, and
keep everything else — facts, numbers, standards — exactly as strict as any other variant.
Naming the draft file `<slug>.html` (matching the application folder) lets the next step
find it automatically.

### 3. Draft the cover letter against the same ad

`cover.html` was already scaffolded in step 1 with the firm/role filled into its title.
Write it now, alongside the resume — see "Building a cover letter" below for the
paragraph-by-paragraph procedure and the MBB structure it follows. Same rule as the resume:
the content is a judgement call against `CLAUDE.md`'s standards, not something scaffolded
for you.

### 4. Render, check, score and refine — `pipeline/apply.sh`

```bash
pipeline/apply.sh applications/<firm>-<role-slug> --draft drafts/consulting/<slug>.html
```

One command for both documents. It runs `score_for_ad.sh` (render → verify → score the
resume, with `FITSIGNAL_ROLE`/`REGION`/`ROUTE`/`PRACTICE` read back out of `ad.md` — so the
score reflects this ad's actual role, region, hiring route and practice, not the hardcoded
McKinsey/AU/experienced-hire defaults) and `build_cover.sh` (render → verify the letter),
then finishes by printing the resume's highest-impact gaps via `pipeline/weak_rules.py`.
(`--draft` can be omitted if the draft is named `drafts/<sector>/<slug>.html` to match the
application folder — the script looks there first; `--skip-cover` runs the resume half
only.) On success it leaves the whole scored, checked application package in place:

```
applications/<slug>/resume.pdf              applications/<slug>/cover.pdf
applications/<slug>/resume.checks.json      applications/<slug>/cover.checks.json
applications/<slug>/resume.scorecard.json
applications/<slug>/resume.provenance.txt
```

**Refining toward the highest score achievable is a loop, not a setting.** There is no
unattended "maximize the score" mode — deciding what a low score on a given rule should
change in the draft is exactly the kind of judgement call this repo has never scripted, the
same reason step 2 and step 3 aren't automated either. What `apply.sh` gives you is a fast,
cheap loop to run that judgement through:

1. Read the "where to focus the next revision" block `apply.sh` just printed — it ranks
   findings by `weight × (3 - score)`, i.e. actual points of `overall` left on the table,
   highest first. Fix the top one or two, not everything at once.
2. Each finding names the rule and quotes the evidence span the model used to justify its
   score — that span tells you what the model actually saw. If a low score is quoting the
   wrong sentence (or none), the content needed for a better score may already be in the
   knowledge base and simply isn't on the page yet; if it's quoting the right sentence and
   still scoring low, the phrasing or the claim itself needs to change, not just its
   position.
3. Edit `drafts/consulting/<slug>.html` (or `cover.html`) accordingly. Never invent a fact
   or a figure to satisfy a rule — a rule that wants evidence the knowledge base doesn't
   have stays unresolved, or gets flagged to Adrian, same standard as everywhere else in
   this repo.
4. Re-run `pipeline/apply.sh`. Repeat until either the score plateaus (a round of edits
   doesn't move `overall`), or every remaining weak rule is one you've deliberately decided
   not to chase (commonly `R07`/`R15`, the prestige proxies FitSignal itself flags as
   low-weight convention — see `fitsignal`'s README) — not until some target number, since
   the rubric is unvalidated and a specific `overall` isn't a real target to hit.
5. `provider=mock` in `resume.provenance.txt` means every score in this loop was a
   placeholder (no `ANTHROPIC_API_KEY` was set) — the ranking is deterministic and the
   loop's mechanics are worth exercising, but don't treat a mock-mode "improvement" as real
   until it's re-run with a key.

## Building a cover letter

A cover letter is per application, not per sector — it lives with the ad it responds to,
in `applications/<firm>-<role-slug>/`, not in `drafts/`. See `applications/README.md` for
the folder layout; this section is the drafting procedure. The standards themselves are in
"Cover-letter standards" in `CLAUDE.md` — read that first.

### 1. Start the application folder

```bash
cp -r applications/_template applications/<firm>-<role-slug>
```

Use the name a recruiter's inbox would sort sensibly by: firm, then role, lowercase and
hyphenated — `bain-associate-consultant`, not `cover-letter-v2`.

### 2. Fill in `ad.md` first

Paste the job ad in full, then fill the metadata block above it: firm, role, office,
practice/group if stated, deadline, the ad URL, and any referral. Do this before touching
the letter — every paragraph in step 4 is written against this ad, not against a general
impression of the firm.

### 3. Copy in the resume that was actually sent

```bash
cp exports/consulting/<export-name>.pdf applications/<firm>-<role-slug>/resume.pdf
```

If this role calls for different emphasis than an existing export supports — a different
practice, a region-specific format — build a new draft and release it first (see "Building
a variant" above), then copy that export in. Never edit `resume.pdf` directly; it is a
build artefact, same rule as `exports/`.

### 4. Draft `cover.html`

The template's four paragraph blocks are commented with what each one has to do — read the
comments, don't just type around them. In order:

1. **Hook** — something specific to this firm/role/ad in the first sentence or two, not
   "I am writing to apply for...". State the role once, inside the hook.
2. **Why this firm** — a named practice, a published case, a sector focus *from the ad or
   the firm's own materials* — never "your prestigious firm" or "your reputation for
   excellence". This is where the resume's Profile line gets argued, not repeated.
3. **Why you** — two, at most three, proof points, each one evidence plus what it
   demonstrates for *this* role. Quantify anything that has a number, same bar as the
   resume. If a sentence could be lifted verbatim from a resume bullet, cut it — this
   paragraph's job is the connective narrative the resume's bullet format can't carry.
4. **Close** — fit, a clear call to action, thanks. No hedging, no re-summarising.

Personalize the salutation (a named recruiter if you have one; otherwise the practice or
recruiting team by name) and mirror the firm's own vocabulary for the role
(McKinsey "Associate", BCG "Consultant", Bain "Associate Consultant" — whatever the ad
itself says, not a generic label).

### 5. Render and check

```bash
pipeline/build_cover.sh applications/<firm>-<role-slug>
```

Runs the same font/page/margin/reading-order/language checks as a resume, minus the
Profile-section check, plus a word-count check (MBB guidance: ~300-400 words) — read
"Cover-letter standards" in `CLAUDE.md` for what each one means for a letter specifically.
A resume's "fill the page" rule does not carry over: white space below a 300-400 word
letter is normal, not a defect.

Fix issues in `cover.html` and re-run; the script overwrites `cover.pdf` and
`cover.checks.json` in place — there is no separate promotion step, because
`applications/<slug>/` already is the final location.

### 6. Commit the whole folder

`ad.md`, `resume.pdf`, `cover.html`, `cover.pdf` and `cover.checks.json` together. A
resume without its ad, or a cover letter without the resume it accompanied, loses the
context that makes the application legible six months later.

## When you change the standards

`CLAUDE.md` is the specification and `pipeline/verify.py` is its executable half. Adding a
rule to one without the other leaves the repo asserting something it does not check. If a
new standard can be tested against the rendered PDF, add the check.

## What the pipeline does not check

It reads the artefact, not the argument. Nothing here can tell you whether a bullet is
MECE, whether a number is the right number, or whether the Profile answers the question
the firm is actually asking. That judgement stays with the person building the resume.
