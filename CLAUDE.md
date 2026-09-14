# Resume formatting standards — McKinsey / MBB-calibre

This repo holds Adrian Cioanca's resume source-of-truth (`Adrian_Cioanca_Master_Knowledge_Base.md`)
and rendered resumes (`resumes/<sector>/`). Adrian is targeting **top-tier management
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
  right-aligned visually. Verify with `pdftotext -layout` that role text precedes its date.
- **Margins:** roughly 13–15mm on all sides for A4. Keep left/right and top/bottom symmetric
  pairs within ~2mm of each other.
- **Section headers:** small caps or all-caps, letter-spaced, with a thin rule — consistent
  weight/size across all sections, no section header larger or bolder than another.
- **No orphaned single words** wrapping onto their own line at the end of a list/column (e.g. a
  two-column skills block leaving "R, SQL" alone on a line) — rebalance column widths or content
  length to avoid it.
- **Bullets:** consistent glyph and weight across the whole document; avoid bullet markers heavy
  enough to compete visually with bold text in the line.

## Verification checklist before treating a resume PDF as final

Run from the file's directory:

```bash
pdffonts <file>.pdf      # every font row should show emb=yes, sub=yes, and the intended family
pdftotext -layout <file>.pdf -   # role must read before its date; no garbled/reordered text
pdfinfo <file>.pdf        # confirm A4 page size, 1 page
```

Visually render the page (or open the PDF) and confirm:
- No dead space exceeding the margin size at the foot of the page
- Reading order top-to-bottom matches source order
- No self-laudatory language in the header tagline
- All dollar figures/metrics match the reconciled numbers in the knowledge base

## Repo structure

- `Adrian_Cioanca_Master_Knowledge_Base.md` — source of truth; pull and trim from here, do not
  invent facts not present in it (or explicitly confirmed by Adrian).
- `resumes/<sector>/` — rendered resumes grouped by target sector (currently `consulting/`).
  Each variant should include its HTML source alongside the rendered PDF so it can be
  re-rendered and diffed.
