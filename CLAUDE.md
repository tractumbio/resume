# Resume formatting standards — McKinsey / MBB-calibre

This repo holds Adrian Cioanca's resume source-of-truth
(`knowledge-base/Adrian_Cioanca_Master_Knowledge_Base.md`), the HTML drafts built from it
(`drafts/<sector>/`), and the ready-to-submit renders those drafts produce
(`exports/<sector>/`). Adrian is targeting **top-tier management
consulting firms (MBB-calibre)** — see the Career Intentions section of the knowledge base.
Any resume produced or edited in this repo must meet the standards below.

## Content standards

- **MECE bullets.** Each bullet makes one distinct claim — no overlap with another bullet in
  the same role, no compound bullets stitched together with "and" to cover two unrelated
  achievements.
- **Quantify every bullet where a number exists.** Dollar figures, percentages, headcounts,
  time saved, accuracy rates. If a number is genuinely unavailable, the bullet should still
  state a concrete, verifiable outcome — never a vague adjective ("significant", "substantial")
  standing in for a number.
- **Lead with the verb and the result, not the activity.** Prefer "Cut clause-identification
  time from days to minutes by …" over "Was responsible for building a system that …".
- **Reconcile conflicting figures before publishing.** The knowledge base flags several numbers
  with open variants (postdoc funding, ErythroSight raise, publication count). Never publish a
  resume with an unreconciled figure — pick the best-supported number (cite it against the
  in-repo grants table or Google Scholar) or flag it to Adrian before finalizing.
- **No self-laudatory taglines.** Avoid phrases like "Top 1% Researcher" or "Medal-Winning"
  in a header tagline — let the bullets and credentials carry that claim. MBB screeners read
  these as a red flag, not a strength. State role/credential facts plainly (e.g. "PhD | Data &
  AI Consultant | Biotech Co-founder").
- **Include a Profile/summary line** that states the target role and the specific angle being
  offered (e.g. "Applying for the Associate role to move from building data and AI solutions to
  framing the strategy questions behind them"). Do not cut this section to save space — cut
  bullet density instead.
- **Cross-sector framing.** Where relevant, foreground stakeholder management, cross-functional
  leadership, and translating technical/scientific complexity into commercial strategy — this is
  the differentiated positioning for Adrian's target roles (see Career Intentions in the
  knowledge base).

## Layout / typography standards

- **One page.** Consulting resumes do not run to two pages regardless of seniority.
- **Fill the page — no large dead space.** Bottom margin should not exceed roughly the size of
  the top/side margins (~15mm). A visible gap at the foot of the page reads as thin content, not
  restraint; add back detail (e.g. a Profile section) rather than leaving it empty.
- **Consistent, print-safe fonts, properly embedded and subsetted.** Do not rely on a renderer's
  fallback font (e.g. DejaVu Sans substituting for Arial when the requested font isn't
  installed at render time) — that is an accident, not a choice, and reads as generic/default.
  Prefer WeasyPrint over wkhtmltopdf (unmaintained) for HTML→PDF rendering, and verify with
  `pdffonts` that every font shows `emb: yes` and the intended family name, not a substitute.
- **Reading order must survive text extraction.** Do not use `float:right` for dates next to a
  role/org line — this inverts reading order in ATS/PDF text extraction (date gets pulled out
  before the role it belongs to). Use `display:flex; justify-content:space-between` (or
  equivalent) so the date remains after the role in source/DOM order while still appearing
  right-aligned visually. Verify with plain `pdftotext` (no `-layout`) that role text
  precedes its date — `-layout` reconstructs columns geometrically and hides exactly this
  defect, which is what an ATS would hit.
- **Margins:** roughly 13–15mm on all sides for A4. Keep left/right and top/bottom symmetric
  pairs within ~2mm of each other.
- **Section headers:** small caps or all-caps, letter-spaced, with a thin rule — consistent
  weight/size across all sections, no section header larger or bolder than another.
- **No orphaned single words** wrapping onto their own line at the end of a list/column (e.g. a
  two-column skills block leaving "R, SQL" alone on a line) — rebalance column widths or content
  length to avoid it.
- **Bullets:** consistent glyph and weight across the whole document; avoid bullet markers heavy
  enough to compete visually with bold text in the line.

## Cover-letter standards (MBB recommendations)

Applies to every `cover.html` in `applications/<slug>/`. The same content standards above
hold — quantify every claim that has a number, no self-laudatory language, no vague filler
— plus what's specific to a letter:

- **Structure: hook, why-this-firm, why-you, close. Four short paragraphs, nothing more.**
  This is the structure McKinsey, BCG and Bain career-advice materials converge on:
    1. **Hook** — open with something specific to this firm, practice, or ad. Never open
       with "I am writing to apply for..." as the first sentence; state the role once,
       inside the hook, not as a bare announcement ahead of it.
    2. **Why this firm** — tie a specific, named thing (a practice area, a published case,
       a sector focus stated in the ad) to the angle being offered. "Your prestigious firm"
       or "your reputation for excellence" is exactly the generic language a screener has
       read a hundred times that week — it signals the whole letter is a template, whether
       or not it is.
    3. **Why you** — two, at most three, proof points. Each one is evidence plus what it
       demonstrates *for this role* — this paragraph's job is to connect the dots the
       resume can't, not to restate resume bullets. If a sentence here could be copy-pasted
       out of the resume unchanged, cut it.
    4. **Close** — state fit plainly, make a clear call to action (a conversation, an
       interview), say thanks. No hedging, no summarising the letter that was just read.
- **One page, ~300-400 words.** Long enough to make the case, short enough that a
  screener reads all of it. This is materially shorter than a resume's information density
  — a letter that reads like a fifth resume section has failed at the form.
- **Personalize the salutation.** A named recruiter or partner if the ad or a referral
  gives you one; otherwise address the practice or recruiting team by name, never "To Whom
  It May Concern" — a generic salutation undercuts paragraph 2 before it starts.
- **Match the firm's own vocabulary.** Mirror how the ad refers to the role and practice
  (McKinsey "Associate", BCG "Consultant", Bain "Associate Consultant", the specific
  practice name as the ad states it) — not a generic label for the job family.
- **No restating the resume.** The cover letter's only job is what the resume's format
  cannot do: build a narrative argument connecting specific experience to this specific
  role. A letter that lists achievements the resume already lists is redundant, not
  reinforcing.
- **Same letterhead as the resume.** Same typefaces (`assets/fonts.css`), same name
  treatment, same contact line — an application package should read as one document
  family, not two documents that happen to be about the same person.
- **Cover-specific layout:** wider margins than the resume (18-25mm — this is a business
  letter, not a densely packed one-pager) and the resume's "fill the page" rule does **not**
  apply — white space below a 300-400 word letter is normal, not thin content.

## Verification checklist before treating a resume PDF as final

Do not run these by hand. `pipeline/verify.py` runs all of them, plus the layout and
language checks below, and reports PASS/WARN/FAIL per standard:

```bash
make verify DRAFT=drafts/consulting/<variant>.html          # resume
pipeline/build_cover.sh applications/<firm>-<role-slug>       # cover letter
```

It is the executable half of this document. A standard added here that can be tested
against a rendered PDF should be added there too, or the repo asserts something it does
not check. What it checks today:

| Check | Standard |
|---|---|
| one page | one page, A4 |
| A4 page size | `pdfinfo` page geometry |
| fonts embedded | every font `emb=yes`, `sub=yes`, and a chosen family, not a substitute |
| reading order | role reads before its date in raw extraction (no `float:right`) |
| margins | 13–15mm, symmetric, no dead space at the foot |
| header tagline | no self-laudatory language |
| quantification | no vague filler where a number belongs |
| profile section | a Profile/summary section is present |
| orphan words | no short word stranded alone on a line |

`pipeline/release.sh` runs the same checks and refuses to promote a PDF that fails one, so
everything in `exports/` has passed them by construction. `pipeline/verify.py --kind cover`
runs the same checks against a letter, minus the Profile-section check (letters don't have
one) and with the margin/dead-space targets from "Cover-letter standards" above, plus a
word-count check in place of it.

Still to be judged by eye, because no check can do it:

- Bullets are MECE, and each one carries its own distinct claim
- Every dollar figure and metric matches the reconciled number in the knowledge base
- The Profile answers the question the firm is actually asking

## Repo structure

- `knowledge-base/` — source of truth. Pull and trim from here; do not invent facts not
  present in it (or explicitly confirmed by Adrian). See `knowledge-base/README.md`.
- `drafts/<sector>/` — HTML sources, one file per variant, grouped by target sector
  (currently `consulting/`). **This is where you edit.**
- `pipeline/` — render, verify, score, promote. See `pipeline/README.md`.
- `exports/<sector>/` — ready-to-submit PDFs, each with its checks, FitSignal scorecard and
  provenance. Build output: never edited by hand, and only ever written by
  `pipeline/release.sh`.
- `archive/` — superseded renders, kept for diffing. Not submittable; some predate these
  standards.
- `assets/` — vendored typefaces (Source Sans 3, Source Serif 4) embedded into every export,
  so a render never depends on what is installed on the machine.
- `applications/<firm>-<role-slug>/` — one folder per job applied to: the ad, the resume
  sent, and the cover letter, checked and rendered. See `applications/README.md`.
- `BUILDER_INSTRUCTIONS.md` — the procedure for building a variant, start to finish. This
  file is the specification; that one is the process.
