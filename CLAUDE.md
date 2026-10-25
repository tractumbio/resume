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
  framing the strategy questions behind them"). Do not cut this section to save space, cut
  bullet density instead. **The Profile is a headline, not an introduction.** State the 2-3
  things that actually make this candidacy distinctive, not a gesture at them: name the
  capability, not just the role being applied for. A reader skimming for 6-8 seconds should get
  the throughline from the Profile alone, not have to reconstruct it by reading every bullet
  across three very different jobs.
- **Order bullets by relevance to the target role, not by chronology or job order.** Within a
  role's bullet list, the strongest, most concrete, most on-brief proof point goes first, even
  if a more abstract or more senior-sounding bullet would conventionally lead. A screener reads
  top to bottom and loses attention fast; the best evidence earns the first line, not the
  oldest or the most impressive-sounding title.
- **Name the throughline across career chapters.** Adrian's background spans consulting
  delivery, biotech founder/commercial work, and academic research leadership, genuinely
  different institutional forms. Breadth reads as strength only when something states what
  connects them (e.g. taking an ambiguous technical problem to a concrete, delivered outcome,
  regardless of institutional form); left unstated, three different-looking careers just read
  as three different careers.
- **Cross-sector framing.** Where relevant, foreground stakeholder management, cross-functional
  leadership, and translating technical/scientific complexity into commercial strategy — this is
  the differentiated positioning for Adrian's target roles (see Career Intentions in the
  knowledge base).
- **Defence/Government content stays generic.** Adrian holds an NV1 clearance and has worked
  on Defence engagements — stating the clearance and "a Defence client" is standard and fine.
  Never combine a specific vendor/product name with "air-gapped"/"classified"/"secure
  environment" and a client-side tool stack in the same sentence — that combination describes
  the technical architecture of a secure government system, which is the pattern a security
  officer flags regardless of formal classification. Describe the work generically (client
  type, your ownership, the outcome) and keep any tool names in a general Capabilities/Skills
  list, decoupled from the Defence/secure-environment context. The knowledge base's Defence —
  GDC PoC entry carries the full detail with an OPSEC flag for exactly this reason — pull the
  generalised framing from there, not the raw entry. This is guidance, not a clearance sign-off:
  anything Defence-related should go through Adrian's actual security/employer process before
  publishing, regardless of what this repo's checks say.

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
  weight/size across all sections, no section header larger or bolder than another. Keep
  `letter-spacing` under ~1pt: WeasyPrint has been observed emitting each glyph as a separate
  text run above that, which `pdftotext` then reads as single characters ("E D U C AT I O N")
  — invisible on the page, but exactly what an ATS parses. Verify with plain `pdftotext` that
  no header splits like this (`pipeline/verify.py`'s "header extraction" check).
- **No orphaned single words** wrapping onto their own line at the end of a list/column (e.g. a
  two-column skills block leaving "R, SQL" alone on a line) — rebalance column widths or content
  length to avoid it.
- **Bullets:** consistent glyph and weight across the whole document; avoid bullet markers heavy
  enough to compete visually with bold text in the line.

## Adrian's own voice

Derived from his actual published scientific papers (verified against the full text of
Cioanca et al. 2025, *Communications Biology*, and the abstract of Cioanca et al. 2021,
*Pigment Cell & Melanoma Research*, not guessed), so a resume or letter reads as something
he would plausibly have written, not as generic "AI resume" prose.

- **No em dashes, anywhere.** Checked directly: his papers never use one as prose punctuation.
  Where an aside or appositive is needed, do what his writing actually does instead:
    - Join with a comma when the clause flows on ("...at Accenture, architecting pipelines...").
    - Use parentheses for an inline list or specification ("a data pipeline (PostgreSQL storage,
      text embedding, hybrid retrieval) surfacing..."), exactly how his papers handle
      abbreviations and inline detail, e.g. "Human choroidal melanocytes (HCMs)".
    - Split into two sentences when the aside is really a second claim, not a qualifier on the
      first. His Discussion sections lean on short sentences opening with "This..." to carry
      a claim forward, rather than bolting it onto the previous one with a dash.
    - Use a plain hyphen for compound modifiers ("time-dependent," "research-informed,"
      "client-facing") and an en dash only for a true range or a title/role separator
      ("Jan 2022 – Dec 2024", "Senior Consultant – Data Engineer"), never as a stand-in comma.
  `pipeline/verify.py`'s "voice: no em dashes" check enforces this on every rendered PDF
  (resume and cover alike); any FAIL blocks promotion the same as any other check.
- **Commas carry the load; semicolons are rare.** His sentences join related clauses with
  commas, sometimes several in one sentence, rather than reaching for a semicolon or dash.
  Reserve the semicolon for truly independent clauses, the way existing resume bullets already
  do ("...from days to minutes; worked directly with the client's compliance team...").
- **Hedge findings, not resume claims.** His papers hedge genuinely uncertain results
  ("might," "suggests," "could," explicit limitation sentences) but state what was actually
  done plainly and in active voice ("We detected...", "This study aimed..."). A resume bullet
  describing Adrian's own completed work should stay in that same confident, active, declarative
  register — the hedging habit is for claims about what the data might mean, not for whether he
  did the work. Nothing here loosens "no vague filler" above; a hedge is not a substitute for a
  number either.
- **British/Australian spelling throughout** ("organisation," "specialise," "colour,"
  "programme" where it's a plan rather than software) — confirmed in his own papers
  ("neovascularisation," "elucidated"). `pipeline/verify.py` does not check spelling; this is
  an eyes-on standard, same as MECE.
- **Prose paragraphs (Profile, cover-letter body) may open a sentence with a signposting
  connective** when genuinely linking two ideas — "This," "That," "Despite" — matching how his
  Discussion sections move between claims. Resume bullets stay telegraphic as elsewhere in this
  document; this is for the handful of places the repo already uses full sentences.

## Cover-letter standards (MBB recommendations)

Applies to every `cover.html` in `applications/<slug>/`. The same content standards above
hold (quantify every claim that has a number, no self-laudatory language, no vague filler),
plus what's specific to a letter:

- **Structure: hook (prose), why-this-firm (dot points), what-I-bring (dot points), close
  (prose).** Bullets give a screener the clarity of a list; personal register in each one is
  what keeps it a letter, not a second resume. Adrian's own call, overriding the pure-prose
  structure this file used to specify:
    1. **Hook** (2-3 sentences, prose) — open with something specific to this firm, practice,
       or ad. Never open with "I am writing to apply for..." as the first sentence; state the
       role once, inside the hook, not as a bare announcement ahead of it.
    2. **Why this firm** (2-3 dot points) — each point names something specific and real about
       the firm (a practice area, a published case, a sector focus stated in the ad), not
       "your prestigious firm" or "your reputation for excellence." Each point is written in
       personal register: a full sentence or two in Adrian's own voice, with "I," not a
       telegraphic resume-bullet fragment. Where it's genuinely true, let a single point draw
       on both the scientific and the consulting career rather than keeping them in separate
       lanes; that combination is the differentiated story, and siloing it by job loses it.
    3. **What I bring** (2-3 dot points) — each point is evidence plus what it demonstrates
       *for this role*, connecting dots the resume's format can't, not restating a resume
       bullet. If a point could be copy-pasted out of the resume unchanged, cut it. Same
       personal-register rule as above, and the same instruction to blend scientific and
       consulting experience within a point where the combination is the actual argument.
    4. **Close** (2-3 sentences, prose) — state fit plainly, make a clear call to action (a
       conversation, an interview), say thanks. No hedging, no summarising the letter just read.
  Dot-point styling matches the resume's `<ul>/<li>` (same glyph, same type scale) so the two
  documents still read as one family, just with prose bookending the lists.
- **Personal register means a person is talking, not a list compressing.** A resume bullet
  opens with a bare past-tense verb and drops "I." A cover-letter dot point keeps "I," runs as
  a real sentence, and can carry a trace of why something mattered, not only what happened.
  The "Adrian's own voice" rules below (commas over semicolons, no em dashes, hedge findings
  not completed work) still apply inside each point; personal register is about register, not
  license to loosen the other standards.
- **One page, ~300-400 words.** Long enough to make the case, short enough that a screener
  reads all of it. This is materially shorter than a resume's information density; a letter
  that reads like a fifth resume section has failed at the form.
- **Personalize the salutation.** A named recruiter or partner if the ad or a referral gives
  you one; otherwise address the practice or recruiting team by name, never "To Whom It May
  Concern," a generic salutation undercuts the why-this-firm points before they start.
- **Match the firm's own vocabulary.** Mirror how the ad refers to the role and practice
  (McKinsey "Associate," BCG "Consultant," Bain "Associate Consultant," the specific practice
  name as the ad states it), not a generic label for the job family.
- **No restating the resume.** The cover letter's only job is what the resume's format cannot
  do: build a narrative argument connecting specific experience to this specific role. A point
  that lists an achievement the resume already lists is redundant, not reinforcing.
- **Same letterhead as the resume.** Same typefaces (`assets/fonts.css`), same name treatment,
  same contact line, same list style; an application package should read as one document
  family, not two documents that happen to be about the same person.
- **Cover-specific layout:** wider margins than the resume (18-25mm, this is a business
  letter, not a densely packed one-pager) and the resume's "fill the page" rule does **not**
  apply; white space below a 300-400 word letter is normal, not thin content.

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
| header extraction | section headers don't split into single-character runs (letter-spacing) |
| header tagline | no self-laudatory language |
| quantification | no vague filler where a number belongs |
| voice: no em dashes | none in the rendered text — see "Adrian's own voice" |
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
